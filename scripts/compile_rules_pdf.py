#!/usr/bin/env python3
"""
Compile every ranking rule the bundled data supports into one PDF.

Uses the same loaders as the search tools (search_signals.py, search_patents.py)
so the PDF and the tools always agree on what is in the data.

  python3 scripts/compile_rules_pdf.py                 # writes output/google-ranking-rules.pdf
  python3 scripts/compile_rules_pdf.py --out rules.pdf

Contents
--------
  Part I    Core ranking signals from the leak          (tier: core)
  Part II   Supporting ranking signals from the leak    (tier: supporting)
  Part III  Contextual signals from the leak            (tier: contextual)
  Part IV   The 27 curated key patents, with actions
  Part V    The SEO rule derived from every one of the 5,456 patents, by cluster

Requires reportlab.
"""

import argparse
import csv
import os
import sys
from collections import Counter, defaultdict
from xml.sax.saxutils import escape

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
sys.path.insert(0, HERE)

import search_patents  # noqa: E402
import search_signals  # noqa: E402

try:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import (KeepTogether, PageBreak, Paragraph, SimpleDocTemplate,
                                    Spacer, Table, TableStyle)
    from reportlab.platypus.tableofcontents import TableOfContents
except ImportError:
    sys.exit("reportlab is required: pip install reportlab")

TIERS = ["core", "supporting", "contextual"]
CATEGORY_LABEL = {
    "content_quality": "Content quality",
    "entity_author": "Entities & authors",
    "spam_demotion": "Spam & demotions",
    "links_authority": "Links & authority",
    "media_image_video": "Images & video",
    "freshness": "Freshness",
    "click_engagement": "Clicks & engagement",
    "personalization_local": "Personalization & local",
    "site_structure": "Site structure",
    "crawl_index": "Crawling & indexing",
    "query_intent": "Query intent",
    "snippet_display": "Snippets & display",
    "other": "Other",
}
EVIDENCE_RULES = [
    "Never assert a ranking behavior without citing a field, a patent, or both.",
    "An undocumented attribute proves existence, not function. Entries below marked "
    "\"no Google description\" are existence-only evidence.",
    "No weights leaked. Any impact percentage anyone quotes is invented.",
    "A patent proves Google described a method, not that the method ships. Check the filing date.",
    "Say when you do not know. What you ruled out is part of the deliverable.",
]


def register_fonts():
    base = "/usr/share/fonts/truetype/dejavu/"
    try:
        pdfmetrics.registerFont(TTFont("Sans", base + "DejaVuSans.ttf"))
        pdfmetrics.registerFont(TTFont("Sans-Bold", base + "DejaVuSans-Bold.ttf"))
        pdfmetrics.registerFont(TTFont("Mono", base + "DejaVuSansMono.ttf"))
        pdfmetrics.registerFont(TTFont("Mono-Bold", base + "DejaVuSansMono-Bold.ttf"))
        from reportlab.pdfbase.pdfmetrics import registerFontFamily
        registerFontFamily("Sans", normal="Sans", bold="Sans-Bold")
        return "Sans", "Sans-Bold", "Mono-Bold"
    except Exception:
        return "Helvetica", "Helvetica-Bold", "Courier-Bold"


SANS, SANS_B, MONO_B = register_fonts()
INK = colors.HexColor("#1f2933")
MUTED = colors.HexColor("#616e7c")
ACCENT = colors.HexColor("#1d4ed8")

S = {
    "title": ParagraphStyle("title", fontName=SANS_B, fontSize=26, leading=32, alignment=TA_CENTER,
                            textColor=INK, spaceAfter=10),
    "subtitle": ParagraphStyle("subtitle", fontName=SANS, fontSize=12, leading=16,
                               alignment=TA_CENTER, textColor=MUTED, spaceAfter=6),
    "h1": ParagraphStyle("h1", fontName=SANS_B, fontSize=18, leading=22, textColor=INK,
                         spaceBefore=4, spaceAfter=8),
    "h2": ParagraphStyle("h2", fontName=SANS_B, fontSize=12.5, leading=16, textColor=ACCENT,
                         spaceBefore=10, spaceAfter=4),
    "body": ParagraphStyle("body", fontName=SANS, fontSize=9.5, leading=13, textColor=INK,
                           spaceAfter=4),
    "name": ParagraphStyle("name", fontName=MONO_B, fontSize=8.3, leading=10.5, textColor=INK,
                           spaceBefore=5),
    "entry": ParagraphStyle("entry", fontName=SANS, fontSize=8.3, leading=10.8, textColor=INK,
                            leftIndent=8),
    "meta": ParagraphStyle("meta", fontName=SANS, fontSize=7, leading=9, textColor=MUTED,
                           leftIndent=8),
    "toc1": ParagraphStyle("toc1", fontName=SANS_B, fontSize=10.5, leading=14),
    "toc2": ParagraphStyle("toc2", fontName=SANS, fontSize=9, leading=11.5, leftIndent=14),
}


