# Decision: what a product or review page actually needs

**Use when** working on ecommerce category pages, product pages, or review and comparison content.

## Ask first

1. Is this a product page (you sell it) or a review page (you assess it)? They are scored
   differently.
2. Is the review based on having used the thing, or on reading other reviews?
3. How much of the page is manufacturer-supplied text?

## Pull

```bash
python3 scripts/search_signals.py productReview --described
python3 scripts/search_signals.py --stage 3 --described --limit 30
python3 scripts/search_patents.py --mechanism structured_data_markup --claims --limit 5
```

## The rule

There is a dedicated review classification layer with both directions of adjustment.
`CompressedQualitySignals.productReviewPReviewPage` and `productReviewPUhqPage` are described as
"for promoting/demoting HQ/LQ review pages," where `productReviewPUhqPage` is "the possibility of a
page being a high quality review page." There is also `productReviewPDemoteSite`, a site-level
review demotion confidence.

Three things follow.

- The system first decides *whether this is a review page at all*, then decides if it is a good one.
  A thin page that looks like a review invites the second judgment.
- The demotion exists at site level, so a catalogue of low-effort reviews is a site problem.
- Manufacturer copy is the same on every retailer. Originality is what separates you, and originality
  scoring specifically applies to pages with little content.

For product pages: original photography, real specifications, real availability, genuine review
content, and structured data that matches what is on the page.

For review pages: evidence of use. Photographs you took, measurements you made, comparisons you
actually ran, and what you would not recommend it for.

## Output

Page-type classification first, then the specific additions. For catalogues, a rule for which
products get full treatment and which stay minimal.

## Do not

Add review schema to a page that is not a review. Marking up something the page is not is the fast
route into the demotion side of that classifier.
