// tqStar: technische Bildqualität (Schärfe, Belichtung, Auflösung). Gemessen: Auflösung, Format,
// Dateigröße; bewertet: Bildqualität per Gemini (multimodal).
import { METHOD, defineFactor, notApplicable, runIfMain } from '../lib/factor.js';
import { round, weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'tqStar',
  title: 'Technische Bildqualität (TQ*)',
  category: 'media_image_video',
  weight: 1,
  gemini: {
    images: [{ id: 'technicalQuality', frage: 'Technische Bildqualität: Schärfe, Belichtung, Auflösung, Bildaufbau, keine Kompressionsartefakte oder Verpixelung. 100 = professionelle Qualität.' }],
  },
  async evaluate(ctx) {
    const [imgs, ai] = await Promise.all([ctx.topImages(4), ctx.ai.rateImages('technicalQuality')]);
    if (!imgs.length) return notApplicable('Keine Inhaltsbilder gefunden.');
    const hiRes = imgs.filter((i) => i.naturalWidth >= 1200).length / imgs.length;
    const modern = imgs.filter((i) => /webp|avif/.test(i.mimeType)).length / imgs.length;
    const light = imgs.filter((i) => i.bytes < 400_000).length / imgs.length;
    const heuristic = weighted([[hiRes * 100, 2], [modern * 100, 1], [light * 100, 1]]);
    return {
      score: weighted([[ai?.score, 3], [heuristic, 2]]),
      method: ai ? METHOD.GEMINI : METHOD.MEASURED,
      confidence: ai ? 'mittel' : 'niedrig',
      findings: [
        ai ? `Gemini (technische Qualität): ${ai.score}/100 – ${ai.reason}` : null,
        `${imgs.length} größte Bilder: ${round(hiRes * 100)} % ≥ 1200 px breit, ${round(modern * 100)} % WebP/AVIF, ${round(light * 100)} % unter 400 KB.`,
        ...imgs.map((i) => `${i.src.split('/').pop().slice(0, 50)} – ${i.naturalWidth}×${i.naturalHeight}, ${i.mimeType}, ${round(i.bytes / 1024)} KB`),
      ],
      recommendations: [hiRes < 0.5 ? 'Bilder in höherer Auflösung (≥ 1200 px Breite) einbinden.' : null, modern < 0.5 ? 'Moderne Formate (WebP/AVIF) verwenden.' : null],
      data: { gemini: ai, hiRes, modern, light },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
