// Panda-Abwertung (Website-Qualität): Wie viele schwache, dünne oder doppelte Seiten hat die Website?
import { siteSample } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';
import { round, scale, weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'pandaDemotion',
  title: 'Panda-Abwertung (Website-Qualität)',
  category: 'content_quality',
  weight: 3,
  async evaluate(ctx) {
    const s = await siteSample(ctx);
    const thin = scale(s.thinRatio, 0.6, 0.1);
    const near = scale(s.nearDupRatio, 0.3, 0);
    const dupTitles = scale(s.dupTitleRatio, 0.5, 0);
    const depth = scale(s.avgWords, 250, 900);
    const score = weighted([[thin, 3], [near, 2], [dupTitles, 1], [depth, 2]]);
    const rec = [];
    if (s.thinRatio > 0.2) rec.push('Dünne Seiten (< 300 Wörter) ausbauen, zusammenführen oder auf noindex setzen.');
    if (s.nearDupRatio > 0.05) rec.push('Fast identische Seiten zusammenführen (301) oder deutlich unterscheiden.');
    if (s.dupTitleRatio > 0.1) rec.push('Jeder Seite einen eigenen, eindeutigen Title geben.');
    return {
      score,
      method: METHOD.HEURISTIC,
      confidence: s.pages >= 5 ? 'mittel' : 'niedrig',
      findings: [
        `${s.pages} Seiten geprüft (Stichprobe aus Sitemap/internen Links).`,
        `Dünne Inhaltsseiten: ${round(s.thinRatio * 100)} %${s.thinUrls.length ? ' – z. B. ' + s.thinUrls.slice(0, 3).join(', ') : ''}`,
        `Fast-Duplikate unter den Seitenpaaren: ${round(s.nearDupRatio * 100)} %`,
        `Doppelte Titles: ${round(s.dupTitleRatio * 100)} %, Ø ${round(s.avgWords)} Wörter Haupttext.`,
      ],
      recommendations: rec,
      data: { thinRatio: s.thinRatio, nearDupRatio: s.nearDupRatio, dupTitleRatio: s.dupTitleRatio, avgWords: s.avgWords },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
