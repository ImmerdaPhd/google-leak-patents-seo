#!/usr/bin/env python3
"""
Self test. Verifies the skill is intact and that every path and command it
promises actually resolves.

  python3 scripts/selftest.py

Checks:
  1. Every file path referenced in SKILL.md, README.md, the playbooks and the
     workflows exists.
  2. The bundled data files load and have the expected shape.
  3. Every shell command shown in the docs runs without error.
  4. Commands that should return results actually return results.

Exit code 0 means everything passed.
"""

import glob
import gzip
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))

fails = []
warns = []


def fail(msg):
    fails.append(msg)
    print(f"  FAIL  {msg}")


def warn(msg):
    warns.append(msg)
    print(f"  warn  {msg}")


def docs():
    out = ["SKILL.md", "README.md"]
    for pat in ("playbooks/*.md", "workflows/*.md", "references/*.md"):
        out += sorted(os.path.relpath(p, ROOT) for p in glob.glob(os.path.join(ROOT, pat)))
    return [d for d in out if os.path.exists(os.path.join(ROOT, d))]


print("1. Referenced paths")
PATH_RE = re.compile(r"`((?:references|workflows|scripts|data|playbooks)/[A-Za-z0-9_.\-]+)`")
seen = set()
for d in docs():
    text = open(os.path.join(ROOT, d), encoding="utf-8").read()
    for p in PATH_RE.findall(text):
        if p in seen:
            continue
        seen.add(p)
        if not os.path.exists(os.path.join(ROOT, p)):
            fail(f"{d} references missing path {p}")
print(f"  checked {len(seen)} distinct paths")

print("2. Data files")
attrs_path = os.path.join(ROOT, "data", "leak_attributes.jsonl")
try:
    attrs = [json.loads(l) for l in open(attrs_path, encoding="utf-8") if l.strip()]
    described = sum(1 for a in attrs if a["desc"])
    tiered = sum(1 for a in attrs if a.get("tier"))
    print(f"  attributes: {len(attrs)}, documented: {described}, classified: {tiered}")
    if len(attrs) < 14000:
        fail(f"expected ~14,022 attributes, found {len(attrs)}")
    if tiered and tiered < described:
        warn(f"{described - tiered} documented attributes have no tier")
except Exception as e:
    fail(f"cannot load leak_attributes.jsonl: {e}")

try:
    with gzip.open(os.path.join(ROOT, "data", "patents.jsonl.gz"), "rt", encoding="utf-8") as fh:
        pats = [json.loads(l) for l in fh if l.strip()]
    claims = sum(len(p["claims"]) for p in pats)
    dated = sum(1 for p in pats if p.get("filed"))
    print(f"  patents: {len(pats)}, claims: {claims}, with filing date: {dated}")
    if len(pats) < 5000:
        fail(f"expected ~5,456 patents, found {len(pats)}")
    if dated < len(pats):
        warn(f"{len(pats) - dated} patents have no filing date")
except Exception as e:
    fail(f"cannot load patents.jsonl.gz: {e}")

for f in ("data/pipeline_map.json", "data/key_patents.csv"):
    if not os.path.exists(os.path.join(ROOT, f)):
        fail(f"missing {f}")

print("3. Documented commands")
CMD_RE = re.compile(r"^python3 (scripts/[a-z_]+\.py.*)$", re.M)
cmds = []
for d in docs():
    text = open(os.path.join(ROOT, d), encoding="utf-8").read()
    for c in CMD_RE.findall(text):
        c = c.split("#")[0].strip()
        if "<" in c:  # placeholder like <field>
            continue
        cmds.append((d, c))

uniq = {}
for d, c in cmds:
    uniq.setdefault(c, d)
print(f"  running {len(uniq)} distinct commands")

empty_ok = ("--modules", "--stages", "--tiers", "--mechanisms")
for c, src in sorted(uniq.items()):
    r = subprocess.run(f"python3 {c}", shell=True, cwd=ROOT,
                       capture_output=True, text=True, timeout=180)
    if r.returncode != 0:
        fail(f"{src}: `python3 {c}` exited {r.returncode}: {r.stderr.strip().splitlines()[-1] if r.stderr.strip() else ''}")
        continue
    out = r.stdout.strip()
    if not out:
        fail(f"{src}: `python3 {c}` produced no output")
        continue
    if any(k in c for k in empty_ok):
        continue
    m = re.match(r"^(\d+) (?:patent|attribute)", out)
    if m and int(m.group(1)) == 0:
        warn(f"{src}: `python3 {c}` returned 0 results")

print()
if fails:
    print(f"FAILED: {len(fails)} problem(s), {len(warns)} warning(s)")
    sys.exit(1)
print(f"PASSED. {len(warns)} warning(s).")
