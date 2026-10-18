// OriginalContentScore: Wie originell ist der Inhalt? Google speichert das nur für Seiten mit wenig Text.
// Wir messen Duplikate innerhalb der eigenen Website und lassen Gemini die Originalität bewerten.
import { siteSample, textStats } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';
import { shingles } from '../lib/text.js';
import { round, scale, weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'OriginalContentScore',
  title: 'Originalität des Inhalts',
  category: 'content_quality',
  weight: 2,
  gemini: {
    text: [{ id: 'originality', frage: 'Wie originell ist der Text? Eigene Formulierungen, eigene Perspektive, neue Informationen – statt generischer, austauschbarer oder offensichtlich übernommener Texte (z. B. Herstellerbeschreibungen). 100 = sehr originell.' }],
  },
  async evaluate(ctx) {
    const [page, stats, s, ai] = await Promise.all([ctx.page(), textStats(ctx), siteSample(ctx), ctx.ai.rate('originality')]);
    const own = shingles(page.mainText || page.bodyText, 5);
    const others = new Set();
    for (const p of s.sampleData) for (const x of shingles(p.data.mainText || p.data.bodyText, 5)) others.add(x);
    let shared = 0;
    for (const x of own) if (others.has(x)) shared++;
    const internalDup = own.size ? shared / own.size : 0;
    const heuristic = scale(internalDup, 0.6, 0.05);
    return {
      score: weighted([[ai?.score, 3], [heuristic, 2]]),
      method: ai ? METHOD.GEMINI : METHOD.HEURISTIC,
      confidence: ai ? 'mittel' : 'niedrig',
      findings: [
        ai ? `Gemini (Originalität): ${ai.score}/100 – ${ai.reason}` : null,
        `${round(internalDup * 100)} % der Textbausteine kommen auch auf anderen Seiten der Website vor.`,
        stats.words < 300 ? 'Kurze Seite – laut Leak wird der Originalitäts-Score gerade für solche Seiten gespeichert.' : null,
      ],
      recommendations: internalDup > 0.3 ? ['Wiederholte Textblöcke (Boilerplate) kürzen und jede Seite mit eigenem Text versehen.'] : [],
      data: { gemini: ai, internalDup },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
