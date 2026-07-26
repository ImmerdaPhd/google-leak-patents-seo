# Stage 7: Freshness & Temporal Signals

**Leak modules (14):** `QualityTimebasedSyntacticDate`, `QualityTimebasedLastSignificantUpdate`, `QualityTimebasedPageType`, `QualityTimebasedDateUnreliability`, `QualityTimebasedLastSignificantUpdateAdjustments`, `QualityTimebasedPetacatDateUnreliability`, `CrawlerChangerateUrlChangerate`, `CrawlerChangerateUrlHistory`, `CrawlerChangerateUrlChange`, `CrawlerChangerateUrlVersion`, `SnapshotSnapshotDocument`, `PerDocData` (freshness subset), `CompressedQualitySignals` (freshness subset), `IndexingDocjoinerDataVersion` (freshness/spam subset)

**Relevant patents (7):** US7346839B2, US8549014B2, US8924379B1, US9002867B1, US8874558B1, US8972391B1, US9390143B2

### What Happens Here

Google extracts, validates, and scores every temporal signal associated with a document - the date it was written, the date it was last meaningfully updated, how often and how significantly it changes, and whether those dates are trustworthy. This stage determines which results surface for freshness-sensitive queries (news, events, trends, seasonal topics) and how aggressively freshness modifies the base ranking score. The system does not simply trust the date a page claims; it cross-references byline dates, content-analysis dates, crawl history, and anchor-link dates against each other, flagging unreliable dates and capping timestamps with upper bounds derived from passage-level evidence.

### How this works

**1. Date extraction is a multi-source, confidence-scored pipeline - not a single byline read.** The `QualityTimebasedSyntacticDate` module is where Google stores the parsed date for a document, and it carries explicit confidence metadata. The `bylineDate` field is "set only when the byline date is different from the 'date' field above. Currently this happens when the byline date is within the 24 hours of the crawl time, or close but not exactly the same as blog post date due to time zone. The syntactic date is never later than the crawl time." The `info` field stores "extra information about the syntactic date" using two bits: "Bit 1 = High confidence byline. This bit is set if the syntactic date has a byline date and this date is considered to be high confidence. Bit 2 = High confidence byline without content age." This maps directly to Patent **US7346839B2** (Information retrieval based on historical data), which specifies that "History data types include: document inception dates, content update dates/changes, query analysis, link-based criteria, anchor text analysis, traffic, user behavior, domain-related information, ranking history, user bookmarks, unique words/bigrams/phrases in anchor text, linkage of independent peers, and document topics" - the syntactic date is Google's attempt to reconstruct the true inception date from all available signals, not just the visible byline. The `PerDocData.semanticDate` field (described as "estimated date of the content of a document based on the contents of the document (via parsing), anchors and related documents") is the parallel content-derived date, and `PerDocData.semanticDateInfo` adds "confidence scores for day/month/year components as well as various meta data required by the freshness twiddlers." When the syntactic date and semantic date agree, confidence is high; when they diverge, the date unreliability system kicks in.

**2. LastSignificantUpdate is the primary freshness signal, and it is a multi-source selector with adjustment logic.** `QualityTimebasedLastSignificantUpdate.date` is "LastSignificantUpdate as UNIX timestamp in seconds. This is the new signal (go/lsu-dd) from LSU Selector V2 ... falling back to the legacy V1 signal if the HIGH_PRECISION signal does not exist." This is not simply the last crawl date - it is a curated signal that selects the best available update timestamp from multiple candidates. The `QualityTimebasedLastSignificantUpdateAdjustments` module reveals the adjustment machinery: `adjustmentSource` records "If the selected LSU has been adjusted, i.e. the maximum passage timestamp, firstseen or contentage were assigned to LSU, the adjustment source is stored here." The `upperboundTimestampInSeconds` is "The upperbound value derived from passage timestamps. If present, the LSU date should never exceed this value." The `unboundedTimestampInSeconds` captures "The timestamp that was picked up by the component indicated in the LastSignificantUpdateSource but was dropped due to exceeding the upper bound." And `isUpperboundTimestampPrecise` records "The timestamp is precise when it's derived from existing (>March 2022) passage timestamp." This directly implements Patent **US8549014B2** (Document scoring based on document content update), which states "A measure of how document content changes over time is computed" and "The difference between document versions is analyzed" and crucially "Meaningful updates (content changes) are distinguished from cosmetic changes." The upper bound mechanism ensures that a page cannot fake freshness by updating a timestamp without genuine content changes - the passage-level timestamps cap what the LSU can claim. `PerDocData.lastSignificantUpdate` is the propagated version ("sourced from the quality_timebased.LastSignificantUpdate proto as computed by the LSUSelector from various signals"), and `PerDocData.lastSignificantUpdateInfo` encodes "the quality_timebased.LastSignificantUpdate.source field which contains the info on the source of the signal."

**3. Date unreliability is scored per-vertical and exposure-adjusted, not binary.** Google does not simply trust or reject dates - it computes a continuous unreliability score. The `QualityTimebasedDateUnreliability` module carries `unreliableDatesScore` ("If scores are missing, the date is reliable by default. max(petacat.unreliable_dates_score)") and `unreliableDatesScoreExposureAdjusted` ("max(petacat.unreliable_dates_score * petacat.date_exposure_score)"). The `petacatScores` field is a list of `QualityTimebasedPetacatDateUnreliability` entries, each scoped to a specific vertical (petacat) via `petacatId` ("go/verticals4"). The underlying scores are `contentageReliability` and `dateVsContentageDistributionSkew`, described as "Auxiliary scores. The unreliable_dates_score is a product of these scores excl. date_exposure." This means Google checks whether the claimed date is consistent with the content's age distribution for that vertical - a page claiming to be from 2024 but with content patterns typical of 2019 would get a high skew score. The exposure adjustment means that unreliability is weighted by how many users actually see the date - a wrong date on a page nobody clicks is less damaging than one on a high-traffic page. Patent **US7346839B2** supports this: "Document age and update frequency feed into scoring - stale documents may be demoted for freshness-sensitive queries" and "Domain registration data (whois, DNS records) is monitored to predict legitimacy." The `QualityTimebasedPageType.isPageWithFreshRepeatedDates` flag ("Set to true if this page has a fresh repeated date sequence") catches a specific manipulation pattern - pages that repeatedly show fresh dates without genuine updates.

