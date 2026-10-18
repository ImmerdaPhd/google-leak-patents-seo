// violatesMobileInterstitialPolicy: Verstoß gegen die Regeln zu aufdringlichen Overlays auf Smartphones.
// Gemessen in einer iPhone-Emulation mit Playwright, 3 Sekunden nach dem Laden.
import { classifyOverlays } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';

const factor = defineFactor({
  id: 'violatesMobileInterstitialPolicy',
  title: 'Mobile Interstitials (Pop-ups auf dem Handy)',
  category: 'spam_demotion',
  weight: 2,
  async evaluate(ctx) {
    const m = await ctx.mobile();
    const { intrusive, legal } = classifyOverlays(m.overlays);
    let score = 100;
    if (intrusive.length) score = 10;
    else if (legal.some((o) => o.coverage >= 0.5)) score = 75;
    if (!m.viewport) score -= 20;
    if (m.horizontalOverflow) score -= 10;
    return {
      score: Math.max(0, score),
      method: METHOD.MEASURED,
      confidence: 'hoch',
      findings: [
        intrusive.length ? `Aufdringliches Overlay: ${intrusive.map((o) => `${Math.round(o.coverage * 100)} % des Bildschirms – ${o.text ? `„${o.text.slice(0, 70)}“` : '(ohne Text)'}`).join('; ')}` : 'Kein aufdringliches Overlay erkannt.',
        legal.length ? `Rechtlich bedingtes Overlay (Cookie/Alter): ${Math.round(Math.max(...legal.map((o) => o.coverage)) * 100)} % des Bildschirms – ist erlaubt, sollte aber klein sein.` : null,
        !m.viewport ? 'Kein Viewport-Meta-Tag – Seite ist nicht für Mobilgeräte optimiert.' : null,
        m.horizontalOverflow ? 'Seite scrollt auf dem Handy horizontal.' : null,
      ],
      recommendations: [
        intrusive.length ? 'Kein bildschirmfüllendes Pop-up beim Seitenaufruf; stattdessen kleines Banner oder Anzeige erst nach dem Scrollen.' : null,
        legal.some((o) => o.coverage >= 0.5) ? 'Cookie-Banner platzsparender gestalten (z. B. als Leiste unten).' : null,
      ],
      data: m,
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
