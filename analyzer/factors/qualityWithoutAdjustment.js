// qualityWithoutAdjustment: Basis-Qualitätsscore (QScore) vor Boni und Abzügen –
// Gesamtqualität laut Gemini plus technische und strukturelle Grundlagen.
import { textStats } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';
import { weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'qualityWithoutAdjustment',
  title: 'Basis-Qualitätsscore (QScore)',
  category: 'content_quality',
  weight: 2,
  gemini: {
    text: [{ id: 'overallQuality', frage: 'Gesamtqualität der Seite als Suchergebnis (Page Quality Rating): Erfüllt sie ihren Zweck, ist sie korrekt, verständlich, gut strukturiert und vollständig? 100 = höchste Qualität, 0 = niedrigste Qualität.' }],
  },
  async evaluate(ctx) {
    const [page, stats, ai] = await Promise.all([ctx.page(), textStats(ctx), ctx.ai.rate('overallQuality')]);
    const h1 = page.headings.filter((h) => h.level === 1);
    const checks = [
      ['HTTP-Status 200', page.status === 200],
      ['HTTPS', page.finalUrl.startsWith('https://')],
      ['Title mit 15–70 Zeichen', page.title.length >= 15 && page.title.length <= 70],
      ['Meta-Description vorhanden', !!page.metaDescription],
      ['genau eine H1', h1.length === 1],
      ['Sprache (lang-Attribut) gesetzt', !!page.lang],
      ['mindestens 2 Zwischenüberschriften (H2)', page.headings.filter((h) => h.level === 2).length >= 2],
      ['mindestens 300 Wörter', stats.words >= 300],
      ['Viewport für Mobilgeräte', !!page.viewport],
    ];
    const heuristic = (checks.filter((c) => c[1]).length / checks.length) * 100;
    return {
      score: weighted([[ai?.score, 3], [heuristic, 2]]),
      method: ai ? METHOD.GEMINI : METHOD.HEURISTIC,
      confidence: ai ? 'mittel' : 'niedrig',
      findings: [
        ai ? `Gemini (Gesamtqualität): ${ai.score}/100 – ${ai.reason}` : null,
        `Grundlagen erfüllt: ${checks.filter((c) => c[1]).length}/${checks.length}.`,
      ],
      recommendations: checks.filter((c) => !c[1]).map((c) => `Beheben: ${c[0]}.`),
      data: { gemini: ai, checks: Object.fromEntries(checks) },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