**4. Change-rate tracking is a simhash-based versioning system that measures what actually changed, not just that something changed.** The `CrawlerChangerateUrlChangerate` module is the aggregate change model. `averageChangeSignificance` is "the 'significance' of the average change we saw of this document (from 0 to 1). Influenced by content changes. This can be used for prioritizing the crawl (higher significance first)." `lastChangeSignificance` is the same for the most recent change. `numIntervals` is "the number of intervals we've seen for this document (where an interval is two different versions)." The `type` field records "The type of the document determined by crawl histories" - classifying the document's change behavior. The `ugcChangePeriod` captures "Information on change period generated from user generated content (UGC) change history," recognizing that user-generated content changes differently from editorial content. The `CrawlerChangerateUrlChange` module records each individual change event with `simhashIsTrusted` ("Whether the simhash-v1 should be trusted") and `simhashV2IsTrusted` ("Whether the simhash-v2 value should be trusted"), plus structural change signals: `onDomainLinksCountChange` ("Whether the number of on-domain links changed"), `offDomainLinksChange` ("Whether the content of the off-domain links changed"), and link counts. The `CrawlerChangerateUrlVersion` module stores each version with `simhash` ("The simhash-v1 value ... now deprecated and new UrlVersions should only populate simhash-v2"), `contentType` ("The content type of the page"), and `timestamp` ("The timestamp we crawled the page"). The `additionalChangesMerged` field in both UrlChange and UrlVersion tracks how many "Duplicate UrlChanges crawled within a specified time range will be merged together" based on simhash equality. This implements Patent **US9002867B1** (Modifying ranking data based on document changes), which states "Quality of result statistics are tracked for pairs of queries and documents" and "Version-specific quality statistics are maintained for different versions of a document" and "When a document changes, overall quality is recomputed by weighting version-specific statistics." The simhash-based versioning means that a page that changes its boilerplate (nav, footer, ads) without changing its substantive content will have a low `averageChangeSignificance` and will not get a freshness boost.

**5. Temporal query patterns dynamically weight freshness at serving time.** Freshness is not a fixed multiplier - it intensifies when query demand spikes. Patent **US8924379B1** (Temporal-based score adjustments) describes: "Time trend data is stored for queries across multiple time periods" and "Query popularity spikes are detected when popularity temporarily increases beyond a baseline" and "Documents responsive to spiking queries receive score adjustments" and "The temporal signal temporarily increases the ranking weight of fresh content when demand rises." The leak's `PerDocData.isHotdoc` ("Set by the FreshDocs instant doc joiner") flags documents that are being rapidly discovered, and `PerDocData.freshboxArticleScores` ("Stores scores of freshness-related classifiers: freshbox article score, live blog score and host-level article score") provides the per-document freshness classification. The `PerDocData.datesInfo` field ("Stores dates-related info (e.g. page is old based on its date annotations). Used in FreshnessTwiddler") is the direct input to the query-time freshness adjustment, and `PerDocData.timeSensitivity` ("Encoded Document Time Sensitivity signal") measures how time-sensitive the document's topic is. Patent **US8874558B1** (Promoting fresh content for authoritative channels) adds the authority dimension: "New content items from an authoritative channel relating to the channel's authoritative topic receive a boosted score if the time since publication is below a threshold - freshness + authority = promotion" and "Channels with fewer content items than a threshold quantity are penalized in their authority score, requiring sufficient volume to establish topical authority." This means fresh content from established, topically-consistent channels gets a double boost (freshness + authority), while fresh content from thin or off-topic channels does not.

**6. Versioned data tracking ensures every temporal annotation has a provenance timestamp.** The `IndexingDocjoinerDataVersion` module (428 attributes) tracks the version of every annotation attached to a document. Key freshness-related entries include `dateAnnotations`, `dateAnnotationTags`, `timeAnnotations`, `timeAnnotationTags`, `dateTimeAnnotations`, `relativeDateAnnotations`, `dateRangeAnnotations`, `timeRangeAnnotations`, `qualityHistoricalContentAge`, `qualityTimebasedTimeSensitivityTimeSensitivityAnnotation`, `freshboxFreshboxArticleAnnotation`, `indexingAnnotationsDatesDateTimes`, `indexingFreshSchedulerFreshSchedulerDoubleInstantExtension`, `indexingFreshSchedulerOutlinkDiscoveryHistoricalHubsSignal`, `indexingSelectionFreshdocsPassthroughExtension`, `qualityFreshnessAbacusInstantNegativeClicksInfo`, `qualityRealtimeBoostRealtimeBoostResponse`, `qualityRealtimeBoostRealtimeBoostEvent`, `qualityRealtimeRtFactAnnotations`, `qualityRealtimeRealtimeResultInfo`, and `newsCorpusLeafPageAnnotation`. Each carries an `IndexingDocjoinerDataVersionVersionInfo` with `timestampMicros` ("The timestamp when a piece of data is updated (or deleted if the data doesn't exist in the update)") and `considerationTimestampMicros` ("Sometimes, a piece of data may not exist for a document ... so timestamp_micros won't exist. However, consideration_timestamp_micros will be set to indicate we tried to update but found no data"). This versioning system means Google can determine not just when a document was updated, but when each individual temporal annotation was last verified - if the date annotation is stale relative to the document's actual content changes, the freshness system can discount it. Patent **US7346839B2** confirms: "User behavior history (clicks, dwell time over time) contributes to scoring" and "Ranking history is tracked - documents that maintain rankings over time build trust" - the versioned data tracking is how ranking history is maintained.

