// spamrank: Wie wahrscheinlich verlinkt die Seite auf Spammer? – Analyse der ausgehenden Links.
import { outbound } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';

const factor = defineFactor({
  id: 'spamrank',
  title: 'Links auf Spam-Websites (spamrank)',
  category: 'spam_demotion',
  weight: 2,
  async evaluate(ctx) {
    const out = await outbound(ctx);
    const score = Math.max(0, 100 - out.spam.length * 25 - Math.min(30, out.affiliateUnmarked.length * 3));
    return {
      score,
      method: METHOD.HEURISTIC,
      confidence: 'mittel',
      findings: [
        `${out.total} externe Links zu ${out.domains.size} Domains.`,
        out.spam.length ? `Links auf Spam-Ziele: ${out.spam.slice(0, 5).map((l) => l.href).join(', ')}` : 'Keine Links auf erkennbare Spam-Ziele.',
        `${out.affiliate.length} Affiliate-Links, davon ${out.affiliateUnmarked.length} ohne rel="sponsored"/"nofollow".`,
      ],
      recommendations: [
        out.spam.length ? 'Links auf Spam-Websites entfernen.' : null,
        out.affiliateUnmarked.length ? 'Bezahlte/Affiliate-Links mit rel="sponsored" kennzeichnen.' : null,
      ],
      data: { total: out.total, spam: out.spam.map((l) => l.href), affiliateUnmarked: out.affiliateUnmarked.length },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
