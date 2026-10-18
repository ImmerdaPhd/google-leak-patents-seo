// DocLevelSpamScore: allgemeiner Spam-Score des Dokuments – versteckter Text, Weiterleitungen, Cloaking.
import { cloaking, spamSignals } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';
import { round } from '../lib/util.js';

const factor = defineFactor({
  id: 'DocLevelSpamScore',
  title: 'Spam-Score des Dokuments',
  category: 'spam_demotion',
  weight: 2,
  async evaluate(ctx) {
    const [s, c] = await Promise.all([spamSignals(ctx), cloaking(ctx)]);
    let score = s.hidden;
    const findings = [];
    if (s.hiddenSamples.length) findings.push(`Versteckter Text gefunden: ${s.hiddenSamples.map((x) => `${x.reason}: „${x.text.slice(0, 60)}…“`).join('; ')}`);
    else findings.push('Kein versteckter Text gefunden.');
    if (s.metaRefreshRedirect) {
      score -= 30;
      findings.push('Meta-Refresh-Weiterleitung gefunden.');
    }
    if (s.offsiteRedirect) {
      score -= 40;
      findings.push('Seite leitet beim Laden auf eine fremde Domain weiter.');
    }
    if (c.comparable) {
      findings.push(`Inhalt für Googlebot vs. Browser zu ${round(c.similarity * 100)} % gleich.`);
      if (c.similarity < 0.5) score -= 40;
    } else findings.push(`Cloaking-Vergleich nicht möglich (Status Browser ${c.browserStatus}, Googlebot-UA ${c.googlebotStatus}).`);
    return {
      score: Math.max(0, score),
      method: METHOD.MEASURED,
      confidence: 'mittel',
      findings,
      recommendations: [
        s.hiddenSamples.length ? 'Versteckten Text sichtbar machen oder entfernen.' : null,
        c.comparable && c.similarity < 0.5 ? 'Suchmaschinen und Nutzern denselben Inhalt ausliefern (kein Cloaking).' : null,
      ],
      data: { hidden: s.hiddenSamples, cloaking: c },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