**7. Recent interest and category-based re-ranking add a personalization layer to temporal signals.** Patents **US8972391B1** and its continuation **US9390143B2** (Recent interest based relevance scoring) describe a system where "A short-term category of interest is determined by analyzing the user's recent search activity period" and "For each search result, a category selection value is calculated: the count of selections of that result as a portion of combined selection counts for all results responsive to the query, for users classified as having the same short-term category of interest." The re-ranking "is adjusted only when the difference between category and general selection values exceeds a threshold value, ensuring adjustments are statistically meaningful" and "Selections are weighted by the amount of time a user viewed the document referred to by the search result (dwell time weighting)." This means that freshness signals are not applied uniformly - a user who has been searching for sports news in the last hour will see fresher sports results weighted more heavily, because the category-specific click behavior of similar users favors recent content. The `PerDocData.freshnessEncodedSignals` field ("Stores freshness and aging related data, such as time-related quality metrics predicted from url-pattern level signals") provides the per-URL-pattern freshness priors that feed this system, and the `SnapshotSnapshotDocument` module (with `metaNoSnippet` - "These are set from tags in the web page" and `imageNode`) captures the document state at snapshot time for comparison.



**8. The SnapshotSnapshotDocument module captures the document state at a frozen point in time for comparison and freshness evaluation.** The `SnapshotSnapshotDocument` module carries `metaNoSnippet` ("These are set from tags in the web page") - recording meta-tag directives like nosnippet at snapshot time - and `imageNode` (a list of `SnapshotImageNode` entries capturing image state). This snapshot is the reference frame against which the `CrawlerChangerateUrlChange` simhash deltas are computed: when Google recrawls a page, it compares the new version's simhash against the snapshot's simhash to determine whether a "change" occurred and how significant it was. The `CrawlerChangerateUrlVersion.timestamp` ("The timestamp we crawled the page") anchors each version in time, and the `CrawlerChangerateUrlHistory.latestVersion` ("The latest version we've seen") is the most recent reference point. The `CrawlerChangerateUrlChangerate.lastFetched` ("The last time (unix timestamp) we saw a fetched copy of the document") is distinct from the last *changed* time - Google distinguishes between pages that were fetched but not modified (304 responses, low significance) and pages that were fetched and substantially modified (high `averageChangeSignificance`). This distinction is critical for the recrawl scheduling described in Patent **US7346839B2**: "Document age and update frequency feed into scoring" - but "update" means a content-significant change, not just a fetch. The `patternChangePeriodVersion` field ("The version number of the algorithm") shows that Google iterates on its change-period estimation algorithm, and different versions may produce different recrawl schedules for the same document history.

**9. FreshDocs and the instant doc joiner create a parallel fast-path for fresh content.** The `PerDocData.isHotdoc` flag ("Set by the FreshDocs instant doc joiner") reveals a separate pipeline for fresh content that bypasses the normal indexing cycle. The `IndexingDocjoinerDataVersion` module includes `indexingSelectionFreshdocsPassthroughExtension` and `indexingFreshSchedulerFreshSchedulerDoubleInstantExtension` and `indexingFreshSchedulerOutlinkDiscoveryHistoricalHubsSignal` - these are the FreshDocs system's entries, each versioned with `timestampMicros`. The FreshDocs system identifies documents that are being rapidly discovered (via outlink discovery from "historical hubs" - sites that consistently surface new content early) and routes them through an instant joiner that makes them available for serving before the full indexing pipeline completes. Patent **US8924379B1** supports this: "Query popularity spikes are detected when popularity temporarily increases beyond a baseline" and "Documents responsive to spiking queries receive score adjustments" - the FreshDocs system is how Google ensures that when a query spikes, fresh results are available immediately, not after the normal crawl-index-serve cycle. The `PerDocData.knexAnnotation` field ("For indexing k'nex annotations for FreshDocs") provides additional FreshDocs metadata, and the `newsCorpusLeafPageAnnotation` and `newsCorpusHubPageAnnotations` entries in `IndexingDocjoinerDataVersion` show that news content gets special freshness treatment with its own annotation track. The `qualityRealtimeBoostRealtimeBoostResponse` and `qualityRealtimeBoostRealtimeBoostEvent` entries confirm that there is a real-time boosting system that can promote content outside the normal ranking cycle - this is the mechanism behind "Top Stories" and breaking-news carousels.

### Leak Attributes

**QualityTimebasedSyntacticDate** - 2 attributes

| Attribute | Type | Description |
|---|---|---|
| `bylineDate` | String.t | The following field is set only when the byline date is different from the "date" field above. Currently this happens when the byline date is within the 24 hours of the crawl time, or close but not exactly the same as blog post date due to time zone. The syntactic date is never later than the crawl time. NOTE: If this field is set, use_as_byline_date will be meaningless, and better to be cleared. |
| `info` | integer() | Used to store extra information about the syntactic date. For now only two bits are set. Please refer to the encoding/decoding functions provided in: quality/timebased/syntacticdate/util.h Bit 1 = High confidence byline. This bit is set if the syntactic date has a byline date and this date is considered to be high confidence. Bit 2 = High confidence byline without content age. This bit is set if the syntactic date has a byline date and this date is considered to be high confidence without support. |

**QualityTimebasedLastSignificantUpdate** - 1 attribute

| Attribute | Type | Description |
|---|---|---|
| `date` | String.t | LastSignificantUpdate as UNIX timestamp in seconds. This is the new signal (go/lsu-dd) from LSU Selector V2 (once that is enabled, see b/171879888 for status), falling back to the legacy V1 signal if the HIGH_PRECISION signal does not exist. Please use the 'source' field to determine where the value comes from. |

**QualityTimebasedPageType** - 1 attribute

| Attribute | Type | Description |
|---|---|---|
| `isPageWithFreshRepeatedDates` | boolean() | Set to true if this page has a fresh repeated date sequence. |

**QualityTimebasedDateUnreliability** - 3 attributes

