// smallPersonalSite: Förderung kleiner persönlicher Websites. Das ist ein BONUS, kein Malus –
// darum zählt der Wert nicht in den Gesamtscore (informational). Score = Wahrscheinlichkeit,
// dass die Website als kleine persönliche Website gilt.
import { AD_HOSTS, siteSample, trust } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';
import { round, scale, weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'smallPersonalSite',
  title: 'Förderung kleiner persönlicher Websites (Bonus)',
  category: 'content_quality',
  weight: 1,
  informational: true,
  async evaluate(ctx) {
    const [page, s, t] = await Promise.all([ctx.page(), siteSample(ctx), trust(ctx)]);
    const size = ctx.sitemapSize || null;
    const person = page.jsonld.some((o) => [].concat(o['@type'] || []).includes('Person'));
    const ads = page.requests.filter((r) => AD_HOSTS.test(r.url)).length;
    const aboutMe = page.links.some((l) => /über mich|ueber-mich|about me|about-me/i.test(l.text + ' ' + l.href));
    const score = weighted([
      [scale(s.firstPerson, 0.002, 0.02), 3],
      [size == null ? null : scale(size, 2000, 100), 2],
      [person || aboutMe ? 100 : 20, 2],
      [scale(ads, 40, 0), 1],
      [t.organization && !person ? 30 : 70, 1],
    ]);
    return {
      score,
      method: METHOD.HEURISTIC,
      confidence: 'niedrig',
      findings: [
        'Bonus-Signal: fließt nicht in den Gesamtscore ein.',
        `Ich-/Wir-Anteil im Text: ${round(s.firstPerson * 100, 1)} %, Sitemap-Größe: ${size ?? 'unbekannt'} URLs.`,
        `Person-Schema: ${person ? 'ja' : 'nein'}, Über-mich-Seite: ${aboutMe ? 'ja' : 'nein'}, Werbe-Requests: ${ads}.`,
      ],
      recommendations: score < 50 ? ['Für persönliche Blogs: Person hinter der Website zeigen (Über-mich, eigene Erfahrungen in Ich-Form).'] : [],
      data: { firstPerson: s.firstPerson, sitemapSize: size, person, aboutMe, ads },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
