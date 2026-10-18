// BabyPanda V2: neuere Qualitätsabwertung – Kombination aus KI-Bewertung der Hilfsbereitschaft
// des Inhalts (Gemini) und der Website-Stichprobe.
import { siteSample } from '../lib/analysis.js';
import { METHOD, defineFactor, runIfMain } from '../lib/factor.js';
import { scale, weighted } from '../lib/util.js';

const factor = defineFactor({
  id: 'babyPandaV2Demotion',
  title: 'BabyPanda V2 (hilfreicher Inhalt)',
  category: 'content_quality',
  weight: 2,
  gemini: {
    text: [{ id: 'helpfulness', frage: 'Ist der Inhalt für Menschen geschrieben und hilft er einem Besucher wirklich weiter (people-first content), oder wirkt er vor allem für Suchmaschinen produziert? 100 = umfassend hilfreich und zufriedenstellend, 0 = ohne echten Nutzen.' }],
  },
  async evaluate(ctx) {
    const [s, ai] = await Promise.all([siteSample(ctx), ctx.ai.rate('helpfulness')]);
    const site = weighted([[scale(s.thinRatio, 0.6, 0.1), 1], [scale(s.nearDupRatio, 0.3, 0), 1]]);
    return {
      score: weighted([[ai?.score, 3], [site, 2]]),
      method: ai ? METHOD.GEMINI : METHOD.HEURISTIC,
      confidence: ai ? 'mittel' : 'niedrig',
      findings: [
        ai ? `Gemini (Hilfsbereitschaft): ${ai.score}/100 – ${ai.reason}` : 'Ohne Gemini nur Website-Stichprobe bewertet.',
        `Website-Stichprobe (dünne/doppelte Seiten): ${Math.round(site ?? 0)}/100.`,
      ],
      recommendations: ai && ai.score < 60 ? ['Inhalt an echten Nutzerfragen ausrichten: konkrete Antworten, Beispiele, eigene Erfahrung.'] : [],
      data: { gemini: ai, site },
    };
  },
});

export default factor;
await runIfMain(import.meta.url, factor);
