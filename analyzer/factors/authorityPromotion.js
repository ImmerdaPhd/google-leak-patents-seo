// authorityPromotion: Aufwertung für autoritative Seiten (Primärquellen, Fachinstitutionen).
import { trust } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';
import { scale, weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'authorityPromotion',
  title: 'Autoritäts-Aufwertung (Primärquelle)',
  category: 'links_authority',
  weight: 2,
  gemini: {
    text: [{ id: 'primarySource', frage: 'Ist diese Seite eine maßgebliche Primärquelle zu ihrem Thema (offizielle Stelle, Hersteller, Fachinstitution, eigene Daten oder Studien), die andere zitieren würden? 100 = maßgebliche Primärquelle, 0 = reine Sekundär- oder Zusammenfassungsseite.' }],
  },
  async evaluate(ctx) {
    const [t, rdap, ai] = await Promise.all([trust(ctx), ctx.rdap(), ctx.ai.rate('primarySource')]);
    const heuristic = weighted([
      [scale(t.citations, 0, 4), 2],
      [t.organization ? 100 : 0, 1],
      [t.sameAs ? 100 : 0, 1],
      [t.author ? 100 : 0, 1],
      [rdap ? scale(rdap.ageYears, 0, 10) : null, 1],
    ]);
    return {
      score: weighted([[ai?.score, 3], [heuristic, 2]]),
      method: ai ? METHOD.GEMINI : METHOD.HEURISTIC,
      confidence: 'niedrig',
      findings: [
        ai ? `Gemini (Primärquelle): ${ai.score}/100 – ${ai.reason}` : null,
        `${t.citations} Links auf autoritative Quellen, Organisation: ${t.organization ? 'ja' : 'nein'}, Autor: ${t.author ? 'ja' : 'nein'}.`,
      ],
      recommendations: ['Eigene Daten, Studien oder offizielle Informationen veröffentlichen, die andere zitieren.', t.citations === 0 ? 'Aussagen mit Primärquellen belegen und verlinken.' : null],
      data: { gemini: ai, citations: t.citations },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
