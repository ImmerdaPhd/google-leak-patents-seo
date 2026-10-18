// exactMatchDomainDemotion: Abwertung für Keyword-Domains (z. B. guenstige-kredite-vergleich.de),
// wenn der Inhalt dünn ist. Marken-Domains sind nicht betroffen.
import { siteSample, textStats } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';
import { STOPWORDS } from '../lib/text.js';
import { scale, weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'exactMatchDomainDemotion',
  title: 'Exact-Match-Domain-Abwertung',
  category: 'spam_demotion',
  weight: 1,
  async evaluate(ctx) {
    const [page, stats, site] = await Promise.all([ctx.page(), textStats(ctx), siteSample(ctx)]);
    const label = ctx.domain.split('.')[0].toLowerCase();
    const parts = label.split('-').filter((p) => p.length > 2 && !STOPWORDS.has(p));
    const topic = (page.title + ' ' + page.headings.map((h) => h.text).join(' ') + ' ' + stats.top.map(([w]) => w).join(' ')).toLowerCase();
    const matched = parts.filter((p) => topic.includes(p));
    const topInLabel = stats.top.slice(0, 5).filter(([w]) => w.length > 4 && label.includes(w)).length;
    const isEmd = (parts.length >= 2 && matched.length >= 2) || (parts.length >= 3 && matched.length >= 1) || (label.includes('-') && topInLabel >= 1);
    if (!isEmd)
      return {
        score: 100,
        method: METHOD.HEURISTIC,
        confidence: 'mittel',
        findings: [`„${ctx.domain}“ wirkt nicht wie eine Keyword-Domain.`],
        data: { label, parts, matched },
      };
    const score = weighted([[scale(site.thinRatio, 0.6, 0.1), 1], [scale(site.avgWords, 250, 900), 1]]);
    return {
      score,
      method: METHOD.HEURISTIC,
      confidence: 'mittel',
      findings: [`„${ctx.domain}“ wirkt wie eine Keyword-Domain (Treffer: ${matched.join(', ') || 'Top-Begriff im Namen'}).`, 'Die Abwertung greift vor allem bei dünnem Inhalt – bewertet wird daher die Inhaltstiefe der Website.'],
      recommendations: score < 70 ? ['Inhalt deutlich ausbauen und eine Marke aufbauen, statt auf den Domainnamen zu setzen.'] : [],
      data: { label, parts, matched },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
