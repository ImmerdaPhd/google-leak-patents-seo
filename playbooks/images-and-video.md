# Decision: is investing in images or video worth it

**Use when** the user is deciding whether to produce original photography, illustration, or video,
or whether stock is fine.

## Ask first

1. Do the ranking pages in this space use original media?
2. Can they produce media that shows something a description cannot?
3. Is video a distribution play or a ranking play? They are different decisions.

## Pull

```bash
python3 scripts/search_signals.py --stage 2 --described --limit 30
python3 scripts/search_patents.py --mechanism image_visual --claims --limit 5
python3 scripts/search_patents.py --mechanism video_media --claims --limit 5
```

## The rule

Image and video have their own engagement measurement, separate from web results. The image click
quality module tracks clicks and a distinct definition of good clicks for images. Video carries its
own anchor and query features. These are separate corpora with separate signals, which means media
is a distinct surface to compete on, not decoration on a page.

Patent US8359309B1 describes comparing click-through rates across corpora and boosting an
underrepresented corpus when users click it disproportionately. That is the argument for
diversifying into media: a different surface with different competition.

Original media has a second effect that stock does not. It is one of the few things on a page that
demonstrably could not have been generated or copied, which matters for originality and effort
assessment.

## Output

Invest or do not, per content type, with the surface named. If investing, the specific shots or
segments that show something text cannot.

## Do not

Recommend stock images for SEO value. There is none. Recommend them for layout if that is the real
reason.
