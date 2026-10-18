// uacSpamScore: Spam in nutzergenerierten Inhalten (Google: ab 64/127 gilt die Seite als Spam).
import { ugc } from '../lib/analysis.js';
import { METHOD, defineFactor, notApplicable, runIfMain } from '../lib/factor.js';
import { round, scale, weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'uacSpamScore',
  title: 'Spam in Nutzerinhalten (UAC)',
  category: 'spam_demotion',
  weight: 1,
  async evaluate(ctx) {
    const u = await ugc(ctx);
    if (!u.present || !u.count) return notApplicable('Keine Kommentare oder Forenbeiträge erkannt.');
    const unmarkedShare = u.externalLinks ? u.unmarkedLinks / u.externalLinks : 0;
    return {
      score: weighted([[scale(u.spamRatio, 0.3, 0), 3], [scale(unmarkedShare, 1, 0), 1]]),
      method: METHOD.HEURISTIC,
      confidence: 'mittel',
      findings: [
        `${u.spamComments} von ${u.count} Beiträgen mit Spam-Merkmalen (${round(u.spamRatio * 100)} %).`,
        `${u.externalLinks} externe Links in Beiträgen, davon ${u.unmarkedLinks} ohne rel="ugc"/"nofollow".`,
      ],
      recommendations: [
        u.spamComments ? 'Spam-Beiträge löschen, Spam-Filter (z. B. Akismet) aktivieren.' : null,
        u.unmarkedLinks ? 'Links in Nutzerbeiträgen mit rel="ugc nofollow" kennzeichnen.' : null,
      ],
      data: u,
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
