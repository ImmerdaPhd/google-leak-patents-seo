# SEO Skill by Missing Intent

SEO analysis grounded in primary sources instead of folklore.

Two evidence layers, joined:

- **The 2024 Google Content Warehouse API leak.** 2,593 modules, 14,022 attributes, 9,475
  carrying Google's own internal description. Every documented attribute was classified for ranking
  relevance, giving **848 defensible ranking signals** rather than an inflated keyword-matched count.
- **5,456 Google search patents**, read in full, with 77,663 SEO-relevant claims extracted,
  dated, categorized by mechanism, and joined to the leak modules they explain.

The leak tells you what Google stores. The patents tell you how the stored value is computed and
used. Most leak analysis has only ever had the first half.

## What makes it usable

Data alone is a library nobody visits. This skill is built around a front door.

- **A router.** Ask it anything vague, it asks two questions and routes you to one specific
  answer path.
- **26 decision playbooks.** Not topics. Decisions with an actual answer: update or delete this
  post, subfolder or subdomain, index the forum or not, is this agency doing real work, is this
  site worth buying.
- **Three search tools** over the bundled data, so lookups take a second instead of an afternoon.
- **An evidence rule** the skill follows in every answer: cite the field, cite the patent, or say
  you do not know.

## Install

**Claude Code**

```bash
git clone https://github.com/thebigasif/google-leak-patents-seo.git \
  ~/.claude/skills/seo-skill-by-missing-intent
```

Or place the folder in `.claude/skills/` inside a project to scope it there.

**Claude desktop, Cowork, or claude.ai**

Download the `.skill` file from the [releases page](https://github.com/thebigasif/google-leak-patents-seo/releases)
and upload it through the skills interface in settings. Availability depends on your plan and
organization settings.

Any agent that reads a `SKILL.md` can use this. Point it at the folder.

## Use it

Plain language. The router handles the rest.

```
Help me with my site
Why did my rankings drop last month
Should I delete these 40 old posts
Is it risky to publish AI-drafted content in my niche
We are moving from a subdomain to a subfolder, what do we lose
Is this agency proposal any good
What does the leak actually store about site authority
Which patent describes how Google classifies a good click
```

## Score a URL against the 58 core signals

`analyzer/` estimates every core signal for a live URL: one file per signal in
`analyzer/factors/`, Playwright for rendering, optional Google Gemini for judgement calls, and a
weighted overall score. See [analyzer/README.md](analyzer/README.md) (German).

```bash
cd analyzer && npm install && npx playwright install chromium
GEMINI_API_KEY=... node analyze.js https://www.example.com --out report.md
```

## Query the data directly

Python 3, no dependencies.

```bash
# One shot: a field or a patent, explained with both evidence layers
python3 scripts/explain.py goodClicks
python3 scripts/explain.py US8661029B1
python3 scripts/explain.py QualityNsrNsrData

# The leak
python3 scripts/search_signals.py siteauthority
python3 scripts/search_signals.py --tier core --limit 60
python3 scripts/search_signals.py click --tier signals --described
python3 scripts/search_signals.py --stages
python3 scripts/search_signals.py --tiers

# The patents
python3 scripts/search_patents.py "dwell time" --claims
python3 scripts/search_patents.py --mechanism click_engagement --limit 20
python3 scripts/search_patents.py --key
python3 scripts/search_patents.py "site quality" --after 2015
```

Matching is whole-word by default, and field names are split on camelCase, so `author` matches
`authorObfuscatedGaiaStr` and not `siteAuthority`. Substring matching is available with `--loose`.

## What is in the box

```
SKILL.md                  Router, evidence rule, decision index
playbooks/                26 decisions, one file each
workflows/                4 long-form processes: audit, gap analysis, brief, research
examples/worked-example.md  The whole method end to end on one page
references/
  00-architecture.md      How the 12 stages connect
  01 to 12                One file per pipeline stage, both sources quoted throughout
  signal-projection.md    The reasoning method
  signal-catalog.md       Every core and supporting signal, readable without running anything
data/
  leak_attributes.jsonl   14,022 attributes with descriptions, stages, tiers, plain meanings
  patents.jsonl.gz        5,456 patents with dates, concepts, claims, connected modules
  key_patents.csv         27 curated patents with notes and actions
  pipeline_map.json       Stages and topics mapped to modules and patents
  classification_report.md  How the tiers were produced and how much they agree
scripts/
  explain.py              One field or patent, fully explained
  search_signals.py       The leak
  search_patents.py       The patents
```

## The rules it follows

1. Never assert a ranking behavior without citing a field, a patent, or both.
2. An undocumented attribute proves existence, not function. 4,547 of the 14,022 have no
   description, and the tools mark them.
3. No weights leaked. Any impact percentage anyone quotes is invented.
4. A patent proves Google described a method, not that the method ships. Check the filing date.
5. Say when you do not know. What you ruled out is part of the deliverable.

## Signal Projection

Every stored signal is a lossy, compressed projection of an upstream computation.

    stored signal = quantize( upstream quality model( real behavior ) )

`siteAuthority` is an integer in a serving bundle, not authority. `goodClicks` is a float, not
satisfaction. You cannot write to a projection, only to the behavior upstream of it.

This is why the skill bundles patents rather than a field list. The field gives you vocabulary.
The patent gives you the mechanism, and the mechanism tells you which real behavior to produce.
Optimize the object, not its shadow. See `references/signal-projection.md`.

## Honest limitations

- The leak is a 2024 snapshot of an internal API surface. Fields may be experimental, deprecated,
  or never shipped. Some say so in their own description.
- Google patents far more than it deploys. Filing dates are printed by every tool for a reason.
- The 77,663 claims are model-extracted paraphrases. Patent numbers, titles, inventors and dates
  are exact. Pull the original from Google Patents before publishing a direct quote.
- Attribute tiers are a model classification, not ground truth. An independent second pass over a
  stratified sample of 658 attributes agreed on the signal/not-signal question 91.8% of the time and
  on the exact tier 79.6% of the time. Method and disagreements are in `data/classification_report.md`.
- No crawler, no backlink index, no traffic data, no SERP data. This explains mechanisms. It does
  not measure your site.
- The local map pack runs on a different pipeline and is out of scope.

## License

All rights reserved. Free to use, including for client work. Not free to redistribute, republish,
resell, or train on. See [LICENSE](LICENSE).

Built by [Missing Intent](https://missingintent.com).
