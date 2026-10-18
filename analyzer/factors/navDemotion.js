// navDemotion: Abwertung durch das System für navigationale Abwertungen. Das Feld ist im Leak
// nicht näher erklärt – wir prüfen Navigation und Bedienbarkeit als Näherung.
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';
import { scale, weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'navDemotion',
  title: 'Navigation & Bedienbarkeit',
  category: 'spam_demotion',
  weight: 1,
  async evaluate(ctx) {
    const [page] = await Promise.all([ctx.page(), ctx.sitePages()]);
    const internal = page.links.filter((l) => l.internal).length;
    const linksHome = page.links.some((l) => l.internal && new URL(l.href).pathname.replace(/\/$/, '') === '');
    const broken = ctx.sampleErrors || [];
    const checks = [
      ['Navigationsbereich (nav)', page.hasNav, 2],
      ['Breadcrumbs', page.hasBreadcrumb, 1],
      ['Link zur Startseite', linksHome, 1],
      ['Suchfunktion', page.hasSearch, 1],
    ];
    const base = (checks.filter((c) => c[1]).reduce((a, c) => a + c[2], 0) / checks.reduce((a, c) => a + c[2], 0)) * 100;
    return {
      score: weighted([[base, 2], [scale(internal, 3, 30), 1], [broken.length ? scale(broken.length, 4, 0) : 100, 1]]),
      method: METHOD.PROXY,
      confidence: 'niedrig',
      findings: [
        `Vorhanden: ${checks.filter((c) => c[1]).map((c) => c[0]).join(', ') || 'nichts'}; ${internal} interne Links.`,
        broken.length ? `Fehlerhafte interne Seiten in der Stichprobe: ${broken.slice(0, 3).join(', ')}` : 'Keine fehlerhaften internen Seiten in der Stichprobe.',
      ],
      recommendations: [...checks.filter((c) => !c[1]).map((c) => `Ergänzen: ${c[0]}.`), broken.length ? 'Defekte interne Links reparieren.' : null],
      data: { internal, broken },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
