// urlPoisoningData: Spam-URLs werden zurückgehalten – wir prüfen die URL-Struktur auf typische
// Merkmale von Spam- und Müll-URLs.
import { isSpamUrl } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';

const factor = defineFactor({
  id: 'urlPoisoningData',
  title: 'Saubere URLs (URL-Poisoning)',
  category: 'spam_demotion',
  weight: 1,
  async evaluate(ctx) {
    const page = await ctx.page();
    const u = new URL(page.finalUrl);
    const params = [...u.searchParams.keys()].length;
    const hyphens = (u.pathname.match(/-/g) || []).length;
    const words = u.pathname.toLowerCase().split(/[-/_]+/).filter((w) => w.length > 3);
    const repeated = words.length - new Set(words).size;
    const issues = [
      ['URL länger als 115 Zeichen', page.finalUrl.length > 115, 10],
      ['mehr als 3 URL-Parameter', params > 3, 15],
      ['mehr als 8 Bindestriche', hyphens > 8, 10],
      ['Wörter im Pfad wiederholt', repeated >= 2, 10],
      ['Spam-Begriffe oder Spam-Domain in der URL', isSpamUrl(page.finalUrl), 50],
    ];
    const hit = issues.filter((i) => i[1]);
    return {
      score: Math.max(0, 100 - hit.reduce((a, i) => a + i[2], 0)),
      method: METHOD.HEURISTIC,
      confidence: 'mittel',
      findings: hit.length ? hit.map((i) => `Auffällig: ${i[0]}.`) : ['URL-Struktur unauffällig.'],
      recommendations: hit.map((i) => `Prüfen: ${i[0]}.`),
      data: { url: page.finalUrl, params, hyphens },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