def p(text, style="body"):
    return Paragraph(text, S[style])


class Doc(SimpleDocTemplate):
    """Feeds headings into the table of contents and the PDF outline."""

    def afterFlowable(self, f):
        if not isinstance(f, Paragraph) or f.style.name not in ("h1", "h2"):
            return
        level = 0 if f.style.name == "h1" else 1
        text = f.getPlainText()
        key = f"h{id(f)}"
        self.canv.bookmarkPage(key)
        self.canv.addOutlineEntry(text, key, level=level, closed=level > 0)
        self.notify("TOCEntry", (level, text, self.page, key))


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(SANS, 7)
    canvas.setFillColor(MUTED)
    canvas.drawString(18 * mm, 10 * mm, "Google ranking rules: compiled from the Content Warehouse "
                      "leak and 5,456 Google search patents")
    canvas.drawRightString(A4[0] - 18 * mm, 10 * mm, str(doc.page))
    canvas.restoreState()


def signal_entry(a):
    out = [p(escape(f"{a['module']}.{a['name']}"), "name")]
    if a.get("meaning"):
        out.append(p(f"<b>Rule:</b> {escape(a['meaning'])}", "entry"))
    if a.get("desc"):
        out.append(p(f"<b>Google's description:</b> {escape(a['desc'])}", "entry"))
    else:
        out.append(p("<i>No Google description. Existence-only evidence.</i>", "entry"))
    meta = [f"type {a['type']}"]
    if a.get("confidence"):
        meta.append(f"confidence {a['confidence']}")
    if a.get("stages"):
        meta.append("stages: " + "; ".join(a["stages"]))
    out.append(p(escape(" · ".join(meta)), "meta"))
    return KeepTogether(out)


def signals_part(story, part, tier, attrs, intro):
    rows = [a for a in attrs if a.get("tier") == tier]
    story += [PageBreak(), p(f"Part {part}. {tier.capitalize()} ranking signals ({len(rows):,})", "h1"),
              p(intro)]
    by_cat = defaultdict(list)
    for a in rows:
        by_cat[a.get("category") or "other"].append(a)
    order = sorted(by_cat, key=lambda c: (-len(by_cat[c]), c))
    for cat in order:
        items = sorted(by_cat[cat], key=lambda a: ({"high": 0, "medium": 1, "low": 2}
                                                   .get(a.get("confidence"), 3),
                                                   a["module"], a["name"]))
        story.append(p(f"{CATEGORY_LABEL.get(cat, cat)} ({len(items)})", "h2"))
        story += [signal_entry(a) for a in items]
    return len(rows)


def patent_dates(r):
    bits = []
    if r.get("filed"):
        bits.append(f"filed {r['filed']}")
    if r.get("granted"):
        bits.append(f"granted {r['granted']}")
    return ", ".join(bits)


