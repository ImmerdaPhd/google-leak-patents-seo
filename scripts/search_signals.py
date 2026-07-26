#!/usr/bin/env python3
"""
Search all 14,022 attributes from the 2024 Google Content Warehouse API leak.

Every attribute carries its module path, its declared type, and Google's own
internal description where one exists. Attributes inside modules that map to a
stage of the ranking pipeline are tagged with that stage. Attributes that have
been classified for ranking relevance also carry a tier and a plain meaning.

Usage
-----
  python3 scripts/search_signals.py siteauthority
  python3 scripts/search_signals.py author --described
  python3 scripts/search_signals.py click --tier core
  python3 scripts/search_signals.py --module QualityNsrNsrData
  python3 scripts/search_signals.py --stage 5
  python3 scripts/search_signals.py --tier core --limit 60
  python3 scripts/search_signals.py demot --loose        # substring matching
  python3 scripts/search_signals.py --modules            # list modules by size
  python3 scripts/search_signals.py --stages             # list pipeline stages
  python3 scripts/search_signals.py --tiers              # tier counts

Matching
--------
  By default terms match whole words. Field names are split on camelCase first,
  so "author" matches authorObfuscatedGaiaStr but NOT siteAuthority. That
  distinction matters: substring matching quietly returns the wrong subsystem.
  Use --loose when you want substring behavior, for example searching a stem
  like "demot".

  Results are ranked: exact field-name matches first, then name-word matches,
  then description matches.

Evidence note
-------------
  Use --described to hide attributes the leak ships without a description. Those
  are real fields, but you cannot say what they do without guessing, so they are
  existence-only evidence. Do not build a recommendation on one.
"""

import argparse
import json
import os
import re
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.normpath(os.path.join(HERE, "..", "data", "leak_attributes.jsonl"))
MAP = os.path.normpath(os.path.join(HERE, "..", "data", "pipeline_map.json"))

TIER_ORDER = {"core": 0, "supporting": 1, "contextual": 2, "not_a_signal": 3}


def load():
    if not os.path.exists(DATA):
        sys.exit("Cannot find data/leak_attributes.jsonl next to the scripts directory.")
    with open(DATA, encoding="utf-8") as fh:
        for line in fh:
            if line.strip():
                yield json.loads(line)


def words(text):
    """Split camelCase, snake_case and dotted paths into lowercase words."""
    text = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", text)
    text = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1 \2", text)
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def score(rec, needles, loose):
    """Return a relevance score, or None if the record does not match."""
    name_w = words(rec["name"])
    mod_w = words(rec["module"])
    desc_w = words(rec["desc"])
    meaning_w = words(rec.get("meaning", ""))
    best = 0
    for n in needles:
        n_clean = words(n)
        if loose:
            blob = f"{rec['name']} {rec['module']} {rec['desc']} {rec.get('meaning','')}".lower()
            if n.lower() not in blob:
                return None
            hit = 2
        else:
            pat = r"\b" + re.escape(n_clean) + r"\b"
            if rec["name"].lower() == n.lower().replace(" ", ""):
                hit = 5
            elif re.search(pat, name_w):
                hit = 4
            elif re.search(pat, meaning_w):
                hit = 3
            elif re.search(pat, mod_w):
                hit = 2
            elif re.search(pat, desc_w):
                hit = 1
            else:
                return None
        best = max(best, hit)
    return best


def show(r):
    print(f"{r['module']}.{r['name']}")
    print(f"  type: {r['type']}")
    if r.get("tier"):
        conf = f", confidence {r['confidence']}" if r.get("confidence") else ""
        cat = f", {r['category']}" if r.get("category") else ""
        print(f"  tier: {r['tier']}{cat}{conf}")
    if r.get("meaning"):
        print(f"  means: {r['meaning']}")
    if r.get("stages"):
        print(f"  stage(s): {'; '.join(r['stages'])}")
    if r.get("topics"):
        print(f"  topic(s): {'; '.join(r['topics'])}")
    if r["desc"]:
        print(f"  google's description: {r['desc']}")
    else:
        print("  google's description: NONE. Existence-only evidence, do not assert what it does.")
    print()


