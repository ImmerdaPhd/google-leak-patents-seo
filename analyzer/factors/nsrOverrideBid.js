// nsrOverrideBid: manueller Notfall-Override des Website-Qualitätswerts durch Google.
import { defineFactor, notMeasurable, runIfMain } from '../lib/factor.js';

const factor = defineFactor({
  id: 'nsrOverrideBid',
  title: 'NSR-Notfall-Override',
  category: 'content_quality',
  weight: 0,
  async evaluate() {
    return notMeasurable(
      'Interner Notfallwert, den nur Google manuell setzt – von außen nicht messbar.',
      'Website-Qualität insgesamt hochhalten; der Wert ist nicht beeinflussbar.',
    );
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
