#!/usr/bin/env node
// Selbsttest ohne Internet und ohne echten Gemini-Key:
// Ein lokaler Server liefert eine saubere und eine spammige Testseite und spielt die
// Gemini-API nach. Geprüft wird, dass alle 58 Faktoren laufen, Gemini genau zweimal
// (Text + Bilder) angefragt wird und die Heuristiken die Spam-Seite erkennen.
//
//   npm test

import assert from 'node:assert/strict';
import http from 'node:http';

// 1×1-PNG, im Browser auf 600×400 skaliert
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

const SENTENCES = [
  'Vor jeder Tour schaue ich mir den Bergwetterbericht für die nächsten drei Tage an.',
  'Gewitter bilden sich im Sommer oft schon am frühen Nachmittag über den Gipfeln.',
  'Deshalb starte ich meistens vor sieben Uhr morgens am Parkplatz im Tal.',
  'Gute Schuhe mit fester Sohle verhindern umgeknickte Knöchel auf Geröllfeldern.',
  'In meinen Rucksack packe ich zwei Liter Wasser, Nüsse, Pflaster und eine Rettungsdecke.',
  'Eine Papierkarte ersetzt das Handy, wenn der Akku in der Kälte schnell leer wird.',
  'Auf schmalen Graten gilt: Lieber umkehren, als ein unnötiges Risiko einzugehen.',
  'Hütten sollte man in der Hauptsaison mindestens zwei Wochen vorher reservieren.',
  'Für Anfänger eignen sich markierte Rundwege mit weniger als 800 Höhenmetern.',
  'Nach jeder Wanderung notiere ich Dauer, Höhenmeter und besondere Schwierigkeiten.',
  'Stöcke entlasten beim Abstieg spürbar die Knie, besonders mit schwerem Gepäck.',
  'Sonnencreme ist auch bei Bewölkung wichtig, weil die Strahlung in der Höhe stärker ist.',
];
let sentence = 0;
const para = (n) => Array.from({ length: n }, () => `<p>${Array.from({ length: 3 }, () => SENTENCES[sentence++ % SENTENCES.length]).join(' ')}</p>`).join('\n');

const CLEAN = `<!doctype html><html lang="de"><head><meta charset="utf-8">
<title>Wandern in den Alpen: Tourenplanung Schritt für Schritt</title>
<meta name="description" content="Wie ich Wandertouren in den Alpen plane: Wetter, Ausrüstung, Route und Sicherheit – mit Checkliste und eigenen Erfahrungen aus 50 Touren.">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="/clean">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"Wandern in den Alpen","author":{"@type":"Person","name":"Anna Berg"},"datePublished":"2026-03-01","dateModified":"2026-09-01","image":"/img/tour.png"}</script>
</head><body><header><nav><a href="/">Start</a> <a href="/impressum">Impressum</a> <a href="/kontakt">Kontakt</a> <a href="/datenschutz">Datenschutz</a> <a href="/ueber-mich">Über mich</a></nav></header>
<main><article><h1>Wandern in den Alpen: Tourenplanung</h1><p class="byline">Von Anna Berg</p>
<h2>Wetter prüfen</h2>${para(6)}<h2>Ausrüstung</h2><ul><li>Wanderschuhe</li><li>Regenjacke</li><li>Erste-Hilfe-Set</li></ul>${para(6)}
<figure><img src="/img/wandern-alpen-route.png" alt="Wandern in den Alpen: Route auf der Karte" width="600" height="400"><figcaption>Unsere Route</figcaption></figure>
<h2>Route</h2><table><tr><td>Etappe</td><td>Dauer</td></tr><tr><td>1</td><td>3 h</td></tr></table>${para(6)}
<p>Quelle: <a href="https://www.dwd.de">Deutscher Wetterdienst</a>, <a href="https://de.wikipedia.org/wiki/Alpen">Wikipedia</a></p>
</article></main><footer><a href="/impressum">Impressum</a></footer></body></html>`;

const stuffed = Array.from({ length: 60 }, () => 'günstige kredite sofort günstige kredite online').join(' ');
const SPAM = `<!doctype html><html><head><title>Günstige Kredite günstige Kredite günstige Kredite</title></head>
<body><p>${stuffed} kredit ohne schufa sofortkredit online casino freispiele viagra</p>
<div style="color:#fff;background:#fff">günstige kredite günstige kredite günstige kredite versteckter text für suchmaschinen</div>
<div style="display:none"><a href="https://casino-spam.xyz/a">casino</a><a href="https://pills.top/b">pills</a><a href="https://loans.click/c">loans</a></div>
<a href="https://casino-spam.xyz/">online casino bonus</a>
<div style="position:fixed;inset:0;background:#000c;z-index:9999;color:#fff">Jetzt Newsletter abonnieren und 10 % sparen!</div>
</body></html>`;

