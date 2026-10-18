// spambrainTotalDocSpamScore: Gesamt-Spam-Score des KI-Systems SpamBrain für die Seite.
// Wir kombinieren eine Gemini-Spam-Einschätzung mit den Spam-Heuristiken der Seite.
// Score: 100 = kein Spam.
import { spamSignals } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';
import { weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'spambrainTotalDocSpamScore',
  title: 'SpamBrain: Spam-Score der Seite',
  category: 'spam_demotion',
  weight: 3,
  gemini: {
    text: [{ id: 'spamFree', frage: 'Wie frei von Webspam ist die Seite? Achte auf automatisch generierten Inhalt ohne Mehrwert, Keyword-Stuffing, Doorway-Muster, Scraping, versteckte Links oder Texte, irreführende Inhalte, Linkverkauf. 100 = eindeutig kein Spam, 0 = eindeutiger Spam.' }],
  },
  async evaluate(ctx) {
    const [s, ai] = await Promise.all([spamSignals(ctx), ctx.ai.rate('spamFree')]);
    const heuristic = Math.min(s.stuffing, s.spamWords, s.gibberish, s.hidden) * 0.3 + ((s.stuffing + s.spamWords + s.gibberish + s.hidden) / 4) * 0.7;
    return {
      score: weighted([[ai?.score, 3], [heuristic, 2]]),
      method: ai ? METHOD.GEMINI : METHOD.HEURISTIC,
      confidence: ai ? 'mittel' : 'niedrig',
      findings: [
        ai ? `Gemini (Spamfreiheit): ${ai.score}/100 – ${ai.reason}` : null,
        `Teil-Scores – Keyword-Stuffing: ${Math.round(s.stuffing)}, Spam-Wörter: ${Math.round(s.spamWords)}, Gibberish: ${Math.round(s.gibberish)}, versteckter Text: ${Math.round(s.hidden)}.`,
      ],
      recommendations: heuristic < 70 ? ['Spam-Merkmale beseitigen (siehe Keyword-Stuffing, Spam-Wörter, versteckter Text).'] : [],
      data: { gemini: ai, heuristic },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
