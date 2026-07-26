# Attribute classification report

How the tier on each leak attribute was produced, and how much you should trust it.

## Method

Every one of the 9,475 attributes that carries a description from Google was
classified by a language model into one of four tiers. Attributes with no description were not
classified, because there is nothing to judge.

The classifier was instructed to work only from the module name, field name, type, and Google's own
description text, and to pick the lower tier whenever torn. Outside SEO knowledge was explicitly
disallowed as grounds for promoting a field, because that is how folklore gets laundered into a
dataset.

Work was split across 48 independent batches of 200 attributes each.

## Tiers

| Tier | Meaning |
|---|---|
| `core` | The value is used directly in scoring or ordering a web document |
| `supporting` | A component, input, or aggregate that feeds a core ranking signal |
| `contextual` | Search related but not used to rank a document: serving, display, logging, experiment flags |
| `not_a_signal` | Infrastructure, versioning, plumbing, or a subsystem that is not web search ranking |

## Result

| Tier | Count |
|---|---|
| `core` | 58 |
| `supporting` | 790 |
| `contextual` | 1,047 |
| `not_a_signal` | 7,580 |
| **core + supporting** | **848** |
| not classified (no description) | 4,547 |
| total attributes | 14,022 |

**848 attributes are the defensible ranking signal set.** That is the number to
use. It is smaller than counts circulating elsewhere, and that is the point: the larger numbers come
from keyword matching over field names, which sweeps in version trackers, media metadata, and
internal plumbing.

Retrieve this set with `python3 scripts/search_signals.py --tier signals`.

### By category

| Category | Count |
|---|---|
| infrastructure_non_signal | 5,452 |
| media_image_video | 1,050 |
| other | 552 |
| personalization_local | 499 |
| entity_author | 395 |
| snippet_display | 361 |
| crawl_index | 290 |
| query_intent | 197 |
| content_quality | 185 |
| spam_demotion | 141 |
| links_authority | 112 |
| freshness | 102 |
| click_engagement | 100 |
| site_structure | 39 |

### Classifier confidence

| Confidence | Count |
|---|---|
| high | 6,114 |
| medium | 2,306 |
| low | 1,055 |

## How much to trust it

A stratified random sample of 658 attributes was re-classified from scratch by
independent agents that could not see the first verdicts.

| Measure | Agreement |
|---|---|
| Exact tier match, all four tiers | 79.6% |
| Signal versus not a signal (core+supporting vs the rest) | 91.8% |

The binary number is the one that matters, because it is the question the tiers exist to answer.
Exact four-way agreement is lower and should be lower: the boundary between core and supporting is a
judgment call, and reasonable readers will disagree on individual fields.

**Read the sampling honestly.** The sample was stratified, not random: every `core` attribute plus
200 each from the other three tiers. That deliberately over-weights the hard, contested cases and
under-weights `not_a_signal`, which is the large easy majority. A uniform random sample would score
higher and mean less. Treat 91.8% as agreement on the difficult end of the distribution, which is
the number worth knowing.

### Where the two passes disagreed

| First pass | Second pass | Count |
|---|---|---|
| contextual | not_a_signal | 53 |
| contextual | supporting | 19 |
| supporting | not_a_signal | 18 |
| supporting | contextual | 13 |
| supporting | core | 11 |
| core | supporting | 9 |

## Honest limits

- This is a model's judgment, not ground truth. Google did not label these fields.
- A `core` tier means the description reads as a directly used ranking value. It does not mean the
  field is heavily weighted, currently deployed, or that you can influence it directly.
- Fields with no description were not classified at all. Their absence from the signal set is not
  evidence that they are not signals.
- Category assignment is coarser than the tier and should be treated as a navigation aid, not a
  claim.

When a specific field matters to something you are publishing, read Google's own description
yourself. It is in the data, and it is the actual evidence. The tier is a filter, not a citation.
