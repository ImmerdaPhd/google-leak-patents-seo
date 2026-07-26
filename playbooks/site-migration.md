# Decision: how to migrate without losing what you have

**Use when** changing domain, restructuring URLs, replatforming, or merging two sites.

## Ask first

1. What exactly changes: domain, URL structure, platform, or content?
2. Is there a page-for-page mapping, or will some pages have no destination?
3. What is the rollback plan?

## Pull

```bash
python3 scripts/search_signals.py --stage 1 --described --limit 30
python3 scripts/search_signals.py --stage 2 --described --limit 30
python3 scripts/search_signals.py hostAge --described
python3 scripts/search_signals.py urlAfterRedirectsFp --described
```

## The rule

Sort what you are moving into three categories, because they behave differently.

- **Travels with the redirect:** link signals and anchors, subject to the redirect being followed
  and the mapping being one to one.
- **Rebuilds over time:** click history is per document. A new URL starts without it, which is why
  migrations often dip before recovering.
- **Attaches to the host:** `PerDocData.hostAge` is "the earliest firstseen date of all pages in this
  host/domain. These data are used in twiddler to sandbox fresh spam in serving time." A brand new
  domain has a new host age. That is a real, named cost of a domain change that a URL restructure
  does not incur.

So: restructure URLs freely with good mapping. Change domain only for a real business reason,
knowing host age resets.

## Output

A mapping table, a list of pages with no destination and what happens to them, the redirect method,
and an explicit expected-dip statement so nobody panics in week three.

## Do not

Promise no traffic loss. Click history is per document and does not transfer instantly.
