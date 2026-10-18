// Analyse-Kontext für eine URL. Alle teuren Schritte (Seitenaufruf mit Playwright,
// Mobil-Ansicht, Stichprobe weiterer Seiten, robots.txt, Domain-Daten, Gemini) sind
// "lazy" und werden pro Lauf nur EINMAL ausgeführt – egal wie viele Faktoren sie nutzen.
// Dadurch können alle Faktoren gleichzeitig laufen und teilen sich die Daten.

import { chromium, devices } from 'playwright';
import { DECORATIVE } from './analysis.js';
import { detectOverlays, extractPage } from './extract.js';
import { Gemini } from './gemini.js';
import {
  CHROME_UA, GOOGLEBOT_UA, fetchText, mapLimit, redirectChain, registrableDomain, safeFetch, sameSite,
} from './util.js';

const VITALS_SCRIPT = `
  window.__vitals = { lcp: null, cls: 0, longTasks: 0 };
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__vitals.lcp = e.startTime; })
      .observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__vitals.cls += e.value; })
      .observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((l) => { window.__vitals.longTasks += l.getEntries().length; })
      .observe({ type: 'longtask', buffered: true });
  } catch (e) {}
`;

const ASSET_EXT = /\.(jpe?g|png|gif|webp|avif|svg|pdf|zip|mp4|mp3|webm|css|js|xml|ico|woff2?|ttf|docx?|xlsx?)(\?|$)/i;

export async function createContext(input, opts = {}) {
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  return new Context(new URL(url).href, opts);
}

export class Context {
  constructor(url, { gemini = true, maxPages = 8, timeout = 45000, verbose = false } = {}) {
    this.inputUrl = url;
    const u = new URL(url);
    this.origin = u.origin;
    this.hostname = u.hostname;
    this.domain = registrableDomain(u.hostname);
    this.opts = { maxPages, timeout, verbose };
    this.cache = new Map();
    this.ai = new Gemini(this, { enabled: gemini });
    this.notes = [];
  }

  log(...a) {
    if (this.opts.verbose) console.error('[ctx]', ...a);
  }

  /** Führt fn nur einmal pro Schlüssel aus und teilt das Ergebnis (auch während es noch läuft). */
  memo(key, fn) {
    if (!this.cache.has(key)) this.cache.set(key, Promise.resolve().then(fn));
    return this.cache.get(key);
  }

  browser() {
    return this.memo('browser', async () => {
      const launch = { headless: true };
      if (process.env.PLAYWRIGHT_CHROMIUM_PATH) launch.executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
      const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
      if (proxy) launch.proxy = { server: proxy };
      this.log('starte Chromium');
      return chromium.launch(launch);
    });
  }

