// anchorMismatchDemotion: Abwertung, wenn Linktexte nicht zur Seite passen. Externe Backlinks
// sind ohne Linkdatenbank nicht abrufbar – wir prüfen daher die INTERNEN Linktexte.
import { internalInlinks } from '../lib/analysis.js';
import { METHOD, defineFactor, notMeasurable, runIfMain } from '../lib/factor.js';
import { overlap } from '../lib/text.js';
import { round } from '../lib/util.js';

const GENERIC = /^(mehr|weiter|hier|klicken|lesen|weiterlesen|read more|more|here|click|details|link|home|start|startseite|zur startseite|\d+)$/i;

const factor = defineFactor({
  id: 'anchorMismatchDemotion',
  title: 'Passende Linktexte (Anchor Mismatch)',
  category: 'links_authority',
  weight: 2,
  async evaluate(ctx) {
    const [page, inl] = await Promise.all([ctx.page(), internalInlinks(ctx)]);
    const anchors = inl.links.map((l) => l.text).filter((t) => t && !GENERIC.test(t.trim()));
    if (!anchors.length)
      return notMeasurable(
        inl.isHome ? 'Startseite – interne Linktexte sind hier meist Logo/„Startseite“.' : 'Keine aussagekräftigen internen Linktexte auf diese Seite in der Stichprobe gefunden.',
        'Externe Linktexte im Search-Console-Bericht „Links“ oder mit Ahrefs/Sistrix prüfen.',
      );
    const topic = page.title + ' ' + page.headings.filter((h) => h.level <= 2).map((h) => h.text).join(' ') + ' ' + page.mainText.slice(0, 3000);
    const scores = anchors.map((a) => overlap(a, topic));
    const matching = scores.filter((s) => s >= 0.5).length / scores.length;
    return {
      score: matching * 100,
      method: METHOD.PROXY,
      confidence: 'niedrig',
      findings: [
        `${anchors.length} interne Linktexte geprüft, ${round(matching * 100)} % passen thematisch zur Seite.`,
        `Beispiele: ${[...new Set(anchors)].slice(0, 5).map((a) => `„${a}“`).join(', ')}`,
        'Externe Backlinks sind ohne Linkdatenbank nicht prüfbar.',
      ],
      recommendations: matching < 0.6 ? ['Interne Links mit beschreibenden, zum Seiteninhalt passenden Linktexten versehen.'] : [],
      data: { anchors, matching },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
