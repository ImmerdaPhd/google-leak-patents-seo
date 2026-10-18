// SpamWordScore: Anteil typischer Spam-Wörter (Pharma, Casino, Kredite, Fake-Waren …).
import { spamSignals } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';
import { round } from '../lib/util.js';

const factor = defineFactor({
  id: 'SpamWordScore',
  title: 'Spam-Wörter',
  category: 'spam_demotion',
  weight: 1,
  async evaluate(ctx) {
    const s = await spamSignals(ctx);
    return {
      score: s.spamWords,
      method: METHOD.MEASURED,
      confidence: 'mittel',
      findings: [
        s.spamHits.length ? `Gefunden: ${s.spamHits.map(([t, n]) => `„${t}“ ${n}×`).join(', ')} (${round(s.spamPer1000, 1)} pro 1000 Wörter).` : 'Keine typischen Spam-Wörter gefunden.',
      ],
      recommendations: s.spamHits.length ? ['Prüfen, ob die Begriffe zum Thema gehören; eingeschleuste Inhalte (Hack, Kommentare) entfernen.'] : [],
      data: { hits: s.spamHits, per1000: s.spamPer1000 },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
