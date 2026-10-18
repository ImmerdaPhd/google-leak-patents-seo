#!/usr/bin/env python3
"""
Build a German PDF guide to the 58 core ranking signals: what each one
measures, an example, and what you can do on your own site.

Usage
-----
  python3 scripts/build_core_signals_pdf.py [output.pdf]

Content comes from data/core_signals_guide_de.json; tier, confidence and
module are joined in from data/leak_attributes.jsonl.
Default output: docs/google-kern-signale-massnahmen.pdf
"""

import json
import sys
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    KeepTogether, PageBreak, Paragraph, Spacer, Table, TableStyle,
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus.tableofcontents import TableOfContents

from build_ranking_factors_pdf import (
    ACCENT, CATEGORIES, CONF_DE, INK, MUTED, PANEL, ROOT, RULE, Doc, heading,
    register_fonts, styles,
)

CONTROL = {
    "direkt": ("direkt beeinflussbar", "#1e7f4f"),
    "indirekt": ("indirekt beeinflussbar", "#b26a00"),
    "nicht": ("nicht beeinflussbar", "#616e7c"),
}


def load():
    guide = json.loads((ROOT / "data" / "core_signals_guide_de.json").read_text(encoding="utf-8"))
    leak = {}
    with open(ROOT / "data" / "leak_attributes.jsonl", encoding="utf-8") as f:
        for line in f:
            r = json.loads(line)
            if r.get("tier") == "core":
                leak[r["name"]] = r
    names = {g["name"] for g in guide}
    missing = set(leak) - names
    if missing or len(guide) != len(leak):
        sys.exit(f"Guide und Leak passen nicht zusammen, fehlend: {sorted(missing)}")
    for g in guide:
        g["module"] = leak[g["name"]]["module"]
        g["confidence"] = leak[g["name"]]["confidence"]
    return guide


def extra_styles(s):
    s["label"] = ParagraphStyle("label", fontName="Sans-Bold", fontSize=8, leading=11,
                                textColor=ACCENT, spaceBefore=4)
    s["bullet"] = ParagraphStyle("bullet", parent=s["summary"], leftIndent=10, bulletIndent=2,
                                 spaceBefore=1)
    s["entryname"] = ParagraphStyle("entryname", parent=s["name"], fontSize=11, leading=14)
    return s


def entry(n, g, s):
    label, color = CONTROL[g["control"]]
    meta = (f'<font color="{color}"><b>{label}</b></font>'
            f' · Konfidenz: {CONF_DE.get(g["confidence"], "–")}'
            f' · Modul: {escape(g["module"])}')
    parts = [Paragraph(f"{n}. {escape(g['name'])}", s["entryname"]), Paragraph(meta, s["meta"]),
             Paragraph("Was es misst", s["label"]), Paragraph(escape(g["explain"]), s["summary"]),
             Paragraph("Beispiel", s["label"]), Paragraph(escape(g["example"]), s["summary"]),
             Paragraph("Was du auf deiner Seite tun kannst", s["label"])]
    parts += [Paragraph(escape(a), s["bullet"], bulletText="•") for a in g["actions"]]
    t = Table([[parts]], colWidths=["100%"])
    t.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LINEBEFORE", (0, 0), (0, -1), 2.5, colors.HexColor(color)),
        ("BACKGROUND", (0, 0), (-1, -1), PANEL),
    ]))
    return KeepTogether([t, Spacer(1, 7)])


