// Gemeinsame Auswertungen, die mehrere Faktoren brauchen. Jede Funktion ist pro
// Kontext memoisiert, damit z. B. die Spam-Heuristik nur einmal berechnet wird.

import {
  ADULT_TERMS, SPAM_TERMS, URGENCY_PATTERNS, countTerms, firstPersonRatio, gibberishStats, jaccard, shingles,
  termStats,
} from './text.js';
import { registrableDomain, scale, stripHtml } from './util.js';

const mainOf = (d) => (d.mainText && d.mainText.length > 200 ? d.mainText : d.bodyText) || '';

export const AUTHORITY_DOMAINS =
  /(\.gov(\.[a-z]{2})?|\.edu|\.ac\.[a-z]{2}|bund\.de|europa\.eu|who\.int|nih\.gov|wikipedia\.org|doi\.org|pubmed|springer|nature\.com|sciencedirect|destatis\.de|statista\.com|reuters\.com|dpa\.|tagesschau\.de|bfarm\.de|rki\.de)$/i;

export const AD_HOSTS =
  /(doubleclick\.net|googlesyndication\.com|googleadservices\.com|adservice\.google|amazon-adsystem\.com|taboola\.com|outbrain\.com|criteo\.(com|net)|adnxs\.com|rubiconproject\.com|pubmatic\.com|openx\.net|smartadserver\.com|yieldlove|adform\.net|teads\.tv|media\.net|moatads\.com|ezoic|mediavine|adthrive|sovrn|33across|seedtag|stroeer|ad\.yieldlab)/i;

export const DECORATIVE = /logo|icon|sprite|avatar|favicon|badge|spinner|placeholder|pixel|blank\.gif/i;

export const SPAM_TLDS = /\.(xyz|top|click|loan|win|bid|stream|gq|cf|tk|ml|ga|work|rest|cam|icu|buzz|cyou|monster)$/i;

export function textStats(ctx) {
  return ctx.memo('a:textStats', async () => {
    const page = await ctx.page();
    return termStats(mainOf(page));
  });
}

/** Spam-Merkmale der geprüften Seite, jeweils als Teil-Score (100 = unbedenklich). */
export function spamSignals(ctx) {
  return ctx.memo('a:spam', async () => {
    const page = await ctx.page();
    const text = mainOf(page);
    const stats = termStats(text);
    const words = Math.max(stats.words, 1);

    // Keyword-Stuffing: Dichte des häufigsten Worts/Bigramms, Wiederholung im Title, Alt-Texte
    const titleTokens = page.title.toLowerCase().split(/[\s|–\-:,]+/).filter((t) => t.length > 3);
    const titleRepeat = Math.max(0, ...titleTokens.map((t) => titleTokens.filter((x) => x === t).length));
    const alts = page.images.map((i) => i.alt || '').filter(Boolean);
    const altStuffed = alts.filter((a) => a.split(/[\s,]+/).length > 16 || (a.match(/,/g) || []).length > 5).length;
    const densityScore = stats.words < 80 ? 100 : scale(stats.topDensity, 0.08, 0.025);
    const bigramScore = stats.words < 80 ? 100 : scale(stats.topBigramDensity, 0.04, 0.01);
    const stuffing = Math.min(densityScore, bigramScore) - (titleRepeat >= 3 ? 25 : 0) - Math.min(30, altStuffed * 10);

    const spamHits = countTerms(text + ' ' + page.title, SPAM_TERMS);
    const spamCount = spamHits.reduce((s, [, n]) => s + n, 0);
    const spamPer1000 = (spamCount / words) * 1000;

    const gib = gibberishStats(text);
    const gibberish = gib ? scale(gib.suspiciousRatio, 0.12, 0.02) : 100;

    const hiddenRatio = page.hidden.chars / Math.max(page.bodyText.length, 1);
    // Jeder Fund ist ein starkes Spam-Signal (Googles Richtlinien), unabhängig von der Textmenge
    const hidden = page.hidden.count ? Math.min(Math.max(0, 100 - 30 * page.hidden.count), scale(hiddenRatio, 0.2, 0.01)) : 100;

    const metaRefreshRedirect = !!page.metaRefresh && /url=/i.test(page.metaRefresh);
    const jsRedirectOffsite =
      page.finalUrl && registrableDomain(new URL(page.finalUrl).hostname) !== registrableDomain(new URL(ctx.inputUrl).hostname);

    return {
      stats,
      stuffing: Math.max(0, stuffing),
      spamHits,
      spamPer1000,
      spamWords: scale(spamPer1000, 6, 0.5),
      gib,
      gibberish,
      hidden,
      hiddenSamples: page.hidden.samples,
      metaRefreshRedirect,
      offsiteRedirect: jsRedirectOffsite,
      titleRepeat,
      altStuffed,
    };
  });
}

