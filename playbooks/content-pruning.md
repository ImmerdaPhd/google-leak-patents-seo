# Decision: what to cut from an existing site

**Use when** a site has accumulated hundreds of pages and the user suspects the weak ones are
holding it back.

## Ask first

1. How many pages, and how many got zero organic visits in the last 6 months?
2. Are the weak pages thin, duplicative, outdated, or simply unpromoted?
3. Does anything link to them?

## Pull

```bash
python3 scripts/search_signals.py tofu --described
python3 scripts/search_signals.py chard --described
python3 scripts/search_signals.py --stage 3 --described --limit 40
```

## The rule

Pruning is justified by site-level scoring, not by page-level scoring. `QualityNsrNsrData.tofu` is a
"site quality predictor based on content" at site level, and `chardScoreVariance` measures spread
across all pages of a site. Both mean the tail is part of how the site is characterised.

But "no traffic" is not the same as "low quality." Sort the tail into four buckets before touching
anything:

- **Thin or duplicative:** delete or merge.
- **Outdated but structurally sound:** update, see `playbooks/update-or-delete.md`.
- **Good but unpromoted:** the problem is links and internal linking, not the page.
- **Serving a real user need with no search volume:** keep, and stop measuring it by traffic.

## Output

A page-by-page disposition list with the bucket named for each, plus redirect targets for anything
deleted that has links.

## Do not

Mass noindex or mass delete on a traffic threshold alone. Traffic is an outcome measure and half the
tail is usually a promotion problem.
