# Workflow: Write a research piece with real citations

For posts, newsletter issues, talks, and anything else where the argument has to
survive someone checking it.

The advantage is not access to the leak. Everyone has that. The advantage is holding
both layers at once, so every claim carries a field and a mechanism.

## Step 1: Pick a mechanism, not a topic

"NavBoost" is a topic. Topics produce summaries, and there are a hundred summaries of
the leak already.

"Google downweights clicks from users who always click position one" is a mechanism.
It has a patent behind it, a field in the leak, and a consequence for what you do on
Monday. Mechanisms produce pieces nobody else has written.

Find one:

```bash
python3 scripts/search_patents.py --mechanism click_engagement --claims --limit 20
python3 scripts/search_patents.py --mechanism demotion_penalty --claims --limit 20
python3 scripts/search_patents.py --mechanism promotion_boost --claims --limit 10
```

Scan the claim lines until one makes you stop. That reaction is the piece.

## Step 2: Get both layers before writing a word

```bash
python3 scripts/search_patents.py --number US10229166B1 --full
python3 scripts/search_signals.py --module QualityNavboostCrapsCrapsClickSignals --described
```

You need the patent claim and the leak field in front of you. If only one exists,
that is still publishable, but the piece has to say which half is missing.

## Step 3: Verify the claim against the original patent

The bundled claims are LLM-extracted paraphrases. The patent numbers, titles, and
dates are exact; the claim wording is not.

Before publishing a direct quote, open the patent on Google Patents and copy the
sentence yourself. Getting caught paraphrasing a patent as a quote costs more
credibility than the piece earns.

Check the filing date while you are there. A mechanism filed in 2007 and granted in
2011 needs different framing from one filed last year.

## Step 4: Structure

What works, in order:

1. **The claim, stated flatly, in one sentence.** No throat clearing.
2. **The patent.** Number, filing date, and the mechanism in plain language.
3. **The leak field.** Module path, type, and Google's own description quoted exactly.
4. **The join.** Why the two together mean something neither says alone. This is the
   paragraph that cannot be copied from anyone else.
5. **What it changes on Monday.** The upstream behavior, per Signal Projection.
6. **The caveat.** What this does not prove.

Step 6 is not weakness. It is the reason people trust step 5.

## Step 5: Apply the Signal Projection lens

Every piece should land on the same underlying point from a new angle: the stored
value is a shadow, and you move it by moving the object.

That consistency is what turns a run of posts into a body of work with a name
attached. Do not restate the framework in full every time. Show it operating.

## Standing rules

- Quote Google's own field description exactly. It is more damning than any paraphrase.
- Give the filing date whenever you cite a patent.
- Never state a weight, a percentage, or a ranking factor count.
- When the leak and the patents disagree, that is the piece. Do not smooth it over.
- Say what would change your mind.

## Things nobody has written up yet

Sitting in the bundled data, unexploited:

- **Timeline analysis.** Every patent has a filing and grant date. Chart when each
  mechanism was filed against when the leak shows it in production. The lag is a
  story.
- **The inverse gap.** Leak fields with no patent behind them, and patented mechanisms
  with no field in the leak. Both directions are findings.
- **Continuation families.** Patents that are continuations of earlier ones show
  Google refining a mechanism over a decade. The diff between parent and continuation
  is where the thinking is visible.
- **Undocumented field census.** 4,547 of 14,022 attributes ship with no description.
  Which subsystems are the most opaque, and why might that be?

```bash
python3 scripts/search_patents.py --after 2020 --mechanism quality_scoring --limit 25
python3 scripts/search_patents.py --before 2005 --key
```

---

**One-shot lookups.** `python3 scripts/explain.py US8661029B1` prints every extracted claim for a patent plus the leak modules it connects to. `python3 scripts/explain.py goodClicks` does the reverse.

**Tier filters.** `python3 scripts/search_signals.py --tier core` restricts to attributes classified as directly used in scoring, which is the set worth writing about.