  /** Vollständig gerenderte Desktop-Ansicht der Seite inkl. Requests und Web Vitals. */
  page() {
    return this.memo('page', async () => {
      const browser = await this.browser();
      const context = await browser.newContext({
        userAgent: CHROME_UA,
        viewport: { width: 1366, height: 900 },
        locale: 'de-DE',
      });
      await context.addInitScript(VITALS_SCRIPT);
      const page = await context.newPage();
      const requests = [];
      page.on('request', (r) => requests.push({ url: r.url(), type: r.resourceType(), bytes: 0 }));
      page.on('response', (resp) => {
        const len = Number(resp.headers()['content-length'] || 0);
        const req = requests.findLast((r) => r.url === resp.url());
        if (req) req.bytes = len;
      });
      this.log('lade', this.inputUrl);
      const resp = await page.goto(this.inputUrl, { waitUntil: 'load', timeout: this.opts.timeout });
      await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {});
      // Einmal scrollen, damit Lazy-Loading und Layout-Verschiebungen sichtbar werden
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight && y < 6000; y += 800) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 120));
        }
        window.scrollTo(0, 0);
      }).catch(() => {});
      await page.waitForTimeout(1200);
      const data = await page.evaluate(extractPage);
      data.overlays = await page.evaluate(detectOverlays).catch(() => []);
      data.vitals = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        return {
          ...window.__vitals,
          ttfb: nav ? nav.responseStart : null,
          domContentLoaded: nav ? nav.domContentLoadedEventEnd : null,
          load: nav ? nav.loadEventEnd : null,
        };
      });
      data.status = resp ? resp.status() : 0;
      data.headers = resp ? await resp.allHeaders() : {};
      const chain = [];
      for (let r = resp?.request(); r; r = r.redirectedFrom()) chain.unshift(r.url());
      data.redirectChain = chain;
      data.requests = requests;
      data.finalUrl = page.url();
      await context.close();
      return data;
    });
  }

  /** Mobile Ansicht (iPhone) – vor allem für Interstitials und Mobilfreundlichkeit. */
  mobile() {
    return this.memo('mobile', async () => {
      const browser = await this.browser();
      const context = await browser.newContext({ ...devices['iPhone 13'], locale: 'de-DE' });
      const page = await context.newPage();
      try {
        const resp = await page.goto(this.inputUrl, { waitUntil: 'load', timeout: this.opts.timeout });
        await page.waitForTimeout(3000);
        const overlays = await page.evaluate(detectOverlays);
        const info = await page.evaluate(() => ({
          viewport: document.querySelector('meta[name=viewport]')?.content || null,
          horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 5,
          bodyFontSize: parseFloat(getComputedStyle(document.body).fontSize),
        }));
        return { status: resp ? resp.status() : 0, overlays, ...info };
      } finally {
        await context.close();
      }
    });
  }

  /** Schneller Abruf einer Seite ohne JavaScript und ohne Bilder/CSS (für Stichproben). */
  async light(url) {
    return this.memo('light:' + url, async () => {
      const ctx = await this.memo('lightContext', async () =>
        (await this.browser()).newContext({ javaScriptEnabled: false, userAgent: CHROME_UA, locale: 'de-DE' }),
      );
      const page = await ctx.newPage();
      await page.route('**/*', (route) =>
        route.request().resourceType() === 'document' ? route.continue() : route.abort(),
      );
      try {
        const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        const data = await page.evaluate(extractPage);
        return { url, status: resp ? resp.status() : 0, data };
      } catch (e) {
        return { url, status: 0, error: e.message.split('\n')[0] };
      } finally {
        await page.close();
      }
    });
  }

  robots() {
    return this.memo('robots', async () => {
      const r = await fetchText(this.origin + '/robots.txt', { timeout: 10000 });
      const exists = r.status === 200 && !/<html/i.test(r.text.slice(0, 500));
      const text = exists ? r.text : '';
      const groups = parseRobots(text);
      const sitemaps = [...text.matchAll(/^\s*sitemap:\s*(\S+)/gim)].map((m) => m[1]);
      const pick = (ua) =>
        groups.find((g) => g.agents.some((a) => a !== '*' && ua.toLowerCase().includes(a))) ||
        groups.find((g) => g.agents.includes('*'));
      return {
        exists,
        status: r.status,
        sitemaps,
        isAllowed(path, ua = 'googlebot') {
          const g = pick(ua);
          if (!g) return true;
          let best = { len: -1, allow: true };
          for (const rule of g.rules) {
            if (!rule.path) continue;
            const re = new RegExp('^' + rule.path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
            if (re.test(path) && rule.path.length > best.len) best = { len: rule.path.length, allow: rule.allow };
          }
          return best.allow;
        },
      };
    });
  }

  /** Prüft http/https und www/ohne www: führen alle Varianten zur selben URL? */
  variants() {
    return this.memo('variants', async () => {
      const u = new URL(this.inputUrl);
      const bare = u.hostname.replace(/^www\./, '');
      const path = u.pathname + u.search;
      const urls = [`http://${bare}${path}`, `https://${bare}${path}`, `http://www.${bare}${path}`, `https://www.${bare}${path}`];
      const results = await Promise.all(urls.map((v) => redirectChain(v)));
      return urls.map((v, i) => ({ variant: v, ...results[i] }));
    });
  }

  /** Stichprobe weiterer Seiten derselben Website (aus Sitemap, sonst interne Links). */
  sitePages() {
    return this.memo('sitePages', async () => {
      const page = await this.page();
      const robots = await this.robots();
      const self = normalizeUrl(page.finalUrl);
      let candidates = [];
      const sitemapUrls = robots.sitemaps.length ? robots.sitemaps.slice(0, 2) : [this.origin + '/sitemap.xml'];
      for (const sm of sitemapUrls) {
        candidates.push(...(await readSitemap(sm)));
        if (candidates.length > 200) break;
      }
      candidates = candidates.filter((c) => sameSite(c, this.origin) && !ASSET_EXT.test(c));
      this.sitemapSize = candidates.length;
      if (candidates.length > this.opts.maxPages) {
        const step = candidates.length / this.opts.maxPages;
        candidates = Array.from({ length: this.opts.maxPages }, (_, i) => candidates[Math.floor(i * step)]);
      }
      const internal = page.links.filter((l) => l.internal && !ASSET_EXT.test(l.href)).map((l) => l.href.split('#')[0]);
      const seen = new Set([self]);
      const picked = [];
      for (const c of [...candidates, ...internal.filter((l) => !page.links.find((x) => x.href === l)?.inFooter)]) {
        const n = normalizeUrl(c);
        if (seen.has(n)) continue;
        seen.add(n);
        picked.push(c);
        if (picked.length >= this.opts.maxPages) break;
      }
      this.log('Stichprobe', picked.length, 'Seiten');
      const pages = await mapLimit(picked, 4, (p) => this.light(p));
      this.sampleErrors = pages.filter((p) => !p.data || p.status >= 400).map((p) => `${p.url} (${p.status || p.error})`);
      return pages.filter((p) => p.data && p.status >= 200 && p.status < 400);
    });
  }

  /** Startseite (ohne JS) – für Verlinkung und Linktexte zur geprüften URL. */
  homepage() {
    return this.memo('homepage', async () => {
      const page = await this.page();
      if (normalizeUrl(page.finalUrl) === normalizeUrl(this.origin + '/')) return { url: page.finalUrl, status: page.status, data: page, isInput: true };
      return this.light(this.origin + '/');
    });
  }

  /** Rohes HTML mit normalem Browser- und mit Googlebot-User-Agent (Cloaking-Vergleich). */
  rawViews() {
    return this.memo('rawViews', async () => {
      const [browser, googlebot] = await Promise.all([
        fetchText(this.inputUrl, { ua: CHROME_UA }),
        fetchText(this.inputUrl, { ua: GOOGLEBOT_UA }),
      ]);
      return { browser, googlebot };
    });
  }

  /** Registrierungsdatum der Domain über RDAP (kostenlos, ohne Key). */
  rdap() {
    return this.memo('rdap', async () => {
      const r = await safeFetch(`https://rdap.org/domain/${this.domain}`, { timeout: 12000, headers: { accept: 'application/rdap+json' } });
      if (!r.ok) return null;
      const json = await r.res.json().catch(() => null);
      const reg = json?.events?.find((e) => e.eventAction === 'registration')?.eventDate;
      if (!reg) return null;
      const ageYears = (Date.now() - new Date(reg).getTime()) / (365.25 * 864e5);
      return { registered: reg, ageYears };
    });
  }

  /** Open PageRank (domcop.com) – nur mit OPENPAGERANK_API_KEY. Liefert 0–10. */
  openPageRank() {
    return this.memo('opr', async () => {
      const key = process.env.OPENPAGERANK_API_KEY;
      if (!key) return null;
      const r = await safeFetch(
        `https://openpagerank.com/api/v1.0/getPageRank?domains%5B%5D=${encodeURIComponent(this.domain)}`,
        { headers: { 'API-OPR': key }, timeout: 12000 },
      );
      if (!r.ok) return null;
      const json = await r.res.json().catch(() => null);
      const row = json?.response?.[0];
      if (!row || row.status_code !== 200) return null;
      return { pageRank: Number(row.page_rank_decimal), rank: row.rank ? Number(row.rank) : null };
    });
  }

  /** Google Safe Browsing – nur mit GOOGLE_SAFE_BROWSING_API_KEY. */
  safeBrowsing() {
    return this.memo('safeBrowsing', async () => {
      const key = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
      if (!key) return null;
      const r = await safeFetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${key}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          client: { clientId: 'core-signals-analyzer', clientVersion: '1.0' },
          threatInfo: {
            threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url: this.inputUrl }, { url: this.origin + '/' }],
          },
        }),
      });
      if (!r.ok) return null;
      const json = await r.res.json().catch(() => ({}));
      return { matches: json.matches || [] };
    });
  }

  /** Die größten Inhaltsbilder der Seite inkl. Dateigröße, Format und (für Gemini) Base64-Daten. */
  topImages(n = 4) {
    return this.memo('topImages', async () => {
      const page = await this.page();
      const seen = new Set();
      const cands = page.images
        .filter((i) => i.src && /^https?:/.test(i.src) && !/\.svg(\?|$)/i.test(i.src))
        .filter((i) => i.width * i.height >= 120 * 120 || i.naturalWidth >= 300)
        .filter((i) => !DECORATIVE.test(`${i.src} ${i.alt || ''}`))
        .sort((a, b) => b.width * b.height - a.width * a.height)
        .filter((i) => (seen.has(i.src) ? false : seen.add(i.src)))
        .slice(0, Math.max(n, 6));
      return mapLimit(cands, 4, async (img) => {
        const r = await safeFetch(img.src, { timeout: 15000, headers: { referer: page.finalUrl } });
        if (!r.ok) return { ...img, error: r.error || r.status };
        const mimeType = (r.res.headers.get('content-type') || '').split(';')[0].trim();
        const buf = Buffer.from(await r.res.arrayBuffer());
        const geminiOk = /^image\/(jpeg|png|webp|heic|heif)$/.test(mimeType) && buf.length < 3_500_000;
        return { ...img, mimeType, bytes: buf.length, base64: geminiOk ? buf.toString('base64') : null };
      }).then((list) => list.filter((i) => !i.error).slice(0, Math.max(n, 6)));
    }).then((list) => list.slice(0, n));
  }

  async close() {
    if (this.cache.has('browser')) {
      const b = await this.cache.get('browser').catch(() => null);
      await b?.close().catch(() => {});
    }
  }
}

export function normalizeUrl(u) {
  try {
    const x = new URL(u);
    x.hash = '';
    return (x.hostname.replace(/^www\./, '') + x.pathname.replace(/\/$/, '') + x.search).toLowerCase();
  } catch {
    return u;
  }
}

function parseRobots(text) {
  const groups = [];
  let cur = null;
  let lastWasAgent = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key === 'user-agent') {
      if (!lastWasAgent || !cur) {
        cur = { agents: [], rules: [] };
        groups.push(cur);
      }
      cur.agents.push(val.toLowerCase());
      lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if (cur && (key === 'allow' || key === 'disallow')) cur.rules.push({ allow: key === 'allow', path: val });
    }
  }
  return groups;
}

async function readSitemap(url, depth = 0) {
  const r = await fetchText(url, { timeout: 12000 });
  if (r.status !== 200) return [];
  const locs = [...r.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].replace(/&amp;/g, '&'));
  if (/<sitemapindex/i.test(r.text) && depth === 0) {
    const out = [];
    for (const child of locs.slice(0, 3)) out.push(...(await readSitemap(child, 1)));
    return out;
  }
  return locs;
}
