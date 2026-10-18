// ugcDiscussionEffortScore: Aufwand/Qualität nutzergenerierter Diskussionen (Kommentare, Foren).
import { ugc } from '../lib/analysis.js';
import { METHOD, defineFactor, notApplicable, runIfMain } from '../lib/factor.js';
import { round, scale, weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'ugcDiscussionEffortScore',
  title: 'Qualität von Nutzerdiskussionen',
  category: 'content_quality',
  weight: 1,
  async evaluate(ctx) {
    const u = await ugc(ctx);
    if (!u.present || !u.count) return notApplicable('Keine Kommentare oder Forenbeiträge auf der Seite erkannt.');
    return {
      score: weighted([[scale(u.avgWords, 5, 40), 2], [scale(u.shortRatio, 0.7, 0.1), 2], [scale(u.spamRatio, 0.3, 0), 1]]),
      method: METHOD.HEURISTIC,
      confidence: 'mittel',
      findings: [
        `${u.count} Beiträge, Ø ${round(u.avgWords)} Wörter, ${round(u.shortRatio * 100)} % sehr kurz (< 8 Wörter).`,
        `${u.spamComments} Beiträge mit Spam-Merkmalen.`,
      ],
      recommendations: [
        u.shortRatio > 0.4 ? 'Ein-Wort-Antworten moderieren; hilfreiche Antworten hervorheben.' : null,
        u.spamComments ? 'Spam-Kommentare entfernen und Spam-Filter einsetzen.' : null,
      ],
      data: u,
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
