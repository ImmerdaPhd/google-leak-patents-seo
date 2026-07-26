# Decision: how to handle multiple countries and languages

**Use when** expanding into new markets, or when an existing multi-region site underperforms in some
regions.

## Ask first

1. Different languages, different countries with the same language, or both?
2. Is the content genuinely adapted per market, or machine translated?
3. Is there a local presence in each market, or is it one team publishing everywhere?

## Pull

```bash
python3 scripts/search_signals.py --stage 5 --described --limit 30
python3 scripts/search_signals.py --stage 12 --described --limit 30
python3 scripts/search_patents.py --mechanism personalization --claims --limit 5
```

## The rule

The important and under-appreciated point is that engagement data is sliced by locale, not pooled.
The NavBoost data structure carries a country slice ("the two-letter uppercase country slice") and a
language slice ("examples: en, fr, pt-BR"), and patent US8694511B1 describes aggregating click data
per population, with narrower populations weighted above broader ones.

Consequences that change strategy:

- Performing well globally does not carry into a new market. That market's engagement is measured
  separately and starts empty.
- Same-language different-country splits are real. UK and US are separate slices.
- Machine translated content that nobody engages with in the target market accumulates the wrong
  data in that market's slice.

So market entry is a per-market build, not a translation project.

## Output

Per-market plan with the expectation set that each market builds its own engagement history, plus
the technical setup (hreflang, distinct URLs) as a prerequisite rather than the strategy.

## Do not

Present hreflang as the international SEO answer. It resolves which version to show. It does not
transfer performance between locales.
