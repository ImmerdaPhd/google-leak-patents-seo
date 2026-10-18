// spambrainLavcScore: Website-weiter SpamBrain-Score – Doorway-Muster, Spam-Links und Spam-Anteil.
import { siteSample, siteSpam } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';
import { round, scale, weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'spambrainLavcScore',
  title: 'SpamBrain: Website-Score (LAVC)',
  category: 'spam_demotion',
  weight: 1,
  async evaluate(ctx) {
    const [s, site] = await Promise.all([siteSpam(ctx), siteSample(ctx)]);
    const outSpam = s.per.reduce((a, p) => a + p.outSpam, 0);
    return {
      score: weighted([[scale(s.spammyRatio, 0.4, 0), 2], [scale(site.nearDupRatio, 0.4, 0), 1], [scale(outSpam, 10, 0), 1]]),
      method: METHOD.HEURISTIC,
      confidence: 'niedrig',
      findings: [
        `${round(s.spammyRatio * 100)} % Seiten mit Spam-Merkmalen, ${round(site.nearDupRatio * 100)} % Fast-Duplikate (Doorway-Indiz), ${outSpam} Links auf Spam-Ziele in der Stichprobe.`,
      ],
      recommendations: [outSpam ? 'Links auf Spam-Websites entfernen.' : null, site.nearDupRatio > 0.1 ? 'Doorway-artige Seiten zusammenführen.' : null],
      data: { spammyRatio: s.spammyRatio, nearDupRatio: site.nearDupRatio, outSpam },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
