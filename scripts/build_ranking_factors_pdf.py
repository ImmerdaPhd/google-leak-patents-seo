#!/usr/bin/env python3
"""
Build a German PDF listing all 848 ranking signals (tier core + supporting)
from the leak, each with a German summary and Google's own description.

Usage
-----
  python3 scripts/build_ranking_factors_pdf.py [output.pdf]

Requires reportlab plus the Liberation and DejaVu fonts (for umlauts).
Default output: docs/google-ranking-faktoren.pdf
"""

import json
import sys
from collections import defaultdict
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, KeepTogether, PageBreak, PageTemplate, Paragraph,
    Spacer, Table, TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents

ROOT = Path(__file__).resolve().parent.parent
FONT_DIR = Path("/usr/share/fonts/truetype")

CATEGORIES = [
    ("content_quality", "Inhaltsqualität & Website-Qualität",
     "Signale, mit denen Google die Qualität einzelner Seiten und ganzer Websites bewertet: "
     "vorhergesagte Inhaltsqualität (Chard, Tofu, Keto), der Website-Qualitätsscore NSR, "
     "siteAuthority, Panda-Abwertungen, Aufwand (Effort) und Originalität des Inhalts."),
    ("entity_author", "Entitäten, Autoren & Knowledge Graph",
     "Wie Google erkennt, um welche Personen, Orte, Dinge und Themen es auf einer Seite geht, "
     "wer Autor und Herausgeber ist und wie zentral eine Entität für die Seite ist."),
    ("spam_demotion", "Spam & Abwertungen",
     "SpamBrain-Scores, Keyword-Stuffing, Gibberish, Ankertext-Spam, gehackte Websites, "
     "Interstitials und weitere Mechanismen, die Seiten herabstufen oder zurückhalten."),
    ("links_authority", "Links & Autorität",
     "PageRank, Ankertexte, Qualität und Herkunft verlinkender Seiten, Penguin-Linkspam "
     "und alle Zähler rund um eingehende und ausgehende Links."),
    ("media_image_video", "Bilder & Videos",
     "Qualitäts-, Relevanz-, Klick- und SafeSearch-Signale für Bilder und Videos, inklusive "
     "OCR-Texten, Transkripten und Bild-Intents."),
    ("freshness", "Aktualität & Datum",
     "Veröffentlichungs-, Byline- und Änderungsdaten, Verlässlichkeit von Datumsangaben, "
     "Crawl-Zeitpunkte und Signale für zeitkritische Inhalte."),
    ("click_engagement", "Klicks & Nutzerverhalten (NavBoost)",
     "Impressionen, gute und lange Klicks, Chrome-Besuche und weitere Nutzersignale, "
     "die u. a. das NavBoost-System für das Ranking verwendet."),
    ("personalization_local", "Personalisierung & Lokales",
     "Länder-, Sprach- und Standortzuordnung von Seiten, lokale Relevanz, Metropolregionen "
     "und ortsbezogene Klickverteilungen."),
    ("site_structure", "Website-Struktur",
     "Signale zum Aufbau einer Website: Themenfokus (siteFocusScore, siteRadius), "
     "Wichtigkeit einer Seite innerhalb der Website, Breadcrumbs und Website-Typ."),
    ("crawl_index", "Crawling & Indexierung",
     "Index-Stufen, Crawl-Zeitstempel, Änderungshäufigkeit und Flags, die Indexierung "
     "oder Snippets steuern."),
    ("query_intent", "Suchintention",
     "Wie Dokumente und Anfragen Intents zugeordnet werden und wie gut Seiten zu einer "
     "Suchintention passen."),
    ("other", "Sonstige",
     "Ranking-relevante Signale, die keiner der übrigen Kategorien eindeutig zugeordnet "
     "werden konnten."),
]

TIER_DE = {"core": "Kern", "supporting": "Unterstützend"}
CONF_DE = {"high": "hoch", "medium": "mittel", "low": "niedrig"}

INK = colors.HexColor("#1f2933")
MUTED = colors.HexColor("#616e7c")
ACCENT = colors.HexColor("#1a5fb4")
CORE = colors.HexColor("#b42318")
RULE = colors.HexColor("#d9dee4")
PANEL = colors.HexColor("#f3f5f8")


