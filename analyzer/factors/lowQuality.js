// lowQuality: Niedrigqualitäts-Score – eigener Mehrwert (Gemini) plus Werbe-/Affiliate-Last und Textumfang.
import { AD_HOSTS, outbound, textStats } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';
import { scale, weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'lowQuality',
  title: 'Niedrigqualitäts-Score',
  category: 'content_quality',
  weight: 3,
  gemini: {
    text: [{ id: 'addedValue', frage: 'Bietet die Seite eigenen Mehrwert gegenüber anderen Seiten zum selben Thema – statt kopierter Hersteller- oder Fremdtexte, dünner Affiliate-Inhalte oder austauschbarer Massenware? 100 = klarer eigener Mehrwert, 0 = kein Mehrwert.' }],
  },
  async evaluate(ctx) {
    const [page, stats, out, ai] = await Promise.all([ctx.page(), textStats(ctx), outbound(ctx), ctx.ai.rate('addedValue')]);
    const adRequests = page.requests.filter((r) => AD_HOSTS.test(r.url)).length;
    const words = scale(stats.words, 150, 800);
    const ads = scale(adRequests, 60, 5);
    const affiliateShare = out.total ? out.affiliate.length / Math.max(page.links.length, 1) : 0;
    const affiliate = scale(affiliateShare, 0.3, 0.02);
    const heuristic = weighted([[words, 2], [ads, 1], [affiliate, 1]]);
    return {
      score: weighted([[ai?.score, 3], [heuristic, 2]]),
      method: ai ? METHOD.GEMINI : METHOD.HEURISTIC,
      confidence: ai ? 'mittel' : 'niedrig',
      findings: [
        ai ? `Gemini (eigener Mehrwert): ${ai.score}/100 – ${ai.reason}` : null,
        `${stats.words} Wörter Haupttext, ${adRequests} Werbe-Requests, ${out.affiliate.length} Affiliate-Links.`,
      ],
      recommendations: [
        stats.words < 300 ? 'Inhalt ausbauen: konkrete Informationen, Beispiele, eigene Daten.' : null,
        adRequests > 30 ? 'Werbung reduzieren – Inhalt sollte im Vordergrund stehen.' : null,
        ai && ai.score < 60 ? 'Kopierte oder generische Texte durch eigene Inhalte mit Mehrwert ersetzen.' : null,
      ],
      data: { gemini: ai, words: stats.words, adRequests, affiliateLinks: out.affiliate.length },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
