# How Google's Ranking System Actually Works

> A cross-referenced analysis connecting the 2024 Google Content Warehouse API leak (2,593 modules, 14,022 attributes) with 5,456 analyzed Google search patents. The stage files below cite 57 distinct patents, some in more than one stage; the full corpus of 77,663 extracted claims is searchable through `scripts/search_patents.py`.
>
> Every claim in this document is backed by BOTH a leaked API attribute (with module path and description) AND a patent claim (with patent number and mechanism).

---

## The 12-Stage Ranking Pipeline

Google's ranking system is not a single algorithm. It is a pipeline of 12 distinct stages, each with its own signals, scoring, and patents. A web page passes through every stage:

```
┌─────────────────────────────────────────────────────────────┐
│                    USER TYPES A QUERY                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
    ┌─────────────────────┴──────────────────────┐
    │           STAGES 1-4: PRE-QUERY             │
    │   (These happen continuously, before any    │
    │    user query - building the index)         │
    └─────────────────────┬──────────────────────┘
                          │
   ┌──────────────────────┼──────────────────────┐
   ▼                      ▼                      ▼
Stage 1            Stage 2            Stage 3
Crawling &      Document           Content Quality
Discovery       Processing         & Site Scoring
   │                      │                      │
   │                      ▼                      │
   │              Stage 4: Link Analysis         │
   │              & Authority Computation        │
   │                      │                      │
   └──────────────────────┼──────────────────────┘
                          │
    ┌─────────────────────┴──────────────────────┐
    │       THE INDEX IS BUILT AND READY          │
    └─────────────────────┬──────────────────────┘
                          │
    ┌─────────────────────┴──────────────────────┐
    │        STAGES 5-8: SIGNAL COLLECTION       │
    │   (These happen at query time and          │
    │    continuously as signals accumulate)     │
    └─────────────────────┬──────────────────────┘
                          │
   ┌──────────────────────┼──────────────────────┐
   ▼                      ▼                      ▼
Stage 5            Stage 6            Stage 7
User              Entity &           Freshness &
Engagement        Knowledge          Temporal
(NavBoost)        Graph              Signals
   │                      │                      │
   │             Stage 8: Spam, Penalty          │
   │             & Trust Systems                 │
   │                      │                      │
   └──────────────────────┼──────────────────────┘
                          │
    ┌─────────────────────┴──────────────────────┐
    │        STAGES 9-12: QUERY-TIME             │
    │   (These happen when the user searches)    │
    └─────────────────────┬──────────────────────┘
                          │
   ┌──────────────────────┼──────────────────────┐
   ▼                      ▼                      ▼
Stage 9            Stage 10           Stage 11
Query             Snippet &          Re-Ranking &
Understanding     Answer             Twiddler
                  Extraction         System
   │                      │                      │
   │             Stage 12: Personalization,      │
   │             Local & Context                 │
   │                      │                      │
   └──────────────────────┼──────────────────────┘
                          │
    ┌─────────────────────┴──────────────────────┐
    │           FINAL SEARCH RESULTS              │
    └─────────────────────────────────────────────┘
```

### Pipeline Overview Table

