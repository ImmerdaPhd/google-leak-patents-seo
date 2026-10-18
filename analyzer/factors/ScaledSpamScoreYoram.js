// ScaledSpamScoreYoram: weiterer Spam-Score des Dokuments – hier als Mittel aller Spam-Heuristiken der Seite.
import { spamSignals } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';

const factor = defineFactor({
  id: 'ScaledSpamScoreYoram',
  title: 'Spam-Score (Yoram-Schema)',
  category: 'spam_demotion',
  weight: 1,
  async evaluate(ctx) {
    const s = await spamSignals(ctx);
    let score = (s.stuffing + s.spamWords + s.gibberish + s.hidden) / 4;
    if (s.metaRefreshRedirect || s.offsiteRedirect) score -= 20;
    return {
      score: Math.max(0, score),
      method: METHOD.HEURISTIC,
      confidence: 'niedrig',
      findings: ['Googles Yoram-Schema ist nicht dokumentiert – Wert = Durchschnitt der Spam-Heuristiken dieser Seite.'],
      data: { stuffing: s.stuffing, spamWords: s.spamWords, gibberish: s.gibberish, hidden: s.hidden },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
