// ScaledLinkAgeSpamScore: Spam-Score anhand des Alters eingehender Links (im Leak vermutlich veraltet).
// Benötigt Googles Backlink-Daten bzw. Link-Historie – von außen nicht messbar.
import { defineFactor, notMeasurable, runIfMain } from '../lib/factor.js';

const factor = defineFactor({
  id: 'ScaledLinkAgeSpamScore',
  title: 'Spam-Score nach Link-Alter',
  category: 'spam_demotion',
  weight: 0,
  async evaluate() {
    return notMeasurable(
      'Erfordert das Erstsichtungsdatum aller eingehenden Links.',
      'Backlinks im Search-Console-Bericht „Links“ oder mit Ahrefs/Semrush/Sistrix prüfen; Spam-Links per Disavow entwerten.',
    );
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
