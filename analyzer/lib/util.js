// Kleine Hilfsfunktionen, die von Kontext, Analysen und Faktoren gemeinsam genutzt werden.

export const clamp = (v, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v));

/** Bildet value linear ab: bei `bad` -> 0, bei `good` -> 100 (funktioniert in beide Richtungen). */
export function scale(value, bad, good) {
  if (value == null || Number.isNaN(value)) return null;
  return clamp(((value - bad) / (good - bad)) * 100);
}

export const round = (v, d = 0) => (v == null ? null : Math.round(v * 10 ** d) / 10 ** d);

/** Gewichteter Mittelwert über [score, weight]-Paare; null-Scores werden ignoriert. */
export function weighted(pairs) {
  let sum = 0;
  let w = 0;
  for (const [s, weight] of pairs) {
    if (s == null) continue;
    sum += s * weight;
    w += weight;
  }
  return w ? sum / w : null;
}

/** Führt fn für alle items mit höchstens `limit` gleichzeitigen Aufrufen aus. */
export async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return out;
}

export const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
export const GOOGLEBOT_UA =
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

/** fetch mit Timeout; wirft nie, sondern liefert {ok:false, error} zurück. */
export async function safeFetch(url, { timeout = 15000, ua = CHROME_UA, ...init } = {}) {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { 'user-agent': ua, 'accept-language': 'de,en;q=0.8', ...(init.headers || {}) },
      signal: AbortSignal.timeout(timeout),
    });
    return { ok: res.ok, status: res.status, res };
  } catch (e) {
    return { ok: false, status: 0, error: e.cause?.code || e.message };
  }
}

export async function fetchText(url, opts) {
  const r = await safeFetch(url, opts);
  if (!r.res) return { ...r, text: '' };
  const text = await r.res.text().catch(() => '');
  return { ...r, text, headers: r.res.headers, finalUrl: r.res.url };
}

/** Folgt Weiterleitungen manuell und protokolliert jeden Schritt. */
export async function redirectChain(url, maxHops = 10) {
  const chain = [];
  let current = url;
  for (let hop = 0; hop < maxHops; hop++) {
    const r = await safeFetch(current, { redirect: 'manual', method: 'GET', timeout: 12000 });
    chain.push({ url: current, status: r.status, error: r.error });
    if (!r.res || r.status < 300 || r.status >= 400) break;
    const loc = r.res.headers.get('location');
    if (!loc) break;
    current = new URL(loc, current).href;
  }
  return { chain, finalUrl: chain.at(-1).url, finalStatus: chain.at(-1).status };
}

/** Grobe Ermittlung der registrierbaren Domain (ohne Public-Suffix-Liste). */
export function registrableDomain(hostname) {
  const parts = hostname.replace(/^www\./, '').split('.');
  const twoLevel = /^(co|com|org|net|gov|ac|edu)\.[a-z]{2}$/;
  const tail = parts.slice(-2).join('.');
  if (parts.length > 2 && twoLevel.test(tail)) return parts.slice(-3).join('.');
  return parts.slice(-2).join('.');
}

export function sameSite(a, b) {
  try {
    return registrableDomain(new URL(a).hostname) === registrableDomain(new URL(b).hostname);
  } catch {
    return false;
  }
}

export function stripHtml(html) {
  return html
    .replace(/<(script|style|noscript|template)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncate(s, n) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n) + ' …' : s;
}
