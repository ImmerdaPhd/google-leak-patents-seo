// spamtokensContentScore: Ist eine Seite mit Nutzerinhalten insgesamt UGC-Spam? – Linkdichte und
// Spam-Begriffe in den Beiträgen.
import { ugc } from '../lib/analysis.js';
import { METHOD, defineFactor, notApplicable, runIfMain } from '../lib/factor.js';
import { round, scale, weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'spamtokensContentScore',
  title: 'UGC-Spam-Inhalt (SpamTokens)',
  category: 'spam_demotion',
  weight: 1,
  async evaluate(ctx) {
    const u = await ugc(ctx);
    if (!u.present || !u.count) return notApplicable('Keine nutzergenerierten Inhalte erkannt.');
    const linksPerPost = u.externalLinks / u.count;
    return {
      score: weighted([[scale(linksPerPost, 1.5, 0.1), 2], [scale(u.spamRatio, 0.3, 0), 2]]),
      method: METHOD.HEURISTIC,
      confidence: 'mittel',
      findings: [`Ø ${round(linksPerPost, 2)} externe Links pro Beitrag, ${round(u.spamRatio * 100)} % Beiträge mit Spam-Begriffen.`],
      recommendations: linksPerPost > 0.5 ? ['Links für neue Nutzer einschränken, Beiträge vor Freischaltung prüfen.'] : [],
      data: { linksPerPost, spamRatio: u.spamRatio },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
