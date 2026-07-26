# Decision: how often to publish

**Use when** the user asks how many posts per week or month, or is being sold a volume-based content
package.

## Ask first

1. What can they sustain at their quality bar, honestly, for a year?
2. Is the topic one where new things actually happen?

## Pull

```bash
python3 scripts/search_signals.py --stage 3 --described --limit 30
python3 scripts/search_patents.py --mechanism freshness_temporal --claims --limit 5
```

## The rule

Site-level signals do track publishing activity over rolling periods, so cadence is not invisible.
But nothing supports a target number, and site-level quality prediction means volume at low quality
moves the wrong metric.

Frame it as capacity, not target: the highest rate at which this team can clear its quality bar,
and no higher. A drop in cadence is not a penalty. A drop in quality shows up in site-level scoring.

Where cadence genuinely matters is topics with real news flow, because freshness handling only
rewards recency where recency is relevant to the query.

## Output

A sustainable rate with a quality floor attached, and an explicit statement that the number is a
ceiling on capacity rather than a goal.

## Do not

Quote a posts-per-week number as a ranking requirement. There is no support for one.
