# Decision: chase featured snippets, or not

**Use when** the user wants position zero, or is worried snippets are taking their clicks.

## Ask first

1. Does the query currently show a snippet, and who holds it?
2. If a searcher reads the snippet and stops, have you lost anything, or was that never a customer?

## Pull

```bash
python3 scripts/search_signals.py --stage 10 --described --limit 30
python3 scripts/search_patents.py --mechanism passage_snippet_answer --claims --limit 6
```

## The rule

Snippet and answer extraction works at passage level, not page level. That is the actionable part:
sections are assessed on their own, so a page can win a snippet with one well-formed passage even if
the rest of the page is about something broader.

Structure follows from that. One question per section, the answer immediately under the heading,
stated completely in a few sentences, before any elaboration.

The strategic question is separate and more important. Winning a snippet for a query whose answer is
a single fact means the searcher stops. That is a loss dressed as a win. Chase snippets where the
answer creates a next question that only your page answers.

## Output

Which queries to structure for snippets and which to deliberately ignore, with the reason.

## Do not

Treat position zero as universally desirable. For fact-lookup queries it converts a visit into a
non-visit.