/** Vergleicht die Seite für normale Browser und für Googlebot (Cloaking). */
export function cloaking(ctx) {
  return ctx.memo('a:cloaking', async () => {
    const { browser, googlebot } = await ctx.rawViews();
    if (!browser.text || !googlebot.text || browser.status !== 200 || googlebot.status !== 200) return { comparable: false, browserStatus: browser.status, googlebotStatus: googlebot.status };
    const a = shingles(stripHtml(browser.text), 4);
    const b = shingles(stripHtml(googlebot.text), 4);
    const sim = a.size < 20 && b.size < 20 ? 1 : jaccard(a, b);
    return { comparable: true, similarity: sim, browserStatus: browser.status, googlebotStatus: googlebot.status };
  });
}

/** Qualität der Website anhand einer Stichprobe mehrerer Seiten. */
export function siteSample(ctx) {
  return ctx.memo('a:site', async () => {
    const page = await ctx.page();
    const sample = await ctx.sitePages();
    const all = [{ url: page.finalUrl, data: page }, ...sample];
    const rows = all.map((p) => {
      const text = mainOf(p.data);
      const words = (text.match(/[\p{L}\p{N}]+/gu) || []).length;
      return {
        url: p.url,
        title: p.data.title,
        desc: p.data.metaDescription || '',
        words,
        noindex: /noindex/i.test(p.data.metaRobots),
        sh: shingles(text, 5),
        firstPerson: firstPersonRatio(text),
        isHome: new URL(p.url).pathname.replace(/\/$/, '') === '',
      };
    });
    const content = rows.filter((r) => !r.isHome && !r.noindex);
    const thin = content.filter((r) => r.words < 300);
    const titles = new Map();
    const descs = new Map();
    for (const r of rows) {
      titles.set(r.title, (titles.get(r.title) || 0) + 1);
      if (r.desc) descs.set(r.desc, (descs.get(r.desc) || 0) + 1);
    }
    const dupTitles = rows.filter((r) => r.title && titles.get(r.title) > 1).length;
    const dupDescs = rows.filter((r) => r.desc && descs.get(r.desc) > 1).length;
    const missingDesc = rows.filter((r) => !r.desc).length;
    let pairs = 0;
    let nearDup = 0;
    const nearDupUrls = new Set();
    for (let i = 0; i < content.length; i++) {
      for (let j = i + 1; j < content.length; j++) {
        pairs++;
        if (jaccard(content[i].sh, content[j].sh) > 0.5) {
          nearDup++;
          nearDupUrls.add(content[i].url).add(content[j].url);
        }
      }
    }
    return {
      pages: rows.length,
      contentPages: content.length,
      thinRatio: content.length ? thin.length / content.length : 0,
      thinUrls: thin.map((r) => `${r.url} (${r.words} Wörter)`),
      avgWords: content.length ? content.reduce((s, r) => s + r.words, 0) / content.length : rows[0].words,
      dupTitleRatio: rows.length ? dupTitles / rows.length : 0,
      dupDescRatio: rows.length ? dupDescs / rows.length : 0,
      missingDescRatio: rows.length ? missingDesc / rows.length : 0,
      nearDupRatio: pairs ? nearDup / pairs : 0,
      nearDupUrls: [...nearDupUrls],
      firstPerson: rows.reduce((s, r) => s + r.firstPerson, 0) / rows.length,
      rows: rows.map(({ sh, ...r }) => r),
      sampleData: sample,
    };
  });
}

