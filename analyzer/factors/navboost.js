// navboost: Klick-basierter Multiplikator (NavBoost). Echte Klickdaten hat nur Google – wir
// bewerten, was gute Klicks begünstigt: attraktives Snippet, Rich Results, Ladezeit, Intent-Treffer.
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';
import { scale, weighted } from '../lib/util.js';

const RICH = ['FAQPage', 'HowTo', 'Product', 'Review', 'AggregateRating', 'Recipe', 'Article', 'NewsArticle', 'BlogPosting', 'BreadcrumbList', 'VideoObject', 'Event', 'LocalBusiness', 'QAPage'];

const factor = defineFactor({
  id: 'navboost',
  title: 'NavBoost (Klick-Zufriedenheit)',
  category: 'click_engagement',
  weight: 2,
  gemini: {
    text: [{ id: 'intentMatch', frage: 'Hält die Seite, was Title und Meta-Description versprechen, und beantwortet sie die vermutete Suchanfrage schnell (Kernaussage weit oben, ohne langes Vorgeplänkel)? 100 = Nutzer findet sofort, was er sucht.' }],
  },
  async evaluate(ctx) {
    const [page, ai] = await Promise.all([ctx.page(), ctx.ai.rate('intentMatch')]);
    const tl = page.title.length;
    const dl = (page.metaDescription || '').length;
    const rich = [...new Set(page.ldTypes.filter((t) => RICH.includes(t)))];
    const snippet = weighted([
      [tl >= 30 && tl <= 65 ? 100 : tl ? 50 : 0, 2],
      [dl >= 70 && dl <= 165 ? 100 : dl ? 50 : 0, 1],
      [rich.length ? 100 : 30, 1],
      [page.favicon ? 100 : 40, 1],
    ]);
    const speed = page.vitals.lcp ? scale(page.vitals.lcp, 4000, 1800) : null;
    return {
      score: weighted([[ai?.score, 2], [snippet, 2], [speed, 1]]),
      method: METHOD.PROXY,
      confidence: 'niedrig',
      findings: [
        'Echte Klickdaten kennt nur Google – bewertet werden Faktoren, die gute Klicks begünstigen.',
        ai ? `Gemini (Suchintention erfüllt): ${ai.score}/100 – ${ai.reason}` : null,
        `Title ${tl} Zeichen, Description ${dl} Zeichen, Rich-Result-Typen: ${rich.join(', ') || 'keine'}, LCP ${page.vitals.lcp ? Math.round(page.vitals.lcp) + ' ms' : 'unbekannt'}.`,
      ],
      recommendations: [
        tl < 30 || tl > 65 ? 'Title auf 30–65 Zeichen bringen, Kernnutzen vorne nennen.' : null,
        dl < 70 || dl > 165 ? 'Meta-Description mit 70–165 Zeichen schreiben, die zum Klicken einlädt.' : null,
        !rich.length ? 'Passende strukturierte Daten für Rich Results ergänzen.' : null,
        'In der Search Console Klickrate und Positionen beobachten.',
      ],
      data: { gemini: ai, titleLength: tl, descLength: dl, rich, lcp: page.vitals.lcp },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
