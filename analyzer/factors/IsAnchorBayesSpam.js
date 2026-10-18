// IsAnchorBayesSpam: Ein Bayes-Klassifikator hält die Linktexte der Seite für Spam. Externe Links
// sind nicht abrufbar – wir prüfen interne Linktexte auf die Seite auf Spam-Vokabular.
import { internalInlinks } from '../lib/analysis.js';
import { METHOD, defineFactor, notMeasurable, runIfMain } from '../lib/factor.js';
import { SPAM_TERMS, countTerms } from '../lib/text.js';

const factor = defineFactor({
  id: 'IsAnchorBayesSpam',
  title: 'Spam-Linktexte (Bayes-Klassifikator)',
  category: 'spam_demotion',
  weight: 1,
  async evaluate(ctx) {
    const inl = await internalInlinks(ctx);
    const anchors = inl.links.map((l) => l.text).filter(Boolean);
    if (!anchors.length) return notMeasurable('Keine internen Linktexte auf diese Seite gefunden; externe Linktexte sind nicht abrufbar.', 'Externe Linktexte mit einem Backlink-Tool prüfen.');
    const spam = anchors.filter((a) => countTerms(a, SPAM_TERMS).length);
    return {
      score: spam.length ? Math.max(0, 100 - (spam.length / anchors.length) * 200) : 100,
      method: METHOD.PROXY,
      confidence: 'niedrig',
      findings: [`${anchors.length} interne Linktexte geprüft, ${spam.length} mit Spam-Vokabular.`, 'Externe Linktexte sind ohne Linkdatenbank nicht prüfbar.'],
      recommendations: spam.length ? ['Spam-Linktexte entfernen (Hinweis auf gehackte Seiten).'] : [],
      data: { anchors, spam },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
