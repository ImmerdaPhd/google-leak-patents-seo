// pornWithHighConfidence: eindeutig pornografische Bilder werden bei harmlosen Suchen abgewertet.
// Text-Heuristik plus optionale Gemini-Prüfung der Bilder. Score: 100 = unbedenklich.
import { trust } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';

const factor = defineFactor({
  id: 'pornWithHighConfidence',
  title: 'Explizite Inhalte (Porn-Flag)',
  category: 'spam_demotion',
  weight: 1,
  gemini: {
    images: [{ id: 'imageSafe', frage: 'Ist das Bild für ein allgemeines Publikum unbedenklich (keine sexuell expliziten oder stark anzüglichen Inhalte)? 100 = völlig unbedenklich, 0 = eindeutig pornografisch.' }],
  },
  async evaluate(ctx) {
    const [page, t, ai] = await Promise.all([ctx.page(), trust(ctx), ctx.ai.rateImages('imageSafe')]);
    const adultMeta = /adult|mature|rta-5042/i.test(page.metaRating || '');
    const hits = t.adultHits.reduce((a, [, n]) => a + n, 0);
    let text = 100 - Math.min(80, hits * 10);
    if (adultMeta) text = Math.min(text, 20);
    const score = ai ? Math.min(ai.score, text) : text;
    return {
      score,
      method: ai ? METHOD.GEMINI : METHOD.HEURISTIC,
      confidence: ai ? 'hoch' : 'mittel',
      findings: [
        ai ? `Gemini (Bilder unbedenklich): ${ai.score}/100 – ${ai.reason}` : 'Bilder ohne Gemini nicht inhaltlich geprüft.',
        hits ? `Erwachsenen-Begriffe im Text: ${t.adultHits.map(([w, n]) => `${w} ${n}×`).join(', ')}.` : 'Keine Erwachsenen-Begriffe im Text.',
        adultMeta ? 'Seite ist per Meta-Tag als Erwachseneninhalt gekennzeichnet.' : null,
      ],
      recommendations: score < 70 ? ['Erwachseneninhalte klar trennen (eigene Domain/Verzeichnis) und mit rating=adult kennzeichnen.'] : [],
      data: { gemini: ai, adultHits: t.adultHits, adultMeta },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
