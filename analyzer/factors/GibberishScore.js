// GibberishScore: Anteil sinnloser Texte (Spinner, kaputte Übersetzungen) – Heuristik + Gemini.
import { spamSignals } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';
import { round, weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'GibberishScore',
  title: 'Sinnloser Text (Gibberish)',
  category: 'spam_demotion',
  weight: 1,
  gemini: {
    text: [{ id: 'coherence', frage: 'Ist der Text sprachlich sinnvoll und zusammenhängend – kein maschinell gesponnener, sinnloser oder kaputt übersetzter Text? 100 = vollständig sinnvoll und flüssig.' }],
  },
  async evaluate(ctx) {
    const [s, ai] = await Promise.all([spamSignals(ctx), ctx.ai.rate('coherence')]);
    return {
      score: weighted([[ai?.score, 2], [s.gibberish, 2]]),
      method: ai ? METHOD.GEMINI : METHOD.HEURISTIC,
      confidence: ai ? 'mittel' : 'niedrig',
      findings: [
        ai ? `Gemini (Textkohärenz): ${ai.score}/100 – ${ai.reason}` : null,
        s.gib ? `${round(s.gib.suspiciousRatio * 100, 1)} % auffällige Wörter, Ø Wortlänge ${round(s.gib.avgWordLength, 1)}.` : 'Zu wenig Text für die Heuristik.',
      ],
      recommendations: s.gibberish < 70 ? ['Automatisch erzeugte oder übersetzte Texte von Menschen überarbeiten lassen.'] : [],
      data: { gemini: ai, gib: s.gib },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
