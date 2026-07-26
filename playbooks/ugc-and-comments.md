# Decision: allow, moderate, or block user generated content

**Use when** the site has comments, forums, reviews, profiles, or any user-submitted content, or is
considering adding them.

## Ask first

1. Is the UGC the product, or an add-on to editorial content?
2. Is anyone moderating, and how fast?
3. Is it indexable today?

## Pull

```bash
python3 scripts/search_signals.py ugc --described
python3 scripts/search_signals.py --stage 8 --described --limit 30
```

## The rule

UGC is scored separately and specifically. `CompressedQualitySignals.ugcDiscussionEffortScore` holds
"UGC page quality signals," so discussion quality is measured rather than ignored.
`PerDocData.spamtokensContentScore` is "used in SiteBoostTwiddler to determine whether a page is UGC
Spam." There is a named UGC spam determination, and it feeds a twiddler.

That gives a clean decision rule. Good UGC is an asset with its own quality measurement. Unmoderated
UGC is a specific, named liability, not a vague risk.

- **Thriving and moderated:** index it. Discussion effort is a scored quality.
- **Sparse or spammy:** do not index it until moderation exists. Fix moderation or remove the
  feature.
- **Abandoned:** remove it. An unmaintained forum on an otherwise good site is a large volume of low
  quality pages attached to your host.

## Output

Index or noindex, the moderation standard required to change that answer, and a cleanup plan for
existing UGC pages.

## Do not

Leave an unmoderated comment section indexed because "engagement is a ranking factor." There is a
named UGC spam determination and no support for that claim.
