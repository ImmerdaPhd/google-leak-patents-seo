# Decision: publish pages at scale, or not

**Use when** the user is considering programmatic, templated, or database-driven page generation.
Directories, location pages, comparison pages, "X vs Y" grids.

## Ask first

1. How many pages, and what varies between them beyond a few fields?
2. Would a person searching this specific query be served by this specific page?
3. What happens to the site if 80 percent of them get no traffic?

## Pull

```bash
python3 scripts/search_signals.py tofu --described
python3 scripts/search_signals.py chard --described
python3 scripts/search_signals.py --stage 3 --described --limit 40
```

## The rule

Site-level scoring is the constraint, not page-level scoring.

`QualityNsrNsrData.tofu` predicts site quality from content. `chardScoreEncoded` is
"site-level Chard (encoded as an int)" and `chardScoreVariance` is "Site-level Chard Variance for
all pages of a site." A site is characterised by the distribution of its page quality, including
the spread. Publishing 5,000 near-identical pages moves that distribution, and it does so whether
or not the pages rank.

So the test is not "will these pages rank." It is "will these pages change what the site looks like
in aggregate."

Scale is viable when each page carries something genuinely per-page: real inventory, real data, real
local specifics. It is not viable when the only variation is a swapped noun.

## Output

Go, go with a smaller and better-differentiated set, or do not go. If go, specify the per-page
minimum: what must exist on every page for it to earn its URL, and the rule for not publishing when
that data is missing.

## Do not

Recommend noindexing the weak ones as a fix without saying that the underlying problem is generating
them at all.
