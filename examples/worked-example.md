# Worked example: a decayed post on a hobby site

An illustration of the method end to end. The page is a composite, not a real URL, so nothing here
is a claim about anyone's site. Every field and patent cited is real and checkable with the bundled
tools.

Read this to see the shape of a good answer: routed, sourced, projected, and honest about limits.

---

## The request

> "I have a post from 2019 that used to bring me most of my traffic and now brings almost none.
> Nothing changed. What do I do?"

## Routing

Question A: fix something that dropped.
Question B: when did it start, site-wide or one page, what shipped before it?

Answers: gradual over about two years, this page and a few like it, nothing shipped.

Gradual decay on individual pages with no deploy event is not a drop. It is decay, which routes to
`playbooks/update-or-delete.md`, not to `playbooks/ranking-drop-triage.md`. Getting this fork right
matters: triage looks for an event, and there is no event to find.

Facts gathered before analysis: published March 2019, never updated, no byline, no visible date,
1,100 words, three stock photos, 40 comments last active 2020, 12 similar posts on the same site.

---

## What the page can and cannot put into storage

```bash
python3 scripts/search_signals.py --stage 7 --described --limit 30
python3 scripts/explain.py lastSignificantUpdate
```

`PerDocData.lastSignificantUpdate` is, in Google's words, "last significant update of the document.
This is sourced from the quality_timebased.LastSignificantUpdate proto as computed by the LSUSelector
from various signals."

The page has never been edited, so whatever that selector computed in 2019 is what it still holds.
This is not a penalty. It is an absence.

`QualityTimebasedSyntacticDate.bylineDate` and `NlpSaftDocument.bylineDate` ("the date that will be
shown in the snippets in web search results") have nothing clean to read, because no date is
rendered. Extraction still happens, it just happens without the author's input.

**Three empty slots, not three problems:** no update signal, no controlled date, no author identity.

---

## The mechanism behind the decay

```bash
python3 scripts/explain.py US11354342B2
python3 scripts/search_patents.py --mechanism click_engagement --claims --limit 5
```

Two mechanisms explain gradual decay without an event.

**Information gain.** US11354342B2, *Contextual estimation of link information gain*, filed 2018,
granted 2022: documents are scored on what new information they add relative to documents the user
has already seen. A 2019 post did not get worse. The set of documents a reader has already seen got
larger. Its marginal contribution fell while the page sat still.

**Accumulated click history.** US8661029B1, filed 2006: relevance is derived from the ratio of
longer views to total views, and the leak stores `goodClicks`, `badClicks` and `lastLongestClicks`
per document. This history is accumulated, not recomputed at query time. A page that slowly stopped
satisfying people carries that record forward.

Neither of these is reversible by editing a date field. Both are reversible by changing what the
page contains.

---

## The projection trace

Every recommendation passes through three columns before it ships.

| Stored signal | Upstream computation | Behavior to produce |
|---|---|---|
| `lastSignificantUpdate` frozen at 2019 | LSUSelector computes significance from content change signals, not from a rendered date | Change facts, figures and examples so there is a substantive edit to detect |
| Information gain score | US11354342B2: score reflects what the document adds beyond what the reader has seen | Add the thing the current top results do not have. If nothing, do not update, consolidate |
| `goodClicks` to `clicks` ratio | US8661029B1: relevance is long views over total views | Answer the query in the first screen so nobody bounces back |
| No author entity | Entity resolution binds documents to known entities | Attach a real person who exists elsewhere on the web, not a byline string |

Column three is what gets written into the plan. Columns one and two are why.

---

## Checking the demotion side

```bash
python3 scripts/search_signals.py --stage 8 --described --limit 40
python3 scripts/search_signals.py demot --loose --described
```

Walked, and cleared: anchor mismatch (internal anchors describe the page accurately), exact match
domain (brandable domain), scamness (no commercial claims), product review demotion (not a review
page).

Not cleared, flagged as a real risk: 40 comments, last active 2020, indexed.
`CompressedQualitySignals.ugcDiscussionEffortScore` holds "UGC page quality signals," and
`PerDocData.spamtokensContentScore` is "used in SiteBoostTwiddler to determine whether a page is UGC
Spam." Five years of unmoderated comments is a named exposure. See
`playbooks/ugc-and-comments.md`.

Saying what was cleared is part of the deliverable. It is the difference between an answer and a
guess.

---

## The site-level question the user did not ask

Twelve similar posts, all untouched since 2019, is not twelve page problems.
`QualityNsrNsrData.tofu` is a "site-level tofu score: site quality predictor based on content," and
`chardScoreVariance` is "site-level Chard Variance for all pages of a site."

So the honest framing is: fixing one page treats a symptom. The tail is the condition. That is
`playbooks/content-pruning.md`, and it should be raised even though the user asked about one page.

This is step 3 of the router. Surface what they did not know to ask, in one line, without turning it
into a second project.

---

## The answer that gets delivered

**The one thing.** This page did not get worse. The field moved. Information gain is relative to
what readers have already seen (US11354342B2), so a static page loses ground by standing still. The
fix is adding what the current top results lack, not refreshing what is already there.

**Empty slots, cheapest first.** A real update with substantive changes. A visible date in markup. A
named author who exists elsewhere online.

**Demotion risk.** Unmoderated comments since 2020 are a named UGC spam exposure. Moderate or
noindex them.

**Site level.** Eleven more posts in the same state. One page fixed changes one page.

**Not determined.** Whether links to this page decayed, whether competitors added something
specific, and whether impressions or clicks fell first. The first two need a backlink tool and a
SERP check. The third needs Search Console, and it changes the diagnosis, so get it before doing the
work.

---

## What makes this answer different

- Every claim carries a field name or a patent number.
- No impact percentage anywhere, because no weights leaked.
- The demotions checked and cleared are stated, not just the one found.
- The recommendation is a behavior, never a metric.
- The unknowns are named specifically enough to act on.
