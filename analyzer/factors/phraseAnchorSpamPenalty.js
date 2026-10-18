// phraseAnchorSpamPenalty: Strafe für plötzlich gehäufte Spam-Phrasen in Linktexten.
// Benötigt Googles Backlink-Daten bzw. Link-Historie – von außen nicht messbar.
import { defineFactor, notMeasurable, runIfMain } from '../lib/factor.js';

const factor = defineFactor({
  id: 'phraseAnchorSpamPenalty',
  title: 'Ankertext-Spam-Strafe (Phrasen)',
  category: 'spam_demotion',
  weight: 0,
  async evaluate() {
    return notMeasurable(
      'Erfordert die zeitliche Entwicklung externer Linktexte (Link-Historie).',
      'Backlinks im Search-Console-Bericht „Links“ oder mit Ahrefs/Semrush/Sistrix prüfen; Spam-Links per Disavow entwerten.',
    );
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