| Attribute | Type | Description |
|---|---|---|
| `petacatScores` | list(GoogleApi.ContentWarehouse.V1.Model.QualityTimebasedPetacatDateUnreliability.t) | *(no description provided in leak)* |
| `unreliableDatesScore` | number() | If scores are missing, the date is reliable by default. max(petacat.unreliable_dates_score) |
| `unreliableDatesScoreExposureAdjusted` | number() | max(petacat.unreliable_dates_score * petacat.date_exposure_score) |

**QualityTimebasedLastSignificantUpdateAdjustments** - 4 attributes

| Attribute | Type | Description |
|---|---|---|
| `adjustmentSource` | String.t | If the selected LSU has been adjusted, i.e. the maximum passage timestamp, firstseen or contentage were assigned to LSU, the adjustment source is stored here. |
| `isUpperboundTimestampPrecise` | boolean() | The timestamp is precise when it's derived from existing (>March 2022) passage timestamp. |
| `unboundedTimestampInSeconds` | String.t | The timestamp that was picked up by the component indicated in the LastSignificantUpdateSource but was dropped due to exceeding the upper bound. Set only if it is not equal to final LSU. |
| `upperboundTimestampInSeconds` | String.t | The upperbound value derived from passage timestamps. If present, the LSU date should never exceed this value. Design doc: go/lsu-max-passage-timestamp |

**QualityTimebasedPetacatDateUnreliability** - 3 attributes

| Attribute | Type | Description |
|---|---|---|
| `petacatId` | integer() | go/verticals4 |
| `contentageReliability` | number() | *(no description provided in leak)* |
| `dateVsContentageDistributionSkew` | number() | Auxiliary scores. The unreliable_dates_score is a product of these scores excl. date_exposure. The definition for each of the scores you can find at go/unreliable-dates-dd |

**CrawlerChangerateUrlChangerate** - 7 attributes (SEO-relevant subset shown; 21 total in full module)

| Attribute | Type | Description |
|---|---|---|
| `averageChangeSignificance` | float() | The "significance" of the average change we saw of this document (from 0 to 1). Influenced by content changes. This can be used for prioritizing the crawl (higher significance first). |
| `lastChangeSignificance` | float() | The "significance" of the last change we saw of this document (from 0 to 1). Influenced by content changes, etc. This can be used for prioritizing the crawl (higher significance first). |
| `lastFetched` | integer() | The last time (unix timestamp) we saw a fetched copy of the document. |
| `numIntervals` | integer() | The number of intervals we've seen for this document (where an interval is two different versions). |
| `patternChangePeriodVersion` | integer() | The version number of the algorithm, refer to ChangePeriodVersion for more information. |
| `type` | integer() | The type of the document determined by crawl histories, refer to TYPE for more information. |
| `ugcChangePeriod` | integer() | Information on change period generated from user generated content (UGC) change history. |

**CrawlerChangerateUrlHistory** - 1 attribute (SEO-relevant subset; 3 total in full module)

| Attribute | Type | Description |
|---|---|---|
| `latestVersion` | GoogleApi.ContentWarehouse.V1.Model.CrawlerChangerateUrlVersion.t | The latest version we've seen. |

**CrawlerChangerateUrlChange** - 7 attributes (SEO-relevant subset shown; 12 total in full module)

| Attribute | Type | Description |
|---|---|---|
| `additionalChangesMerged` | integer() | Duplicate UrlChanges crawled within a specified time range will be merged together. UrlChanges are considered duplicates if the simhash, simhash_is_trusted, simhash_v2, simhash_v2_is_trusted, and shingle_simhash are the same. additional_changes_merged indiciates the number of duplicate UrlChanges merged into this UrlChange. |
| `offDomainLinksChange` | boolean() | Whether the content of the off-domain links changed. |
| `offDomainLinksCount` | integer() | The new count of off-domain links, if they changed. |
| `onDomainLinksCount` | integer() | The new count of on-domain links, if the count changed. |
| `onDomainLinksCountChange` | boolean() | Whether the number of on-domain links changed. |
| `simhashIsTrusted` | boolean() | Whether the simhash-v1 should be trusted. |
| `simhashV2IsTrusted` | boolean() | Whether the simhash-v2 value should be trusted. |

**CrawlerChangerateUrlVersion** - 6 attributes (SEO-relevant subset shown; 10 total in full module)

| Attribute | Type | Description |
|---|---|---|
| `additionalChangesMerged` | integer() | Same as the field in UrlChange. This allows us to merge identical UrlVersions into a single UrlVersion. |
| `contentType` | integer() | The content type of the page. |
| `simhash` | String.t | The simhash-v1 value. The simhash-v1 is now deprecated and new UrlVersions should only populate simhash-v2. During migration phase from using simhash-v1 to simhash-v2, it is possible that previous UrlChange only contain simhash-v1 and the next UrlChange / UrlVersion could only contain simhash-v2. In this case, we skip that interval in our changerate computation. [go/changerate-simhash-v2-migration] |
| `simhashIsTrusted` | boolean() | Whether the simhash-v1 should be trusted. |
| `simhashV2IsTrusted` | boolean() | Whether the simhash-v2 value should be trusted. |
| `timestamp` | integer() | The timestamp we crawled the page. |

**SnapshotSnapshotDocument** - 2 attributes

| Attribute | Type | Description |
|---|---|---|
| `metaNoSnippet` | boolean() | These are set from tags in the web page: |
| `imageNode` | list(GoogleApi.ContentWarehouse.V1.Model.SnapshotImageNode.t) | *(no description provided in leak)* |

**PerDocData** - freshness-relevant attributes (subset of 97 total)

