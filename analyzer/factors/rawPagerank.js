// rawPagerank: PageRank von Duplikat-URLs, der an die Hauptversion weitergereicht wird.
// Gemessen: führen http/https und www/ohne-www per 301 auf dieselbe URL? Passt der Canonical?
import { normalizeUrl } from '../lib/context.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';

const factor = defineFactor({
  id: 'rawPagerank',
  title: 'Weitergabe von Duplikat-PageRank (Weiterleitungen/Canonical)',
  category: 'links_authority',
  weight: 2,
  async evaluate(ctx) {
    const [variants, page] = await Promise.all([ctx.variants(), ctx.page()]);
    const ok = variants.filter((v) => v.finalStatus >= 200 && v.finalStatus < 300);
    const finals = new Set(ok.map((v) => normalizeUrl(v.finalUrl) + '|' + new URL(v.finalUrl).protocol + new URL(v.finalUrl).hostname));
    const temporary = variants.filter((v) => v.chain.some((c) => c.status === 302 || c.status === 307));
    const longChains = variants.filter((v) => v.chain.length > 3);
    const canonicalOk = !page.canonical || normalizeUrl(page.canonical) === normalizeUrl(page.finalUrl);
    let score = 100;
    const findings = variants.map((v) => `${v.variant} → ${v.finalUrl} (${v.chain.map((c) => c.status || 'Fehler').join(' → ')})`);
    if (finals.size > 1) score -= 50;
    if (temporary.length) score -= 15;
    if (longChains.length) score -= 10;
    if (!canonicalOk) score -= 25;
    if (!page.canonical) score -= 5;
    return {
      score,
      method: METHOD.MEASURED,
      confidence: 'hoch',
      findings: [
        finals.size > 1 ? `Varianten enden auf ${finals.size} verschiedenen URLs – PageRank wird aufgeteilt.` : 'Alle erreichbaren Varianten führen auf dieselbe URL.',
        ...findings,
        page.canonical ? `Canonical: ${page.canonical}${canonicalOk ? ' (passt)' : ' (zeigt auf eine andere URL!)'}` : 'Kein Canonical-Tag gesetzt.',
      ],
      recommendations: [
        finals.size > 1 ? 'Alle Varianten (http/https, www/ohne www) per 301 auf eine Version leiten.' : null,
        temporary.length ? 'Temporäre Weiterleitungen (302/307) durch permanente (301/308) ersetzen.' : null,
        longChains.length ? 'Weiterleitungsketten auf einen Sprung verkürzen.' : null,
        !page.canonical ? 'Selbstreferenzierenden Canonical-Tag setzen.' : null,
      ],
      data: { variants, canonical: page.canonical },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
