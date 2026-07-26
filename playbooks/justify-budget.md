# Decision: how to justify the work to someone holding the money

**Use when** the user needs to defend a budget, a timeline, or a decision to a client, a boss, or a
board.

## Ask first

1. Who is the audience, and what do they actually care about?
2. What are they comparing this spend against?
3. What is the specific decision being asked for?

## Pull

Pull the primary source behind whatever is being defended.

```bash
python3 scripts/search_patents.py --key --limit 10
python3 scripts/search_signals.py --stage 5 --described --limit 20
```

## The rule

The argument that works with a sceptical audience is not "SEO best practice says." It is a
mechanism, a source, and a timeframe.

Structure it in four lines.

1. **The mechanism**, in plain language, with the source. "Google stores a per-document click
   history, sliced by country and device. Patent US8661029B1, filed 2006."
2. **What that implies for us**, specifically.
3. **What we will do about it**, as a deliverable.
4. **When we will know if it worked**, and what result would mean we were wrong.

The fourth line is the one that gets budget approved, because it converts an open-ended spend into a
test with a decision point.

Timeframes: click history and site-level quality are accumulated over time, not set at publish. Say
that plainly rather than promising speed, and set the review date accordingly.

## Output

A one-page argument in those four parts, in the audience's language, with the source cited but not
belaboured.

## Do not

Cite a ranking factor percentage to sound authoritative. If the audience checks, the number does not
exist, and the whole argument goes with it.