| Attribute | Type | Description |
|---|---|---|
| `datesInfo` | String.t | Stores dates-related info (e.g. page is old based on its date annotations). Used in FreshnessTwiddler. Use encode/decode functions from quality/timebased/utils/dates-info-helper-inl.h |
| `lastSignificantUpdate` | String.t | Last significant update of the document. This is sourced from the quality_timebased.LastSignificantUpdate proto as computed by the LSUSelector from various signals. The value is a UNIX timestamp in seconds. |
| `lastSignificantUpdateInfo` | String.t | Metadata about last significant update. Currently this only encodes the quality_timebased.LastSignificantUpdate.source field which contains the info on the source of the signal. |
| `semanticDate` | integer() | SemanticDate, estimated date of the content of a document based on the contents of the document (via parsing), anchors and related documents. Date is encoded as a 32-bits UNIX date (1970 Jan 1 epoch). |
| `semanticDateInfo` | integer() | Info is encoded using a SemanticDate specific format. Contains confidence scores for day/month/year components as well as various meta data required by the freshness twiddlers. |
| `domainAge` | integer() | 16-bit |
| `hostAge` | integer() | The earliest firstseen date of all pages in this host/domain. These data are used in twiddler to sandbox fresh spam in serving time. It is 16 bit and the time is day number after 2005-12-31. |
| `isHotdoc` | boolean() | Set by the FreshDocs instant doc joiner. See //indexing/instant/hotdocs/README and |
| `freshboxArticleScores` | integer() | Stores scores of freshness-related classifiers: freshbox article score, live blog score and host-level article score. The encoding/decoding API is in quality/freshness/freshbox/goldmine/freshbox_annotation_encoder.h. |
| `freshnessEncodedSignals` | String.t | Stores freshness and aging related data, such as time-related quality metrics predicted from url-pattern level signals. Use the encoding decoding API in quality/freshness/docclassifier/aging/encoded-pattern-signals.h This field is deprecated. |
| `timeSensitivity` | integer() | Encoded Document Time Sensitivity signal. |
| `eventsDate` | list(String.t) | Date for Events. A web page might list multiple events with different dates. We only take one date (start date) per event. |
| `crawlerIdProto` | GoogleApi.ContentWarehouse.V1.Model.LogsProtoIndexingCrawlerIdCrawlerIdProto.t | For crawler-ID variations, the crawling context applied to the document. See go/url, and the description in google3/indexing/crawler_id |
| `inNewsstand` | boolean() | This field indicates whether the document is in the newsstand corpus. |
| `scaledSelectionTierRank` | integer() | Selection tier rank is a language normalized score ranging from 0-32767 over the serving tier (Base, Zeppelins, Landfills) for this document. |


**CompressedQualitySignals** - freshness-relevant attributes (subset of 35 total)

| Attribute | Type | Description |
|---|---|---|
| `navDemotion` | integer() | nav_demotion: converted from QualityBoost.nav_demoted.boost. |
| `siteAuthority` | integer() | site_authority: converted from quality_nsr.SiteAuthority, applied in Qstar. |
| `authorityPromotion` | integer() | authority promotion: converted from QualityBoost.authority.boost |

**IndexingDocjoinerDataVersion** - freshness/date/time-relevant attributes (subset of 428 total)

| Attribute | Type | Description |
|---|---|---|
| `dateAnnotations` | VersionInfo | *(versioned - timestamp tracked)* |
| `dateAnnotationTags` | VersionInfo | *(versioned - timestamp tracked)* |
| `timeAnnotations` | VersionInfo | *(versioned - timestamp tracked)* |
| `timeAnnotationTags` | VersionInfo | *(versioned - timestamp tracked)* |
| `dateTimeAnnotations` | VersionInfo | *(versioned - timestamp tracked)* |
| `relativeDateAnnotations` | VersionInfo | *(versioned - timestamp tracked)* |
| `dateRangeAnnotations` | VersionInfo | *(versioned - timestamp tracked)* |
| `timeRangeAnnotations` | VersionInfo | *(versioned - timestamp tracked)* |
| `qualityHistoricalContentAge` | VersionInfo | *(versioned - timestamp tracked)* |
| `qualityTimebasedTimeSensitivityTimeSensitivityAnnotation` | VersionInfo | *(versioned - timestamp tracked)* |
| `freshboxFreshboxArticleAnnotation` | VersionInfo | *(versioned - timestamp tracked)* |
| `indexingAnnotationsDatesDateTimes` | VersionInfo | *(versioned - timestamp tracked)* |
| `indexingFreshSchedulerFreshSchedulerDoubleInstantExtension` | VersionInfo | *(versioned - timestamp tracked)* |
| `indexingFreshSchedulerOutlinkDiscoveryHistoricalHubsSignal` | VersionInfo | *(versioned - timestamp tracked)* |
| `indexingSelectionFreshdocsPassthroughExtension` | VersionInfo | *(versioned - timestamp tracked)* |
| `qualityFreshnessAbacusInstantNegativeClicksInfo` | VersionInfo | *(versioned - timestamp tracked)* |
| `qualityRealtimeBoostRealtimeBoostResponse` | VersionInfo | *(versioned - timestamp tracked)* |
| `qualityRealtimeBoostRealtimeBoostEvent` | VersionInfo | *(versioned - timestamp tracked)* |
| `qualityRealtimeRtFactAnnotations` | VersionInfo | *(versioned - timestamp tracked)* |
| `qualityRealtimeRealtimeResultInfo` | VersionInfo | *(versioned - timestamp tracked)* |
| `newsCorpusLeafPageAnnotation` | VersionInfo | *(versioned - timestamp tracked)* |
| `newsCorpusHubPageAnnotations` | VersionInfo | *(versioned - timestamp tracked)* |
| `newsCrawlFilterNewsLinkCrawlSignal` | VersionInfo | *(versioned - timestamp tracked)* |
| `indexingInstantNewsImagesInfo` | VersionInfo | *(versioned - timestamp tracked)* |
| `knowledgeMumStorytimeStampEngagementAnnotation` | VersionInfo | *(versioned - timestamp tracked)* |
| `knowledgeMumStorytimeStampQualityAnnotation` | VersionInfo | *(versioned - timestamp tracked)* |
| `qualityPanopticStorytimeScoringSignals` | VersionInfo | *(versioned - timestamp tracked)* |
| `qualityPanopticStorytimeAnnotation` | VersionInfo | *(versioned - timestamp tracked)* |


**IndexingDocjoinerDataVersion** - freshness/date/time annotation tracks (subset of 428 total)

