// boost: Multiplikator eines Bildes für bestimmte Suchanfragen. Bewertet wird die Bild-SEO,
// mit der Bilder einer Suchanfrage zugeordnet werden können.
import { imageInfo } from '../lib/analysis.js';
import { METHOD, defineFactor, notApplicable, runIfMain } from '../lib/factor.js';
import { round, weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'boost',
  title: 'Bild-Boost pro Suchanfrage (Bild-SEO)',
  category: 'media_image_video',
  weight: 1,
  async evaluate(ctx) {
    const [page, img] = await Promise.all([ctx.page(), imageInfo(ctx)]);
    if (!img.content.length) return notApplicable('Keine Inhaltsbilder gefunden.');
    const n = img.content.length;
    const ogImage = page.jsonld.some((o) => o.image) || page.ldTypes.includes('ImageObject');
    const firstLazy = [...img.content].sort((a, b) => a.top - b.top)[0]?.loading === 'lazy';
    return {
      score: weighted([
        [(img.withAlt.length / n) * 100, 3],
        [(img.descriptiveName.length / n) * 100, 1],
        [(img.captioned.length / n) * 100, 1],
        [ogImage ? 100 : 40, 1],
        [firstLazy ? 50 : 100, 1],
      ]),
      method: METHOD.MEASURED,
      confidence: 'mittel',
      findings: [
        `${n} Inhaltsbilder: ${round((img.withAlt.length / n) * 100)} % Alt-Text, ${round((img.descriptiveName.length / n) * 100)} % sprechende Dateinamen, ${round((img.captioned.length / n) * 100)} % Bildunterschrift.`,
        `Bild in strukturierten Daten: ${ogImage ? 'ja' : 'nein'}; erstes Bild lazy geladen: ${firstLazy ? 'ja (bremst)' : 'nein'}.`,
      ],
      recommendations: [
        img.descriptiveName.length < n / 2 ? 'Sprechende Dateinamen verwenden (z. B. krawatte-binden-schritt-1.jpg).' : null,
        !ogImage ? 'Bild im Article/Product-Schema angeben.' : null,
        firstLazy ? 'Das erste, sichtbare Bild nicht lazy laden.' : null,
      ],
      data: { n, withAlt: img.withAlt.length, descriptiveName: img.descriptiveName.length },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
