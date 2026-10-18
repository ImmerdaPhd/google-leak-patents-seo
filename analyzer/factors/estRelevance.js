// estRelevance: Wie nützlich ist das Bild für das Thema (0 = themenfremd, 1 = sehr nützlich)?
// Gemini bewertet die Bilder inhaltlich; ohne KI: Alt-Texte vs. Seitenthema.
import { imageInfo } from '../lib/analysis.js';
import { METHOD, defineFactor, notApplicable, runIfMain } from '../lib/factor.js';
import { overlap } from '../lib/text.js';
import { round, weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'estRelevance',
  title: 'Bild-Relevanz für das Thema',
  category: 'media_image_video',
  weight: 1,
  gemini: {
    images: [{ id: 'imageRelevance', frage: 'Wie nützlich ist das Bild für das Thema der Seite (siehe Seitentitel)? 0 = themenfremd oder rein dekorativ (Logo, Platzhalter), 100 = sehr nützlich, zeigt oder erklärt das Thema.' }],
  },
  async evaluate(ctx) {
    const [page, img, ai] = await Promise.all([ctx.page(), imageInfo(ctx), ctx.ai.rateImages('imageRelevance')]);
    if (!img.content.length) return notApplicable('Keine Inhaltsbilder gefunden.');
    const topic = page.title + ' ' + page.headings.map((h) => h.text).join(' ');
    const rel = img.content.map((i) => (i.alt || i.caption ? overlap(i.alt || i.caption, topic) : 0));
    const heuristic = (rel.filter((r) => r >= 0.3).length / rel.length) * 100;
    return {
      score: weighted([[ai?.score, 3], [heuristic, ai ? 1 : 2]]),
      method: ai ? METHOD.GEMINI : METHOD.HEURISTIC,
      confidence: ai ? 'mittel' : 'niedrig',
      findings: [ai ? `Gemini (Bild-Relevanz): ${ai.score}/100 – ${ai.reason}` : null, `${round(heuristic)} % der Bilder sind per Alt-Text/Bildunterschrift dem Seitenthema zugeordnet.`],
      recommendations: heuristic < 60 ? ['Bilder verwenden, die das Thema zeigen oder erklären (Anleitungen, Diagramme, Beispiele), und passend beschriften.'] : [],
      data: { gemini: ai, heuristic },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