def register_fonts():
    for name, file in [("Sans", "liberation/LiberationSans-Regular.ttf"),
                       ("Sans-Bold", "liberation/LiberationSans-Bold.ttf"),
                       ("Sans-Oblique", "liberation/LiberationSans-Italic.ttf"),
                       ("Mono", "dejavu/DejaVuSansMono.ttf"),
                       ("Mono-Bold", "dejavu/DejaVuSansMono-Bold.ttf")]:
        pdfmetrics.registerFont(TTFont(name, str(FONT_DIR / file)))
    pdfmetrics.registerFontFamily("Sans", normal="Sans", bold="Sans-Bold",
                                  italic="Sans-Oblique", boldItalic="Sans-Bold")


def styles():
    s = {}
    s["title"] = ParagraphStyle("title", fontName="Sans-Bold", fontSize=28, leading=34,
                                textColor=INK, alignment=TA_CENTER, spaceAfter=10)
    s["subtitle"] = ParagraphStyle("subtitle", fontName="Sans", fontSize=13, leading=18,
                                   textColor=MUTED, alignment=TA_CENTER)
    s["h1"] = ParagraphStyle("h1", fontName="Sans-Bold", fontSize=18, leading=23,
                             textColor=ACCENT, spaceBefore=4, spaceAfter=6)
    s["h2"] = ParagraphStyle("h2", fontName="Sans-Bold", fontSize=11.5, leading=15,
                             textColor=INK, spaceBefore=10, spaceAfter=4)
    s["body"] = ParagraphStyle("body", fontName="Sans", fontSize=9.5, leading=13.5,
                               textColor=INK, spaceAfter=6)
    s["intro"] = ParagraphStyle("intro", parent=s["body"], textColor=MUTED, spaceAfter=8)
    s["name"] = ParagraphStyle("name", fontName="Mono-Bold", fontSize=9.5, leading=12,
                               textColor=INK)
    s["meta"] = ParagraphStyle("meta", fontName="Sans", fontSize=7.5, leading=10,
                               textColor=MUTED)
    s["summary"] = ParagraphStyle("summary", fontName="Sans", fontSize=9, leading=12.5,
                                  textColor=INK, spaceBefore=1)
    s["google"] = ParagraphStyle("google", fontName="Sans-Oblique", fontSize=7.5, leading=10,
                                 textColor=MUTED, spaceBefore=1)
    s["cell"] = ParagraphStyle("cell", fontName="Sans", fontSize=8, leading=10.5, textColor=INK)
    s["cellmono"] = ParagraphStyle("cellmono", fontName="Mono", fontSize=7.5, leading=10,
                                   textColor=INK)
    s["toc0"] = ParagraphStyle("toc0", fontName="Sans", fontSize=10.5, leading=16,
                               leftIndent=0, textColor=INK)
    return s


class Doc(BaseDocTemplate):
    def __init__(self, path, title="Google Ranking-Faktoren",
                 subject="848 Ranking-Signale aus dem Google-Content-Warehouse-Leak 2024",
                 footer="Google Ranking-Faktoren – Content Warehouse Leak 2024", **kw):
        super().__init__(path, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm,
                         topMargin=18 * mm, bottomMargin=18 * mm,
                         title=title, author="google-leak-patents-seo", subject=subject, **kw)
        self.footer = footer
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="f")
        self.addPageTemplates([PageTemplate(id="p", frames=[frame], onPage=self.decorate)])

    def decorate(self, canvas, doc):
        if doc.page == 1:
            return
        canvas.saveState()
        canvas.setFont("Sans", 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(self.leftMargin, 10 * mm, self.footer)
        canvas.drawRightString(A4[0] - self.rightMargin, 10 * mm, f"Seite {doc.page}")
        canvas.restoreState()

    def afterFlowable(self, flowable):
        if getattr(flowable, "toc_level", None) is not None:
            key = f"h{id(flowable)}"
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(flowable.getPlainText(), key, level=flowable.toc_level)
            self.notify("TOCEntry", (flowable.toc_level, flowable.getPlainText(), self.page, key))


def heading(text, style, level=0):
    p = Paragraph(escape(text), style)
    p.toc_level = level
    return p


def load_signals():
    summaries = {}
    with open(ROOT / "data" / "signal_summaries_de.jsonl", encoding="utf-8") as f:
        for line in f:
            r = json.loads(line)
            summaries[(r["module"], r["name"])] = r["summary_de"]
    signals = []
    with open(ROOT / "data" / "leak_attributes.jsonl", encoding="utf-8") as f:
        for line in f:
            r = json.loads(line)
            if r.get("tier") in ("core", "supporting"):
                r["summary_de"] = summaries.get((r["module"], r["name"]), r.get("meaning", ""))
                signals.append(r)
    return signals


def google_desc(text, limit=360):
    text = " ".join(text.split())
    if len(text) > limit:
        text = text[:limit].rsplit(" ", 1)[0] + " …"
    return text


def entry(r, s):
    tier = r["tier"]
    tier_color = "#b42318" if tier == "core" else "#1a5fb4"
    meta = (f'<font color="{tier_color}"><b>{TIER_DE[tier]}</b></font>'
            f' · Konfidenz: {CONF_DE.get(r.get("confidence"), "–")}'
            f' · Modul: {escape(r["module"])}')
    parts = [Paragraph(escape(r["name"]), s["name"]), Paragraph(meta, s["meta"]),
             Paragraph(escape(r["summary_de"]), s["summary"])]
    if r.get("desc"):
        parts.append(Paragraph("Google: „" + escape(google_desc(r["desc"])) + "“", s["google"]))
    t = Table([[parts]], colWidths=["100%"])
    t.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LINEBEFORE", (0, 0), (0, -1), 2, colors.HexColor(tier_color)),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, RULE),
    ]))
    return KeepTogether([t, Spacer(1, 3)])


