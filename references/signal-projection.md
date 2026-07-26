# Signal Projection

The framework that decides how everything else in this skill gets used.

## The claim

Every ranking signal stored in Google's Content Warehouse is a lossy, compressed
projection of an upstream computation. The stored value is not the thing. It is a
shadow the thing casts after a model has read it, scored it, and squeezed the result
into a few bits.

    stored signal = quantize( upstream quality model( real behavior ) )

Three transformations sit between reality and the field you read about in a leak
analysis. Every one of them destroys information.

## The evidence

You do not have to take this on faith. The leak documents the compression itself.

**Quantization is explicit in the field descriptions.**
`PerDocData.onsiteProminence` is "a 13-bit int." `PerDocData.uacSpamScore` is
"represented in 7 bits, going from 0 to 127." A 7-bit score is not a measurement of
spam. It is a model's opinion about spam, rounded to one of 128 buckets.

**The conversion is named in the description.**
`CompressedQualitySignals.siteAuthority` reads: "site_authority: converted from
quality_nsr.SiteAuthority, applied in Qstar." Converted. The field you have heard
about is a downstream copy of something computed elsewhere. `navDemotion` is
"converted from QualityBoost.nav_demoted.boost." The leak is full of the word
converted, and every instance is a projection boundary.

**The whole module is called CompressedQualitySignals.**
Google named the compression layer after the compression. 38 fields carrying squeezed
copies of richer upstream computations into the serving shards, because the real
models are too expensive to run at query time.

**Position bias correction is a projection you can see happening.**
NavBoost stores both `clicks` and `unsquashedClicks`. Squashing normalizes for the
fact that position one gets clicks regardless of quality. The squashed number is
further from raw behavior and closer to what Google actually wants to know. The
transformation is the point.

## Why this changes what you do

The standard SEO reading of a leak is: here is a list of fields, optimize for the
fields. That reading fails, and it fails predictably.

**You cannot write to a projection.** `siteAuthority` is an integer in a serving
bundle. There is no input where you supply it. The only way to move it is to change
what the upstream NSR model consumes, and the leak does not tell you the model's
inputs. So "build site authority" as a task is incoherent. "Become the kind of site
the model reads as authoritative" is a real task with a different work plan.

**Optimizing the shadow produces artifacts, not rankings.** Every dead SEO tactic is
someone finding a proxy and manufacturing it directly. Keyword density was a proxy
for topical relevance. Link count was a proxy for endorsement. Dwell time is a proxy
for satisfaction. Manufacture the proxy without the underlying reality and you get a
page that scores briefly, then gets caught when the model improves, because improving
the model *is* reducing the gap between projection and reality.

**Projection explains why the same tactic works and then stops.** Nothing was
penalized. The compression got better. The gap you were exploiting closed.

**It tells you which advice will age well.** Any recommendation phrased as "increase
metric X" is fragile. Any recommendation phrased as "produce the behavior that X is
trying to measure" survives every model update, because model updates move X *toward*
that behavior, not away from it.

## How to apply it

Work backwards through the three layers, every time.

| Layer | Question | Example |
|---|---|---|
| Stored signal | What field holds this? | `QualityNavboostCrapsCrapsClickSignals.goodClicks` |
| Upstream computation | What model or process produces it, per the patents? | US8661029B1: clicks classified by viewing duration; relevance is the ratio of long views to total views |
| Real behavior | What did a human do that started the chain? | A searcher clicked, found what they needed, and did not go back |

Then advise on the third column. Only ever the third column.

The middle column is what the patents are for, and it is why this skill bundles
77,663 patent claims rather than a field list. Without the patents you have a
vocabulary. With them you have a mechanism, and a mechanism tells you which real
behavior to produce.

## The reframe worth stating plainly

The leak did not reveal how Google ranks. It revealed **what Google stores**. Those
are different questions, and the industry answered the first using data that only
answers the second.

Storage is the compressed residue of ranking. Reading it as a ranking recipe is
reading a compression artifact as a specification. Optimize the object, not its
shadow.

---

Signal Projection is a Missing Intent framework, set out in *What Google Stores, Not How It
Ranks*. More at [missingintent.com](https://missingintent.com).
