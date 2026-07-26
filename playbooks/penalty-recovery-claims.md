# Decision: is this penalty recovery offer real

**Use when** someone is selling recovery services, a disavow audit, or a "we know what the update
did" diagnosis.

## Ask first

1. Is there a manual action in Search Console, yes or no?
2. What specifically does the seller claim is wrong?
3. What is the guarantee, and what happens if it does not work?

## Pull

```bash
python3 scripts/search_signals.py --stage 8 --described --limit 40
python3 scripts/search_signals.py demotion --described --limit 30
```

## The rule

Start with the distinction almost every seller blurs. A manual action is a human decision visible in
Search Console with a reconsideration process. Everything else is algorithmic scoring, where there
is no reconsideration and no removal event. Selling "penalty removal" for an algorithmic drop is
selling a thing that does not exist.

Check the claim against what is actually documented. The leak names specific demotions: anchor
mismatch, exact match domain, nav demotion, scam scoring, product review demotion, location
demotions. If the seller's diagnosis maps to a named mechanism, they may be onto something. If it
maps to a vendor metric or an invented factor, they are not.

Red flags: a guarantee of recovery, a diagnosis given before looking at the site, a disavow file as
the primary deliverable, and any specific numeric attribution of the drop to a factor.

## Output

Real, unclear, or nonsense, with the reasoning. If unclear, the specific evidence that would settle
it.

## Do not

Confirm an algorithmic penalty as a diagnosis. Algorithmic scoring is continuous. There is no state
to be removed from.
