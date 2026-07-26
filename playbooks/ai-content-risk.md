# Decision: is AI-assisted content a risk here

**Use when** the user is deciding whether to publish AI-drafted content, or worrying about content
they already published that way.

## Ask first

1. What does the draft contain that could not have been produced without doing the work?
2. Is this a topic where being wrong is expensive (health, money, legal, safety)?
3. How much of the site is drafted this way?

## Pull

```bash
python3 scripts/search_signals.py contentEffort --described
python3 scripts/search_signals.py OriginalContentScore --described
python3 scripts/search_signals.py tofu --described
python3 scripts/search_patents.py "original content" --claims --limit 5
```

## The rule

The question is not "was AI used." Nothing in the leak detects a model. The question is whether the
page carries the marks of work.

`QualityNsrPQData.contentEffort` is "LLM-based effort estimation for article pages." Google is using
a model to estimate effort. A model estimating effort is exactly the thing that cheap generated
text fails, because effort shows up as specifics a generator does not have: original data, named
sources, first-hand observation, things that had to be obtained.

`PerDocData.OriginalContentScore` is scored 0 to 127 and, critically, "Only pages with little
content have this field." So thin pages get an originality judgment that longer pages do not.
Thin plus unoriginal is the exposed combination.

`QualityNsrNsrData.tofu` is a "site-level tofu score: site quality predictor based on content."
Site level. A large volume of low-effort pages is a site-level exposure, not a per-page one.

## Output

Publish, publish with additions, or do not publish. If additions, name them concretely: the dataset
to gather, the person to interview, the test to run, the screenshot to take.

## Do not

Claim AI content is penalized, or that it is safe. Neither is supported. Effort is measured; the
tool used to produce it is not.
