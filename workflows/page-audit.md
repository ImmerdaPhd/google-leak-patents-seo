# Workflow: Audit a page or site

The goal is not a score. The goal is a short list of upstream behaviors the page
fails to produce, each tied to a stored signal and a patent that says why it matters.

## Before you start

Get these from the user. Do not guess at them.

- The URL. If a web fetching tool is available, fetch it yourself rather than asking the user to
  paste. If it is not, ask for the rendered text plus the head markup, since a copy-paste of the
  visible page loses the dates and structured data that half this audit depends on.
- The target query, or the job the page is meant to do.
- Whether the problem is *not indexed*, *indexed but not ranking*, or *ranking and
  slipping*. These are three different audits and they load different stages.

If the user has Search Console data, ask for impressions, clicks, and average
position. Impressions with no clicks is a stage 5 and stage 10 problem. Clicks with
no retention is a stage 3 and stage 5 problem. No impressions at all is stage 1
through 4.

## Route by symptom

| Symptom | Load these stages first |
|---|---|
| Not indexed, or slow to update | 1 crawling, 2 document processing, 7 freshness |
| Indexed, no impressions | 2 document processing, 9 query intent, 6 entities |
| Impressions, no clicks | 10 snippets, 5 NavBoost |
| Clicks, high bounce back to SERP | 5 NavBoost, 3 content quality |
| Ranked, then dropped | 8 spam and trust, 11 twiddlers, 7 freshness |
| Whole site underperforming | 3 content quality, 4 links, 8 spam and trust |
| Local or map results | 12 personalization and local, 6 entities |

Load one or two stage files. Not all twelve.

## The audit itself

Work in this order. Each step produces findings, not scores.

### 1. Establish what Google can even store about this page

Read the page. For each of the stage's key signals, ask whether the page gives Google
anything to put in that field.

```bash
python3 scripts/search_signals.py --stage 3 --described --limit 40
```

A page with no byline gives `authorObfuscatedGaiaStr` nothing to hold. A page with no
dates gives `QualityTimebasedSyntacticDate` nothing to parse. These are not
optimization opportunities, they are empty slots. Empty slots are the cheapest fixes
you will find, and they are usually invisible in normal SEO tooling.

### 2. Trace each weak signal back to its mechanism

For every signal that looks weak, find the patent that says how it is computed.

```bash
python3 scripts/search_patents.py "content quality" --claims --limit 5
python3 scripts/search_patents.py --module QualityNsrPQData --claims
```

Now you know what behavior the model is actually reading for. Write that down, not
the field name.

### 3. Apply Signal Projection to every finding

Restate each finding in three columns before you recommend anything.

| Stored signal | Upstream computation | Behavior to produce |
|---|---|---|
| `goodClicks` low relative to `clicks` | US8661029B1: relevance is the ratio of long views to total views | Answer the query above the fold so nobody bounces back |

If you cannot fill the third column, you do not have a recommendation yet. You have a
metric. Do not ship it.

### 4. Check the demotion side

Most audits only look for boosts. Demotions are cheaper to fix and more damaging to
carry.

```bash
python3 scripts/search_signals.py demotion --described
python3 scripts/search_signals.py --stage 8 --described --limit 30
```

Walk the named demotions in stage 8 and stage 11 and ask, for each, whether this page
could plausibly be caught by it. Anchor mismatch, scam patterns, low quality UGC,
product review thinness, exact match domain, location demotions. Name the ones that
apply and the ones you checked and cleared.

### 5. Write the output

Structure the deliverable like this.

1. **The one thing.** The single highest-leverage change, with its mechanism.
2. **Empty slots.** Signals the page currently gives Google nothing to store. Usually
   quick wins.
3. **Weak signals.** Fields that have a value but the upstream behavior is thin.
   Each with the three-column trace.
4. **Demotion risk.** What could be actively suppressing it, and how confident you
   are.
5. **What you could not determine.** Be specific. "Link quality needs a backlink tool,
   which this skill does not include" is a better line than silence.

## Rules for the write-up

- Cite `Module.attributeName` for every leak claim and the patent number for every
  mechanism claim.
- Never give a numeric impact estimate. No weights leaked. Anyone who says a signal
  is worth twelve percent is making it up.
- Mark undescribed attributes as existence-only evidence.
- Rank recommendations by leverage, not by how easy they are to write.
- If the honest finding is "this page is fine and the problem is the competition,"
  say that.

---

**Faster paths.** If the request is really one decision, use the playbook instead of the full audit: `playbooks/ranking-drop-triage.md` for a drop, `playbooks/redesign-recovery.md` if something shipped recently, `playbooks/content-pruning.md` if the question is what to cut.

**One-shot lookups.** `python3 scripts/explain.py <field>` returns the field, its stage, its tier and the connected patents in a single call. Use it instead of two separate searches.
