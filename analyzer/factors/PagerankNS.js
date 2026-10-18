// PagerankNS: PageRank der Seite. Ohne Googles Linkgraph nähern wir ihn an: Domain-PageRank
// (Open PageRank, optional) plus interne Verlinkung der Seite (Startseite, Stichprobe).
import { internalInlinks } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';
import { scale, weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'PagerankNS',
  title: 'PageRank der Seite (Nearest Seeds)',
  category: 'links_authority',
  weight: 2,
  async evaluate(ctx) {
    const [opr, inl] = await Promise.all([ctx.openPageRank(), internalInlinks(ctx)]);
    const internal = inl.isHome ? 100 : weighted([[inl.fromHome ? 100 : 30, 2], [scale(inl.links.length / Math.max(inl.sources, 1), 0, 0.6), 1]]);
    return {
      score: weighted([[opr ? opr.pageRank * 10 : null, 2], [internal, 2]]),
      method: METHOD.PROXY,
      confidence: 'niedrig',
      findings: [
        opr ? `Open PageRank der Domain: ${opr.pageRank}/10.` : 'Kein OPENPAGERANK_API_KEY – nur interne Verlinkung bewertet.',
        inl.isHome ? 'Geprüfte URL ist die Startseite.' : `Von der Startseite verlinkt: ${inl.fromHome ? 'ja' : 'nein'}; ${inl.links.length} interne Links aus ${inl.sources} geprüften Seiten.`,
      ],
      recommendations: [
        !inl.isHome && !inl.fromHome ? 'Wichtige Seite von der Startseite oder einer Hub-Seite aus verlinken.' : null,
        'Links von vertrauenswürdigen Seiten (Unis, Behörden, Fachmedien) gewinnen.',
      ],
      data: { opr, inlinks: inl.links.length, fromHome: inl.fromHome },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