const geminiRequests = [];

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/v1beta/models/')) {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const json = JSON.parse(body);
      geminiRequests.push({ key: req.headers['x-goog-api-key'], json });
      const text = json.contents[0].parts.map((p) => p.text || '').join('\n');
      const ids = [...text.matchAll(/^- ([A-Za-z]+):/gm)].map((m) => m[1]);
      const images = json.contents[0].parts.filter((p) => p.inlineData).length;
      const kriterien = Object.fromEntries(ids.map((id) => [id, { score: 77, begruendung: 'Testantwort', ...(images ? { bilder: Array(images).fill(77) } : {}) }]));
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ kriterien }) }] } }] }));
    });
    return;
  }
  if (req.url.startsWith('/img/')) {
    res.writeHead(200, { 'content-type': 'image/png' });
    return res.end(PNG);
  }
  const pages = { '/clean': CLEAN, '/spam': SPAM, '/': CLEAN.replace('/clean', '/') };
  const html = pages[req.url] ?? (req.url === '/robots.txt' ? null : `<html><head><title>${req.url}</title></head><body><main><h1>${req.url}</h1>${para(4)}<a href="/clean">Wandern in den Alpen</a></main></body></html>`);
  if (html === null) {
    res.writeHead(200, { 'content-type': 'text/plain' });
    return res.end('User-agent: *\nDisallow: /privat/\n');
  }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(html);
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
process.env.GEMINI_API_KEY = 'test-key';
process.env.GEMINI_BASE_URL = `${base}/v1beta`;
delete process.env.HTTPS_PROXY;
delete process.env.https_proxy;
const { analyze } = await import('../analyze.js');

let failed = 0;
const check = (name, fn) => {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}\n    ${e.message.split('\n')[0]}`);
  }
};

try {
  console.log('Saubere Testseite (mit Gemini-Mock):');
  const clean = await analyze(`${base}/clean`, { maxPages: 3 });
  const c = Object.fromEntries(clean.results.map((r) => [r.id, r]));
  check('58 Faktoren ausgewertet', () => assert.equal(clean.results.length, 58));
  check('kein Faktor wirft einen Fehler', () => assert.deepEqual(clean.results.filter((r) => r.method === 'fehler').map((r) => `${r.id}: ${r.findings[0]}`), []));
  check('Gesamtscore ist eine Zahl zwischen 0 und 100', () => assert.ok(clean.summary.total >= 0 && clean.summary.total <= 100));
  check('Gemini genau 2× aufgerufen (Text + Bilder)', () => assert.equal(geminiRequests.length, 2));
  check('API-Key im Header, nicht in der URL', () => assert.equal(geminiRequests[0].key, 'test-key'));
  check('Bild wird inline an Gemini geschickt', () => assert.ok(geminiRequests.some((r) => r.json.contents[0].parts.some((p) => p.inlineData?.mimeType === 'image/png'))));
  check('Gemini-Wert fließt in contentEffort ein', () => assert.equal(c.contentEffort.method, 'gemini'));
  check('Bildfaktor eqStar nutzt Gemini', () => assert.equal(c.eqStar.score, 77));
  check('kein Keyword-Stuffing erkannt', () => assert.ok(c.KeywordStuffingScore.score >= 80, c.KeywordStuffingScore.score));
  check('kein versteckter Text erkannt', () => assert.ok(c.DocLevelSpamScore.score >= 80, c.DocLevelSpamScore.findings.join(' ')));
  check('Vertrauenssignale erkannt (Autor, Impressum, Quellen)', () => assert.ok(c.unauthoritativeScore.data.author && c.unauthoritativeScore.data.impressum && c.unauthoritativeScore.data.citations >= 1));
  check('kein Mobile-Interstitial', () => assert.equal(c.violatesMobileInterstitialPolicy.score, 100));
  check('Seite ist indexierbar', () => assert.equal(c.boostSourceBlocker.score, 100));

  console.log('Spam-Testseite (ohne Gemini):');
  const spam = await analyze(`${base}/spam`, { maxPages: 2, gemini: false });
  const s = Object.fromEntries(spam.results.map((r) => [r.id, r]));
  check('keine weiteren Gemini-Aufrufe mit --no-gemini', () => assert.equal(geminiRequests.length, 2));
  check('Keyword-Stuffing erkannt', () => assert.ok(s.KeywordStuffingScore.score < 40, s.KeywordStuffingScore.score));
  check('Spam-Wörter erkannt', () => assert.ok(s.SpamWordScore.score < 30, s.SpamWordScore.score));
  check('versteckter Text erkannt', () => assert.ok(s.DocLevelSpamScore.score < 60, s.DocLevelSpamScore.findings.join(' ')));
  check('Link auf Spam-Domain erkannt', () => assert.ok(s.spamrank.score < 100, s.spamrank.score));
  check('Mobile-Interstitial erkannt', () => assert.ok(s.violatesMobileInterstitialPolicy.score <= 20, s.violatesMobileInterstitialPolicy.findings.join(' ')));
  check('Spam-Seite schlechter als saubere Seite', () => assert.ok(spam.summary.total < clean.summary.total - 15, `${spam.summary.total} vs ${clean.summary.total}`));
  console.log(`\nGesamtscore sauber: ${clean.summary.total}, Spam: ${spam.summary.total}`);
} finally {
  server.close();
}

console.log(failed ? `\n${failed} Test(s) fehlgeschlagen.` : '\nAlle Tests bestanden.');
process.exit(failed ? 1 : 0);
