// spambrainDomainSitechunkData: SpamBrain-Scores auf Domain-Ebene – Safe Browsing (optional),
// Domain-Alter und Spam-Anteil der Stichprobe.
import { siteSpam } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';
import { round, scale, weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'spambrainDomainSitechunkData',
  title: 'SpamBrain: Domain-Ebene',
  category: 'spam_demotion',
  weight: 1,
  async evaluate(ctx) {
    const [s, sb, rdap] = await Promise.all([siteSpam(ctx), ctx.safeBrowsing(), ctx.rdap()]);
    if (sb && sb.matches.length)
      return {
        score: 0,
        method: METHOD.MEASURED,
        confidence: 'hoch',
        findings: [`Google Safe Browsing meldet: ${sb.matches.map((m) => m.threatType).join(', ')}.`],
        recommendations: ['Malware/Phishing sofort entfernen und in der Search Console eine Überprüfung beantragen.'],
        data: { safeBrowsing: sb },
      };
    const young = rdap && rdap.ageYears < 0.5;
    return {
      score: weighted([[scale(s.spammyRatio, 0.4, 0), 3], [rdap ? (young ? 50 : 100) : null, 1], [sb ? 100 : null, 1]]),
      method: METHOD.HEURISTIC,
      confidence: 'niedrig',
      findings: [
        sb ? 'Google Safe Browsing: keine Treffer.' : 'Safe Browsing nicht geprüft (GOOGLE_SAFE_BROWSING_API_KEY fehlt).',
        rdap ? `Domain-Alter: ${round(rdap.ageYears, 1)} Jahre${young ? ' – sehr junge Domain' : ''}.` : null,
        `${round(s.spammyRatio * 100)} % der geprüften Seiten mit Spam-Merkmalen.`,
      ],
      recommendations: young ? ['Bei neu gekauften Domains die Historie prüfen (Wayback Machine, alte Backlinks).'] : [],
      data: { safeBrowsing: sb, rdap },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
