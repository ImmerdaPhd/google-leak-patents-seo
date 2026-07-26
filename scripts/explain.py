#!/usr/bin/env python3
"""
Explain one thing completely: a leak field, a module, or a patent.

This is the fastest path from "what is X" to a citable answer, because it
returns both evidence layers in one call: what Google stores, and the patents
that describe how the stored value is computed and used.

Usage
-----
  python3 scripts/explain.py siteAuthority
  python3 scripts/explain.py goodClicks
  python3 scripts/explain.py QualityNsrNsrData
  python3 scripts/explain.py US8661029B1
  python3 scripts/explain.py contentEffort --claims 12

Output
------
  For a field: the field, Google's description, its pipeline stage, its
  classified tier, sibling fields in the same module, and the patents connected
  to that module with their most relevant claims.

  For a patent: dates, concept, curated note if it is a key patent, every
  extracted claim, and the leak modules it connects to.

Reading the output
------------------
  A field with no Google description is existence-only evidence. The tool says
  so explicitly. Do not build a recommendation on one.
"""

import argparse
import gzip
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ATTRS = os.path.normpath(os.path.join(HERE, "..", "data", "leak_attributes.jsonl"))
PATENTS = os.path.normpath(os.path.join(HERE, "..", "data", "patents.jsonl.gz"))


def load_attrs():
    with open(ATTRS, encoding="utf-8") as fh:
        return [json.loads(l) for l in fh if l.strip()]


def load_patents():
    if os.path.exists(PATENTS):
        with gzip.open(PATENTS, "rt", encoding="utf-8") as fh:
            return [json.loads(l) for l in fh if l.strip()]
    plain = PATENTS[:-3]
    with open(plain, encoding="utf-8") as fh:
        return [json.loads(l) for l in fh if l.strip()]


def print_patent(p, max_claims=None, highlight=None):
    dates = []
    if p.get("filed"):
        dates.append(f"filed {p['filed']}")
    if p.get("granted"):
        dates.append(f"granted {p['granted']}")
    print(f"{p['n']}  {p['t']}")
    if dates:
        line = "  " + " · ".join(dates)
        if p.get("inventor"):
            line += f" · {p['inventor']}"
        print(line)
    if p.get("topic"):
        print(f"  topic: {p['topic']}")
    if p.get("concept"):
        print(f"  concept: {p['concept']}")
    if p.get("key"):
        k = p["key"]
        print(f"  [KEY PATENT: {k['theme']}]")
        print(f"  note: {k['note']}")
        print(f"  action: {k['action']}")
    if p.get("modules"):
        print(f"  connected leak modules: {', '.join(p['modules'][:10])}")
    claims = p.get("claims", [])
    if highlight:
        h = highlight.lower()
        ranked = sorted(claims, key=lambda c: (0 if h in c[1].lower() else 1))
    else:
        ranked = claims
    shown = ranked if max_claims is None else ranked[:max_claims]
    if shown:
        print(f"  claims ({len(shown)} of {len(claims)}):")
        for mech, ctx in shown:
            print(f"    - ({mech}) {ctx}")
    print()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("term", help="a field name, a module name, or a patent number")
    ap.add_argument("--claims", type=int, default=6, help="claims to show per patent")
    ap.add_argument("--patents", type=int, default=4, help="how many connected patents to show")
    args = ap.parse_args()

    term = args.term.strip()

    # Patent lookup
    if re.match(r"^US[0-9]", term, re.I):
        for p in load_patents():
            if p["n"].upper() == term.upper():
                print()
                print_patent(p, max_claims=None)
                return
        sys.exit(f"No patent {term} in the corpus.")

    attrs = load_attrs()
    tl = term.lower()

    exact = [a for a in attrs if a["name"].lower() == tl]
    modules = sorted({a["module"] for a in attrs if a["module"].lower() == tl})

    if not exact and not modules:
        near = [a for a in attrs if tl in a["name"].lower()][:10]
        if not near:
            sys.exit(f"Nothing matches '{term}'. Try scripts/search_signals.py {term} --loose")
        print(f"No exact field or module named '{term}'. Closest field names:\n")
        for a in near:
            print(f"  {a['module']}.{a['name']}")
        return

    print()
    target_modules = set(modules)

    for a in exact:
        print(f"FIELD  {a['module']}.{a['name']}")
        print(f"  type: {a['type']}")
        if a.get("tier"):
            extra = ", ".join(x for x in [a.get("category"), a.get("confidence")] if x)
            print(f"  tier: {a['tier']}" + (f" ({extra})" if extra else ""))
        if a.get("meaning"):
            print(f"  means: {a['meaning']}")
        if a.get("stages"):
            print(f"  pipeline stage(s): {'; '.join(a['stages'])}")
        if a.get("topics"):
            print(f"  topic(s): {'; '.join(a['topics'])}")
        if a["desc"]:
            print(f"  google's description: {a['desc']}")
        else:
            print("  google's description: NONE.")
            print("  EVIDENCE LIMIT: this field's existence is confirmed, its behavior is not.")
        print()
        target_modules.add(a["module"])

    for mod in sorted(target_modules):
        siblings = [a for a in attrs if a["module"] == mod]
        documented = [a for a in siblings if a["desc"]]
        print(f"MODULE  {mod}")
        print(f"  {len(siblings)} attributes, {len(documented)} documented by Google")
        core = [a for a in siblings if a.get("tier") == "core"]
        if core:
            print(f"  core signals here: {', '.join(a['name'] for a in core[:12])}")
        stages = next((a.get("stages") for a in siblings if a.get("stages")), None)
        if stages:
            print(f"  pipeline stage(s): {'; '.join(stages)}")
        print()

    pats = load_patents()
    tl_words = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", term).lower()

    def relevance(p):
        mods = p.get("modules", [])
        overlap = sum(1 for m in target_modules if m in mods)
        # A patent wired to a handful of modules is a more specific connection than
        # one wired to twenty. Reward specificity.
        specificity = 1.0 / (1 + len(mods))
        text = (p.get("concept", "") + " " + " ".join(c[1] for c in p.get("claims", []))).lower()
        mentions = sum(1 for w in tl_words.split() if len(w) > 3 and w in text)
        return (
            0 if "key" in p else 1,
            -mentions,
            -overlap,
            -specificity,
            -len(p.get("claims", [])),
        )

    connected = [p for p in pats if any(m in p.get("modules", []) for m in target_modules)]
    connected.sort(key=relevance)

    if not connected:
        print("No patents in the corpus are mapped to this module.")
        print("That is itself a finding: the leak stores it, but nothing here explains it.")
        return

    print(f"CONNECTED PATENTS  {len(connected)} total, showing {min(args.patents, len(connected))}")
    print()
    for p in connected[: args.patents]:
        print_patent(p, max_claims=args.claims, highlight=term)

    if len(connected) > args.patents:
        rest = ", ".join(p["n"] for p in connected[args.patents:args.patents + 12])
        print(f"Others: {rest}")


if __name__ == "__main__":
    main()
