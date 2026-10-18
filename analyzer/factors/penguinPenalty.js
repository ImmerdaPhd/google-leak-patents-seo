// penguinPenalty: Penguin-Abstrafung für Link-Spam (0 = gut, 1 = schlecht).
// Benötigt Googles Backlink-Daten bzw. Link-Historie – von außen nicht messbar.
import { defineFactor, notMeasurable, runIfMain } from '../lib/factor.js';

const factor = defineFactor({
  id: 'penguinPenalty',
  title: 'Penguin-Linkspam-Abstrafung',
  category: 'spam_demotion',
  weight: 0,
  async evaluate() {
    return notMeasurable(
      'Bewertet das gesamte Backlink-Profil – dafür sind Googles Linkdaten nötig.',
      'Backlinks im Search-Console-Bericht „Links“ oder mit Ahrefs/Semrush/Sistrix prüfen; Spam-Links per Disavow entwerten.',
    );
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
