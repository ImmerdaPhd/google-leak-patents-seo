// KeywordStuffingScore: unnatürliche Wiederholung von Keywords (Text, Title, Alt-Texte).
import { spamSignals } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';
import { round } from '../lib/util.js';

const factor = defineFactor({
  id: 'KeywordStuffingScore',
  title: 'Keyword-Stuffing',
  category: 'spam_demotion',
  weight: 2,
  async evaluate(ctx) {
    const s = await spamSignals(ctx);
    const [w, n] = s.stats.top[0] || ['–', 0];
    const [bg, bn] = s.stats.topBigrams[0] || ['–', 0];
    return {
      score: s.stuffing,
      method: METHOD.MEASURED,
      confidence: s.stats.words > 150 ? 'hoch' : 'mittel',
      findings: [
        `Häufigstes Wort: „${w}“ ${n}× (${round(s.stats.topDensity * 100, 1)} % aller Wörter).`,
        `Häufigste Wortkombination: „${bg}“ ${bn}× (${round(s.stats.topBigramDensity * 100, 1)} %).`,
        s.titleRepeat >= 3 ? `Wort wird im Title ${s.titleRepeat}× wiederholt.` : null,
        s.altStuffed ? `${s.altStuffed} Alt-Texte wirken überladen.` : null,
      ],
      recommendations: s.stuffing < 70 ? ['Keyword seltener wiederholen, Synonyme und verwandte Begriffe nutzen; natürlich für Menschen schreiben.'] : [],
      data: { top: s.stats.top.slice(0, 5), topBigrams: s.stats.topBigrams.slice(0, 5) },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
