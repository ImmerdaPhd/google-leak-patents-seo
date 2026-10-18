// eqStar: Emotionale Bildwirkung (EQ*) – lässt sich nur inhaltlich beurteilen, deshalb per Gemini (multimodal).
// Ohne GEMINI_API_KEY bleibt der Wert leer.
import { METHOD, defineFactor, notApplicable, runIfMain } from '../lib/factor.js';

const factor = defineFactor({
  id: 'eqStar',
  title: 'Emotionale Bildwirkung (EQ*)',
  category: 'media_image_video',
  weight: 1,
  gemini: {
    images: [{ id: 'emotionalQuality', frage: 'Emotionale Wirkung: Wirkt das Bild inspirierend, lebensnah und mit Kontext (Lifestyle, Menschen, echte Situation) statt steril, generisch oder austauschbar? 100 = sehr inspirierend.' }],
  },
  async evaluate(ctx) {
    const imgs = await ctx.topImages(4);
    if (!imgs.length) return notApplicable('Keine Inhaltsbilder gefunden.');
    const ai = await ctx.ai.rateImages('emotionalQuality');
    if (!ai)
      return {
        score: null,
        method: METHOD.GEMINI,
        confidence: 'niedrig',
        findings: [ctx.ai.available ? 'Gemini hat keine Bewertung geliefert.' : 'Benötigt Gemini (GEMINI_API_KEY) – ohne KI nicht bewertbar.'],
      };
    return {
      score: ai.score,
      method: METHOD.GEMINI,
      confidence: 'mittel',
      findings: [`Gemini: ${ai.score}/100 – ${ai.reason}`, ai.perImage ? `Einzelwerte: ${ai.perImage.join(', ')}` : null],
      recommendations: ai.score < 60 ? ['Produkte und Themen im echten Einsatz zeigen; austauschbare Stockfotos durch eigene, stimmungsvolle Bilder ersetzen.'] : [],
      data: { gemini: ai },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
