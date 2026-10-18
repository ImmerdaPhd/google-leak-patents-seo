// Gemini-Client (Google AI, REST API). Faktoren melden ihre Bewertungsfragen an;
// alle Text-Fragen gehen gebündelt in EINEN Aufruf, alle Bild-Fragen in einen zweiten.
// So kostet ein kompletter Durchlauf nur zwei Gemini-Anfragen.
//
// Konfiguration über Umgebungsvariablen:
//   GEMINI_API_KEY   (oder GOOGLE_API_KEY)  – ohne Key werden Gemini-Fragen übersprungen
//   GEMINI_MODEL     Standard: gemini-2.5-flash
//   GEMINI_BASE_URL  Standard: https://generativelanguage.googleapis.com/v1beta

import { truncate } from './util.js';

const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 3_500_000;

export class Gemini {
  constructor(ctx, { enabled = true } = {}) {
    this.ctx = ctx;
    this.apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    this.model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    this.base = (process.env.GEMINI_BASE_URL || DEFAULT_BASE).replace(/\/$/, '');
    this.enabled = enabled && !!this.apiKey;
    this.textCriteria = new Map();
    this.imageCriteria = new Map();
    this.calls = 0;
    this.errors = [];
  }

  get available() {
    return this.enabled;
  }

  /** Meldet Fragen eines Faktors an: { text: [{id, frage}], images: [{id, frage}] } */
  register({ text = [], images = [] } = {}) {
    for (const c of text) this.textCriteria.set(c.id, c.frage);
    for (const c of images) this.imageCriteria.set(c.id, c.frage);
  }

  /** Bewertung (0–100, 100 = am besten) für eine angemeldete Text-Frage oder null. */
  async rate(id) {
    if (!this.enabled || !this.textCriteria.has(id)) return null;
    this._textBatch ??= this._runText();
    const res = await this._textBatch;
    return normalize(res?.[id]);
  }

  /** Bewertung für eine angemeldete Bild-Frage oder null (auch wenn keine Bilder da sind). */
  async rateImages(id) {
    if (!this.enabled || !this.imageCriteria.has(id)) return null;
    this._imageBatch ??= this._runImages();
    const res = await this._imageBatch;
    return normalize(res?.[id]);
  }

  async _runText() {
    const page = await this.ctx.page();
    const headings = page.headings.slice(0, 25).map((h) => `${'#'.repeat(h.level)} ${h.text}`).join('\n');
    const prompt = [
      'Du bist ein erfahrener Bewerter für Suchergebnis-Qualität nach den Google Search Quality Rater Guidelines.',
      'Bewerte die folgende Webseite für JEDES Kriterium mit einer ganzen Zahl von 0 bis 100.',
      '100 bedeutet immer: bestmöglich / unbedenklich im Sinne der Frage. 0 bedeutet: sehr schlecht / sehr problematisch.',
      'Ist ein Kriterium für diese Seite nicht anwendbar, setze "score" auf null.',
      'Antworte ausschließlich mit JSON im Format {"kriterien": {"<id>": {"score": <0-100|null>, "begruendung": "<max. 2 Sätze, deutsch>"}}}.',
      '',
      'KRITERIEN:',
      ...[...this.textCriteria].map(([id, frage]) => `- ${id}: ${frage}`),
      '',
      'SEITE:',
      `URL: ${page.url}`,
      `Titel: ${page.title}`,
      `Meta-Description: ${page.metaDescription || '(keine)'}`,
      `Autor (erkannt): ${page.authorText || page.metaAuthor || '(keiner)'}`,
      `Datum (erkannt): ${page.published || '(keins)'}`,
      `Strukturierte Daten: ${[...new Set(page.ldTypes)].join(', ') || '(keine)'}`,
      `Überschriften:\n${headings || '(keine)'}`,
      '',
      `Haupttext (gekürzt):\n${truncate(page.mainText || page.bodyText, 14000)}`,
    ].join('\n');
    return this._call([{ text: prompt }]);
  }

  async _runImages() {
    const imgs = await this.ctx.topImages(MAX_IMAGES);
    if (!imgs.length) return {};
    const page = await this.ctx.page();
    const parts = [
      {
        text: [
          'Du bewertest Bilder einer Webseite so, wie es ein Bild-Ranking-System tun würde.',
          `Seitentitel: ${page.title}`,
          `Seitenthema (Anfang des Texts): ${truncate(page.mainText, 600)}`,
          `Es folgen ${imgs.length} Bilder (Bild 1 bis ${imgs.length}), jeweils mit Alt-Text.`,
          'Bewerte für JEDES Kriterium jedes Bild mit 0–100 (100 = bestmöglich) und gib den Durchschnitt an.',
          'Antworte nur mit JSON: {"kriterien": {"<id>": {"score": <Durchschnitt>, "bilder": [<score je Bild>], "begruendung": "<max. 2 Sätze, deutsch>"}}}',
          'KRITERIEN:',
          ...[...this.imageCriteria].map(([id, frage]) => `- ${id}: ${frage}`),
        ].join('\n'),
      },
    ];
    imgs.forEach((img, i) => {
      parts.push({ text: `Bild ${i + 1} – Alt-Text: ${img.alt || '(leer)'} – URL: ${img.src}` });
      parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } });
    });
    return this._call(parts);
  }

  async _call(parts) {
    const url = `${this.base}/models/${encodeURIComponent(this.model)}:generateContent`;
    const body = {
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature: 0, responseMimeType: 'application/json' },
    };
    for (let attempt = 0; attempt < 3; attempt++) {
      this.calls++;
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-goog-api-key': this.apiKey },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(90000),
        });
        if (res.status === 429 || res.status >= 500) {
          await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
          continue;
        }
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || `HTTP ${res.status}`);
        const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
        const parsed = parseJson(text);
        return parsed?.kriterien || parsed || {};
      } catch (e) {
        if (attempt === 2) {
          this.errors.push(e.message);
          return {};
        }
      }
    }
    this.errors.push('Gemini nicht erreichbar (Rate-Limit oder Serverfehler)');
    return {};
  }
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    try {
      return m ? JSON.parse(m[0]) : null;
    } catch {
      return null;
    }
  }
}

function normalize(r) {
  if (!r || r.score == null || Number.isNaN(Number(r.score))) return null;
  return {
    score: Math.max(0, Math.min(100, Number(r.score))),
    reason: r.begruendung || r.reason || '',
    perImage: r.bilder || null,
  };
}
