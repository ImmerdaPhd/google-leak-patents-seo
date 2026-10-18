// Funktionen, die per page.evaluate() IM BROWSER laufen. Sie dürfen deshalb
// keine Imports oder Variablen aus dem Node-Kontext verwenden.

/** Liest alle für die Faktoren relevanten Daten aus dem DOM einer Seite. */
export function extractPage() {
  const abs = (u) => {
    try {
      return new URL(u, location.href).href;
    } catch {
      return null;
    }
  };
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const meta = (sel) => document.querySelector(sel)?.getAttribute('content') || null;
  const host = location.hostname.replace(/^www\./, '');
  const isInternal = (u) => {
    try {
      const h = new URL(u).hostname.replace(/^www\./, '');
      return h === host || h.endsWith('.' + host) || host.endsWith('.' + h);
    } catch {
      return false;
    }
  };
  const rendered = !!document.body && typeof getComputedStyle === 'function';

  // JSON-LD inkl. @graph flach machen
  const jsonld = [];
  const pushLd = (o) => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) return o.forEach(pushLd);
    if (o['@graph']) pushLd(o['@graph']);
    jsonld.push(o);
  };
  document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
    try {
      pushLd(JSON.parse(s.textContent));
    } catch {
      /* ungültiges JSON-LD ignorieren */
    }
  });
  const ldTypes = jsonld.flatMap((o) => [].concat(o['@type'] || []));
  const microdataTypes = [...document.querySelectorAll('[itemtype]')].map((e) =>
    e.getAttribute('itemtype').split('/').pop(),
  );

  // Haupttext: <main>/<article> bevorzugen, Navigation/Footer/Skripte entfernen
  const root = document.querySelector('main, article, [role=main]') || document.body;
  let mainText = '';
  if (root) {
    const clone = root.cloneNode(true);
    clone
      .querySelectorAll('script,style,noscript,template,nav,footer,header,aside,form,iframe,svg')
      .forEach((n) => n.remove());
    mainText = clean(clone.textContent);
  }
  const bodyText = clean(document.body ? document.body.innerText || document.body.textContent : '');

  const inside = (el, sel) => !!el.closest(sel);
  const links = [...document.querySelectorAll('a[href]')]
    .map((a) => {
      const href = abs(a.getAttribute('href'));
      if (!href || !/^https?:/.test(href)) return null;
      return {
        href,
        text: clean(a.textContent || a.getAttribute('aria-label') || a.querySelector('img')?.alt || ''),
        rel: (a.getAttribute('rel') || '').toLowerCase(),
        internal: isInternal(href),
        inNav: inside(a, 'nav, header, [role=navigation]'),
        inFooter: inside(a, 'footer'),
        inComments: inside(a, '#comments, .comments, .comment, [itemtype*="Comment"], .commentlist'),
      };
    })
    .filter(Boolean);

  const images = [...document.querySelectorAll('img')].map((img) => {
    const r = rendered ? img.getBoundingClientRect() : { width: 0, height: 0, top: 0 };
    const fig = img.closest('figure');
    return {
      src: abs(img.currentSrc || img.getAttribute('src') || img.getAttribute('data-src') || ''),
      alt: img.getAttribute('alt'),
      title: img.getAttribute('title'),
      width: Math.round(r.width),
      height: Math.round(r.height),
      top: Math.round(r.top + (window.scrollY || 0)),
      naturalWidth: img.naturalWidth || 0,
      naturalHeight: img.naturalHeight || 0,
      loading: img.getAttribute('loading'),
      caption: fig ? clean(fig.querySelector('figcaption')?.textContent) : null,
      inLink: !!img.closest('a'),
    };
  });

  // Versteckter Text (nur sinnvoll bei gerendertem CSS)
  const hidden = { chars: 0, count: 0, samples: [] };
  if (rendered) {
    const benign = /menu|nav|modal|dropdown|popup|cookie|consent|tab|accordion|collapse|sr-only|visually-hidden|screen-reader|skip|tooltip|mega|offcanvas|drawer|search/i;
    const parse = (c) => (c.match(/\d+(\.\d+)?/g) || []).map(Number);
    for (const el of document.body.querySelectorAll('p, div, span, a, li, h1, h2, h3, h4, td, ul, section')) {
      const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' ').trim();
      const linkCount = el.querySelectorAll(':scope > a[href], :scope > * > a[href]').length;
      if (own.length < 25 && linkCount < 3) continue;
      if (el.closest('nav, header, footer, [role=dialog], [aria-modal], details, template, noscript, [hidden]')) continue;
      let benignAncestor = false;
      for (let p = el; p && p !== document.body; p = p.parentElement) {
        if (benign.test((p.className && p.className.baseVal === undefined ? p.className : '') + ' ' + p.id)) {
          benignAncestor = true;
          break;
        }
      }
      if (benignAncestor) continue;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      let reason = null;
      // Ausgeblendete Elemente (display/visibility) sind meist legitim (Banner, Tabs, Modals) –
      // verdächtig sind nur versteckte Linkblöcke, ein klassisches Spam-Muster.
      if (cs.display === 'none' || cs.visibility === 'hidden') {
        if (linkCount >= 3) reason = 'versteckter Linkblock';
      } else if (own.length < 25) {
        continue;
      } else if (parseFloat(cs.fontSize) < 2) reason = 'Schriftgröße < 2px';
      else if (r.right < -500 || r.bottom < -500) reason = 'aus dem sichtbaren Bereich geschoben';
      else {
        const fg = parse(cs.color);
        let bg = null;
        let bgImage = false;
        for (let p = el; p; p = p.parentElement) {
          if (getComputedStyle(p).backgroundImage !== 'none') {
            bgImage = true; // Text auf Hintergrundbild – Farbe allein sagt nichts
            break;
          }
          const b = parse(getComputedStyle(p).backgroundColor);
          if (b.length >= 3 && (b.length < 4 || b[3] > 0.5)) {
            bg = b;
            break;
          }
        }
        if (!bg) bg = [255, 255, 255];
        if (!bgImage && fg.length >= 3 && Math.abs(fg[0] - bg[0]) + Math.abs(fg[1] - bg[1]) + Math.abs(fg[2] - bg[2]) < 12)
          reason = 'Textfarbe = Hintergrundfarbe';
      }
      if (reason) {
        // Verschachtelte Treffer (Kind eines bereits gezählten Elements) nicht doppelt zählen
        if (hidden.samples.some((s) => s.el && s.el.contains(el))) continue;
        hidden.count++;
        hidden.chars += Math.max(own.length, (el.textContent || '').trim().length);
        hidden.samples.push({ el, reason, text: (own || el.textContent || '').trim().slice(0, 120) });
      }
    }
  }

  hidden.samples = hidden.samples.slice(0, 5).map(({ el, ...s }) => s);

  // Kommentare / nutzergenerierte Inhalte
  const commentSel =
    '.comment-content, .comment-body, .comment-text, [itemtype*="Comment"] [itemprop="text"], .commentlist li, ol.comment-list > li, .post-message, .forum-post, [data-testid*="comment"]';
  const commentEls = [...document.querySelectorAll(commentSel)];
  const comments = commentEls.slice(0, 200).map((c) => ({
    text: clean(c.textContent).slice(0, 2000),
    links: [...c.querySelectorAll('a[href]')].map((a) => ({
      href: abs(a.getAttribute('href')),
      rel: (a.getAttribute('rel') || '').toLowerCase(),
      text: clean(a.textContent),
    })),
  }));

  const timeEls = [...document.querySelectorAll('time[datetime]')].map((t) => t.getAttribute('datetime'));
  const authorEl = document.querySelector('[rel=author], .author, .byline, [itemprop=author], .post-author');

  const iframes = [...document.querySelectorAll('iframe')].map((f) => {
    const r = rendered ? f.getBoundingClientRect() : { width: 0, height: 0 };
    return { src: abs(f.getAttribute('src') || '') || '', width: Math.round(r.width), height: Math.round(r.height) };
  });
  const videos = [...document.querySelectorAll('video')].map((v) => ({
    autoplay: v.autoplay || v.hasAttribute('autoplay'),
    muted: v.muted || v.hasAttribute('muted'),
  }));

  return {
    url: location.href,
    title: clean(document.title),
    lang: document.documentElement.getAttribute('lang'),
    metaDescription: meta('meta[name="description" i]'),
    metaRobots: meta('meta[name="robots" i]') || '',
    googlebotRobots: meta('meta[name="googlebot" i]') || '',
    metaRating: meta('meta[name="rating" i]'),
    metaAuthor: meta('meta[name="author" i]'),
    metaRefresh: meta('meta[http-equiv="refresh" i]'),
    viewport: meta('meta[name="viewport" i]'),
    canonical: abs(document.querySelector('link[rel="canonical" i]')?.getAttribute('href') || '') || null,
    hreflang: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => l.getAttribute('hreflang')),
    favicon: !!document.querySelector('link[rel*="icon" i]'),
    ogType: meta('meta[property="og:type"]'),
    published:
      meta('meta[property="article:published_time"]') ||
      jsonld.map((o) => o.datePublished).find(Boolean) ||
      timeEls[0] ||
      null,
    modified:
      meta('meta[property="article:modified_time"]') || jsonld.map((o) => o.dateModified).find(Boolean) || null,
    timeElements: timeEls.length,
    headings: [...document.querySelectorAll('h1,h2,h3')].map((h) => ({ level: +h.tagName[1], text: clean(h.textContent) })),
    mainText,
    bodyText,
    links,
    images,
    jsonld,
    ldTypes,
    microdataTypes,
    hidden,
    comments,
    commentContainer: !!document.querySelector('#comments, .comments, .comment-list, .commentlist, #disqus_thread'),
    hasNav: !!document.querySelector('nav, [role=navigation]'),
    hasBreadcrumb:
      ldTypes.includes('BreadcrumbList') ||
      !!document.querySelector('[aria-label*="breadcrumb" i], .breadcrumb, .breadcrumbs, nav.crumbs'),
    hasSearch: !!document.querySelector('input[type=search], form[role=search]'),
    authorText: authorEl ? clean(authorEl.textContent).slice(0, 120) : null,
    counts: {
      tables: document.querySelectorAll('table').length,
      lists: document.querySelectorAll('ul li, ol li').length,
      figures: document.querySelectorAll('figure').length,
      forms: document.querySelectorAll('form').length,
      scripts: document.querySelectorAll('script[src]').length,
      dom: document.getElementsByTagName('*').length,
    },
    iframes,
    videos,
    horizontalOverflow: rendered ? document.documentElement.scrollWidth > window.innerWidth + 5 : false,
  };
}

/** Findet fixierte Overlays (Pop-ups, Interstitials) und deren Abdeckung des Viewports. */
export function detectOverlays() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.1) continue;
    const r = el.getBoundingClientRect();
    const w = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
    const h = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
    const coverage = (w * h) / (vw * vh);
    if (coverage < 0.05) continue;
    // Elternelemente, die selbst schon gezählt wurden, nicht doppelt zählen
    if (out.some((o) => o.el.contains(el))) continue;
    const text = (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 160);
    out.push({
      el,
      coverage: Math.round(coverage * 100) / 100,
      position: cs.position,
      zIndex: cs.zIndex,
      text,
      legal: /cookie|consent|einwillig|datenschutz|privacy|gdpr|dsgvo|alter|age/i.test(text),
    });
  }
  return out.map(({ el, ...rest }) => ({ tag: el.tagName.toLowerCase(), ...rest }));
}
