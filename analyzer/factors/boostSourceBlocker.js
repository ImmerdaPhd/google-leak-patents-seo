// boostSourceBlocker: Seiten, die z. B. per robots gesperrt sind, dürfen Boost-Ziel sein, werden
// selbst aber nie geboostet. Gemessen: Ist die Seite crawl- und indexierbar?
import { normalizeUrl } from '../lib/context.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';

const factor = defineFactor({
  id: 'boostSourceBlocker',
  title: 'Indexierbarkeit (Boost-Sperre)',
  category: 'personalization_local',
  weight: 2,
  async evaluate(ctx) {
    const [page, robots] = await Promise.all([ctx.page(), ctx.robots()]);
    const u = new URL(page.finalUrl);
    const xRobots = page.headers['x-robots-tag'] || '';
    const checks = [
      ['robots.txt erlaubt Googlebot', robots.isAllowed(u.pathname + u.search)],
      ['kein noindex im Meta-Robots', !/noindex/i.test(page.metaRobots + ' ' + page.googlebotRobots)],
      ['kein noindex im X-Robots-Tag-Header', !/noindex/i.test(xRobots)],
      ['Canonical zeigt auf sich selbst (oder fehlt)', !page.canonical || normalizeUrl(page.canonical) === normalizeUrl(page.finalUrl)],
      ['HTTP-Status 200', page.status === 200],
    ];
    const failed = checks.filter((c) => !c[1]);
    const hard = failed.filter((c) => c[0] !== 'Canonical zeigt auf sich selbst (oder fehlt)');
    return {
      score: hard.length ? 0 : failed.length ? 60 : 100,
      method: METHOD.MEASURED,
      confidence: 'hoch',
      findings: failed.length ? failed.map((c) => `Nicht erfüllt: ${c[0]}.`) : ['Seite ist crawl- und indexierbar.'],
      recommendations: failed.map((c) => `Prüfen: ${c[0]}.`),
      data: { checks: Object.fromEntries(checks), robotsTxt: robots.exists, xRobots },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
