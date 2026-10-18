// unauthoritativeScore: Wie wenig vertrauenswürdig wirkt die Seite? (E-E-A-T)
// Score hier umgedreht: 100 = sehr vertrauenswürdig (also KEIN Unauthoritative-Problem).
import { trust } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';
import { weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'unauthoritativeScore',
  title: 'Vertrauenswürdigkeit / Autorität (E-E-A-T)',
  category: 'content_quality',
  weight: 3,
  gemini: {
    text: [{ id: 'trustworthiness', frage: 'Wie vertrauenswürdig und fachkundig wirkt die Seite (E-E-A-T)? Berücksichtige Autorenangaben, Quellen und Belege, Sorgfalt, Seriosität. Bei YMYL-Themen (Gesundheit, Finanzen, Recht, Sicherheit) besonders streng bewerten. 100 = sehr vertrauenswürdig.' }],
  },
  async evaluate(ctx) {
    const [t, ai] = await Promise.all([trust(ctx), ctx.ai.rate('trustworthiness')]);
    const checks = [
      ['Autor angegeben', t.author, 2],
      ['Impressum verlinkt', t.impressum, 2],
      ['Kontaktseite verlinkt', t.contact, 1],
      ['Über-uns/Team-Seite verlinkt', t.about, 1],
      ['Datenschutz verlinkt', t.privacy, 1],
      ['Quellen auf autoritative Websites', t.citations > 0, 2],
      ['Organisation/Publisher in strukturierten Daten', t.organization, 1],
      ['HTTPS', t.https, 1],
    ];
    const total = checks.reduce((s, c) => s + c[2], 0);
    const heuristic = (checks.filter((c) => c[1]).reduce((s, c) => s + c[2], 0) / total) * 100;
    return {
      score: weighted([[ai?.score, 3], [heuristic, 2]]),
      method: ai ? METHOD.GEMINI : METHOD.HEURISTIC,
      confidence: ai ? 'mittel' : 'niedrig',
      findings: [
        ai ? `Gemini (Vertrauenswürdigkeit): ${ai.score}/100 – ${ai.reason}` : null,
        `Vorhanden: ${checks.filter((c) => c[1]).map((c) => c[0]).join(', ') || 'nichts'}.`,
        `Fehlt: ${checks.filter((c) => !c[1]).map((c) => c[0]).join(', ') || 'nichts'}.`,
      ],
      recommendations: checks.filter((c) => !c[1]).map((c) => `Ergänzen: ${c[0]}.`),
      data: { gemini: ai, ...t, heuristic },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
