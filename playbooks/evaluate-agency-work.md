# Decision: is this agency or contractor doing real work

**Use when** the user is reviewing a proposal, a monthly report, or deciding whether to renew.

## Ask first

1. What does the report actually claim was done, in deliverables rather than activities?
2. What metrics do they lead with?
3. What did they say no to?

## Pull

```bash
python3 scripts/search_signals.py --described --limit 5
python3 scripts/search_patents.py --key --limit 5
```

## The rule

Read the report through the projection lens. Every stored signal is downstream of real behavior, so
work that targets the stored number rather than the behavior is work that will stop paying.

Tells that the work is shadow-chasing:

- Deliverables measured in volume: number of posts, number of links, number of keywords tracked.
- Reports leading with metrics no one outside SEO tooling uses, such as vendor authority scores.
- Optimization of a proxy directly: dwell time services, CTR manipulation, anchor ratios.
- An impact percentage attached to any ranking factor. No weights leaked. Anyone quoting one is
  inventing it.
- No mention of anything they declined to do.

Tells that the work is real:

- Deliverables that changed the page or the site in ways a reader would notice.
- Reporting that includes what did not work.
- A stated hypothesis with a timeframe and a falsification condition.
- Willingness to say a request would not help.

## Output

A short assessment with specific lines from the report quoted, plus the three questions the user
should ask the agency next.

## Do not

Judge an agency by ranking movement over one month. Neither good nor bad work shows up that fast,
and the noise exceeds the signal.
