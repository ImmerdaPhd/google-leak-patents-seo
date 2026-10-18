// boostLevel: Boost für Live-Ergebnisse, solange sie aktuell sind. Bei Live-Inhalten prüfen wir das
// LiveBlogPosting-Schema; sonst die Datums-Signale, die Google für Aktualität auswertet (Näherung).
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';
import { scale, weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'boostLevel',
  title: 'Aktualitäts-/Live-Boost',
  category: 'freshness',
  weight: 1,
  async evaluate(ctx) {
    const page = await ctx.page();
    const live = page.jsonld.find((o) => [].concat(o['@type'] || []).includes('LiveBlogPosting'));
    const pub = page.published ? new Date(page.published) : null;
    const mod = page.modified ? new Date(page.modified) : null;
    const valid = (d) => d && !Number.isNaN(d.getTime());
    const now = Date.now();
    const future = [pub, mod].some((d) => valid(d) && d.getTime() > now + 864e5);
    const inconsistent = valid(pub) && valid(mod) && mod < pub;
    if (live) {
      const ok = live.coverageStartTime && (live.liveBlogUpdate || live.coverageEndTime);
      return {
        score: ok ? 100 : 60,
        method: METHOD.MEASURED,
        confidence: 'mittel',
        findings: [`LiveBlogPosting erkannt (Start: ${live.coverageStartTime || 'fehlt'}, Ende: ${live.coverageEndTime || 'offen'}).`],
        recommendations: ok ? [] : ['coverageStartTime/coverageEndTime und liveBlogUpdate im Schema angeben.'],
      };
    }
    const latest = [mod, pub].find(valid);
    const ageDays = latest ? (now - latest.getTime()) / 864e5 : null;
    const score = weighted([
      [valid(pub) ? 100 : 30, 2],
      [valid(mod) ? 100 : 50, 1],
      [future || inconsistent ? 0 : 100, 2],
      [ageDays == null ? null : scale(ageDays, 1100, 180), 1],
    ]);
    return {
      score,
      method: METHOD.PROXY,
      confidence: 'niedrig',
      findings: [
        'Kein Live-Inhalt – bewertet werden die Datums-Signale der Seite.',
        `Veröffentlicht: ${valid(pub) ? pub.toISOString().slice(0, 10) : 'nicht angegeben'}, geändert: ${valid(mod) ? mod.toISOString().slice(0, 10) : 'nicht angegeben'}.`,
        future ? 'Datum liegt in der Zukunft!' : null,
        inconsistent ? 'Änderungsdatum liegt vor dem Veröffentlichungsdatum.' : null,
      ],
      recommendations: [
        !valid(pub) ? 'Veröffentlichungsdatum sichtbar und als datePublished im Schema angeben.' : null,
        !valid(mod) ? 'Bei Aktualisierungen dateModified setzen (nur bei echten Änderungen).' : null,
        ageDays > 730 ? 'Inhalt prüfen und aktualisieren – er ist über zwei Jahre alt.' : null,
      ],
      data: { published: page.published, modified: page.modified, ageDays },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