/** Spam-Merkmale über alle Seiten der Stichprobe (Host-/Domain-Ebene). */
export function siteSpam(ctx) {
  return ctx.memo('a:siteSpam', async () => {
    const page = await ctx.page();
    const sample = await ctx.sitePages();
    const pages = [page, ...sample.map((s) => s.data)];
    const per = pages.map((d) => {
      const text = mainOf(d);
      const st = termStats(text);
      const hits = countTerms(text + ' ' + d.title, SPAM_TERMS).reduce((s, [, n]) => s + n, 0);
      const outSpam = d.links.filter((l) => !l.internal && (isSpamUrl(l.href) || countTerms(l.text, SPAM_TERMS).length)).length;
      return {
        url: d.url,
        spamPer1000: (hits / Math.max(st.words, 1)) * 1000,
        density: st.words > 80 ? st.topDensity : 0,
        outSpam,
      };
    });
    const spammy = per.filter((p) => p.spamPer1000 > 3 || p.density > 0.07 || p.outSpam > 2);
    return { pages: per.length, spammyRatio: spammy.length / per.length, spammyUrls: spammy.map((p) => p.url), per };
  });
}

export function isSpamUrl(href) {
  try {
    const u = new URL(href);
    return SPAM_TLDS.test(u.hostname) || countTerms(u.hostname.replace(/[-.]/g, ' ') + ' ' + u.pathname.replace(/[-/_]/g, ' '), SPAM_TERMS).length > 0;
  } catch {
    return false;
  }
}

/** Ausgehende Links der Seite. */
export function outbound(ctx) {
  return ctx.memo('a:outbound', async () => {
    const page = await ctx.page();
    const ext = page.links.filter((l) => !l.internal);
    const domains = new Map();
    for (const l of ext) {
      const d = registrableDomain(new URL(l.href).hostname);
      domains.set(d, (domains.get(d) || 0) + 1);
    }
    const spam = ext.filter((l) => isSpamUrl(l.href) || countTerms(l.text, SPAM_TERMS).length);
    const affiliate = ext.filter((l) => /(amzn\.to|amazon\.[a-z.]+\/.*tag=|awin1|partnerize|digistore24|clickbank|tradedoubler|financeads|belboon|\/go\/|\/out\/|\/recommends\/|ref=|aff(iliate)?_?id=)/i.test(l.href));
    const affiliateUnmarked = affiliate.filter((l) => !/sponsored|nofollow/.test(l.rel));
    const authority = ext.filter((l) => AUTHORITY_DOMAINS.test(new URL(l.href).hostname));
    return { total: ext.length, domains, spam, affiliate, affiliateUnmarked, authority };
  });
}

/** Vertrauens- und Transparenzmerkmale (Impressum, Autor, Quellen, Organisation). */
export function trust(ctx) {
  return ctx.memo('a:trust', async () => {
    const page = await ctx.page();
    const linkTexts = page.links.map((l) => `${l.text} ${l.href}`.toLowerCase());
    const has = (re) => linkTexts.some((t) => re.test(t));
    const types = new Set([...page.ldTypes, ...page.microdataTypes]);
    const out = await outbound(ctx);
    const authorLd = page.jsonld.some((o) => o.author);
    return {
      https: page.finalUrl.startsWith('https://'),
      impressum: has(/impressum|imprint|legal notice/),
      contact: has(/kontakt|contact/),
      privacy: has(/datenschutz|privacy/),
      about: has(/über uns|ueber-uns|about|wir über|team|über mich|ueber-mich/),
      terms: has(/agb|terms|nutzungsbedingungen/),
      author: !!(page.authorText || page.metaAuthor || authorLd),
      authorName: page.authorText || page.metaAuthor || null,
      organization: types.has('Organization') || types.has('LocalBusiness') || types.has('Corporation') || page.jsonld.some((o) => o.publisher),
      sameAs: page.jsonld.some((o) => Array.isArray(o.sameAs) ? o.sameAs.length : !!o.sameAs),
      citations: out.authority.length,
      externalLinks: out.total,
      urgency: URGENCY_PATTERNS.filter((re) => re.test(page.bodyText)).map((re) => re.source),
      adultHits: countTerms(page.bodyText + ' ' + page.title, ADULT_TERMS),
    };
  });
}

