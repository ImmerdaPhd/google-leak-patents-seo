// serpDemotion: Abwertung im Q*-Scoring, vermutlich aus Signalen der Suchergebnisse
// (z. B. Nutzer springen sofort zurück). Näherung: Hält die Seite, was das Snippet verspricht?
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';
import { overlap } from '../lib/text.js';
import { scale, weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'serpDemotion',
  title: 'Suchergebnis-Zufriedenheit (SERP-Abwertung)',
  category: 'spam_demotion',
  weight: 2,
  gemini: {
    text: [{ id: 'intentMatch', frage: 'Hält die Seite, was Title und Meta-Description versprechen, und beantwortet sie die vermutete Suchanfrage schnell (Kernaussage weit oben, ohne langes Vorgeplänkel)? 100 = Nutzer findet sofort, was er sucht.' }],
  },
  async evaluate(ctx) {
    const [page, ai] = await Promise.all([ctx.page(), ctx.ai.rate('intentMatch')]);
    const h1 = page.headings.find((h) => h.level === 1)?.text || '';
    const titleH1 = h1 ? overlap(page.title, h1 + ' ' + page.mainText.slice(0, 1500)) : 0;
    const descMatch = page.metaDescription ? overlap(page.metaDescription, page.mainText.slice(0, 5000)) : null;
    const lcp = page.vitals.lcp;
    const heuristic = weighted([[titleH1 * 100, 2], [descMatch == null ? 40 : descMatch * 100, 1], [lcp ? scale(lcp, 4000, 2500) : null, 1]]);
    return {
      score: weighted([[ai?.score, 3], [heuristic, 2]]),
      method: ai ? METHOD.GEMINI : METHOD.PROXY,
      confidence: 'niedrig',
      findings: [
        ai ? `Gemini (Versprechen erfüllt): ${ai.score}/100 – ${ai.reason}` : null,
        `Title ↔ Inhalt: ${Math.round(titleH1 * 100)} % Übereinstimmung; Meta-Description ↔ Inhalt: ${descMatch == null ? 'keine Description' : Math.round(descMatch * 100) + ' %'}; LCP ${lcp ? Math.round(lcp) + ' ms' : 'unbekannt'}.`,
      ],
      recommendations: ['Kernaussage im ersten Absatz liefern.', !page.metaDescription ? 'Ehrliche Meta-Description schreiben, die den Inhalt zusammenfasst.' : null],
      data: { gemini: ai, titleH1, descMatch, lcp },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