def build(out):
    register_fonts()
    s = extra_styles(styles())
    guide = load()
    counts = {k: sum(g["control"] == k for g in guide) for k in CONTROL}

    story = [Spacer(1, 65 * mm),
             Paragraph("Die 58 Kern-Signale von Google", s["title"]),
             Paragraph("Was sie messen, ein Beispiel für jedes Signal – und was du auf deiner "
                       "eigenen Website tun kannst", s["subtitle"]),
             Spacer(1, 12 * mm),
             Paragraph("Grundlage: Google Content Warehouse API Leak 2024", s["subtitle"]),
             PageBreak()]

    story.append(heading("So nutzt du dieses Dokument", s["h1"]))
    story += [Paragraph(p, s["body"]) for p in [
        "Von den 848 Ranking-Signalen im Google-Leak sind 58 als <b>Kern-Signale</b> eingestuft: "
        "Ihr Wert fließt direkt in die Bewertung oder Sortierung einer Seite ein. Für jedes Signal "
        "findest du hier drei Dinge: <b>was es misst</b>, ein <b>Beispiel</b> und konkrete "
        "<b>Maßnahmen</b> für deine eigene Website.",
        "Fast die Hälfte der Kern-Signale sind Abwertungen (Spam, Panda, Link-Spam). Bei ihnen "
        "geht es vor allem darum, Fehler zu vermeiden. Die übrigen belohnen Qualität, "
        "Autorität, gute Klicks und gute Bilder.",
    ]]
    story.append(Paragraph("Wie stark du ein Signal beeinflussen kannst", s["h2"]))
    rows = [[Paragraph(f'<font color="{CONTROL["direkt"][1]}"><b>direkt</b></font>', s["cell"]),
             Paragraph("Du kannst den Wert mit Änderungen an Inhalt, Technik oder Links unmittelbar "
                       f"verbessern ({counts['direkt']} Signale).", s["cell"])],
            [Paragraph(f'<font color="{CONTROL["indirekt"][1]}"><b>indirekt</b></font>', s["cell"]),
             Paragraph("Der Wert entsteht aus anderen Signalen oder Google-Systemen; du "
                       f"beeinflusst ihn über die Grundlagen ({counts['indirekt']} Signale).", s["cell"])],
            [Paragraph(f'<font color="{CONTROL["nicht"][1]}"><b>nicht</b></font>', s["cell"]),
             Paragraph("Interner Wert von Google (z. B. Notfall-Override, Modellversionen); "
                       f"nicht von außen steuerbar ({counts['nicht']} Signale).", s["cell"])]]
    t = Table(rows, colWidths=[24 * mm, None])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("BACKGROUND", (0, 0), (-1, -1), PANEL),
                           ("LINEBELOW", (0, 0), (-1, -2), 0.4, RULE),
                           ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
    story += [t, Spacer(1, 8)]
    story.append(Paragraph(
        "Wichtig: Der Leak zeigt, <i>welche</i> Werte Google speichert, nicht wie stark sie "
        "gewichtet werden. Die Beispiele sind erfundene Szenarien zur Veranschaulichung. Die "
        "Maßnahmen sind bewährte SEO-Praxis, die zum jeweiligen Signal passt – keine Garantie "
        "für bessere Rankings.", s["intro"]))

    story.append(Paragraph("Die wichtigsten Hebel auf einen Blick", s["h2"]))
    for p in [
        "<b>Aufräumen:</b> Dünne, doppelte und veraltete Seiten zusammenführen, verbessern oder "
        "entfernen (Panda, lowQuality, siteAuthority).",
        "<b>Aufwand zeigen:</b> Eigene Fotos, Daten, Tests und Erfahrungen statt umformulierter "
        "Fremdtexte (contentEffort, OriginalContentScore, Product Reviews).",
        "<b>Vertrauen aufbauen:</b> Echte Autoren, Quellen, Impressum, seriöser Auftritt "
        "(unauthoritativeScore, scamness).",
        "<b>Saubere Links:</b> Keine gekauften Links, natürliche Linktexte, Spam-Links entwerten "
        "(Penguin, Anchor-Spam, anchorMismatchDemotion).",
        "<b>Gute Nutzererfahrung:</b> Wenig Werbung, keine aufdringlichen Pop-ups, Antwort "
        "schnell liefern (clutterScore, Interstitials, NavBoost).",
        "<b>Nutzerinhalte moderieren:</b> Kommentare und Foren sauber halten (uacSpamScore, "
        "ugcDiscussionEffortScore).",
    ]:
        story.append(Paragraph(p, s["bullet"], bulletText="•"))
    story.append(PageBreak())

    story.append(Paragraph("Inhaltsverzeichnis", s["h1"]))
    toc = TableOfContents()
    toc.levelStyles = [s["toc0"]]
    story += [toc, PageBreak()]

    n = 0
    for i, (key, label, intro) in enumerate(CATEGORIES, 1):
        items = [g for g in guide if g["category"] == key]
        if not items:
            continue
        story.append(heading(f"{label} ({len(items)})", s["h1"]))
        story.append(Paragraph(escape(intro), s["intro"]))
        for g in items:
            n += 1
            story.append(entry(n, g, s))
        story.append(PageBreak())

    Doc(str(out), title="Die 58 Kern-Signale von Google",
        subject="Kern-Ranking-Signale mit Beispielen und Maßnahmen",
        footer="Die 58 Kern-Signale von Google – Erklärung, Beispiel, Maßnahmen").multiBuild(story)
    return n


if __name__ == "__main__":
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "docs" / "google-kern-signale-massnahmen.pdf"
    out.parent.mkdir(parents=True, exist_ok=True)
    n = build(out)
    print(f"{n} Kern-Signale -> {out}")
