// sbScore: interner Wert von Googles SpamBrain (je Modellversion) – von außen nicht messbar.
import { defineFactor, notMeasurable, runIfMain } from '../lib/factor.js';

const factor = defineFactor({
  id: 'sbScore',
  title: 'SpamBrain: Score je Modellversion',
  category: 'spam_demotion',
  weight: 0,
  async evaluate() {
    return notMeasurable(
      'Interne Versionsdaten von SpamBrain – nicht öffentlich abrufbar.',
      'Die übrigen Spam-Signale sauber halten; dann bewertet jede Modellversion die Seite gut.',
    );
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