/** Nutzergenerierte Inhalte (Kommentare, Forum, Q&A). */
export function ugc(ctx) {
  return ctx.memo('a:ugc', async () => {
    const page = await ctx.page();
    const types = new Set([...page.ldTypes, ...page.microdataTypes]);
    const isUgcPage = ['DiscussionForumPosting', 'QAPage', 'Comment', 'SocialMediaPosting'].some((t) => types.has(t));
    const comments = page.comments.filter((c) => c.text.length > 0);
    const present = isUgcPage || comments.length > 0;
    const words = comments.map((c) => (c.text.match(/[\p{L}\p{N}]+/gu) || []).length);
    const short = words.filter((w) => w < 8).length;
    const links = comments.flatMap((c) => c.links.filter((l) => l.href && !sameHost(l.href, page.finalUrl)));
    const unmarked = links.filter((l) => !/ugc|nofollow|sponsored/.test(l.rel));
    const spamComments = comments.filter((c) => countTerms(c.text, SPAM_TERMS).length || c.links.some((l) => l.href && isSpamUrl(l.href)));
    return {
      present,
      isUgcPage,
      count: comments.length,
      avgWords: words.length ? words.reduce((a, b) => a + b, 0) / words.length : 0,
      shortRatio: words.length ? short / words.length : 0,
      externalLinks: links.length,
      unmarkedLinks: unmarked.length,
      spamRatio: comments.length ? spamComments.length / comments.length : 0,
      spamComments: spamComments.length,
    };
  });
}

function sameHost(a, b) {
  try {
    return registrableDomain(new URL(a).hostname) === registrableDomain(new URL(b).hostname);
  } catch {
    return false;
  }
}

/**
 * Teilt große Overlays in aufdringliche und rechtlich bedingte (Cookie, Altersprüfung).
 * Leere, abgedunkelte Hintergründe (Backdrops) gehören zum Dialog davor: Gibt es ein
 * rechtliches Overlay, zählen sie dazu, sonst als aufdringlich.
 */
export function classifyOverlays(overlays, minCoverage = 0.3) {
  const big = overlays.filter((o) => o.coverage >= minCoverage);
  const legalPresent = overlays.some((o) => o.legal);
  const legal = big.filter((o) => o.legal || (!o.text && legalPresent));
  const intrusive = big.filter((o) => !legal.includes(o));
  return { intrusive, legal };
}

/** Bild-Basisdaten der Seite. */
export function imageInfo(ctx) {
  return ctx.memo('a:images', async () => {
    const page = await ctx.page();
    const content = page.images.filter((i) => i.width * i.height >= 100 * 100 && !DECORATIVE.test(`${i.src} ${i.alt || ''}`));
    const withAlt = content.filter((i) => i.alt && i.alt.trim().length > 3);
    const descriptiveName = content.filter((i) => {
      const name = (i.src || '').split('/').pop().split('?')[0];
      return /[a-zäöü]{3,}[-_][a-zäöü]{3,}/i.test(name) && !/^(img|dsc|image|photo|pxl)[-_]?\d/i.test(name);
    });
    const captioned = content.filter((i) => i.caption);
    return { all: page.images.length, content, withAlt, descriptiveName, captioned };
  });
}

/** Interne Links (Startseite + Stichprobe), die auf die geprüfte Seite zeigen, samt Linktext. */
export function internalInlinks(ctx) {
  return ctx.memo('a:inlinks', async () => {
    const { normalizeUrl } = await import('./context.js');
    const page = await ctx.page();
    const [home, sample] = await Promise.all([ctx.homepage(), ctx.sitePages()]);
    const target = normalizeUrl(page.finalUrl);
    const sources = [];
    if (home?.data && !home.isInput) sources.push({ url: home.url, data: home.data, home: true });
    for (const p of sample) if (normalizeUrl(p.url) !== normalizeUrl(home?.url || '')) sources.push({ url: p.url, data: p.data });
    const links = [];
    for (const s of sources) {
      for (const l of s.data.links) if (normalizeUrl(l.href) === target) links.push({ from: s.url, text: l.text, home: !!s.home, inNav: l.inNav });
    }
    return { sources: sources.length, links, fromHome: links.some((l) => l.home), isHome: !!home?.isInput };
  });
}
