# Decision: update it, rewrite it, or delete it

**Use when** a page is old, traffic has decayed, and the user is deciding what to do with it.

## Ask first

1. Is this page still the best answer to its query, or has the world moved on?
2. Does it have links or traffic, even declining?
3. Is there a newer page on the same site covering the same ground?

## Pull

```bash
python3 scripts/search_signals.py --stage 7 --described --limit 30
python3 scripts/search_patents.py --mechanism freshness_temporal --claims --limit 5
```

## The rule

Google separates *any edit* from a *significant* one. `PerDocData.lastSignificantUpdate` is
"sourced from the quality_timebased.LastSignificantUpdate proto as computed by the LSUSelector from
various signals." A selector decides. Changing a date string is not an input to it.

That gives three outcomes, not two.

- **Update** when the page is still correct in structure but stale in fact. Change facts, figures,
  examples and the parts that were wrong. That is what an LSU selector can see.
- **Rewrite** when the page answers a question people stopped asking, but the URL has equity. Keep
  the URL, replace the body, and treat it as a new page for brief purposes.
- **Delete or consolidate** when the page is thin, duplicative, and unlinked. Site-level quality
  scoring means weak pages are not free. `QualityNsrNsrData.chardScoreVariance` is
  "Site-level Chard Variance for all pages of a site." Variance across pages is measured, so a tail
  of weak pages is visible at site level, not just page level.

## Output

For each page: keep / update / rewrite / delete, one line of reasoning, and for updates a list of
what specifically changes. Never "refresh the content" as an instruction.

## Do not

Bump the date without changing the substance. The date field and the significant-update field are
different fields, computed differently. Only one of them responds to a date change.
