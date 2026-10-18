// BabyPanda: kleinere Qualitätsabwertung – hier pro Website-Bereich (Verzeichnis) ermittelt.
import { siteSample } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';
import { round, scale, weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'babyPandaDemotion',
  title: 'BabyPanda-Abwertung (schwache Bereiche)',
  category: 'content_quality',
  weight: 2,
  async evaluate(ctx) {
    const s = await siteSample(ctx);
    const sections = new Map();
    for (const r of s.rows.filter((r) => !r.isHome && !r.noindex)) {
      const seg = new URL(r.url).pathname.split('/').filter(Boolean)[0] || '/';
      if (!sections.has(seg)) sections.set(seg, []);
      sections.get(seg).push(r);
    }
    const sectionStats = [...sections.entries()].map(([seg, rows]) => ({
      seg,
      pages: rows.length,
      thin: rows.filter((r) => r.words < 300).length / rows.length,
      avgWords: rows.reduce((a, r) => a + r.words, 0) / rows.length,
    }));
    const worst = sectionStats.sort((a, b) => b.thin - a.thin || a.avgWords - b.avgWords)[0];
    const overall = scale(s.thinRatio, 0.6, 0.1);
    const worstScore = worst ? scale(worst.thin, 0.8, 0.1) : null;
    const meta = scale(s.missingDescRatio + s.dupDescRatio, 0.8, 0);
    const score = weighted([[overall, 2], [worstScore, 2], [meta, 1]]);
    return {
      score,
      method: METHOD.HEURISTIC,
      confidence: s.pages >= 5 ? 'mittel' : 'niedrig',
      findings: [
        `${sectionStats.length} Bereiche in der Stichprobe.`,
        worst ? `Schwächster Bereich: /${worst.seg} – ${round(worst.thin * 100)} % dünne Seiten, Ø ${round(worst.avgWords)} Wörter.` : 'Zu wenige Seiten für einen Bereichsvergleich.',
        `Fehlende oder doppelte Meta-Descriptions: ${round((s.missingDescRatio + s.dupDescRatio) * 100)} %.`,
      ],
      recommendations: worst && worst.thin > 0.3 ? [`Bereich /${worst.seg} gezielt überarbeiten oder aus dem Index nehmen.`] : [],
      data: { sections: sectionStats },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
