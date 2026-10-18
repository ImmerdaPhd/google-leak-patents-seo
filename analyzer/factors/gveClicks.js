// gveClicks: "gute" Klicks auf Bilder – Nutzer bleiben auf der Seite. Bewertet wird, ob Bilder
// gut beschrieben sind und auf einer passenden Seite stehen.
import { imageInfo } from '../lib/analysis.js';
import { METHOD, defineFactor, notApplicable, runIfMain } from '../lib/factor.js';
import { overlap } from '../lib/text.js';
import { round, weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'gveClicks',
  title: 'Gute Bildklicks (GVE)',
  category: 'click_engagement',
  weight: 1,
  async evaluate(ctx) {
    const [page, img] = await Promise.all([ctx.page(), imageInfo(ctx)]);
    if (!img.content.length) return notApplicable('Keine Inhaltsbilder auf der Seite.');
    const topic = page.title + ' ' + page.headings.map((h) => h.text).join(' ');
    const relevantAlt = img.content.filter((i) => (i.alt || i.caption) && overlap(i.alt || i.caption, topic + ' ' + page.mainText.slice(0, 4000)) >= 0.3).length;
    const altShare = img.withAlt.length / img.content.length;
    const relShare = relevantAlt / img.content.length;
    const largeShare = img.content.filter((i) => i.naturalWidth >= 800).length / img.content.length;
    return {
      score: weighted([[altShare * 100, 2], [relShare * 100, 2], [largeShare * 100, 1], [img.captioned.length ? 100 : 50, 1]]),
      method: METHOD.PROXY,
      confidence: 'niedrig',
      findings: [`${img.content.length} Inhaltsbilder: ${round(altShare * 100)} % mit Alt-Text, ${round(relShare * 100)} % thematisch passend beschrieben, ${round(largeShare * 100)} % groß (≥ 800 px), ${img.captioned.length} mit Bildunterschrift.`],
      recommendations: [altShare < 0.9 ? 'Allen Inhaltsbildern beschreibende Alt-Texte geben.' : null, !img.captioned.length ? 'Wichtige Bilder mit Bildunterschrift (figcaption) versehen.' : null],
      data: { altShare, relShare, largeShare },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
