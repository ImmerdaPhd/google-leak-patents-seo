// scamness: Wie betrügerisch wirkt die Seite? – Gemini-Einschätzung plus Seriositätsmerkmale.
// Score: 100 = seriös.
import { trust } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';
import { weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'scamness',
  title: 'Betrugs-Risiko (Scamness)',
  category: 'spam_demotion',
  weight: 2,
  gemini: {
    text: [{ id: 'scamRisk', frage: 'Wie seriös wirkt die Seite bzw. das Angebot? Achte auf Betrugsmerkmale: unrealistische Preise oder Versprechen, fehlende Firmenangaben, Druck und künstliche Verknappung, nur Vorkasse, gefälschte Bewertungen, Phishing. 100 = eindeutig seriös, 0 = sehr wahrscheinlich Betrug.' }],
  },
  async evaluate(ctx) {
    const [t, rdap, sb, ai] = await Promise.all([trust(ctx), ctx.rdap(), ctx.safeBrowsing(), ctx.ai.rate('scamRisk')]);
    let heuristic = 100;
    const issues = [];
    if (!t.https) (heuristic -= 30), issues.push('keine HTTPS-Verschlüsselung');
    if (!t.impressum && !t.contact) (heuristic -= 30), issues.push('weder Impressum noch Kontakt verlinkt');
    if (!t.privacy) (heuristic -= 10), issues.push('keine Datenschutzerklärung verlinkt');
    if (t.urgency.length) (heuristic -= 15 * Math.min(2, t.urgency.length)), issues.push('künstliche Verknappung/Druck im Text');
    if (rdap && rdap.ageYears < 0.5) (heuristic -= 20), issues.push('Domain jünger als 6 Monate');
    if (sb?.matches.length) (heuristic = 0), issues.push('Safe Browsing meldet eine Gefahr');
    return {
      score: weighted([[ai?.score, 3], [Math.max(0, heuristic), 2]]),
      method: ai ? METHOD.GEMINI : METHOD.HEURISTIC,
      confidence: ai ? 'mittel' : 'niedrig',
      findings: [ai ? `Gemini (Seriosität): ${ai.score}/100 – ${ai.reason}` : null, issues.length ? `Auffällig: ${issues.join(', ')}.` : 'Keine typischen Betrugsmerkmale gefunden.'],
      recommendations: issues.map((i) => `Beheben: ${i}.`),
      data: { gemini: ai, issues },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
