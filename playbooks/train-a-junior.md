# Decision: how to get someone up to speed fast

**Use when** onboarding a junior, briefing a freelancer, or teaching a client's in-house team.

## Ask first

1. What do they already believe about SEO, and where did they learn it?
2. What will they actually be doing day to day?

## Pull

```bash
python3 scripts/search_signals.py --stages
python3 scripts/search_patents.py --key
```

## The rule

Teach in this order. It is deliberately the reverse of how SEO is normally taught.

1. **The pipeline shape first.** Twelve stages, and a page passes through all of them. Read
   `references/00-architecture.md`. Most confusion in SEO comes from arguing about signals from
   different stages as if they compete.
2. **Then projection.** Read `references/signal-projection.md`. Stored values are shadows of
   upstream computations. Learn this before learning any field names, or the field names become a
   checklist.
3. **Then one subsystem in depth**, whichever matches their work. Not all twelve.
4. **Then the 27 key patents**, as the historical spine of why the system looks like this.
5. **Only then tactics**, which by this point they can mostly derive.

The unlearning matters as much as the learning. Ask what they believe, then check those beliefs
against the sources together. Watching a confident claim fail to find any supporting field is the
lesson that sticks.

## Output

A reading order with the specific files, one exercise per stage (find a field, find its patent,
state the behavior it projects), and a list of beliefs to check.

## Do not

Hand them a ranking factors list. That is the habit this whole skill exists to prevent.
