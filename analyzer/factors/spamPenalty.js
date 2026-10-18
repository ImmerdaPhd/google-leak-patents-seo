// spamPenalty: kombinierte Strafe für spammige Linktexte eingehender Links.
// Benötigt Googles Backlink-Daten bzw. Link-Historie – von außen nicht messbar.
import { defineFactor, notMeasurable, runIfMain } from '../lib/factor.js';

const factor = defineFactor({
  id: 'spamPenalty',
  title: 'Ankertext-Spam-Strafe',
  category: 'spam_demotion',
  weight: 0,
  async evaluate() {
    return notMeasurable(
      'Basiert auf Linktexten externer Backlinks – ohne Linkdatenbank nicht abrufbar.',
      'Backlinks im Search-Console-Bericht „Links“ oder mit Ahrefs/Semrush/Sistrix prüfen; Spam-Links per Disavow entwerten.',
    );
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
