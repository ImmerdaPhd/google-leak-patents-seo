#!/usr/bin/env python3
"""
Search 5,456 analyzed Google search patents.

Each record carries the patent's core concept, the SEO-relevant claims extracted
from its full text, the mechanism categories it belongs to, and the Content
Warehouse leak modules it connects to.

Usage
-----
  python3 scripts/search_patents.py "dwell time"
  python3 scripts/search_patents.py navboost --claims
  python3 scripts/search_patents.py --mechanism click_engagement --limit 20
  python3 scripts/search_patents.py --module QualityNsrNsrData
  python3 scripts/search_patents.py --number US8661029B1 --full
  python3 scripts/search_patents.py --key
  python3 scripts/search_patents.py "site quality" --after 2015
  python3 scripts/search_patents.py --mechanisms          # list categories

Notes
-----
  Terms are ANDed. Quote multi-word phrases. Matching is case-insensitive and
  runs over title, core concept, and claim text unless you narrow it with
  --field. Add --claims to print the matching claim lines, which is usually
  what you want when writing or auditing.
"""

import argparse
import gzip
import json
import os
import re
import sys
from collections import Counter

DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "patents.jsonl.gz")


def load():
    path = os.path.normpath(DATA)
    if not os.path.exists(path):
        plain = path[:-3]
        if os.path.exists(plain):
            with open(plain, encoding="utf-8") as fh:
                for line in fh:
                    if line.strip():
                        yield json.loads(line)
            return
        sys.exit("Cannot find data/patents.jsonl.gz next to the scripts directory.")
    with gzip.open(path, "rt", encoding="utf-8") as fh:
        for line in fh:
            if line.strip():
                yield json.loads(line)


def haystack(rec, field):
    if field == "title":
        return rec["t"]
    if field == "concept":
        return rec["concept"]
    if field == "claims":
        return " ".join(c[1] for c in rec["claims"])
    return " ".join([rec["t"], rec["concept"], rec.get("action", "")] + [c[1] for c in rec["claims"]])


def year(datestr):
    m = re.match(r"(\d{4})", datestr or "")
    return int(m.group(1)) if m else None


def main():
    ap = argparse.ArgumentParser(add_help=True)
    ap.add_argument("terms", nargs="*", help="search terms, ANDed together")
    ap.add_argument("--mechanism", help="filter by mechanism category")
    ap.add_argument("--module", help="filter to patents connected to a leak module (substring ok)")
    ap.add_argument("--topic", help="filter by topic slug, e.g. link-analysis")
    ap.add_argument("--number", help="fetch one patent by number")
    ap.add_argument("--field", choices=["all", "title", "concept", "claims"], default="all")
    ap.add_argument("--after", type=int, help="filed on or after this year")
    ap.add_argument("--before", type=int, help="filed on or before this year")
    ap.add_argument("--key", action="store_true", help="only the 27 curated key patents")
    ap.add_argument("--claims", action="store_true", help="print matching claim lines")
    ap.add_argument("--full", action="store_true", help="print every claim, not just matches")
    ap.add_argument("--limit", type=int, default=10)
    ap.add_argument("--mechanisms", action="store_true", help="list mechanism categories and exit")
    args = ap.parse_args()

    if args.mechanisms:
        c = Counter()
        for rec in load():
            for m in rec["mech"]:
                c[m] += 1
        for m, n in c.most_common():
            print(f"{n:6d}  {m}")
        return

    needles = [t.lower() for t in args.terms]
    hits = []
    for rec in load():
        if args.number and rec["n"].upper() != args.number.upper():
            continue
        if args.key and "key" not in rec:
            continue
        if args.mechanism and args.mechanism not in rec["mech"]:
            continue
        if args.topic and args.topic.lower() not in (rec.get("topic") or "").lower():
            continue
        if args.module and not any(args.module.lower() in m.lower() for m in rec["modules"]):
            continue
        y = year(rec.get("filed"))
        if args.after and (y is None or y < args.after):
            continue
        if args.before and (y is None or y > args.before):
            continue
        if needles:
            hay = haystack(rec, args.field).lower()
            if not all(n in hay for n in needles):
                continue
        hits.append(rec)

    print(f"{len(hits)} patent(s) matched. Showing up to {args.limit}.\n")
    for rec in hits[: args.limit]:
        dates = " · ".join(x for x in [f"filed {rec['filed']}" if rec.get("filed") else "",
                                       f"granted {rec['granted']}" if rec.get("granted") else ""] if x)
        print(f"{rec['n']}  {rec['t']}")
        if dates:
            print(f"  {dates}" + (f" · {rec['inventor']}" if rec.get("inventor") else ""))
        if rec.get("topic"):
            print(f"  topic: {rec['topic']}")
        if rec["concept"]:
            print(f"  concept: {rec['concept']}")
        if rec.get("key"):
            k = rec["key"]
            print(f"  [KEY PATENT: {k['theme']}] {k['note']}")
            print(f"  SEO action: {k['action']}")
        if rec["modules"]:
            print(f"  leak modules: {', '.join(rec['modules'][:8])}")
        if rec["mech"]:
            print(f"  mechanisms: {', '.join(rec['mech'])}")
        if args.claims or args.full:
            selected = rec["claims"]
            if not args.full and needles:
                narrowed = [c for c in rec["claims"] if all(n in c[1].lower() for n in needles)]
                if narrowed:
                    selected = narrowed
                else:
                    selected = rec["claims"][:5]
                    if rec["claims"]:
                        print("    (no claim contains every term; showing the first few)")
            for mech, ctx in selected[:40]:
                print(f"    - ({mech}) {ctx}")
            if len(selected) > 40:
                print(f"    ... {len(selected) - 40} more claims")
        else:
            print(f"  {len(rec['claims'])} extracted claims (add --claims to show)")
        print()

    if len(hits) > args.limit:
        print(f"({len(hits) - args.limit} more, raise --limit to see them)")


if __name__ == "__main__":
    main()