| Stage | What Happens | Key Leak Modules | Key Patents | SEO Impact |
|-------|-------------|-----------------|-------------|------------|
| 1. Crawling & Discovery | Googlebot discovers, fetches, and schedules re-crawls | TrawlerFetchReplyData, CrawlerChangerateUrlChangerate | US7627613B1, US8386459B1 | Crawl budget, sitemap quality, URL structure |
| 2. Document Processing | HTML parsed, content extracted, CompositeDoc built | CompositeDoc, GDocumentBase, IndexingDocjoinerDataVersion | US7716225B1, US7536408B2 | Semantic HTML, structured data, content extraction |
| 3. Content Quality | Page and site quality scored (Panda, Helpful Content) | PerDocData, QualityNsrNsrData, CompressedQualitySignals | US8682892B1, US9031929B1 | Content depth, originality, site-wide quality |
| 4. Link Analysis | Links evaluated, anchor text indexed, authority computed | AnchorsAnchor, IndexingDocjoinerAnchorStatistics | US6285999B1, US7716225B1 | Link quality, anchor text, link building |
| 5. NavBoost (Clicks) | Click quality, dwell time, pogo-sticking tracked | QualityNavboostCrapsCrapsClickSignals | US8661029B1, US7962462B1 | Title/content match, user satisfaction |
| 6. Entity & KG | Entities extracted, Knowledge Graph connections built | RepositoryWebrefEntityJoin, RepositoryWebrefMention | US9268820B2, US10270791B1 | Entity consistency, sameAs schema, Knowledge panels |
| 7. Freshness | Content dates parsed, updates tracked, temporal scoring | QualityTimebasedSyntacticDate, QualityTimebasedLastSignificantUpdate | US7346839B2, US8549014B2 | Content updates, date accuracy, QDF |
| 8. Spam & Trust | Spam detected, penalties applied, trust computed | SpamBrainScore, PerDocData (GibberishScore) | US8554769B1, US7603350B1 | Avoid spam signals, earn trust |
| 9. Query Understanding | Query parsed, intent classified, neural matching | QualityOrbitAsteroidBeltDocumentIntentScores | US9037464B1, US10452978B2 | Write for intent, natural language |
| 10. Snippet Extraction | Passages scored for featured snippets | SnippetExtraInfo, QualityPreviewRanklabSnippet | US9940367B1, US11409748B1 | Answer structure, passage formatting |
| 11. Re-Ranking (Twiddlers) | Boost/demotion multipliers applied to final scores | CompressedQualitySignals (38 attributes) | US8682892B1, US11893034B2 | Fix demotions, earn promotions |
| 12. Personalization & Local | Results adjusted by location, device, history | LocalWWWInfo, SmartphonePerDocData, QualityNsrNsrData | US11893034B2, US10248698B2 | Local SEO, mobile optimization, brand building |

---

## Detailed Stage Analysis




> **Source data:** the Content Warehouse leak attribute set cross-referenced against 92 deeply analyzed patents. The full bundled data is in `data/leak_attributes.jsonl` and `data/patents.jsonl.gz`, and every attribute quoted here can be checked with `scripts/search_signals.py`.
>
> Every mechanism described below cites **both** a specific leak attribute (with its verbatim `desc`) **and** a specific patent claim. Attribute descriptions are quoted directly from the leak, none are invented. Patent claim lines are paraphrases of the patent text.

---

---

## Cross-Stage Summary - How Stages 9-12 Connect

| Stage | Input | Core Function | Key Output |
|-------|-------|---------------|------------|
| **9. Query Understanding** | Raw query text | Entity recognition (QRef), intent scoring (Asteroid Belt), semantic parsing (SAFT), topic matching (Petacat) | Query interpretation, intent classification, titlematch scores |
| **10. Snippet Extraction** | Ranked documents + query | Multi-candidate snippet/title generation (Muppet/SnippetBrain), passage-level answer scoring (Radish), context scoring (heading hierarchy, bold text) | Display titles, snippets, featured snippet answers |
| **11. Re-Ranking/Twiddlers** | Initially ranked results | Site-wide quality multiplier (Panda/NSR), link weight (Reasonable Surfer), product review boosts, EMD demotion, device adjustment | Final ranking with boost/demotion multipliers applied |
| **12. Personalization/Local** | Ranked results + user context | Geographic matching (GeoTopicality/Brainloc/CountryAttachment), distance demotion, device-specific signals (SmartphonePerDocData), user profile biasing (PersonalizationContext) | Personalized, localized, device-optimized final results |

The pipeline flows from understanding what the user wants (Stage 9) → generating what they see (Stage 10) → adjusting rankings based on quality and behavior (Stage 11) → tailoring results to their specific context (Stage 12). Each stage builds on the previous: query understanding determines which intent scores activate, which determines which passages are extracted, which determines which twiddlers apply, which determines which personalization signals are relevant.

---

*Attribute descriptions quoted in this document are verbatim from the leak and can be checked with `python3 scripts/search_signals.py <field>`. Patent claim lines are model-extracted paraphrases of the patent text, not verbatim quotes: patent numbers, titles and dates are exact, but pull the original from Google Patents before publishing a direct quote.*
