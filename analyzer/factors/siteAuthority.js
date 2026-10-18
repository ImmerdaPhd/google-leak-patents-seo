// siteAuthority: Autorität der gesamten Website. Googles Wert ist nicht öffentlich – mit
// OPENPAGERANK_API_KEY nutzen wir Open PageRank (Linkautorität der Domain), sonst Näherungen.
import { trust } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';
import { round, scale, weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'siteAuthority',
  title: 'Website-Autorität (siteAuthority)',
  category: 'links_authority',
  weight: 3,
  async evaluate(ctx) {
    const [opr, rdap, t] = await Promise.all([ctx.openPageRank(), ctx.rdap(), trust(ctx)]);
    const age = rdap ? scale(rdap.ageYears, 0, 10) : null;
    const brand = (t.organization ? 50 : 0) + (t.sameAs ? 50 : 0);
    const oprScore = opr ? opr.pageRank * 10 : null;
    const score = weighted([[oprScore, 4], [age, 1], [brand, 1]]);
    return {
      score,
      method: METHOD.PROXY,
      confidence: opr ? 'mittel' : 'niedrig',
      findings: [
        opr ? `Open PageRank der Domain: ${opr.pageRank}/10${opr.rank ? ` (Rang ${opr.rank})` : ''}.` : 'Kein OPENPAGERANK_API_KEY gesetzt – nur Näherung über Domain-Alter und Marken-Signale.',
        rdap ? `Domain registriert seit ${rdap.registered.slice(0, 10)} (${round(rdap.ageYears, 1)} Jahre).` : 'Domain-Alter nicht ermittelbar.',
        `Organisation im Schema: ${t.organization ? 'ja' : 'nein'}, sameAs-Profile: ${t.sameAs ? 'ja' : 'nein'}.`,
      ],
      recommendations: [
        'Erwähnungen und Links von relevanten Fachseiten, Medien und Verbänden gewinnen.',
        !t.sameAs ? 'Organization-Schema mit sameAs-Links zu offiziellen Profilen (Wikipedia, LinkedIn …) ergänzen.' : null,
      ],
      data: { opr, rdap, organization: t.organization, sameAs: t.sameAs },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
