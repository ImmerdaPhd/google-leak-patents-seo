# Kern-Signal-Analyzer

Schätzt die **58 Kern-Ranking-Signale** aus dem Google-Leak (2024) für eine beliebige URL und
berechnet daraus einen **Gesamtscore von 0 bis 100**.

- Jedes Signal hat eine **eigene Datei** in `factors/`, die auch einzeln aufrufbar ist.
- `analyze.js` lädt die Seite einmal mit **Playwright** und ermittelt **alle Signale gleichzeitig**.
- Wo eine inhaltliche Beurteilung nötig ist (Aufwand, Originalität, Vertrauen, Bildwirkung …),
  wird **Google Gemini** gefragt – gebündelt in nur zwei Anfragen pro Analyse.

> **Wichtig:** Das sind Schätzungen. Googles echte interne Werte sind nicht öffentlich; der Leak
> zeigt nur, *welche* Signale existieren, nicht wie sie berechnet oder gewichtet werden. Jedes
> Ergebnis nennt deshalb seine **Methode** und **Konfidenz**.

## Installation

```bash
cd analyzer
npm install
npx playwright install chromium
```

Node.js ≥ 20 wird benötigt.

## Benutzung

```bash
# Alle 58 Signale gleichzeitig + Gesamtscore
node analyze.js https://www.example.com

# Bericht speichern (Markdown oder JSON)
node analyze.js https://www.example.com --out berichte/example.md
node analyze.js https://www.example.com --out berichte/example.json

# Nur einzelne Signale
node analyze.js https://www.example.com --only contentEffort,clutterScore

# Ein einzelnes Signal direkt über seine Datei
node factors/contentEffort.js https://www.example.com
node factors/violatesMobileInterstitialPolicy.js https://www.example.com --json
```

| Option | Bedeutung |
|---|---|
| `--out <datei>` | Bericht als `.md` oder `.json` speichern |
| `--json` | Ausgabe als JSON statt Text |
| `--no-gemini` | Gemini nicht verwenden (nur Heuristiken) |
| `--max-pages <n>` | Größe der Stichprobe weiterer Seiten der Website (Standard 8) |
| `--only <ids>` | Nur diese Signale (kommagetrennt) |
| `--force` | Auch auswerten, wenn die Seite einen Fehlerstatus (≥ 400) liefert |
| `--verbose` | Fortschritt ausgeben |

## API-Keys (Umgebungsvariablen)

| Variable | Wofür | Pflicht? |
|---|---|---|
| `GEMINI_API_KEY` | KI-Bewertungen über Google Gemini ([Key erstellen](https://aistudio.google.com/apikey)) | empfohlen |
| `GEMINI_MODEL` | Gemini-Modell, Standard `gemini-2.5-flash` | nein |
| `OPENPAGERANK_API_KEY` | Linkautorität der Domain über [Open PageRank](https://www.domcop.com/openpagerank/) (kostenlos) | nein |
| `GOOGLE_SAFE_BROWSING_API_KEY` | Malware-/Phishing-Prüfung über Google Safe Browsing | nein |
| `PLAYWRIGHT_CHROMIUM_PATH` | eigener Chromium-Pfad, falls nicht über Playwright installiert | nein |

```bash
export GEMINI_API_KEY=dein-key
node analyze.js https://www.example.com
```

Ohne `GEMINI_API_KEY` läuft alles weiter. KI-gestützte Signale fallen dann auf Heuristiken
zurück; die drei rein visuellen Bildsignale (`eqStar`, `dimeScore` sowie die Bildprüfung in
`pornWithHighConfidence`) bleiben leer bzw. nur textbasiert.

## So wird gemessen

Für jedes Signal liefert die Datei: **Score** (0–100, immer *höher = besser*, auch bei
Abwertungs-Signalen), **Methode**, **Konfidenz**, **Befunde** und **Empfehlungen**.

| Methode | Bedeutung |
|---|---|
| `gemessen` | direkt technisch geprüft (z. B. Weiterleitungen, Overlays, Requests, robots.txt) |
| `heuristik` | Näherung über eindeutige Merkmale (z. B. Keyword-Dichte, Spam-Wörter) |
| `gemini` | KI-Bewertung durch Gemini, kombiniert mit Heuristiken |
| `proxy` | indirekte Annäherung, weil Googles Daten (Klicks, Links) nicht öffentlich sind |
| `nicht messbar` | nur mit Googles internen Daten bestimmbar (z. B. Penguin, SpamBrain-Versionen) |

Datenquellen eines Laufs, jeweils nur einmal abgerufen und von allen Signalen geteilt:

- **Desktop-Ansicht** (Playwright, Chromium): DOM, Texte, Links, Bilder, strukturierte Daten,
  alle Netzwerk-Requests, Core Web Vitals (LCP, CLS), Overlays, versteckter Text
- **Mobile Ansicht** (iPhone-Emulation): Interstitials/Pop-ups, Viewport
- **Stichprobe** weiterer Seiten der Website (aus Sitemap bzw. internen Links)
- **robots.txt**, URL-Varianten (http/https, www), Rohes HTML für Browser vs. Googlebot (Cloaking)
- **RDAP** (Domain-Alter), optional Open PageRank und Safe Browsing
- **Gemini**: eine Anfrage für alle Textfragen, eine für alle Bildfragen (bis zu 4 Bilder)

## Gesamtscore

```
Gesamtscore = Σ (Score × Gewicht × Konfidenzfaktor) / Σ (Gewicht × Konfidenzfaktor)
Konfidenzfaktor: hoch = 1, mittel = 0,75, niedrig = 0,5
```

- Das **Gewicht** (0–3) steht in jeder Faktor-Datei (`weight`).
- Nicht messbare und nicht anwendbare Signale (z. B. Produktdaten auf einer Blogseite) zählen nicht mit.
- `smallPersonalSite` ist ein Bonus-Signal und wird nur angezeigt, nicht eingerechnet.
- Die **Abdeckung** zeigt, wie viele der gewichteten Signale tatsächlich bewertet wurden.

## Eigene Faktoren anpassen

Jede Datei in `factors/` folgt demselben Muster:

```js
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';

const factor = defineFactor({
  id: 'meinSignal',
  title: 'Mein Signal',
  category: 'content_quality',
  weight: 2,
  gemini: { text: [{ id: 'frageId', frage: '… 100 = am besten.' }] }, // optional
  async evaluate(ctx) {
    const page = await ctx.page();             // gerenderte Seite
    const ai = await ctx.ai.rate('frageId');   // { score, reason } oder null
    return { score: 80, method: METHOD.HEURISTIC, confidence: 'mittel', findings: ['…'] };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
```

Neue Dateien in `factors/` werden von `analyze.js` automatisch mitgeladen.

## Test

```bash
npm test
```

Der Selbsttest startet einen lokalen Server mit einer sauberen und einer spammigen Testseite
und simuliert die Gemini-API. Er braucht weder Internet noch einen API-Key.

## Grenzen

- Viele Websites blockieren Anfragen aus Rechenzentren (Bot-Schutz). Dann bricht die Analyse mit
  einem Hinweis ab, statt die Sperrseite zu bewerten.
- Backlink-, Klick- und SpamBrain-Daten besitzt nur Google. Diese Signale sind als
  `nicht messbar` oder `proxy` gekennzeichnet.
- Cookie-Banner können Werbung bis zur Zustimmung zurückhalten – die Werbelast wird dann
  unterschätzt.
