# Decision: what actually moves a local business site

**Use when** the user runs or works with a business serving a physical area.

## Ask first

1. One location or many?
2. Do they rank in the map pack, the normal results, both, or neither?
3. Is there real differentiation between their location pages, or a template with a swapped town?

## Pull

```bash
python3 scripts/search_signals.py locality --described
python3 scripts/search_signals.py --stage 12 --described --limit 30
python3 scripts/search_patents.py --mechanism local_geographic --claims --limit 6
```

## The rule

Separate the two systems before advising. Map pack ranking runs on a different pipeline from web
results and this skill covers the web side. Say so rather than blurring them.

On the web side, `QualityNsrNsrData.localityScore` is "the locality component of the LocalAuthority
signal." Local authority is computed as a site-level thing, which reframes the work: it is about
being a recognizable local entity, not about putting a town name in a title tag.

The multi-location trap is the same as the programmatic pages trap. Location pages that differ only
by town name are templated thin content with a local flavour. Location pages with real per-location
substance, staff, photos, hours, service specifics, local references, are real pages.

## Output

Web-side actions separated from map-pack actions, and for multi-location a per-page minimum bar.

## Do not

Answer a map pack question with web ranking signals. If the question is about the map pack, say the
skill does not cover it.
