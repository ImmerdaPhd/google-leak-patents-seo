// spamCookbookAction: feste Spam-"Rezepte" – bekannte Muster lösen automatisch eine Aktion aus.
// Wir prüfen die gängigsten Muster aus Googles Spam-Richtlinien.
import { cloaking, outbound, siteSample, spamSignals } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';

const factor = defineFactor({
  id: 'spamCookbookAction',
  title: 'Bekannte Spam-Muster (Cookbook-Rezepte)',
  category: 'spam_demotion',
  weight: 2,
  async evaluate(ctx) {
    const [s, c, out, site] = await Promise.all([spamSignals(ctx), cloaking(ctx), outbound(ctx), siteSample(ctx)]);
    const recipes = [
      ['Doorway-Seiten (viele fast identische Seiten)', site.nearDupRatio > 0.3, 35],
      ['Versteckter Text', s.hidden < 60, 30],
      ['Irreführende Weiterleitung (Meta-Refresh/fremde Domain)', s.metaRefreshRedirect || s.offsiteRedirect, 35],
      ['Cloaking (Googlebot sieht anderen Inhalt)', c.comparable && c.similarity < 0.5, 40],
      ['Keyword-Stuffing', s.stuffing < 40, 25],
      ['Ungekennzeichnete Affiliate-Links in großer Zahl', out.affiliateUnmarked.length > 15, 20],
      ['Links auf Spam-Websites', out.spam.length > 2, 25],
    ];
    const hit = recipes.filter((r) => r[1]);
    return {
      score: Math.max(0, 100 - hit.reduce((a, r) => a + r[2], 0)),
      method: METHOD.HEURISTIC,
      confidence: 'mittel',
      findings: hit.length ? hit.map((r) => `Muster erkannt: ${r[0]}`) : ['Keines der geprüften Spam-Muster erkannt.'],
      recommendations: hit.map((r) => `Beheben: ${r[0]}.`),
      data: { recipes: Object.fromEntries(recipes.map((r) => [r[0], r[1]])) },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