def main():
    ap = argparse.ArgumentParser(add_help=True)
    ap.add_argument("terms", nargs="*", help="search terms, ANDed together")
    ap.add_argument("--module", help="filter by module name (substring)")
    ap.add_argument("--stage", help="filter by pipeline stage number or name fragment")
    ap.add_argument("--topic", help="filter by SEO topic fragment")
    ap.add_argument("--tier", help="core, supporting, contextual, not_a_signal, or signals "
                                   "(core plus supporting)")
    ap.add_argument("--category", help="filter by classified category, e.g. click_engagement")
    ap.add_argument("--described", action="store_true", help="only attributes Google documented")
    ap.add_argument("--loose", action="store_true", help="substring matching instead of whole word")
    ap.add_argument("--limit", type=int, default=25)
    ap.add_argument("--modules", action="store_true", help="list modules by attribute count")
    ap.add_argument("--stages", action="store_true", help="list pipeline stages and exit")
    ap.add_argument("--tiers", action="store_true", help="show tier counts and exit")
    args = ap.parse_args()

    if args.stages:
        m = json.load(open(MAP, encoding="utf-8"))
        for name, info in m["stages"].items():
            pats = info.get("patent_nums", [])
            print(f"{name}\n  {info.get('description','')}")
            print(f"  reference: references/{name.split('.')[0].zfill(2)}-*.md")
            print(f"  leak modules: {len(info.get('leak_modules', []))}")
            if pats:
                print(f"  patents: {', '.join(pats[:10])}")
            print()
        print("SEO topics (cross-reference view):")
        for name, info in m["topics"].items():
            print(f"  {name}: {len(info.get('leak_modules', []))} modules, "
                  f"key patents: {', '.join(info.get('key_patents', [])[:5])}")
        return

    rows = list(load())

    if args.tiers:
        c = Counter(r.get("tier") or "unclassified" for r in rows)
        for t in ["core", "supporting", "contextual", "not_a_signal", "unclassified"]:
            if c.get(t):
                print(f"{c[t]:6d}  {t}")
        cc = Counter(r.get("category") for r in rows if r.get("category"))
        if cc:
            print("\nby category:")
            for cat, n in cc.most_common():
                print(f"{n:6d}  {cat}")
        return

    if args.modules:
        c = Counter(r["module"] for r in rows)
        for mod, n in c.most_common(args.limit):
            print(f"{n:5d}  {mod}")
        return

    wanted_tiers = None
    if args.tier:
        wanted_tiers = {"core", "supporting"} if args.tier == "signals" else {args.tier}

    hits = []
    for r in rows:
        if args.described and not r["desc"]:
            continue
        if wanted_tiers and r.get("tier") not in wanted_tiers:
            continue
        if args.category and args.category.lower() not in (r.get("category") or "").lower():
            continue
        if args.module and args.module.lower() not in r["module"].lower():
            continue
        if args.stage and not any(args.stage.lower() in s.lower() for s in r.get("stages", [])):
            continue
        if args.topic and not any(args.topic.lower() in t.lower() for t in r.get("topics", [])):
            continue
        if args.terms:
            s = score(r, args.terms, args.loose)
            if s is None:
                continue
        else:
            s = 0
        hits.append((s, TIER_ORDER.get(r.get("tier"), 9), r))

    hits.sort(key=lambda x: (-x[0], x[1], x[2]["module"], x[2]["name"]))

    described = sum(1 for _, _, r in hits if r["desc"])
    tiered = Counter(r.get("tier") for _, _, r in hits if r.get("tier"))
    line = f"{len(hits)} attribute(s) matched, {described} documented by Google"
    if tiered:
        line += ". Tiers: " + ", ".join(f"{v} {k}" for k, v in tiered.most_common())
    print(line + f". Showing up to {args.limit}.\n")

    for _, _, r in hits[: args.limit]:
        show(r)

    if len(hits) > args.limit:
        print(f"({len(hits) - args.limit} more, raise --limit to see them)")
    if args.terms and not hits and not args.loose:
        print("No whole-word matches. Try --loose for substring matching.")


if __name__ == "__main__":
    main()
