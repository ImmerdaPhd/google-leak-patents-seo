# Decision: show dates on pages, or hide them

**Use when** the user is choosing whether to display publish and updated dates, or is following
advice to remove them.

## Ask first

1. Is the topic time-sensitive, or is it evergreen reference material?
2. Are they hiding dates to look fresh, or because dates genuinely mislead?

## Pull

```bash
python3 scripts/search_signals.py bylineDate --described
python3 scripts/search_signals.py --stage 7 --described --limit 30
```

## The rule

Dates are extracted from multiple places whether or not you display them nicely.
`QualityTimebasedSyntacticDate` parses dates syntactically. `NlpSaftDocument.bylineDate` is "the
date that will be shown in the snippets in web search results." `QualityDniDocPreviewRestrictions.bylineDateSecs`
is "publish date set by webmaster."

Two consequences.

- Hiding the date does not make the page undated. It makes the date less reliable, and control of
  what shows in the snippet passes from you to an extractor.
- The syntactic date "is never later than the crawl time," so post-dating does nothing.

Show dates when the reader benefits from knowing recency, which is most of the time. Hide them only
when the content is genuinely timeless and a date creates false staleness. If hiding, be consistent:
a page with no date anywhere is cleaner than a page with a date in the markup and not on screen.

## Output

Show or hide, applied per content type rather than site-wide, plus the markup that should carry the
date either way.

## Do not

Advise removing dates to appear fresh. The extraction happens regardless and you lose the snippet.
