# Decision: what anchor text to use, internally and externally

**Use when** setting an internal linking policy, briefing outreach, or auditing an existing link
profile.

## Ask first

1. What anchors currently point at the money pages, internal and external?
2. Is anyone buying or requesting anchors at scale?

## Pull

```bash
python3 scripts/search_signals.py anchor --described --limit 30
python3 scripts/search_signals.py anchorMismatchDemotion --described
python3 scripts/search_patents.py --mechanism link_anchor_evaluation --claims --limit 6
```

## The rule

Two mechanisms matter and they point in opposite directions.

`CompressedQualitySignals.anchorMismatchDemotion` is "converted from QualityBoost.mismatched.boost."
There is a named demotion for anchors that do not match the target. So anchors that promise
something the page does not deliver are a liability, not just wasted.

`AnchorsAnchor.locality` says "for ranking purposes, the quality of an anchor is measured by its
locality and bucket." Anchor quality is assessed, not just counted.

The policy that follows: anchors should describe the target page accurately, vary naturally because
real people writing links do not repeat a phrase, and never be centrally dictated to external
sites. Exact-match anchor campaigns optimize a count while exposing you to a mismatch demotion.

## Output

An internal anchor convention (descriptive, varied, matching the target's actual subject) and an
outreach rule (suggest context, never dictate anchor).

## Do not

Give an anchor text ratio. No ratio is supported anywhere in either source.
