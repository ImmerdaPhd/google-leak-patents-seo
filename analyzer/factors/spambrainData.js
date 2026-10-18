// spambrainData: SpamBrain-Scores auf Host-Ebene (z. B. blog.beispiel.de) – Stichprobe des Hosts.
import { siteSpam } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';
import { round, scale } from '../lib/util.js';

const factor = defineFactor({
  id: 'spambrainData',
  title: 'SpamBrain: Host-Ebene',
  category: 'spam_demotion',
  weight: 1,
  async evaluate(ctx) {
    const s = await siteSpam(ctx);
    return {
      score: scale(s.spammyRatio, 0.4, 0),
      method: METHOD.HEURISTIC,
      confidence: s.pages >= 5 ? 'mittel' : 'niedrig',
      findings: [
        `Host ${ctx.hostname}: ${s.pages} Seiten geprüft, ${round(s.spammyRatio * 100)} % mit Spam-Merkmalen.`,
        s.spammyUrls.length ? `Auffällig: ${s.spammyUrls.slice(0, 3).join(', ')}` : null,
      ],
      recommendations: s.spammyRatio > 0 ? ['Auffällige Seiten bereinigen; Upload- und Nutzerbereiche gegen Spam absichern.'] : [],
      data: s,
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
