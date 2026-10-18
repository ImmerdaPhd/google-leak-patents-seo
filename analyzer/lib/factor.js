// Gemeinsames Gerüst für alle Faktor-Dateien:
//  - defineFactor(): einheitliche Beschreibung eines Faktors
//  - runFactor():   führt einen Faktor sicher aus und normalisiert das Ergebnis
//  - runIfMain():   macht jede Faktor-Datei auch einzeln aufrufbar:
//                   node factors/contentEffort.js https://example.com [--json] [--no-gemini]

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createContext } from './context.js';
import { round } from './util.js';

/** Bewertungsmethoden – bestimmen, wie stark ein Wert in den Gesamtscore eingeht. */
export const METHOD = {
  MEASURED: 'gemessen', // direkt technisch geprüft
  HEURISTIC: 'heuristik', // Näherung über eindeutige Merkmale
  GEMINI: 'gemini', // KI-Bewertung (ggf. kombiniert mit Heuristik)
  PROXY: 'proxy', // indirekte Annäherung, weil Googles Daten nicht öffentlich sind
  NONE: 'nicht messbar',
};

export const CONFIDENCE_WEIGHT = { hoch: 1, mittel: 0.75, niedrig: 0.5 };

export function defineFactor(def) {
  for (const k of ['id', 'title', 'category', 'evaluate']) if (!def[k]) throw new Error(`Faktor ohne ${k}`);
  return { weight: 1, gemini: null, ...def };
}

/** Ergebnis für Signale, die sich von außen nicht bestimmen lassen. */
export function notMeasurable(reason, hint) {
  return { score: null, method: METHOD.NONE, confidence: 'niedrig', findings: [reason], recommendations: hint ? [hint] : [] };
}

/** Ergebnis für Faktoren, die auf diese Seite nicht zutreffen (z. B. keine Kommentare). */
export function notApplicable(reason) {
  return { score: null, method: METHOD.HEURISTIC, confidence: 'mittel', applicable: false, findings: [reason] };
}

export function label(score) {
  if (score == null) return '–';
  if (score >= 85) return 'sehr gut';
  if (score >= 70) return 'gut';
  if (score >= 50) return 'mittel';
  if (score >= 30) return 'schwach';
  return 'kritisch';
}

export async function runFactor(factor, ctx) {
  const base = { id: factor.id, title: factor.title, category: factor.category, weight: factor.weight, informational: !!factor.informational };
  const started = Date.now();
  try {
    const r = await factor.evaluate(ctx);
    const score = r.score == null ? null : round(Math.max(0, Math.min(100, r.score)));
    return {
      ...base,
      score,
      rating: label(score),
      method: r.method || METHOD.HEURISTIC,
      confidence: r.confidence || 'mittel',
      applicable: r.applicable !== false,
      findings: (r.findings || []).filter(Boolean),
      recommendations: (r.recommendations || []).filter(Boolean),
      data: r.data || {},
      ms: Date.now() - started,
    };
  } catch (e) {
    return { ...base, score: null, rating: '–', method: 'fehler', confidence: 'niedrig', applicable: true, findings: [`Fehler: ${e.message.split('\n')[0]}`], recommendations: [], data: {}, ms: Date.now() - started };
  }
}

export function parseArgs(argv) {
  const args = { url: null, json: false, gemini: true, maxPages: 8, out: null, verbose: false, only: null, force: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') args.json = true;
    else if (a === '--no-gemini') args.gemini = false;
    else if (a === '--verbose' || a === '-v') args.verbose = true;
    else if (a === '--force') args.force = true;
    else if (a === '--max-pages') args.maxPages = Number(argv[++i]);
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--only') args.only = argv[++i].split(',');
    else if (!a.startsWith('-') && !args.url) args.url = a;
  }
  return args;
}

export function formatResult(r) {
  const lines = [];
  const score = r.score == null ? '  –' : String(r.score).padStart(3);
  lines.push(`${r.id} – ${r.title}`);
  lines.push(`  Score: ${score}/100 (${r.rating})   Methode: ${r.method}   Konfidenz: ${r.confidence}`);
  for (const f of r.findings) lines.push(`  • ${f}`);
  for (const rec of r.recommendations) lines.push(`  → ${rec}`);
  return lines.join('\n');
}

/** Startet die Datei als eigenes Programm, wenn sie direkt mit node aufgerufen wird. */
export async function runIfMain(metaUrl, factor) {
  if (!process.argv[1] || pathToFileURL(path.resolve(process.argv[1])).href !== metaUrl) return;
  const args = parseArgs(process.argv.slice(2));
  if (!args.url) {
    console.error(`Aufruf: node ${path.basename(process.argv[1])} <url> [--json] [--no-gemini] [--max-pages N]`);
    process.exit(2);
  }
  const ctx = await createContext(args.url, { gemini: args.gemini, maxPages: args.maxPages, verbose: args.verbose });
  if (factor.gemini) ctx.ai.register(factor.gemini);
  try {
    const result = await runFactor(factor, ctx);
    console.log(args.json ? JSON.stringify(result, null, 2) : formatResult(result));
  } finally {
    await ctx.close();
  }
}
