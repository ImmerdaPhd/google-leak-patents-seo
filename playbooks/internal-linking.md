# Decision: how to structure internal links

**Use when** the user is planning site architecture, a hub-and-spoke content model, or trying to get
a specific page to rank better.

## Ask first

1. Which pages are the ones that must rank, and which exist to support them?
2. What does the homepage currently link to?
3. Are there pages more than three clicks from anything popular?

## Pull

```bash
python3 scripts/search_signals.py onsiteProminence --described
python3 scripts/search_signals.py --stage 4 --described --limit 30
python3 scripts/search_patents.py "reasonable surfer" --claims --limit 3
```

## The rule

`PerDocData.onsiteProminence` is the field that makes this concrete: "Onsite prominence measures the
importance of the document within its site. It is computed by propagating simulated traffic from the
homepage and high craps click pages."

Two sources of propagation, and the second one is the interesting one. Prominence flows from the
homepage, and from pages that already earn good clicks. So the highest-value internal links are on
your best-performing pages, not on a sitemap page nobody visits.

Patent US7716225B1 (the reasonable surfer) adds that links are not equal: the more likely a real
person is to click a link, the more it carries. A link in the main body, in context, near relevant
text, is worth more than the same link in a footer.

## Output

A named list of source pages (best performers plus homepage) and the specific target pages they
should link to, with the anchor text and where in the page the link sits.

## Do not

Recommend a fixed number of internal links per page. Placement and plausibility are the mechanism;
count is not.
