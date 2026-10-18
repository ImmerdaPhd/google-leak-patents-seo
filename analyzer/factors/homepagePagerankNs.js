// homepagePagerankNs: PageRank der Startseite, der auf alle Unterseiten übertragen wird.
import { METHOD, defineFactor, notMeasurable, runIfMain } from '../lib/factor.js';
import { scale, weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'homepagePagerankNs',
  title: 'PageRank der Startseite',
  category: 'links_authority',
  weight: 1,
  async evaluate(ctx) {
    const [opr, home, page, rdap] = await Promise.all([ctx.openPageRank(), ctx.homepage(), ctx.page(), ctx.rdap()]);
    const reachable = home && home.status >= 200 && home.status < 400;
    const linksHome = page.links.some((l) => l.internal && new URL(l.href).pathname.replace(/\/$/, '') === '');
    if (!opr && !rdap) return notMeasurable('Ohne OPENPAGERANK_API_KEY und Domain-Daten nicht bestimmbar.', 'OPENPAGERANK_API_KEY setzen (kostenlos bei domcop.com/openpagerank).');
    return {
      score: weighted([[opr ? opr.pageRank * 10 : null, 3], [rdap ? scale(rdap.ageYears, 0, 10) : null, 1], [reachable ? 100 : 0, 1]]),
      method: METHOD.PROXY,
      confidence: opr ? 'mittel' : 'niedrig',
      findings: [
        opr ? `Open PageRank der Domain/Startseite: ${opr.pageRank}/10.` : 'Ohne Open PageRank nur Näherung über Domain-Alter.',
        `Startseite erreichbar: ${reachable ? 'ja' : 'nein'} (Status ${home?.status}); Seite verlinkt zur Startseite: ${linksHome ? 'ja' : 'nein'}.`,
      ],
      recommendations: [linksHome ? null : 'Von jeder Seite zur Startseite verlinken (Logo/Breadcrumb).', 'Marken- und PR-Links auf die Startseite lenken.'],
      data: { opr, reachable, linksHome },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
