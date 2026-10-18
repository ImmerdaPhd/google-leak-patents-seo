// Textanalyse: Tokenisierung, Keyword-Dichte, Ähnlichkeit, Spam- und Gibberish-Merkmale.

export const STOPWORDS = new Set(
  (
    'der die das und oder aber ist sind war waren ein eine einer eines einem einen zu im in am an auf aus bei mit ' +
    'nach von vor für über unter um durch als wie wenn dass daß nicht kein keine auch noch nur schon sehr mehr so ' +
    'es er sie wir ihr ich du man sich sein seine ihre ihr unser euer dem den des hat haben hatte wird werden wurde ' +
    'kann können muss müssen soll sollen will wollen diese dieser dieses diesem diesen jede jeder jedes alle alles ' +
    'was wer wo wann warum welche welcher welches hier dort dann denn doch ja nein zum zur vom beim bis ab ob ' +
    'the a an and or but is are was were be been being to of in on at by for with from as that this these those it ' +
    'its he she they we you i not no yes do does did have has had will would can could should may might must ' +
    'than then there their them our your my me us so if which who what when where why how all any each more most ' +
    'also just only into about over after before up down out off again further once here very'
  ).split(' '),
);

export function tokenize(text) {
  return (text || '').toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'-]*/gu) || [];
}

export const contentTokens = (tokens) => tokens.filter((t) => t.length > 2 && !STOPWORDS.has(t) && !/^\d+$/.test(t));

/** Häufigkeiten, Top-Begriffe und wiederholte N-Gramme eines Texts. */
export function termStats(text) {
  const tokens = tokenize(text);
  const content = contentTokens(tokens);
  const counts = new Map();
  for (const t of content) counts.set(t, (counts.get(t) || 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  const bigrams = new Map();
  for (let i = 0; i < content.length - 1; i++) {
    const g = content[i] + ' ' + content[i + 1];
    bigrams.set(g, (bigrams.get(g) || 0) + 1);
  }
  const topBigrams = [...bigrams.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  return {
    words: tokens.length,
    contentWords: content.length,
    top,
    topBigrams,
    // Anteil des häufigsten Inhaltsworts an allen Wörtern (Keyword-Dichte)
    topDensity: tokens.length ? (top[0]?.[1] || 0) / tokens.length : 0,
    topBigramDensity: tokens.length ? (topBigrams[0]?.[1] || 0) / tokens.length : 0,
    uniqueRatio: content.length ? counts.size / content.length : 0,
  };
}

/** Wort-Shingles für Duplikat-Vergleiche. */
export function shingles(text, k = 5) {
  const t = contentTokens(tokenize(text));
  const set = new Set();
  for (let i = 0; i + k <= t.length; i++) set.add(t.slice(i, i + k).join(' '));
  return set;
}

export function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

/** Anteil der Wörter von `a`, die auch in `b` vorkommen (Überschneidung zweier Begriffsmengen). */
export function overlap(aText, bText) {
  const a = new Set(contentTokens(tokenize(aText)));
  const b = new Set(contentTokens(tokenize(bText)));
  if (!a.size) return 0;
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n / a.size;
}

export const SPAM_TERMS = [
  'viagra', 'cialis', 'levitra', 'kamagra', 'casino', 'online casino', 'slots', 'freispiele', 'poker bonus',
  'sportwetten bonus', 'payday loan', 'payday loans', 'kredit ohne schufa', 'sofortkredit', 'bitcoin verdoppeln',
  'crypto giveaway', 'replica', 'rolex replica', 'fake rolex', 'escort', 'porn', 'xxx', 'sex cams', 'cheap pills',
  'buy followers', 'follower kaufen', 'likes kaufen', 'backlinks kaufen', 'cheap backlinks', 'essay writing service',
  'weight loss pills', 'abnehmen ohne sport', 'schnell reich', 'get rich quick', 'make money fast', 'work from home scam',
  'lottery winner', 'lotto gewinner', 'garantierter gewinn', 'guaranteed profit', '100% gratis', 'free money',
  'pharmacy online', 'online apotheke ohne rezept', 'without prescription',
];

export const ADULT_TERMS = ['porn', 'porno', 'xxx', 'sex cam', 'sexcam', 'nude', 'nackt', 'erotik', 'escort', 'hardcore', 'fetisch', 'fetish', 'onlyfans leak'];

export const URGENCY_PATTERNS = [
  /nur noch \d+ (stück|verfügbar|artikel|plätze)/i,
  /only \d+ (left|remaining|in stock)/i,
  /angebot endet (in|heute)/i,
  /offer ends (in|today)/i,
  /nur heute/i,
  /limited time offer/i,
  /act now/i,
  /jetzt zugreifen,? bevor/i,
  /\d+ personen (sehen|kaufen) sich (das|dies) gerade an/i,
  /\d+ people are (viewing|looking at) this/i,
];

export function countTerms(text, terms) {
  const t = ` ${(text || '').toLowerCase()} `;
  const hits = [];
  for (const term of terms) {
    const re = new RegExp(`[^\\p{L}]${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\\p{L}]`, 'gu');
    const n = (t.match(re) || []).length;
    if (n) hits.push([term, n]);
  }
  return hits;
}

/** Heuristische Merkmale für sinnlosen Text (lateinische Schrift). */
export function gibberishStats(text) {
  const words = tokenize(text).filter((w) => /^[a-zäöüß]+$/.test(w));
  if (words.length < 30) return null;
  const noVowel = words.filter((w) => w.length > 3 && !/[aeiouyäöü]/.test(w)).length;
  const longCons = words.filter((w) => /[bcdfghjklmnpqrstvwxz]{5,}/.test(w)).length;
  const veryLong = words.filter((w) => w.length > 22).length;
  const repeatedChars = words.filter((w) => /(.)\1{3,}/.test(w)).length;
  const avgLen = words.reduce((s, w) => s + w.length, 0) / words.length;
  const suspicious = (noVowel + longCons + veryLong + repeatedChars) / words.length;
  return { words: words.length, suspiciousRatio: suspicious, avgWordLength: avgLen };
}

/** Anteil der Ich-/Wir-Perspektive (Indiz für persönliche Erfahrung). */
export function firstPersonRatio(text) {
  const tokens = tokenize(text);
  if (!tokens.length) return 0;
  const fp = new Set(['ich', 'mein', 'meine', 'meinen', 'meinem', 'mir', 'mich', 'wir', 'unser', 'unsere', 'uns', 'i', 'my', 'me', 'we', 'our', "i'm", "i've"]);
  return tokens.filter((t) => fp.has(t)).length / tokens.length;
}
