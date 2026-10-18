// productReviewPDemoteSite: Auf-/Abwertung bei Produktbewertungen (Product-Reviews-Update).
import { METHOD, defineFactor, notApplicable, runIfMain } from '../lib/factor.js';
import { sameSite, weighted } from '../lib/util.js';

const REVIEW_RE = /\b(test|tests|testbericht|im test|review|reviews|vergleich|erfahrung(en)?|bewertung|testsieger|best(e|en)?\s|top\s?\d+|vs\.?)\b/i;

const factor = defineFactor({
  id: 'productReviewPDemoteSite',
  title: 'Qualität von Produktbewertungen',
  category: 'content_quality',
  weight: 2,
  gemini: {
    text: [{ id: 'reviewQuality', frage: 'Nur falls die Seite ein Produkttest, eine Produktbewertung oder ein Produktvergleich ist: Wie gut erfüllt sie Googles Kriterien für hochwertige Reviews – eigene Tests mit Belegen (Fotos, Messwerte), Vor- und Nachteile, Vergleich mit Alternativen, nachvollziehbare Expertise? 100 = vorbildlich. Ist es kein Review, gib null.' }],
  },
  async evaluate(ctx) {
    const page = await ctx.page();
    const types = new Set([...page.ldTypes, ...page.microdataTypes]);
    const h1 = page.headings.find((h) => h.level === 1)?.text || '';
    const isReview = types.has('Review') || types.has('AggregateRating') || REVIEW_RE.test(page.title + ' ' + h1);
    if (!isReview) return notApplicable('Seite ist keine Produktbewertung bzw. kein Produktvergleich.');
    const ai = await ctx.ai.rate('reviewQuality');
    const headings = page.headings.map((h) => h.text.toLowerCase()).join(' | ');
    const prosCons = /(vorteil|nachteil|pro\b|contra|kontra|pros|cons|stärken|schwächen)/.test(headings + ' ' + page.mainText.slice(0, 20000).toLowerCase());
    const ownImages = page.images.filter((i) => i.src && sameSite(i.src, page.finalUrl) && i.width > 200).length;
    const checks = [
      ['Vor- und Nachteile genannt', prosCons],
      ['eigene Produktfotos (≥ 3)', ownImages >= 3],
      ['Vergleichstabelle', page.counts.tables > 0],
      ['Review-Schema', types.has('Review')],
      ['Autor angegeben', !!(page.authorText || page.metaAuthor)],
      ['ausführlich (≥ 1200 Wörter)', (page.mainText.match(/\S+/g) || []).length >= 1200],
    ];
    const heuristic = (checks.filter((c) => c[1]).length / checks.length) * 100;
    return {
      score: weighted([[ai?.score, 3], [heuristic, 2]]),
      method: ai ? METHOD.GEMINI : METHOD.HEURISTIC,
      confidence: ai ? 'mittel' : 'niedrig',
      findings: [
        ai ? `Gemini (Review-Qualität): ${ai.score}/100 – ${ai.reason}` : null,
        `Erfüllt: ${checks.filter((c) => c[1]).map((c) => c[0]).join(', ') || 'nichts'}.`,
      ],
      recommendations: checks.filter((c) => !c[1]).map((c) => `Ergänzen: ${c[0]}.`),
      data: { gemini: ai, checks: Object.fromEntries(checks) },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