def build(out):
    register_fonts()
    s = styles()
    signals = load_signals()
    by_cat = defaultdict(list)
    for r in signals:
        by_cat[r["category"]].append(r)
    for rows in by_cat.values():
        rows.sort(key=lambda r: (r["tier"] != "core", r["module"].lower(), r["name"].lower()))

    n_core = sum(r["tier"] == "core" for r in signals)
    story = []

    # Title page
    story += [Spacer(1, 70 * mm), Paragraph("Google Ranking-Faktoren", s["title"]),
              Paragraph(f"Alle {len(signals)} Ranking-Signale aus dem Google Content Warehouse "
                        "API Leak 2024 – mit deutscher Zusammenfassung", s["subtitle"]),
              Spacer(1, 12 * mm),
              Paragraph(f"{n_core} Kern-Signale · {len(signals) - n_core} unterstützende Signale · "
                        f"{len(CATEGORIES)} Kategorien", s["subtitle"]),
              PageBreak()]

    # About
    story.append(heading("Über dieses Dokument", s["h1"]))
    story += [Paragraph(p, s["body"]) for p in [
        "Im Mai 2024 wurde die interne Dokumentation der <b>Google Content Warehouse API</b> "
        "öffentlich. Sie umfasst 2.593 Module mit 14.022 Attributen – also die Felder, die Google "
        "über Webseiten, Websites, Links, Bilder und Nutzerverhalten speichert.",
        "In diesem Repository wurde jedes Attribut mit einer Google-eigenen Beschreibung auf seine "
        "Ranking-Relevanz klassifiziert. Übrig bleiben <b>848 belastbare Ranking-Signale</b>. "
        "Dieses Dokument listet alle davon auf, gruppiert nach Kategorie. Zu jedem Signal gibt es "
        "eine deutsche Zusammenfassung, die erklärt, was es misst, sowie – sofern vorhanden – "
        "Googles originale interne Beschreibung (gekürzt).",
    ]]
    story.append(Paragraph("So liest du einen Eintrag", s["h2"]))
    legend = [
        [Paragraph("<b>Kern</b>", s["cell"]),
         Paragraph("Der Wert wird direkt zum Bewerten oder Sortieren eines Dokuments verwendet.", s["cell"])],
        [Paragraph("<b>Unterstützend</b>", s["cell"]),
         Paragraph("Ein Bestandteil, Eingabewert oder Aggregat, das in ein Kern-Signal einfließt.", s["cell"])],
        [Paragraph("<b>Konfidenz</b>", s["cell"]),
         Paragraph("Wie sicher die Einstufung als Ranking-Signal ist (hoch / mittel / niedrig).", s["cell"])],
        [Paragraph("<b>Modul</b>", s["cell"]),
         Paragraph("Das Modul (die Datenstruktur) im Leak, in dem das Attribut definiert ist.", s["cell"])],
    ]
    lt = Table(legend, colWidths=[32 * mm, None])
    lt.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"),
                            ("BACKGROUND", (0, 0), (-1, -1), PANEL),
                            ("LINEBELOW", (0, 0), (-1, -2), 0.4, RULE),
                            ("TOPPADDING", (0, 0), (-1, -1), 4),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
    story += [lt, Spacer(1, 6)]
    story.append(Paragraph(
        "Wichtig: Der Leak zeigt, <i>was</i> Google speichert, nicht wie stark ein Wert gewichtet "
        "wird. Die Zusammenfassungen beschreiben die Bedeutung eines Feldes, keine Rankinggewichte. "
        "Die Klassifizierung wurde von einem Sprachmodell vorgenommen; Methodik und Unsicherheiten "
        "stehen in <font name='Mono'>data/classification_report.md</font>.", s["intro"]))

    story.append(Paragraph("Signale pro Kategorie", s["h2"]))
    rows = [[Paragraph("<b>Kategorie</b>", s["cell"]), Paragraph("<b>Kern</b>", s["cell"]),
             Paragraph("<b>Unterst.</b>", s["cell"]), Paragraph("<b>Gesamt</b>", s["cell"])]]
    for key, label, _ in CATEGORIES:
        cat = by_cat[key]
        c = sum(r["tier"] == "core" for r in cat)
        rows.append([Paragraph(label, s["cell"]), str(c), str(len(cat) - c), str(len(cat))])
    rows.append([Paragraph("<b>Summe</b>", s["cell"]), str(n_core), str(len(signals) - n_core),
                 str(len(signals))])
    ct = Table(rows, colWidths=[None, 20 * mm, 20 * mm, 20 * mm])
    ct.setStyle(TableStyle([("FONTNAME", (0, 0), (-1, -1), "Sans"), ("FONTSIZE", (0, 0), (-1, -1), 8),
                            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                            ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                            ("LINEBELOW", (0, 0), (-1, 0), 0.8, INK),
                            ("LINEABOVE", (0, -1), (-1, -1), 0.8, INK),
                            ("LINEBELOW", (0, 1), (-1, -3), 0.3, RULE),
                            ("FONTNAME", (1, -1), (-1, -1), "Sans-Bold")]))
    story += [ct, PageBreak()]

    # Table of contents
    story.append(Paragraph("Inhaltsverzeichnis", s["h1"]))
    toc = TableOfContents()
    toc.levelStyles = [s["toc0"]]
    toc.dotsMinLevel = 0
    story += [toc, PageBreak()]

    # Core overview
    story.append(heading(f"Überblick: die {n_core} Kern-Signale", s["h1"]))
    story.append(Paragraph(
        "Diese Signale werden laut Klassifizierung direkt im Scoring oder bei der Sortierung "
        "verwendet. Ausführliche Einträge folgen in den Kategorie-Kapiteln.", s["intro"]))
    cat_label = {k: l for k, l, _ in CATEGORIES}
    rows = [[Paragraph("<b>Signal</b>", s["cell"]), Paragraph("<b>Kategorie</b>", s["cell"]),
             Paragraph("<b>Kurz erklärt</b>", s["cell"])]]
    core = sorted((r for r in signals if r["tier"] == "core"),
                  key=lambda r: ([k for k, *_ in CATEGORIES].index(r["category"]), r["name"].lower()))
    for r in core:
        rows.append([Paragraph(escape(r["name"]), s["cellmono"]),
                     Paragraph(cat_label[r["category"]], s["cell"]),
                     Paragraph(escape(r["summary_de"]), s["cell"])])
    ot = Table(rows, colWidths=[50 * mm, 38 * mm, None], repeatRows=1)
    ot.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"),
                            ("LINEBELOW", (0, 0), (-1, 0), 0.8, INK),
                            ("LINEBELOW", (0, 1), (-1, -1), 0.3, RULE),
                            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PANEL])]))
    story += [ot, PageBreak()]

    # Categories
    for i, (key, label, intro) in enumerate(CATEGORIES, 1):
        cat = by_cat[key]
        c = sum(r["tier"] == "core" for r in cat)
        story.append(heading(f"{i}. {label} ({len(cat)})", s["h1"]))
        story.append(Paragraph(f"{escape(intro)} – <b>{c}</b> Kern-Signale, "
                               f"<b>{len(cat) - c}</b> unterstützende Signale.", s["intro"]))
        for r in cat:
            story.append(entry(r, s))
        story.append(PageBreak())

    Doc(str(out)).multiBuild(story)
    return len(signals)


if __name__ == "__main__":
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "docs" / "google-ranking-faktoren.pdf"
    out.parent.mkdir(parents=True, exist_ok=True)
    n = build(out)
    print(f"{n} Signale -> {out}")
