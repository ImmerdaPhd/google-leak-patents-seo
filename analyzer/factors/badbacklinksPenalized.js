// badbacklinksPenalized: Markierung für Seiten mit schlechten Backlinks.
// Benötigt Googles Backlink-Daten bzw. Link-Historie – von außen nicht messbar.
import { defineFactor, notMeasurable, runIfMain } from '../lib/factor.js';

const factor = defineFactor({
  id: 'badbacklinksPenalized',
  title: 'Abstrafung wegen schlechter Backlinks',
  category: 'spam_demotion',
  weight: 0,
  async evaluate() {
    return notMeasurable(
      'Hängt von den eingehenden Links ab, die nur Google (bzw. Linkdatenbanken) kennt.',
      'Backlinks im Search-Console-Bericht „Links“ oder mit Ahrefs/Semrush/Sistrix prüfen; Spam-Links per Disavow entwerten.',
    );
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
