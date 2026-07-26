# Decision: subfolder or subdomain

**Use when** launching a blog, help centre, store, or regional section and choosing where it lives.

## Ask first

1. Is this the same business serving the same audience, or a genuinely separate property?
2. Who maintains it, and will it be maintained to the same standard?

## Pull

```bash
python3 scripts/search_signals.py siteChunk --described
python3 scripts/search_signals.py --stage 3 --described --limit 30
```

## The rule

The question reduces to: do you want this content pooled with the main site for site-level scoring,
or separated from it?

`QualityNsrNsrData.siteChunk` is the unit: "Primary NSR sitechunk. In most of the cases it's same as
HOST_LEVEL_V3 sitechunked canonical url of the document. In rare, but important cases it's based on
page markup." Site-level signals attach to a chunk, and the chunk is usually host level.

That makes the trade explicit.

- **Subfolder** pools quality signals. Good when the new section will meet the main site's standard.
  Bad when it is a UGC dump or a low-effort content farm, because the tail joins the main site's
  distribution.
- **Subdomain** separates. Use it when the content genuinely differs in quality or purpose and you
  want a firebreak.

Note the "based on page markup" exception: chunking is not purely mechanical, so treating a
subdomain as a guaranteed firewall is not safe either.

## Output

A recommendation with the pooling consequence stated explicitly, so the user is choosing the
trade rather than following a convention.

## Do not

Repeat "subfolders are better for SEO" as a rule. It is a default, not a law, and it inverts when
the new section is lower quality than the main site.
