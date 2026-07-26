# Decision: which CMS, theme, or framework to build on

**Use when** the user is choosing a platform, buying a theme, or deciding whether their current one
is holding them back.

## Ask first

1. Is the main content in the initial HTML response, or rendered client-side?
2. Can they control markup, or is the template fixed?
3. Who will maintain it?

## Pull

```bash
python3 scripts/search_signals.py --stage 2 --described --limit 40
python3 scripts/search_patents.py --mechanism structured_data_markup --claims --limit 5
```

## The rule

The only platform question that matters for search is what the document processing stage can
extract. Everything else is preference.

Test any candidate against five things:

1. Main content present in the HTML response without executing scripts.
2. A real, editable date in markup.
3. Author markup that can carry a person, not just a string.
4. Headings that are headings.
5. Body content that can contain links, not just menus and cards.

A platform that fails one of these is a platform where you will spend years working around it.

## Output

Pass or fail against those five, with the specific failure named. If the site already exists on a
failing platform, the fix list ordered by cost.

## Do not

Recommend a platform by name as an SEO choice. Any platform that passes the five tests is fine.