| Attribute | Type | Description |
|---|---|---|
| `dateAnnotations` | VersionInfo | Date annotations for the document |
| `dateAnnotationTags` | VersionInfo | Date annotation tags |
| `timeAnnotations` | VersionInfo | Time annotations for the document |
| `timeAnnotationTags` | VersionInfo | Time annotation tags |
| `dateTimeAnnotations` | VersionInfo | Combined date-time annotations |
| `relativeDateAnnotations` | VersionInfo | Relative date annotations |
| `dateRangeAnnotations` | VersionInfo | Date range annotations |
| `timeRangeAnnotations` | VersionInfo | Time range annotations |
| `qualityHistoricalContentAge` | VersionInfo | Historical content age quality signal |
| `qualityTimebasedTimeSensitivityTimeSensitivityAnnotation` | VersionInfo | Time sensitivity annotation |
| `freshboxFreshboxArticleAnnotation` | VersionInfo | Freshbox article freshness annotation |
| `indexingAnnotationsDatesDateTimes` | VersionInfo | Date-time indexing annotations |
| `indexingFreshSchedulerFreshSchedulerDoubleInstantExtension` | VersionInfo | Fresh scheduler double-instant extension |
| `indexingFreshSchedulerOutlinkDiscoveryHistoricalHubsSignal` | VersionInfo | Fresh scheduler outlink discovery from historical hubs |
| `indexingSelectionFreshdocsPassthroughExtension` | VersionInfo | FreshDocs passthrough extension |
| `qualityFreshnessAbacusInstantNegativeClicksInfo` | VersionInfo | Freshness Abacus instant negative clicks info |
| `qualityRealtimeBoostRealtimeBoostResponse` | VersionInfo | Real-time boost response |
| `qualityRealtimeBoostRealtimeBoostEvent` | VersionInfo | Real-time boost event |
| `qualityRealtimeRtFactAnnotations` | VersionInfo | Real-time fact annotations |
| `qualityRealtimeRealtimeResultInfo` | VersionInfo | Real-time result info |
| `newsCorpusLeafPageAnnotation` | VersionInfo | News corpus leaf page annotation |
| `newsCorpusHubPageAnnotations` | VersionInfo | News corpus hub page annotations |
| `newsCrawlFilterNewsLinkCrawlSignal` | VersionInfo | News crawl filter link crawl signal |
| `indexingInstantNewsImagesInfo` | VersionInfo | Instant news images info |
| `knowledgeMumStorytimeStampEngagementAnnotation` | VersionInfo | MUM storytime stamp engagement annotation |
| `knowledgeMumStorytimeStampQualityAnnotation` | VersionInfo | MUM storytime stamp quality annotation |
| `qualityPanopticStorytimeScoringSignals` | VersionInfo | Panoptic storytime scoring signals |
| `qualityPanopticStorytimeAnnotation` | VersionInfo | Panoptic storytime annotation |

**IndexingDocjoinerDataVersionVersionInfo** - 3 attributes (the version metadata type)

