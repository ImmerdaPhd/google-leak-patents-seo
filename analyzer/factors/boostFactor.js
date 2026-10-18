// boostFactor: Multiplikator für Shopping-Websites – Vollständigkeit der Produktdaten.
import { METHOD, defineFactor, notApplicable, runIfMain } from '../lib/factor.js';

const factor = defineFactor({
  id: 'boostFactor',
  title: 'Shopping-Boost (Produktdaten)',
  category: 'content_quality',
  weight: 1,
  async evaluate(ctx) {
    const page = await ctx.page();
    const products = page.jsonld.filter((o) => [].concat(o['@type'] || []).some((t) => /^(Product|ProductGroup)$/.test(t)));
    const isShop = products.length || /product/i.test(page.ogType || '') || page.microdataTypes.includes('Product');
    if (!isShop) return notApplicable('Keine Produktseite erkannt (kein Product-Schema).');
    const p = products[0] || {};
    const offer = [].concat(p.offers || [])[0] || {};
    const checks = [
      ['Produktname', !!p.name],
      ['Produktbild', !!p.image],
      ['Preis', offer.price != null || offer.lowPrice != null],
      ['Währung', !!offer.priceCurrency],
      ['Verfügbarkeit', !!offer.availability],
      ['Versandinfos (shippingDetails)', !!offer.shippingDetails],
      ['Rückgaberichtlinie (hasMerchantReturnPolicy)', !!(offer.hasMerchantReturnPolicy || p.hasMerchantReturnPolicy)],
      ['Bewertungen (aggregateRating/review)', !!(p.aggregateRating || p.review)],
      ['Marke', !!p.brand],
      ['GTIN/SKU', !!(p.gtin || p.gtin13 || p.gtin8 || p.sku || p.mpn)],
    ];
    return {
      score: (checks.filter((c) => c[1]).length / checks.length) * 100,
      method: METHOD.MEASURED,
      confidence: products.length ? 'hoch' : 'mittel',
      findings: [`Produktdaten vollständig: ${checks.filter((c) => c[1]).length}/${checks.length}.`, page.hreflang.length ? `hreflang für ${page.hreflang.length} Sprach-/Länderversionen.` : null],
      recommendations: checks.filter((c) => !c[1]).map((c) => `Im Product-Schema ergänzen: ${c[0]}.`),
      data: { checks: Object.fromEntries(checks) },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
