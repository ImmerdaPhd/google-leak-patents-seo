#!/usr/bin/env node
// Ermittelt alle 58 Kern-Signale für eine URL GLEICHZEITIG und berechnet einen Gesamtscore.
//
//   node analyze.js https://example.com
//   node analyze.js https://example.com --out bericht.md      (oder .json)
//   node analyze.js https://example.com --json --no-gemini
//   node analyze.js https://example.com --only contentEffort,clutterScore
//
// Die Seite wird einmal mit Playwright geladen; alle Faktoren teilen sich diese Daten.
// Gemini-Fragen aller Faktoren gehen gebündelt in zwei Anfragen (Text + Bilder).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CATEGORY_LABELS } from './lib/categories.js';
import { createContext } from './lib/context.js';
import { CONFIDENCE_WEIGHT, label, parseArgs, runFactor } from './lib/factor.js';
import { round } from './lib/util.js';

const here = path.dirname(fileURLToPath(import.meta.url));

export async function loadFactors(only) {
  const dir = path.join(here, 'factors');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort((a, b) => a.localeCompare(b, 'de', { sensitivity: 'base' }));
  const factors = [];
  for (const f of files) factors.push((await import(pathToFileURL(path.join(dir, f)).href)).default);
  return only ? factors.filter((f) => only.includes(f.id)) : factors;
}

/** Gewichteter Gesamtscore: Gewicht des Faktors × Konfidenz der Messung. */
export function aggregate(results) {
  const counted = results.filter((r) => r.score != null && !r.informational && r.weight > 0);
  const sum = (rows) => {
    const w = rows.reduce((a, r) => a + r.weight * (CONFIDENCE_WEIGHT[r.confidence] ?? 0.5), 0);
    return w ? rows.reduce((a, r) => a + r.score * r.weight * (CONFIDENCE_WEIGHT[r.confidence] ?? 0.5), 0) / w : null;
  };
  const categories = Object.keys(CATEGORY_LABELS)
    .map((key) => {
      const rows = results.filter((r) => r.category === key);
      const scored = rows.filter((r) => counted.includes(r));
      return { key, label: CATEGORY_LABELS[key], score: round(sum(scored)), measured: scored.length, total: rows.length };
    })
    .filter((c) => c.total);
  const total = round(sum(counted));
  const possible = results.filter((r) => r.weight > 0 && !r.informational);
  return {
    total,
    rating: label(total),
    measured: counted.length,
    factors: results.length,
    coverage: round((counted.length / Math.max(possible.length, 1)) * 100),
    categories,
    priorities: counted
      .filter((r) => r.score < 70)
      .sort((a, b) => (100 - b.score) * b.weight - (100 - a.score) * a.weight)
      .slice(0, 10)
      .map((r) => ({ id: r.id, title: r.title, score: r.score, recommendations: r.recommendations })),
  };
}

export async function analyze(url, { gemini = true, maxPages = 8, only = null, verbose = false, force = false } = {}) {
  const factors = await loadFactors(only);
  const ctx = await createContext(url, { gemini, maxPages, verbose });
  for (const f of factors) if (f.gemini) ctx.ai.register(f.gemini);
  const started = Date.now();
  try {
    // Seite zuerst laden: Ist die URL nicht erreichbar oder gesperrt, sofort abbrechen
    const page = await ctx.page();
    if (page.status >= 400 && !force)
      throw new Error(
        `Die Seite antwortet mit HTTP ${page.status}${page.status === 403 || page.status === 429 ? ' – vermutlich Bot-Schutz/Firewall' : ''}. ` +
          'Analysiert würde nur die Fehlerseite. Mit --force trotzdem auswerten.',
      );
    const results = await Promise.all(factors.map((f) => runFactor(f, ctx)));
    return {
      url: ctx.inputUrl,
      finalUrl: (await ctx.page()).finalUrl,
      analyzedAt: new Date().toISOString(),
      durationMs: Date.now() - started,
      gemini: { enabled: ctx.ai.available, model: ctx.ai.available ? ctx.ai.model : null, calls: ctx.ai.calls, errors: ctx.ai.errors },
      summary: aggregate(results),
      results,
    };
  } finally {
    await ctx.close();
  }
}

const bar = (s) => (s == null ? '·'.repeat(20) : '█'.repeat(Math.round(s / 5)) + '░'.repeat(20 - Math.round(s / 5)));
const pad = (s, n) => String(s).padEnd(n).slice(0, n);
const num = (s) => (s == null ? '  –' : String(Math.round(s)).padStart(3));

