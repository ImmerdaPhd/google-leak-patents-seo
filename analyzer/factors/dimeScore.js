// dimeScore: Bild-Attraktivität (DImE) – lässt sich nur inhaltlich beurteilen, deshalb per Gemini (multimodal).
// Ohne GEMINI_API_KEY bleibt der Wert leer.
import { METHOD, defineFactor, notApplicable, runIfMain } from '../lib/factor.js';

const factor = defineFactor({
  id: 'dimeScore',
  title: 'Bild-Attraktivität (DImE)',
  category: 'media_image_video',
  weight: 1,
  gemini: {
    images: [{ id: 'engagingness', frage: 'Wie ansprechend ist das Bild – würde man es in der Bildersuche anklicken? Klare Komposition, eindeutiges Hauptmotiv, attraktive Farben und Licht. 100 = sehr ansprechend.' }],
  },
  async evaluate(ctx) {
    const imgs = await ctx.topImages(4);
    if (!imgs.length) return notApplicable('Keine Inhaltsbilder gefunden.');
    const ai = await ctx.ai.rateImages('engagingness');
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
      recommendations: ai.score < 60 ? ['Bilder mit klarem Hauptmotiv, gutem Licht und natürlichen, kräftigen Farben verwenden.'] : [],
      data: { gemini: ai },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
