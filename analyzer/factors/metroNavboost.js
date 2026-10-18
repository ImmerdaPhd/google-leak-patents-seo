// metroNavboost: NavBoost je Metropolregion – regionale Relevanz. Bewertet werden lokale Signale
// (Adresse, Telefon, LocalBusiness-Schema, Karte). Ohne lokale Ausrichtung nicht anwendbar.
import { METHOD, defineFactor, notApplicable, runIfMain } from '../lib/factor.js';

// Eine einzelne Telefonnummer reicht nicht: anwendbar erst mit LocalBusiness-Schema oder ≥ 2 lokalen Signalen.
const factor = defineFactor({
  id: 'metroNavboost',
  title: 'Regionale Klick-Relevanz (Metro-NavBoost)',
  category: 'click_engagement',
  weight: 1,
  async evaluate(ctx) {
    const page = await ctx.page();
    const types = new Set([...page.ldTypes, ...page.microdataTypes]);
    const localLd = [...types].some((t) => /LocalBusiness|Restaurant|Store|Dentist|Physician|LegalService|Hotel|Organization/.test(t) && t !== 'Organization') || page.jsonld.some((o) => o.address);
    const address = /\b\d{5}\s+[A-ZÄÖÜ][a-zäöüß]+/.test(page.bodyText) || /\b[A-ZÄÖÜ][a-zäöüß]+(straße|str\.|weg|platz|allee|gasse)\s+\d+/i.test(page.bodyText);
    const phone = page.links.some((l) => l.href.startsWith('tel:')) || /(tel\.?|telefon|phone|fon)\s*:?\s*\+?[\d\s()/-]{7,}/i.test(page.bodyText);
    const map = page.iframes.some((f) => /google\.[a-z.]+\/maps|maps\.google|openstreetmap/.test(f.src)) || page.links.some((l) => /google\.[a-z.]+\/maps|goo\.gl\/maps|maps\.app\.goo\.gl/.test(l.href));
    const signals = [['LocalBusiness-Schema mit Adresse', localLd], ['Adresse im Text', address], ['Telefonnummer', phone], ['Karte/Maps-Link', map]];
    if (!localLd && signals.filter((s) => s[1]).length < 2) return notApplicable('Keine lokale Ausrichtung erkannt (kein LocalBusiness-Schema, weniger als zwei lokale Signale).');
    return {
      score: (signals.filter((s) => s[1]).length / signals.length) * 100,
      method: METHOD.PROXY,
      confidence: 'niedrig',
      findings: [`Lokale Signale: ${signals.filter((s) => s[1]).map((s) => s[0]).join(', ')}.`],
      recommendations: [...signals.filter((s) => !s[1]).map((s) => `Ergänzen: ${s[0]}.`), 'Google-Unternehmensprofil pro Standort pflegen.'],
      data: Object.fromEntries(signals),
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
