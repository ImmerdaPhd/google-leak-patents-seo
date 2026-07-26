# Decision: what to do when rankings drop

**Use when** traffic or rankings fell and nobody knows why. This is the most common request and the
one most often answered with a guess.

## Ask first

1. What date did it start, precisely?
2. Site-wide, one section, or one page?
3. What shipped in the two weeks before, including things that seem unrelated?
4. Did impressions fall, or did clicks fall while impressions held?

## Pull

```bash
python3 scripts/search_signals.py --stage 8 --described --limit 40
python3 scripts/search_signals.py demotion --described --limit 30
python3 scripts/search_signals.py --stage 11 --described --limit 30
```

## The rule

Work by elimination, in this order, because it goes cheapest and most likely first.

1. **Did you break something?** See `playbooks/redesign-recovery.md`. Most unexplained drops are
   self-inflicted extraction failures.
2. **Did impressions hold while clicks fell?** Then ranking is intact and the SERP changed around
   you. Different problem entirely.
3. **Is it confined to a template or section?** Then it is that template, not the site.
4. **Walk the named demotions.** Go through them one at a time and say which plausibly apply:
   anchor mismatch, exact match domain, scam scoring, nav demotion, product review demotion, UGC
   spam, location demotion. Name the ones you cleared, not just the ones you found.
5. **Only then consider an algorithm update**, and treat it as the residual explanation rather than
   the first one.

## Output

The finding, or an explicit "not determined" with the list of what was ruled out and what data would
be needed next. A clean elimination list is a real deliverable.

## Do not

Lead with "it was a core update." That explanation is unfalsifiable, produces no action, and is
usually wrong.
