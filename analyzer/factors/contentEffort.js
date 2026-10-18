// contentEffort: Wie viel Aufwand steckt im Inhalt? Google nutzt dafür ein Sprachmodell –
// wir ebenfalls (Gemini), ergänzt um messbare Aufwands-Merkmale.
import { textStats } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';
import { sameSite, scale, weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'contentEffort',
  title: 'Aufwand im Inhalt (Content Effort)',
  category: 'content_quality',
  weight: 3,
  gemini: {
    text: [{ id: 'effort', frage: 'Wie viel Aufwand steckt im Inhalt? Eigene Recherche, Erfahrung aus erster Hand, Originaldaten, eigene Fotos, Tests, Tiefe und Sorgfalt. 100 = sehr hoher Aufwand, schwer zu kopieren; 0 = minimaler Aufwand, austauschbarer Text.' }],
  },
  async evaluate(ctx) {
    const [page, stats, ai] = await Promise.all([ctx.page(), textStats(ctx), ctx.ai.rate('effort')]);
    const ownImages = page.images.filter((i) => i.src && sameSite(i.src, page.finalUrl) && i.width * i.height > 150 * 150).length;
    const h2 = page.headings.filter((h) => h.level === 2).length;
    const parts = [
      [scale(stats.words, 200, 1500), 3],
      [scale(ownImages, 0, 4), 1],
      [scale(page.counts.tables, 0, 1), 1],
      [scale(h2, 0, 5), 1],
      [scale(page.counts.lists, 0, 8), 1],
    ];
    const heuristic = weighted(parts);
    return {
      score: weighted([[ai?.score, 3], [heuristic, 2]]),
      method: ai ? METHOD.GEMINI : METHOD.HEURISTIC,
      confidence: ai ? 'mittel' : 'niedrig',
      findings: [
        ai ? `Gemini (Aufwand): ${ai.score}/100 – ${ai.reason}` : null,
        `${stats.words} Wörter, ${ownImages} eigene Bilder, ${page.counts.tables} Tabellen, ${h2} H2-Abschnitte, ${page.counts.lists} Listenpunkte.`,
      ],
      recommendations: [
        ownImages === 0 ? 'Eigene Fotos, Screenshots oder Grafiken ergänzen.' : null,
        page.counts.tables === 0 ? 'Daten, Vergleiche oder Messwerte als Tabelle aufbereiten.' : null,
        stats.words < 600 ? 'Thema tiefer behandeln: Schritte, Beispiele, typische Fehler, eigene Erfahrungen.' : null,
      ],
      data: { gemini: ai, words: stats.words, ownImages, tables: page.counts.tables, h2 },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
