# Decision: how to handle health, money, legal, and safety content

**Use when** the site covers medical, financial, legal, safety, or civic topics where bad
information causes harm.

## Ask first

1. Who on the team is actually qualified in this subject?
2. Is the content advice, or is it information about advice?
3. What happens to a reader who follows it and it is wrong?

## Pull

```bash
python3 scripts/search_signals.py ymyl --described
python3 scripts/search_signals.py --stage 8 --described --limit 30
python3 scripts/search_signals.py --stage 3 --described --limit 30
```

## The rule

There are dedicated classifiers. `PerDocData.ymylHealthScore` and `PerDocData.ymylNewsScore` store
"scores of ymyl health classifier" and "ymyl news classifier" respectively. So YMYL is not a
guideline concept only; a classification is stored per document.

What the leak does not say is what the classification triggers. Do not claim it. Say: your page is
classified into a category with a higher bar, and the practical response is to meet that bar rather
than to guess at the mechanism.

Meeting it means the things that are checkable by a person or a model: named qualified authors,
citations to primary sources rather than to other blogs, review dates, correction policy, and no
claims beyond what the sources support.

For a site without genuine expertise in a YMYL area, the honest advice is often to pick a different
topic. Say that when it is true.

## Output

A qualification and sourcing standard for the content, plus what has to change on existing pages.

## Do not

Promise that adding a medical reviewer badge fixes it. What the classifiers consume is not
documented, and a badge with nobody real behind it is a claim you cannot support.
