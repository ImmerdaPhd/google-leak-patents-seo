# Decision: what broke after the redesign

**Use when** rankings or traffic fell after a visual redesign, replatform, or template change, and
the content supposedly did not change.

## Ask first

1. What exactly shipped, and on what date?
2. Did URLs change? Did markup change? Did the content move into JavaScript?
3. Is the drop site-wide or confined to a template?

## Pull

```bash
python3 scripts/search_signals.py --stage 2 --described --limit 40
python3 scripts/search_signals.py bylineDate --described
python3 scripts/search_signals.py --stage 10 --described --limit 20
```

## The rule

Redesigns rarely change content and frequently change what is *extractable* from it. Work through
what the document processing stage can still see.

Check in this order, because this is the order of likelihood:

1. Dates disappeared from markup, so byline extraction lost its source.
2. Main content moved behind rendering, so text extraction sees a shell.
3. Headings became styled divs, so structure is gone.
4. Internal links moved into menus and out of body content, changing prominence propagation.
5. Structured data was dropped from the new template.
6. URLs changed silently, for example trailing slashes or case.

Confine the diagnosis to a template if the drop is confined to a template. That single observation
usually finds it.

## Output

The specific extraction that broke, the template it broke in, and the markup fix. Not "the redesign
hurt SEO."

## Do not

Attribute a redesign drop to an algorithm update without checking extraction first. The timing
coincidence is doing the work in that story, not evidence.