export function toText(report) {
  const s = report.summary;
  const out = [];
  out.push('');
  out.push(`Analyse der 58 Google-Kern-Signale für ${report.finalUrl}`);
  out.push(`Gemini: ${report.gemini.enabled ? `aktiv (${report.gemini.model}, ${report.gemini.calls} Anfragen)` : 'aus – KI-gestützte Werte nur heuristisch'}${report.gemini.errors.length ? ` – Fehler: ${report.gemini.errors.join('; ')}` : ''}`);
  out.push(`Dauer: ${round(report.durationMs / 1000, 1)} s`);
  out.push('');
  out.push(`GESAMTSCORE: ${num(s.total)}/100  ${bar(s.total)}  (${s.rating})`);
  out.push(`Bewertet: ${s.measured} von ${s.factors} Signalen (Abdeckung ${s.coverage} % der gewichteten Signale)`);
  out.push('');
  out.push('Kategorien:');
  for (const c of s.categories) out.push(`  ${pad(c.label, 38)} ${num(c.score)}  ${bar(c.score)}  ${c.measured}/${c.total} bewertet`);
  for (const c of s.categories) {
    out.push('');
    out.push(`── ${c.label} ${'─'.repeat(Math.max(0, 60 - c.label.length))}`);
    for (const r of report.results.filter((x) => x.category === c.key)) {
      const tag = r.informational ? ' [Bonus, nicht im Gesamtscore]' : r.score == null ? ` [${r.applicable === false ? 'nicht anwendbar' : r.method}]` : '';
      out.push(`  ${num(r.score)} ${bar(r.score)} ${r.id} – ${r.title}${tag}`);
      out.push(`      Methode: ${r.method}, Konfidenz: ${r.confidence}`);
      for (const f of r.findings.slice(0, 4)) out.push(`      • ${f}`);
    }
  }
  if (s.priorities.length) {
    out.push('');
    out.push('Größte Hebel (niedriger Score × hohes Gewicht):');
    s.priorities.forEach((p, i) => {
      out.push(`  ${i + 1}. ${p.title} (${p.id}) – ${p.score}/100`);
      for (const rec of p.recommendations.slice(0, 2)) out.push(`     → ${rec}`);
    });
  }
  out.push('');
  out.push('Hinweis: Die Werte sind Schätzungen. Googles echte interne Werte sind nicht öffentlich; der Leak');
  out.push('zeigt nur, welche Signale existieren, nicht wie sie berechnet oder gewichtet werden.');
  return out.join('\n');
}

export function toMarkdown(report) {
  const s = report.summary;
  const md = [];
  md.push(`# Kern-Signal-Analyse: ${report.finalUrl}`, '');
  md.push(`- **Gesamtscore:** ${s.total ?? '–'}/100 (${s.rating})`);
  md.push(`- **Bewertet:** ${s.measured} von ${s.factors} Signalen (Abdeckung ${s.coverage} %)`);
  md.push(`- **Gemini:** ${report.gemini.enabled ? report.gemini.model : 'aus'}`);
  md.push(`- **Datum:** ${report.analyzedAt}`, '');
  md.push('## Kategorien', '', '| Kategorie | Score | bewertet |', '|---|---:|---:|');
  for (const c of s.categories) md.push(`| ${c.label} | ${c.score ?? '–'} | ${c.measured}/${c.total} |`);
  if (s.priorities.length) {
    md.push('', '## Größte Hebel', '');
    s.priorities.forEach((p, i) => md.push(`${i + 1}. **${p.title}** (\`${p.id}\`) – ${p.score}/100${p.recommendations[0] ? `: ${p.recommendations[0]}` : ''}`));
  }
  for (const c of s.categories) {
    md.push('', `## ${c.label}`, '');
    for (const r of report.results.filter((x) => x.category === c.key)) {
      md.push(`### ${r.title} (\`${r.id}\`) – ${r.score ?? '–'}/100`, '');
      md.push(`*Methode: ${r.method} · Konfidenz: ${r.confidence}${r.informational ? ' · Bonus, nicht im Gesamtscore' : ''}*`, '');
      for (const f of r.findings) md.push(`- ${f}`);
      for (const rec of r.recommendations) md.push(`- → ${rec}`);
      md.push('');
    }
  }
  return md.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.url) {
    console.error('Aufruf: node analyze.js <url> [--out bericht.md|bericht.json] [--json] [--no-gemini] [--max-pages N] [--only id1,id2] [--force] [--verbose]');
    process.exit(2);
  }
  let report;
  try {
    report = await analyze(args.url, args);
  } catch (e) {
    console.error(`Analyse fehlgeschlagen: ${e.message.split('\n')[0]}`);
    process.exit(1);
  }
  console.log(args.json ? JSON.stringify(report, null, 2) : toText(report));
  if (args.out) {
    fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true });
    fs.writeFileSync(args.out, args.out.endsWith('.md') ? toMarkdown(report) : JSON.stringify(report, null, 2));
    console.error(`Bericht gespeichert: ${args.out}`);
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) await main();