| Attribute | Type | Description |
|---|---|---|
| `considerationTimestampMicros` | String.t | Sometimes, a piece of data may not exist for a document (and we don't want to delete it), so timestamp_micros won't exist. However, consideration_timestamp_micros will be set to indicate we tried to update but found no data. |
| `humanReadableVersion` | String.t | *(no description provided in leak)* |
| `timestampMicros` | String.t | The timestamp when a piece of data is updated (or deleted if the data doesn't exist in the update). |

### Patent Analysis

##### US7346839B2 - Information retrieval based on historical data

- **Core concept:** Document scores are computed from multiple types of historical data: document inception dates, content change frequency, link age/velocity, domain registration data, traffic, user behavior, and ranking history.
- **Connected leak modules:** `PerDocData`, `QualityTimebasedSyntacticDate`, `QualityNsrNsrData`
- **SEO claims:**
  - History data types include: document inception dates, content update dates/changes, query analysis, link-based criteria, anchor text analysis, traffic, user behavior, domain-related information, ranking history, user bookmarks, unique words/bigrams/phrases in anchor text, linkage of independent peers, and document topics
  - Link age is scored by a decaying function - older links may carry less weight
  - Link freshness is determined by date of appearance/change of the link, anchor text, and containing document
  - Domain registration data (whois, DNS records) is monitored to predict legitimacy
  - Document age and update frequency feed into scoring - stale documents may be demoted for freshness-sensitive queries
  - Link velocity (rate of new link acquisition) is a signal - sudden spikes may indicate manipulation
  - User behavior history (clicks, dwell time over time) contributes to scoring
  - Ranking history is tracked - documents that maintain rankings over time build trust
- **SEO action:** Grow steadily. Link spikes and sudden swings read differently from consistent history, and history is a signal. The leak's `domainAge`, `hostAge`, `lastSignificantUpdate`, `semanticDate`, and `timeSensitivity` fields are the direct implementation.

##### US8549014B2 - Document scoring based on document content update

- **Core concept:** Documents are scored based on how their content changes over time - the magnitude, frequency, and nature of updates all feed into the scoring system.
- **Connected leak modules:** `PerDocData`, `QualityTimebasedSyntacticDate`, `QualityNsrNsrData`
- **SEO claims:**
  - A measure of how document content changes over time is computed
  - The score is based at least in part on the measure of content change
  - The difference between document versions is analyzed
  - How much changed (magnitude) and how often (frequency) are both measured
  - The date-of-change is compared against average dates of other search results
  - Meaningful updates (content changes) are distinguished from cosmetic changes
  - Search engine learns which queries recent changes are most important for
- **SEO action:** Update meaningfully, not cosmetically, and date honestly. How much changed and how often is measured. The leak's `lastSignificantUpdate` and `averageChangeSignificance` fields confirm update magnitude is tracked.

##### US8924379B1 - Temporal-based score adjustments

- **Core concept:** Document scores are adjusted based on temporal query patterns - when interest in a query spikes or trends, freshness weighting increases for relevant documents.
- **Connected leak modules:** `PerDocData`, `QualityTimebasedSyntacticDate`, `QualityNsrNsrData`
- **SEO claims:**
  - Time trend data is stored for queries across multiple time periods
  - Query popularity spikes are detected when popularity temporarily increases beyond a baseline
  - Documents responsive to spiking queries receive score adjustments
  - Age classifications for documents are determined based on related query classifications
  - Seasonal/temporal patterns are recognized (e.g., Thanksgiving recipes spike annually)
  - The temporal signal temporarily increases the ranking weight of fresh content when demand rises
  - Multiple spikes in popularity can indicate recurring temporal relevance
- **SEO action:** When your topic spikes, ship fresh coverage fast. Freshness weighs more exactly when demand rises. The leak's `isHotdoc`, `freshboxArticleScores`, and `timeSensitivity` fields confirm trending/freshness detection.

##### US9002867B1 - Modifying ranking data based on document changes

- **Core concept:** Quality-of-result statistics are tracked per document version, and when documents change, the ranking is updated using weighted version-specific quality data to reflect current content.
- **Connected leak modules:** `QualityNavboostCrapsCrapsClickSignals`, `PerDocData`, `QualityTimebasedSyntacticDate`
- **SEO claims:**
  - Quality of result statistics are tracked for pairs of queries and documents
  - Version-specific quality statistics are maintained for different versions of a document
  - When a document changes, overall quality is recomputed by weighting version-specific statistics
  - The system determines whether to use current or historical quality data based on the nature of the change
  - Past content quality influences how quickly new content quality is trusted
  - Ranking updates respond to document changes - what you edit after ranking matters
- **SEO action:** Keep improving pages that already rank. Edits after ranking are inputs, not cosmetics. The leak's `lastSignificantUpdate` and versioned data tracking confirm post-change quality is re-evaluated.

##### US8874558B1 - Promoting fresh content for authoritative channels

- **Core concept:** Channels (e.g., YouTube channels, blogs) are scored for topical authority based on content quality scores, topic distributions, and channel-level quality. New content from authoritative channels on their authoritative topics is promoted in search results.
- **Connected leak modules:** `QualityNsrNsrData`, `QualityNsrNsrDataClusterUplift`, `QualityNsrNsrDataMetadata`, `QualityTimebasedLastSignificantUpdate`, `QualityTimebasedSyntacticDate`, `QualityAuthorityTopicEmbeddingsVersionedItem`, `QualitySalientTermsSalientTermSet`, `QualitySalientTermsSignalData`, `QualitySalientTermsDocData`, `VideoPerDocData`, `BlogPerDocData`, `CompressedQualitySignals`
- **SEO claims:**
  - A channel's authority for a particular term is determined by: computing per-content-item quality scores, determining topic distributions for each content item, combining them into a channel-level score, normalizing by content quantity, and combining with a channel-level quality score
  - New content items from an authoritative channel relating to the channel's authoritative topic receive a boosted score if the time since publication is below a threshold - freshness + authority = promotion
  - The channel-level quality score is normalized by the total quantity of content items in the channel, preventing channels with few high-quality items from being over-rewarded
  - Channels with fewer content items than a threshold quantity are penalized in their authority score, requiring sufficient volume to establish topical authority
  - Topic distributions are generated by counting occurrences of terms associated with each topic in the content items
  - A list of authoritative channels for a particular topic is created and ranked, with channel position in the list determining relative authority
  - The age of the channel itself modifies the quality score - older channels may receive different treatment than newer ones
  - The authority score must satisfy a threshold for the channel to be identified as authoritative for a particular term
- **SEO action:** Build topical authority by consistently publishing high-quality content on a specific topic. New content from authoritative channels gets a freshness boost, but only if the channel has sufficient content volume. The leak's `QualityAuthorityTopicEmbeddings` and `NsrDataClusterUplift` modules confirm Google tracks per-channel topical authority and applies cluster-level uplift.

##### US8972391B1 - Recent interest based relevance scoring

- **Core concept:** A user's short-term category of interest is inferred from their recent search activity period, and search results are re-ranked by comparing category-specific selection statistics against general population selection statistics.
- **Connected leak modules:** `QualityNavboostCrapsCrapsClickSignals`, `QualityNavboostCrapsCrapsData`, `QualityFringeFringeQueryPriorPerDocData`, `QualityOrbitAsteroidBeltDocumentIntentScores`, `CompressedQualitySignals`, `PerDocData`
- **SEO claims:**
  - A short-term category of interest is determined by analyzing the user's recent search activity period, comparing queries submitted during that period with categories of selected search results
  - For each search result, a category selection value is calculated: the count of selections of that result as a portion of combined selection counts for all results responsive to the query, for users classified as having the same short-term category of interest
  - A general selection value is calculated as the same selection proportion but for all users regardless of category of interest
  - Category relevance is computed as the difference between the category selection value and the general selection value, and only results where this difference exceeds a threshold are selected for score adjustment
  - The ranking score is adjusted by combining the information retrieval score with the category relevance - either by multiplying or adding the category relevance to the IR score
  - Selections are weighted by the amount of time a user viewed the document referred to by the search result (dwell time weighting)
  - The short-term category of interest can be based on user-specific information including demographic information and location information
  - The category relevance must be statistically significant to trigger a score adjustment - statistically insignificant categories are excluded
  - A second category of interest can also be determined, enabling multi-category interest profiling
- **SEO action:** Google infers your users' short-term interests from their recent search sessions and re-ranks results based on category-specific click patterns. Optimize for category-relevant engagement. The leak's NavboostCraps click signals and OrbitAsteroidBelt intent scores confirm this category-based re-ranking is live.

##### US9390143B2 - Recent interest based relevance scoring (continuation)

- **Core concept:** A continuation of US8972391B1. A user's short-term category of interest is identified, and search results are re-ranked by comparing category-specific selection values against general selection values, adjusting the ranking score when the difference exceeds a threshold.
- **Connected leak modules:** `QualityNavboostCrapsCrapsClickSignals`, `QualityNavboostCrapsCrapsData`, `QualityFringeFringeQueryPriorPerDocData`, `QualityOrbitAsteroidBeltDocumentIntentScores`, `CompressedQualitySignals`, `PerDocData`
- **SEO claims:**
  - A short-term category of interest is identified for a user based on their search activity or web browsing history
  - For each search result, a category selection value (selection proportion among users with the same interest category) is compared to a general selection value (selection proportion among all users)
  - The ranking score is adjusted only when the difference between category and general selection values exceeds a threshold value, ensuring adjustments are statistically meaningful
  - The ranking score (information retrieval score) is combined with the category-general difference by multiplying the IR score by the difference
  - Similar users are identified, and if a portion of similar users have selected a search result, the ranking of that result is adjusted upward
  - The category selection value is computed as a count of selections of the search result as a portion of combined selection counts for all results responsive to the query, for users classified as having the short-term category of interest
  - The general selection value uses the same proportional measure but across all users regardless of interest category
- **SEO action:** This continuation confirms Google's ongoing use of short-term interest categories for re-ranking. Optimize for category-relevant engagement and ensure your content satisfies specific intent categories.

### SEO actions

- **Make real content updates, not cosmetic ones.** US8549014B2 confirms that "meaningful updates (content changes) are distinguished from cosmetic changes." The leak's `averageChangeSignificance` (0-1 scale) and `lastChangeSignificance` measure how much actually changed via simhash comparison. Changing a date tag or fixing a typo will not trigger a freshness boost - the simhash delta will be tiny and significance will be near zero.
- **Ensure date consistency across all signals.** The `QualityTimebasedSyntacticDate` cross-references byline dates, content-parsed dates, and anchor dates. `QualityTimebasedDateUnreliability` computes `dateVsContentageDistributionSkew` - if your claimed date doesn't match the content age distribution for your vertical, the date is flagged as unreliable and the exposure-adjusted unreliability score (`unreliableDatesScoreExposureAdjusted`) penalizes you proportionally to traffic. Use consistent dates in structured data, visible bylines, and sitemap `lastmod` fields.
- **Maintain a consistent update cadence on important pages.** US7346839B2 confirms "Document age and update frequency feed into scoring." The `CrawlerChangerateUrlChangerate.numIntervals` tracks how many version intervals Google has seen. Pages with a rich change history get better change-period estimates and faster recrawls. Erratic update patterns produce poor priors.
- **Publish fresh content on your core topic, not off-topic.** US8874558B1 shows that "freshness + authority = promotion" but only for "authoritative channels relating to the channel's authoritative topic." New content from a topically-consistent, high-volume channel gets a double boost. Content that drifts from your established topic does not get the authority multiplier. The channel's `QualityAuthorityTopicEmbeddings` and topic distribution determine what terms you are authoritative for.
- **Ship fast when your topic trends.** US8924379B1 confirms that "the temporal signal temporarily increases the ranking weight of fresh content when demand rises." The `isHotdoc` flag and `freshboxArticleScores` classify documents for the fresh-content system. When query popularity spikes (breaking news, seasonal events, trending topics), fresh documents get a temporary ranking weight increase - being first with good coverage matters disproportionately.
- **Monitor and fix date manipulation patterns.** The `QualityTimebasedPageType.isPageWithFreshRepeatedDates` flag catches pages with "a fresh repeated date sequence" - a manipulation pattern where dates are repeatedly updated without genuine content changes. The `upperboundTimestampInSeconds` in `QualityTimebasedLastSignificantUpdateAdjustments` caps the LSU at what passage-level timestamps can support. You cannot fake freshness by updating dates alone.
- **Understand that versioned quality tracking means edits after ranking matter.** US9002867B1 confirms "version-specific quality statistics are maintained for different versions of a document" and "past content quality influences how quickly new content quality is trusted." When you update a page, Google re-evaluates quality based on the new version, but your historical quality affects how quickly the new version is trusted. Keep improving pages that already rank - each meaningful update is a new version with its own quality evaluation.

- **Use structured data for dates and events.** The `IndexingDocjoinerDataVersion` module tracks `dateAnnotations`, `dateAnnotationTags`, `dateTimeAnnotations`, `relativeDateAnnotations`, `dateRangeAnnotations`, and `timeRangeAnnotations` - each versioned with `timestampMicros`. These annotations come from structured data parsing. Proper schema.org DatePublished, DateModified, and Event dates feed directly into the date annotation pipeline. Missing or inconsistent structured data means Google must rely on content parsing, which is less reliable and may trigger date unreliability flags.
- **Monitor FreshDocs inclusion for time-sensitive content.** The `indexingSelectionFreshdocsPassthroughExtension` and `indexingFreshSchedulerOutlinkDiscoveryHistoricalHubsSignal` entries in `IndexingDocjoinerDataVersion` show that Google maintains a fast-path for fresh content discovered via "historical hubs" - sites that consistently surface new content. If your site is not a historical hub, your fresh content may not enter the FreshDocs instant pipeline. Build a track record of being an early source for new content in your niche to become a historical hub.
- **Recognize that the FreshnessTwiddler uses `datesInfo` as its primary input.** The `PerDocData.datesInfo` field ("Stores dates-related info (e.g. page is old based on its date annotations). Used in FreshnessTwiddler") is the encoded input to the query-time freshness twiddler. This field aggregates date annotation information into a compact string. If your date annotations are inconsistent (structured data says one date, visible byline says another, content references suggest a third), the `datesInfo` encoding will reflect that inconsistency, and the FreshnessTwiddler will apply conservative freshness scoring.
- **Track `semanticDateInfo` confidence scores for your key pages.** The `PerDocData.semanticDateInfo` field ("Contains confidence scores for day/month/year components as well as various meta data required by the freshness twiddlers") encodes per-component confidence. If Google is confident about the year but not the day, freshness scoring is applied at year granularity. Structured data with precise dates (not just year) improves component-level confidence and enables more accurate freshness scoring.

---
