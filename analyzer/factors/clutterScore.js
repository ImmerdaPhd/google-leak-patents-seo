// clutterScore: Abwertung für viele störende Ressourcen (Werbung, Pop-ups, Autoplay, Tracker).
// Gemessen beim echten Laden der Seite mit Playwright.
import { AD_HOSTS, classifyOverlays } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';
import { registrableDomain, round, scale, weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'clutterScore',
  title: 'Störende Elemente (Clutter)',
  category: 'spam_demotion',
  weight: 2,
  async evaluate(ctx) {
    const page = await ctx.page();
    const own = registrableDomain(new URL(page.finalUrl).hostname);
    const third = new Set(page.requests.map((r) => { try { return registrableDomain(new URL(r.url).hostname); } catch { return own; } }).filter((d) => d !== own));
    const ads = page.requests.filter((r) => AD_HOSTS.test(r.url)).length;
    const adFrames = page.iframes.filter((f) => AD_HOSTS.test(f.src) || (f.width >= 250 && f.height >= 90 && /ads?[/_.-]|banner/i.test(f.src))).length;
    const autoplay = page.videos.filter((v) => v.autoplay && !v.muted).length;
    const overlays = classifyOverlays(page.overlays, 0.25).intrusive.length;
    const mb = page.requests.reduce((a, r) => a + r.bytes, 0) / 1e6;
    const score = weighted([
      [scale(ads, 80, 5), 3],
      [scale(adFrames, 6, 0), 2],
      [scale(third.size, 60, 10), 1],
      [scale(page.requests.length, 300, 60), 1],
      [autoplay ? 20 : 100, 1],
      [overlays ? 30 : 100, 2],
    ]);
    return {
      score,
      method: METHOD.MEASURED,
      confidence: 'hoch',
      findings: [
        `${page.requests.length} Requests (${round(mb, 1)} MB laut Header), ${third.size} Fremd-Domains.`,
        `${ads} Werbe-Requests, ${adFrames} Werbe-iFrames, ${autoplay} Autoplay-Videos mit Ton, ${overlays} große Overlays (Desktop).`,
      ],
      recommendations: [
        ads > 30 ? 'Anzahl der Werbeplätze reduzieren, vor allem oberhalb des Inhalts.' : null,
        third.size > 30 ? 'Unnötige Drittanbieter-Skripte, Widgets und Tracker entfernen.' : null,
        autoplay ? 'Autoplay mit Ton abschalten.' : null,
        overlays ? 'Große Pop-ups/Overlays entfernen oder verkleinern.' : null,
      ],
      data: { requests: page.requests.length, thirdParty: [...third].slice(0, 40), ads, adFrames, autoplay, overlays },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