def build(out_path):
    attrs = list(search_signals.load())
    patents = list(search_patents.load())
    with open(os.path.join(ROOT, "data", "key_patents.csv"), encoding="utf-8") as fh:
        key = list(csv.DictReader(fh))

    tiers = Counter(a.get("tier") or "unclassified" for a in attrs)
    with_rule = [r for r in patents if r.get("action")]
    n_claims = sum(len(r.get("claims", [])) for r in patents)

    story = [Spacer(1, 60 * mm),
             p("Google Ranking Rules", "title"),
             p("Every ranking signal and patent-derived rule in this repository, in one document",
               "subtitle"),
             Spacer(1, 10 * mm),
             p(f"{tiers['core'] + tiers['supporting']:,} defensible ranking signals "
               f"({tiers['core']} core, {tiers['supporting']:,} supporting) · "
               f"{tiers['contextual']:,} contextual signals · "
               f"{len(with_rule):,} patent rules · {len(key)} key patents", "subtitle"),
             p(f"Sources: 2024 Google Content Warehouse API leak ({len(attrs):,} attributes), "
               f"{len(patents):,} Google search patents ({n_claims:,} extracted claims)", "subtitle"),
             PageBreak(),
             p("How to read this document", "h1"),
             p("<b>Signals (Parts I to III)</b> come from the leak. Each entry gives the stored field "
               "as <font name='Mono-Bold'>Module.field</font>, the rule in plain language (the "
               "classified meaning), Google's own internal description where one exists, and the "
               "pipeline stages the module feeds. Within each category, high-confidence "
               "classifications are listed first."),
             p("<b>Patent rules (Parts IV and V)</b> are the SEO action derived from each patent. "
               "A patent proves Google described a method, not that it ships, so every rule carries "
               "its filing and grant dates. Full claims for any patent are available with "
               "<font name='Mono-Bold'>python3 scripts/explain.py &lt;patent number&gt;</font>."),
             p("Tier counts across all leak attributes", "h2")]
    tbl = Table([["Tier", "Attributes"]] +
                [[t, f"{tiers[t]:,}"] for t in ("core", "supporting", "contextual", "not_a_signal",
                                                 "unclassified")],
                colWidths=[60 * mm, 30 * mm])
    tbl.setStyle(TableStyle([("FONT", (0, 0), (-1, -1), SANS, 9),
                             ("FONT", (0, 0), (-1, 0), SANS_B, 9),
                             ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                             ("LINEBELOW", (0, 0), (-1, 0), 0.6, INK),
                             ("TEXTCOLOR", (0, 0), (-1, -1), INK)]))
    story += [tbl, p("Not-a-signal and unclassified attributes are infrastructure or undocumented "
                     "fields and are not rules; search them with scripts/search_signals.py."),
              p("The evidence rules", "h2")]
    story += [p(f"{i}. {escape(r)}") for i, r in enumerate(EVIDENCE_RULES, 1)]
    story += [p("Limitations", "h2"),
              p("The leak is a 2024 snapshot of an internal API surface; fields may be experimental "
                "or deprecated. Tiers and plain meanings are a model classification (91.8% agreement "
                "with an independent second pass on signal versus not-signal, 79.6% on exact tier; "
                "see data/classification_report.md). Patent rules are model-written paraphrases; "
                "pull the original from Google Patents before quoting.")]

    toc = TableOfContents()
    toc.levelStyles = [S["toc1"], S["toc2"]]
    story += [PageBreak(), p("Contents", "h1"), toc]

    signals_part(story, "I", "core", attrs,
                 "The fields the classification judged most directly tied to ranking. Start here.")
    signals_part(story, "II", "supporting", attrs,
                 "Fields that contribute to ranking alongside the core signals. Together with Part I "
                 "these are the defensible ranking signals.")
    signals_part(story, "III", "contextual", attrs,
                 "Fields that shape ranking only in specific contexts: verticals, result types, "
                 "devices, locales, or special features.")

    story += [PageBreak(), p(f"Part IV. Key patents ({len(key)})", "h1"),
              p("The curated patents that explain the mechanisms most SEO decisions rest on.")]
    by_theme = defaultdict(list)
    for k in key:
        by_theme[k["theme"]].append(k)
    for theme, items in by_theme.items():
        story.append(p(escape(theme), "h2"))
        for k in items:
            story.append(KeepTogether([
                p(escape(f"{k['patent_number']}  {k['title']}"), "name"),
                p(f"<b>What it shows:</b> {escape(k['note'])}", "entry"),
                p(f"<b>Rule:</b> {escape(k['action'])}", "entry"),
                p(escape(k["years"]), "meta")]))

    story += [PageBreak(), p(f"Part V. Rules from all {len(with_rule):,} patents", "h1"),
              p("One rule per patent, grouped by cluster and ordered by filing date. Clusters are "
                "listed largest first.")]
    by_cluster = defaultdict(list)
    for r in with_rule:
        by_cluster[r.get("cluster") or "Unclustered"].append(r)
    for cluster in sorted(by_cluster, key=lambda c: (-len(by_cluster[c]), c)):
        items = sorted(by_cluster[cluster], key=lambda r: (r.get("filed") or "9999", r["n"]))
        story.append(p(f"{escape(cluster)} ({len(items)})", "h2"))
        for r in items:
            block = [p(escape(f"{r['n']}  {r['t']}"), "name"),
                     p(f"<b>Rule:</b> {escape(r['action'])}", "entry")]
            meta = patent_dates(r)
            if r.get("modules"):
                meta += (" · " if meta else "") + "leak modules: " + ", ".join(r["modules"][:8])
            if meta:
                block.append(p(escape(meta), "meta"))
            story.append(KeepTogether(block))

    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    doc = Doc(out_path, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm,
              topMargin=16 * mm, bottomMargin=16 * mm, title="Google Ranking Rules",
              author="Compiled from google-leak-patents-seo",
              subject="Ranking signals from the Content Warehouse leak and Google search patents")
    doc.multiBuild(story, onFirstPage=footer, onLaterPages=footer)
    return {"core": tiers["core"], "supporting": tiers["supporting"],
            "contextual": tiers["contextual"], "key_patents": len(key),
            "patent_rules": len(with_rule), "pages": doc.page}


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    ap.add_argument("--out", default=os.path.join(ROOT, "output", "google-ranking-rules.pdf"))
    args = ap.parse_args()
    stats = build(args.out)
    print(f"wrote {args.out}")
    for k, v in stats.items():
        print(f"  {k}: {v:,}")


if __name__ == "__main__":
    main()
