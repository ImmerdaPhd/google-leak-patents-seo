# Stage 11: Re-Ranking & Twiddler System

**Leak modules (12):** `CompressedQualitySignals`, `PerDocData` (twiddler subset), `QualityNsrNsrData` (boost/demotion subset), `IndexingSignalAggregatorAgeWeightedCoverageData`, `IndexingSignalAggregatorUrlScore`, `IndexingSignalAggregatorUrlPatternSignals`, `IndexingSignalAggregatorSccSignal`, `IndexingSignalAggregatorAdaptiveIntervalData`, `QualityNavboostCrapsCrapsClickSignals`, `QualityNavboostCrapsCrapsData`, `WeboftrustLiveResultDocBoostData`, `ImageContentQueryBoost`

**Relevant patents (14):** US8682892B1, US7716225B1, US7308643B1, US9165040B1, US9183499B1, US8694511B1, US8661029B1, US9514194B1, US8819006B1, US10025868B1, US8996520B2, US11036804B1, US11893034B2, US8051076B1

### What Happens Here

After the initial ranking pass retrieves and scores documents based on relevance, content quality, link authority, and user engagement signals, Google applies a layer of **twiddlers** - re-ranking functions that boost, demote, or filter results based on site-wide quality multipliers, device type, spam signals, freshness, specialized content rules, and user preferences. The leak's `CompressedQualitySignals` module (38 attributes) is the heart of this system: it encodes the actual boost/demotion multipliers applied in **Q\*** (Google's final scoring system) as compressed integers in the range [0, 1023], where float values in [0, 1] are converted using 10 bits to save indexing space. These signals represent the site-wide quality multiplier from Panda, the Reasonable Surfer link weighting model, product review promotions/demotions, exact-match domain demotions, scam detection, and much more.

The twiddler system is where site-wide quality meets page-level ranking. A page might rank well on content and link signals, but if the site's `pandaDemotion` or `babyPandaV2Demotion` is high, or if the `scamness` score triggers, the page gets demoted in the final re-ranking. Conversely, `authorityPromotion` and `siteAuthority` can boost pages from trusted sites above their raw relevance score. Twiddlers fire both before and after the main DocInfo request to the Mustang backend - the `PerDocData.socialgraphNodeNameFp` field is explicitly described as being "used in one of the superroot's PRE_DOC twiddlers as a lookup key" where "PRE_DOC = twiddlers firing before the DocInfo request is sent to the mustang backend." This means some re-ranking happens before the full scoring bundle is even assembled, while other twiddlers fire after initial scoring is complete.

This stage also encompasses the IndexingSignalAggregator system, which aggregates click and engagement signals across URL patterns and computes statistical distributions (mean, deviation, percentiles) that feed into the twiddler decisions. The `IndexingSignalAggregatorAgeWeightedCoverageData` module tracks time-decayed click data with separate counters for good clicks, bad clicks, image clicks, dwells from KnowledgePanel/WebAnswers, and LocalUniversal dwells - each with date tracking to enable temporal decay. The `IndexingSignalAggregatorAdaptiveIntervalData` module tracks the average time between clicks and dwells with prior weights, enabling Google to model click frequency patterns over time and detect when a page's engagement is accelerating or decaying.

---

### How this works

**1. The site-wide quality multiplier: Panda, NSR, and the Qstar scoring system.** Patent US8682892B1 (invented by Navneet Panda) describes the core mechanism: "Resources are grouped (e.g., by site/domain) and each group gets a group-specific modification factor" based on "the count of independent incoming links to the group" and "the count of reference queries (queries referencing the site)." Critically, "the modification factor acts as a multiplier on individual page scores within the group" and "bad pages in a group drag down the group's modification factor, affecting all pages in the group." The leak's `CompressedQualitySignals` module implements this directly. The `pandaDemotion` field is described as "This is the encoding of Panda fields in the proto SiteQualityFeatures in quality/q2/proto/site_quality_features.proto. The encoding/decoding is performed using functions from quality_coati::coati_util" - this is the Panda multiplier from the patent, encoded as an integer for storage efficiency. The `babyPandaDemotion` ("baby_panda_demotion: converted from QualityBoost.rendered.boost") and `babyPandaV2Demotion` ("New BabyPanda demotion, applied on top of Panda. This is meant to replace |baby_panda_demotion|") fields show that Google has iterated on the Panda algorithm with newer versions layered on top of the original. The `siteAuthority` field ("site_authority: converted from quality_nsr.SiteAuthority, applied in Qstar") and `authorityPromotion` ("authority promotion: converted from QualityBoost.authority.boost") are the positive counterparts - these are the boost multipliers for authoritative sites. The `lowQuality` field ("S2V low quality score: converted from quality_nsr.NsrData, applied in Qstar. See quality_nsr::util::ConvertNsrDataToLowQuality") is the site-wide quality demotion. All of these are explicitly described as "applied in Qstar" - Google's final scoring system - confirming that these are twiddler-level adjustments applied after initial ranking. The `nsrOverrideBid` field in `QualityNsrNsrData` ("This signal is used to unconditionally override NSR as a bid in Q*. Should only be used in case of emergency (see go/nsr-override-bid). To have any effect, the value should be present and greater than 0.001") reveals that Google has an emergency override mechanism - in critical situations, the NSR score can be manually set to a specific bid value, bypassing the normal computation entirely. The `QualityNsrNsrData.priorAdjustedNsr` field ("NSR - prior. Estimate of whether the site is above/below average NSR in its slice") shows that NSR is evaluated relative to a prior - a site's quality is judged not in absolute terms but relative to other sites in its category slice, meaning a site in a low-quality niche may have a lower absolute NSR but still score above its prior. The `siteQualityStddev` field ("Estimate of site's PQ rating stddev--spread of the page-level PQ ratings of a site") measures consistency - a site with highly variable page quality (some great pages, many terrible ones) has a high stddev, which can trigger additional scrutiny from the Panda multiplier.

**2. The Reasonable Surfer model: link weight by click probability and anchor validation.** Patent US7716225B1 describes the Reasonable Surfer model: "Links do not pass equal weight; the probability of a user clicking a link determines its ranking contribution." Link features that affect weight include "font size of anchor text, position in document (above/below fold, sidebar, footer, list position), font color and attributes, number of words in anchor text, actual words in anchor text, commerciality of anchor text, image link aspect ratio, context words before/after link, topical cluster of anchor text, whether link is same-host/domain." The leak's `CompressedQualitySignals` module connects to this through the `crapsNewUrlSignals`, `crapsNewHostSignals`, `crapsAbsoluteHostSignals`, and `crapsNewPatternSignals` fields - these carry the CRAPS (Click, Retrieval, and Action Prediction System) signals that track user behavior data used to train the click probability model. The `crapsAbsoluteHostSignals` field ("Impressions, unsquashed, host level, not to be used with compressed ratios. Not to be used in Pattern Data") provides the raw impression data at the host level, while the pattern signals track URL-level patterns. The `anchorMismatchDemotion` field ("anchor_mismatch_demotion: converted from QualityBoost.mismatched.boost") is directly relevant: it demotes pages where the anchor text doesn't match the page content - a signal that the Reasonable Surfer model's "actual words in anchor text" feature is being validated against page content. When anchor text says "best running shoes" but the page is about dress shoes, this demotion fires. Patent US7308643B1 (anchor tag indexing) confirms the other side of this: "Target documents are indexed using both their own content and the anchor text from all linking documents" and "Anchor text provides extrinsic information about documents - what others say about a page matters." The mismatch demotion thus checks whether what others say (anchor text) aligns with what the page actually contains. The `PerDocData.spamtokensContentScore` field ("For SpamTokens content scores. Used in SiteBoostTwiddler to determine whether a page is UGC Spam. See go/spamtokens-dd for details") shows that the SiteBoostTwiddler actively evaluates content tokens for spam patterns - another twiddler that operates on the compressed quality signal bundle.

**3. Product review boosts/demotions and specialized content quality systems.** The `CompressedQualitySignals` module reveals a full product review quality system. Six fields handle this: `productReviewPReviewPage` ("Fields product_review_p_review_page and product_review_p_uhq_page are for promoting/demoting HQ/LQ review pages in NGS. See go/pr-boosts for details. The possibility of a page being a review page"), `productReviewPUhqPage` ("The possibility of a page being a high quality review page"), `productReviewPPromotePage`, `productReviewPDemotePage`, `productReviewPPromoteSite`, and `productReviewPDemoteSite` ("Product review demotion/promotion confidences. (Times 1000 and floored)"). These fields implement a dual page-level and site-level promotion/demotion system for product review content - high-quality reviews get boosted, low-quality reviews get demoted, and these signals operate at both the individual page and the entire site level. The "(Times 1000 and floored)" encoding shows these are confidence scores multiplied by 1000 to preserve precision in integer storage. Beyond product reviews, the `ugcDiscussionEffortScore` ("UGC page quality signals. (Times 1000 and floored)") measures the effort level in user-generated content discussions - a forum thread with detailed, thoughtful responses scores higher than one with one-word answers. The `serpDemotion` field ("serp demotion: applied in Qstar") handles demotion of SERP-like pages - pages that look like search results pages themselves, which Google considers low-value. The `scamness` field ("Scam model score. Used as one of the web page quality qstar signals. Value range from 0 to 1023") and `unauthoritativeScore` ("Unauthoritative score. Used as one of the web page quality qstar signals") are scam and unauthoritative content demotions. The `exactMatchDomainDemotion` field ("exact_match_domain_demotion: converted from QualityBoost.emd.boost") is the well-known EMD demotion - exact-match domains get demoted when the domain name matches the query but the content quality doesn't justify the ranking. The `navDemotion` field ("nav_demotion: converted from QualityBoost.nav_demoted.boost") handles demotion of pages that are navigational targets but fail to meet quality thresholds for their navigational intent. The `experimentalQstarSignal`, `experimentalQstarDeltaSignal`, and `experimentalQstarSiteSignal` fields ("This field is") are experimental Qstar scoring signals - Google continuously tests new quality signals in production, and these fields carry the experimental variants alongside the stable ones.

**4. Signal aggregation and URL pattern analysis with time-decayed coverage data.** The `IndexingSignalAggregatorAgeWeightedCoverageData` module reveals how click signals are time-decayed and aggregated. The `chances` field ("Numbers below are all total in the decayed manner. To get rate of impression/clicks, divide by chances") is the denominator for all rate calculations - it represents decayed opportunities (impressions). The `clicksGood`, `clicksBad`, `clicksTotal`, `clicksImage`, and `clicksUnclassified` fields are all decayed click counts in their respective categories. The `dwells` field ("Dwells from KnowledgePanel and WebAnswers") tracks time spent on pages reached through Knowledge Panel and Web Answer features, while `luDwells` ("Dwells from LocalUniversal") tracks dwell time specifically for Local Universal search results. The `lastGoodClickDateInDays` ("Indicates the date when this document received the last good click. Note: The date is identified in terms of number of days since Epoch") and `lastDwellDateInDays` fields enable temporal decay - the system knows exactly when each signal was last refreshed, allowing it to weight recent signals more heavily. The `lastPseudoImpressionsDateInDays` field ("Indicates the date when this document received the last pseudo-impression. I.e., when it was retrieved as a result but GWS would not show it because of the document's age in the index") tracks pseudo-impressions - cases where the document was retrieved by the search system but not shown to the user because it was too old in the index. The `firstCoveragePagerankNs` field ("The pagerank when the url was serving for the first time") captures the page's authority at first serving - a baseline for measuring authority growth. The `IndexingSignalAggregatorAdaptiveIntervalData` module tracks click frequency patterns: `clicksGoodInterval`, `clicksTotalInterval`, `dwellsInterval`, and `luDwellsInterval` track the average time between events, while their `PriorWeight` counterparts (`clicksGoodPriorWeight`, `clicksTotalPriorWeight`, `dwellsPriorWeight`, `luDwellsPriorWeight`) provide Bayesian priors for smoothing. This means Google models not just how many clicks a page gets, but the tempo of those clicks - a page getting 10 good clicks per week consistently is scored differently from one getting 50 good clicks in one week then nothing. The `IndexingSignalAggregatorUrlScore.isImportant` field ("Whether this url has important signal. Used for keeping patterns that match too few URLs but some of them have good clicks") shows that individual URLs can be flagged as important even when their URL pattern is too sparse to generate reliable aggregate statistics - this prevents new but high-quality pages from being invisible to pattern-based twiddlers. The `IndexingSignalAggregatorUrlPatternSignals.pagerankScore` field references an `IndexingSignalAggregatorAggregatedScore` type, which (per the existing pipeline documentation) carries `meanScore`, `deviation`, `percentile`, `maxScoreUrl`, `minScoreUrl`, `numUrlsMatched`, `numUrlsWithSignal`, `patternsUsedInMediation`, and `signalId` - showing Google computes full statistical distributions across URL patterns and uses a mediation layer where multiple patterns contribute to the final signal.

**5. Quality propagation through the link graph and distance-based ranking demotion.** Patent US9183499B1 (Evaluating quality based on neighbor features) describes a quality model that "computes a second quality score for an entity using not just its own features, but also the quality scores of neighbor entities that link to it." The patent states: "A second quality score for a candidate entity is computed using a quality model that takes as inputs: a first quality score for the entity, neighbor features (quality scores of linked-to neighbor entities), and entity-specific feature values determined independent of neighbors." Critically, "Quality scores propagate ('smear') from entity to entity across the link graph as the model is iteratively applied and retrained, meaning the quality of distant neighbors eventually influences a candidate's score." The leak's `CompressedQualitySignals` module connects to this through the `experimentalNsrTeamData` and `experimentalNsrTeamWsjData` fields, which carry experimental NSR (Neural Site Ranking) team data including WSJ (Weighted Site Judgment) signals. The `QualityNsrNsrData.siteQualityStddev` field ("Estimate of site's PQ rating stddev--spread of the page-level PQ ratings of a site") is a direct input to the neighbor quality model - it measures how consistent a site's quality is across its pages. Patent US9165040B1 (Producing a ranking for pages using distances in a web-link graph) adds another dimension: "A set of trusted seed pages is selected as the starting point for distance computation" and "Link length is computed as a function of the number of outgoing links from the source page - more outbound links means longer link length." The formula is "alpha + log(|q|_out), where alpha is a non-negative value and |q|_out is out-degree." This means a link from a page with few outbound links passes more authority than a link from a page with many. The patent states "Shortest distance from seeds to a page determines its ranking score" and "Spam pages far from trusted seeds receive low scores naturally." The leak's `PerDocData.homepagePagerankNs` field ("The page-rank of the homepage of the site. Copied from the cdoc.doc().pagerank_ns() of the homepage") and `CompressedQualitySignals.siteAuthority` ("site_authority: converted from quality_nsr.SiteAuthority, applied in Qstar") confirm proximity-to-trust scoring - a site's homepage authority propagates to its subpages through the internal link graph. Patent US11893034B2 (Distance based search ranking demotion) adds geographic distance as a twiddler: "Local documents with locations far from the user device are eligible for demotion when a proximity measure exceeds a maximum locality distance" but "A location-independent search score component can preclude demotion - if the document's relevance without locality boost meets a preservation threshold, it is protected." This means strong content and authority can protect a page from distance-based demotion, but weak pages that are also geographically distant get doubly penalized.

**6. Device-specific twiddlers, population-based click weighting, and preferred site boosting.** Patent US11036804B1 describes device-specific adjustments: "Device type identifier is received with each query" and "Search results referencing resources with positive utility for the querying device are boosted relative to those without" but "the adjustment operation is skipped for navigational queries." The leak's `PerDocData.smartphoneData` field ("Additional metadata for smartphone documents in the Google index") and `PerDocData.voltData` field ("Contains page UX signals for VOLT ranking change") carry device-specific quality signals that feed device twiddlers. The `PerDocData.desktopInterstitials` field ("Contains desktop interstitials signal for VOLT ranking change") specifically tracks interstitial penalties on desktop. Patent US8694511B1 (Modifying search result ranking based on populations) describes multi-population click aggregation: "First click data aggregates weighted selections for the same country and language; second click data aggregates weighted selections for the same language across countries" and "The second (broader, language-level) click data is deemphasized relative to the first (narrower, country+language-level) click data." The leak's `QualityNavboostCrapsCrapsData` module implements this with its `country` field ("The two-letter uppercase country slice of the CrapsData") and `language` field ("The language slice of the CrapsData"). The `IndexingSignalAggregatorSccSignal` module provides the SCC (Site-level Click Count) aggregation with `clicksBad`, `clicksImage`, `clicksTotal`, and `numImageUrls` ("This represents the number of urls with image clicks. A url can have both image and non-image clicks, in which case we set num_image_urls to be the ratio of image_clicks vs total clicks") - showing image clicks are tracked separately from web clicks. Patent US10025868B1 (Preferred sites) reveals that user preferences create per-document boosting: "The ranking of search results referencing preferred sites is adjusted (boosted) based on the preference" and "Ranking adjustments for explicitly identified preferred sites are more aggressive than for inferred preferred sites, because there is high confidence the user desires these results." The leak's `PerDocData.queriesForWhichOfficial` field ("The set of (query, country, language) triples for which this document is considered to be the official page") shows that official page status is tracked per-query, per-country, per-language - a page can be official for one query in one locale but not another. The `WeboftrustLiveResultDocBoostData` module provides event-based boosting: `boostLevel` ("Identifies the degree to which the existence of this LiveResult should boost a query's score (when the query is performed within the hot_times range). This field is always in the range [0,1]") and `hotTimes` ("Specifies the time range within which this LiveResult is relevant. Used for deciding whether the rank of the corresponding page should be boosted") - this is a time-windowed boost for live results like sports scores or breaking news, where the boost only applies during the relevant time period.

**7. Native app normalization, rich content selection, and categorical quality re-ranking.** Patent US8996520B2 (Ranking of native application content) describes how app and web scores are unified: "Web resource scores and native application scores are normalized to a common scale using a normalization factor derived from apps that have corresponding web resources, enabling unified ranking." The normalization uses linear regression: "The normalization factor is determined by linearly regressing native application scores as a variable dependent on the corresponding web resource scores." The leak's `PerDocData.appsLink` field ("AppsLink contains Android application IDs in outlinks. It is used to improve results ranking within applications universal") and `PerDocData.launchAppInfo` field ("Info on how to launch a mobile app to consume this document's content, if applicable") connect to this - Google tracks the relationship between web pages and their corresponding app content, and quality signals are cross-attributed: "Relevance and quality signals are cross-attributed for web page resources and corresponding native applications, reducing underserving effects." Patent US8819006B1 (Rich content for query answers) describes a twiddler for answer-rich content: "A contextual query is generated combining elements from both the question query and the answer" and "First rich content items (in contextual set but NOT in both question and answer sets) meet the context condition and are preferentially selected" while "Second rich content items (in contextual set AND in question or answer set) are demoted relative to first items." This means images or videos that contextualize both the question and answer get boosted, while those relevant to only one get demoted - a specialized twiddler for answer features. Patent US8051076B1 (Demotion of repetitive search results) describes a session-level twiddler: "identifying one or more candidate search results, candidate search results being repetitive search results that have a relevancy score greater than the relevancy threshold" and "demoting the first candidate search result in the second set of search results by lowering the ranking." This means if a user sees the same result for two different queries in the same session, it gets demoted in subsequent results - Google tracks within-session repetition and actively suppresses results the user has already seen. The `PerDocData.compressedQualitySignals` field is the umbilical cord connecting all these twiddler signals to the per-doc scoring bundle - it embeds the entire `CompressedQualitySignals` proto into PerDocData so that every twiddler can access the compressed quality signals at query time without additional lookups.

**8. Freshness twiddlers, spam sandboxing, and the SCC signal pipeline.** The `PerDocData.datesInfo` field ("Stores dates-related info (e.g. page is old based on its date annotations). Used in FreshnessTwiddler. Use encode/decode functions from quality/timebased/utils/dates-info-helper-inl.h") explicitly names the FreshnessTwiddler - a dedicated twiddler that adjusts rankings based on date signals. The `PerDocData.semanticDateInfo` field ("Info is encoded using a SemanticDate specific format. Contains confidence scores for day/month/year components as well as various meta data required by the freshness twiddlers") shows that the freshness twiddlers use confidence-scored date components - a page with a high-confidence recent date gets a different freshness adjustment than one with a low-confidence or old date. The `PerDocData.freshboxArticleScores` field ("Stores scores of freshness-related classifiers: freshbox article score, live blog score and host-level article score") reveals that freshness is classified at multiple levels: individual article freshness, live blog freshness, and host-level article velocity. The `PerDocData.freshnessEncodedSignals` field ("Stores freshness and aging related data, such as time-related quality metrics predicted from url-pattern level signals") shows freshness signals are predicted from URL patterns - a URL pattern like /news/2024/ gets a different freshness prior than /guides/evergreen/. The `PerDocData.hostAge` field ("The earliest firstseen date of all pages in this host/domain. These data are used in twiddler to sandbox fresh spam in serving time") reveals the spam sandbox twiddler: new hosts/domains are sandboxed - their pages get suppressed in ranking until the host has accumulated enough age and trust. This is explicitly a twiddler-level mechanism ("used in twiddler to sandbox fresh spam in serving time"), not a pre-scoring filter. The `PerDocData.timeSensitivity` field ("Encoded Document Time Sensitivity signal") encodes how time-sensitive the content is - a page about breaking news has higher time sensitivity than a page about historical facts, and the freshness twiddler adjusts accordingly. Multiple spam signals feed into twiddler decisions: `PerDocData.DocLevelSpamScore` ("The document spam score is represented as a 7-bits, going from 0 to 127"), `PerDocData.KeywordStuffingScore` ("The keyword stuffing score is represented in 7 bits, going from 0 to 127"), `PerDocData.GibberishScore` ("The gibberish score is represented in 7 bits, going from 0 to 127"), `PerDocData.SpamWordScore` ("The spamword score is represented in 7-bits, going from 0 to 127"), `PerDocData.OriginalContentScore` ("The original content score is represented as a 7-bits, going from 0 to 127. Only pages with little content have this field"), `PerDocData.spamrank` ("The spamrank measures the likelihood that this document links to known spammers. Its value is between 0 and 65535"), `PerDocData.uacSpamScore` ("The uac spam score is represented in 7 bits, going from 0 to 127. Threshold is 64. Score >= 64 is considered as uac spam"), `PerDocData.trendspamScore` ("For now, the count of matching trendspam queries"), and multiple SpamBrain scores. Each of these 7-bit scores (0-127 range) represents a different spam dimension, and the threshold-based design (e.g., uacSpamScore >= 64 = spam) shows that twiddlers use binary trigger conditions on top of continuous scores.

**9. Experimental scoring, versioned data, and the twiddler experimentation framework.** Google continuously experiments with new quality signals alongside stable ones. The `CompressedQualitySignals.experimentalQstarSignal`, `experimentalQstarDeltaSignal`, and `experimentalQstarSiteSignal` fields are experimental variants of the Qstar scoring system - they carry new quality signal computations being tested in production. The `experimentalNsrTeamData` and `experimentalNsrTeamWsjData` fields carry experimental NSR team data and WSJ (Weighted Site Judgment) data. The versioned data system enables continuous evaluation: `nsrVersionedData` ("Versioned NSR score to be used in continuous evaluation of the upcoming NSR version and assess quality impact on various slices"), `pairwiseqVersionedData` ("Versioned PairwiseQ score to be used in continuous evaluation of the upcoming PairwiseQ versions and assess quality impact on various slices"), and `topicEmbeddingsVersionedData` ("Versioned TopicEmbeddings data to be populated later into superroot / used directly in scorers") all carry upcoming versions of their respective signals alongside the current versions, allowing Google to measure the quality impact of signal updates before deploying them. The `QualityNsrNsrData.versionedData` field ("Versioned map of NSR values for experimenting with the next release") and `ketoVersionedData` field ("Keto data") show that multiple signal systems use the versioned experimentation framework. The `QualityNsrNsrData.nsrEpoch` field ("The epoch from which this NSR value is coming from") tracks which NSR computation epoch produced the current score, enabling A/B comparison across epochs. The `PerDocData.scaledSelectionTierRank` field ("Selection tier rank is a language normalized score ranging from 0-32767 over the serving tier (Base, Zeppelins, Landfills) for this document. This is converted back to fractional position within the index tier by scaled_selection_tier_rank/32767") shows that documents are normalized by language and tier - a document's position in the index is language-normalized before twiddlers are applied. This is the mechanism by which Google ensures fair comparison across different language indexes: a document in the French index at tier rank 30000 is not directly comparable to one in the English index at the same rank, but the language normalization makes them comparable for twiddler purposes. The `QualityNsrNsrData.smallPersonalSite` field ("Score of small personal site promotion go/promoting-personal-blogs-v1") reveals a dedicated promotion signal for small personal sites - Google actively boosts personal blogs and small independent sites, counteracting the tendency for large commercial sites to dominate. The `QualityNsrNsrData.isElectionAuthority` ("Bit to determine whether the site has the election authority signal, as computed by go/election-authority") and `isCovidLocalAuthority` ("Bit to determine whether the site has the local authority covid signal, as computed by go/covid-local-authority") fields show that Google has topic-specific authority twiddlers - certain sensitive topics (elections, COVID) get dedicated authority signals that override general quality scoring.

---

### Leak attributes relevant to Stage 11

**CompressedQualitySignals** - 38 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| CompressedQualitySignals | `productReviewPPromotePage` | `integer()` | *(no description provided in leak)* |
| CompressedQualitySignals | `experimentalQstarDeltaSignal` | `number()` | This field is |
| CompressedQualitySignals | `productReviewPDemoteSite` | `integer()` | Product review demotion/promotion confidences. (Times 1000 and floored) |
| CompressedQualitySignals | `experimentalQstarSiteSignal` | `number()` | This field is |
| CompressedQualitySignals | `exactMatchDomainDemotion` | `integer()` | Page quality signals converted from fields in proto QualityBoost in quality/q2/proto/quality-boost.proto. To save indexing space, we convert the float values in [0, 1] to integers in range [0, 1023] (use 10 bits). exact_match_domain_demotion: converted from QualityBoost.emd.boost. |
| CompressedQualitySignals | `nsrVersionedData` | `list(GoogleApi.ContentWarehouse.V1.Model.NSRVersionedItem.t)` | Versioned NSR score to be used in continuous evaluation of the upcoming NSR version and assess quality impact on various slices. This field is deprecated - used the equivalent field inside nsr_data_proto instead. |
| CompressedQualitySignals | `nsrConfidence` | `integer()` | NSR confidence score: converted from quality_nsr.NsrData. This field is deprecated - use nsr_variance inside nsr_data_proto instead. |
| CompressedQualitySignals | `lowQuality` | `integer()` | S2V low quality score: converted from quality_nsr.NsrData, applied in Qstar. See quality_nsr::util::ConvertNsrDataToLowQuality. |
| CompressedQualitySignals | `navDemotion` | `integer()` | nav_demotion: converted from QualityBoost.nav_demoted.boost. |
| CompressedQualitySignals | `siteAuthority` | `integer()` | site_authority: converted from quality_nsr.SiteAuthority, applied in Qstar. |
| CompressedQualitySignals | `crapsNewUrlSignals` | `String.t` | For craps |
| CompressedQualitySignals | `babyPandaV2Demotion` | `integer()` | New BabyPanda demotion, applied on top of Panda. This is meant to replace |baby_panda_demotion|. |
| CompressedQualitySignals | `authorityPromotion` | `integer()` | authority promotion: converted from QualityBoost.authority.boost |
| CompressedQualitySignals | `crapsAbsoluteHostSignals` | `integer()` | Impressions, unsquashed, host level, not to be used with compressed ratios. Not to be used in Pattern Data. |
| CompressedQualitySignals | `productReviewPPromoteSite` | `integer()` | *(no description provided in leak)* |
| CompressedQualitySignals | `nsrOverrideBid` | `number()` | NSR override bid, used in Q* for emergency overrides. This field is deprecated - used the equivalent field inside nsr_data_proto instead. |
| CompressedQualitySignals | `babyPandaDemotion` | `integer()` | baby_panda_demotion: converted from QualityBoost.rendered.boost. |
| CompressedQualitySignals | `serpDemotion` | `integer()` | serp demotion: applied in Qstar. |
| CompressedQualitySignals | `anchorMismatchDemotion` | `integer()` | anchor_mismatch_demotion: converted from QualityBoost.mismatched.boost. |
| CompressedQualitySignals | `crapsNewHostSignals` | `String.t` | *(no description provided in leak)* |
| CompressedQualitySignals | `experimentalQstarSignal` | `number()` | This field is |
| CompressedQualitySignals | `scamness` | `integer()` | Scam model score. Used as one of the web page quality qstar signals. Value range from 0 to 1023. |
| CompressedQualitySignals | `crapsUnscaledIpPriorBadFraction` | `integer()` | *(no description provided in leak)* |
| CompressedQualitySignals | `pandaDemotion` | `integer()` | This is the encoding of Panda fields in the proto SiteQualityFeatures in quality/q2/proto/site_quality_features.proto. The encoding/decoding is performed using functions from quality_coati::coati_util. |
| CompressedQualitySignals | `unauthoritativeScore` | `integer()` | Unauthoritative score. Used as one of the web page quality qstar signals. |
| CompressedQualitySignals | `experimentalNsrTeamWsjData` | `list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrExperimentalNsrTeamWSJData.t)` | This field is |
| CompressedQualitySignals | `experimentalNsrTeamData` | `GoogleApi.ContentWarehouse.V1.Model.QualityNsrExperimentalNsrTeamData.t` | This field is |
| CompressedQualitySignals | `productReviewPReviewPage` | `integer()` | Fields product_review_p_review_page and product_review_p_uhq_page are for promoting/demoting HQ/LQ review pages in NGS. See go/pr-boosts for details. The possibility of a page being a review page. |
| CompressedQualitySignals | `crapsNewPatternSignals` | `String.t` | *(no description provided in leak)* |
| CompressedQualitySignals | `vlqNsr` | `integer()` | NSR for low-quality videos, converted from quality_nsr.NsrData.vlq_nsr. This field is deprecated - used the equivalent field inside nsr_data_proto instead. |
| CompressedQualitySignals | `productReviewPDemotePage` | `integer()` | *(no description provided in leak)* |
| CompressedQualitySignals | `ugcDiscussionEffortScore` | `integer()` | UGC page quality signals. (Times 1000 and floored) |
| CompressedQualitySignals | `productReviewPUhqPage` | `integer()` | The possibility of a page being a high quality review page. |
| CompressedQualitySignals | `topicEmbeddingsVersionedData` | `list(GoogleApi.ContentWarehouse.V1.Model.QualityAuthorityTopicEmbeddingsVersionedItem.t)` | Versioned TopicEmbeddings data to be populated later into superroot / used directly in scorers. |
| CompressedQualitySignals | `pairwiseqVersionedData` | `list(GoogleApi.ContentWarehouse.V1.Model.PairwiseQVersionedItem.t)` | Versioned PairwiseQ score to be used in continuous evaluation of the upcoming PairwiseQ versions and assess quality impact on various slices. |
| CompressedQualitySignals | `pqData` | `integer()` | Encoded page-level PQ signals. |
| CompressedQualitySignals | `pairwiseqScoringData` | `GoogleApi.ContentWarehouse.V1.Model.PairwiseQScoringData.t` | Deprecated and unused field. |
| CompressedQualitySignals | `pqDataProto` | `GoogleApi.ContentWarehouse.V1.Model.QualityNsrPQData.t` | Stripped page-level signals, not present in the encoded field 'pq_data'. |

**PerDocData** (twiddler-relevant subset) - 41 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| PerDocData | `uacSpamScore` | `integer()` | The uac spam score is represented in 7 bits, going from 0 to 127. Threshold is 64. Score >= 64 is considered as uac spam. |
| PerDocData | `spamtokensContentScore` | `number()` | For SpamTokens content scores. Used in SiteBoostTwiddler to determine whether a page is UGC Spam. See go/spamtokens-dd for details. |
| PerDocData | `spamMuppetSignals` | `GoogleApi.ContentWarehouse.V1.Model.SpamMuppetjoinsMuppetSignals.t` | Contains hacked site signals which will be used in query time joins. As of Oct'19, the field is stored in a separate corpus. It'll only be populated for in-flight requests between retrieve and full-score in perdocdata. So no extra storage is needed on muppet side. |
| PerDocData | `trendspamScore` | `integer()` | For now, the count of matching trendspam queries. |
| PerDocData | `ScaledSpamScoreYoram` | `integer()` | Spamscores are represented as a 7-bit integer, going from 0 to 127. |
| PerDocData | `datesInfo` | `String.t` | Stores dates-related info (e.g. page is old based on its date annotations). Used in FreshnessTwiddler. Use encode/decode functions from quality/timebased/utils/dates-info-helper-inl.h |
| PerDocData | `pagerank2` | `number()` | *(no description provided in leak)* |
| PerDocData | `spambrainData` | `GoogleApi.ContentWarehouse.V1.Model.SpamBrainData.t` | Host-v1 sitechunk level scores coming from spambrain. |
| PerDocData | `homepagePagerankNs` | `integer()` | The page-rank of the homepage of the site. Copied from the cdoc.doc().pagerank_ns() of the homepage. |
| PerDocData | `topPetacatTaxId` | `integer()` | Top petacat of the site. Used in SiteboostTwiddler to determine result/query matching. |
| PerDocData | `OriginalContentScore` | `integer()` | The original content score is represented as a 7-bits, going from 0 to 127. Only pages with little content have this field. The actual original content score ranges from 0 to 512. It is encoded with quality_q2::OriginalContentUtil::EncodeOriginalContentScore(). To decode the value, use quality_q2::OriginalContentUtil::DecodeOriginalContentScore(). |
| PerDocData | `DocLevelSpamScore` | `integer()` | The document spam score is represented as a 7-bits, going from 0 to 127. |
| PerDocData | `urlPoisoningData` | `GoogleApi.ContentWarehouse.V1.Model.UrlPoisoningData.t` | Contains url poisoning data for suppressing spam documents. |
| PerDocData | `scaledSelectionTierRank` | `integer()` | Selection tier rank is a language normalized score ranging from 0-32767 over the serving tier (Base, Zeppelins, Landfills) for this document. This is converted back to fractional position within the index tier by scaled_selection_tier_rank/32767. |
| PerDocData | `pagerank` | `number()` | Experimental pageranks (DEPRECATED; only pagerank in MustangBasicInfo is used). |
| PerDocData | `nsrIsCovidLocalAuthority` | `boolean()` | This field is propagated to shards. In addition, it is populated at serving time by go/web-signal-joins. This field is deprecated - used the equivalent field inside nsr_data_proto instead. |
| PerDocData | `ScaledSpamScoreEric` | `integer()` | *(no description provided in leak)* |
| PerDocData | `ScaledExptSpamScoreEric` | `integer()` | *(no description provided in leak)* |
| PerDocData | `semanticDate` | `integer()` | SemanticDate, estimated date of the content of a document based on the contents of the document (via parsing), anchors and related documents. Date is encoded as a 32-bits UNIX date (1970 Jan 1 epoch). Confidence is encoded using a SemanticDate specific format. For details of encoding, please refer to quality/freshness/docclassifier/semanticdate/public/semantic_date.proto |
| PerDocData | `pagerank1` | `number()` | *(no description provided in leak)* |
| PerDocData | `spamCookbookAction` | `GoogleApi.ContentWarehouse.V1.Model.SpamCookbookAction.t` | Actions based on Cookbook recipes that match the page. |
| PerDocData | `socialgraphNodeNameFp` | `String.t` | For Social Search we store the fingerprint of the SG node name. This is used in one of the superroot's PRE_DOC twiddlers as a lookup key for the full Social Search data. PRE_DOC = twiddlers firing before the DocInfo request is sent to the mustang backend. |
| PerDocData | `urlAfterRedirectsFp` | `String.t` | These two fingerprints are used for de-duping results in a twiddler. They should only be populated by freshdocs, and will only be present for documents that are chosen to be canonicals in a cluster whose previous canonical is also in the index. Additionally, url_after_redirects_fp is only present if it is different from a fingerprint of the URL. |
| PerDocData | `KeywordStuffingScore` | `integer()` | The keyword stuffing score is represented in 7 bits, going from 0 to 127. |
| PerDocData | `spambrainTotalDocSpamScore` | `number()` | The document total spam score identified by spambrain, going from 0 to 1. |
| PerDocData | `crawlPagerank` | `integer()` | This field is used internally by the docjoiner to forward the crawl pageranks from original canonicals to canonicals we actually chose; outside sources should not set it, and it should not be present in actual docjoins or the index. |
| PerDocData | `ScaledExptSpamScoreYoram` | `integer()` | *(no description provided in leak)* |
| PerDocData | `spamrank` | `integer()` | The spamrank measures the likelihood that this document links to known spammers. Its value is between 0 and 65535. |
| PerDocData | `hostAge` | `integer()` | The earliest firstseen date of all pages in this host/domain. These data are used in twiddler to sandbox fresh spam in serving time. It is 16 bit and the time is day number after 2005-12-31, and all the previous time are set to 0. If this url's host_age == domain_age, then omit domain_age Please use //spam/content/siteage-util.h to convert the day between epoch second. Regarding usage of Sentinel values: We would like to check if a value exists in scoring bundle while using in Ranklab AST. For t |
| PerDocData | `GibberishScore` | `integer()` | The gibberish score is represented in 7 bits, going from 0 to 127. |
| PerDocData | `toolbarPagerank` | `integer()` | A copy of the value stored in /namespace/indexing/wwwglobal//fakepr/* for this document. A value of quality_bakery::FakeprUtils::kUnknownToolbarPagerank indicates that we don't have toolbar pagerank for this document. A value between 0 and 10 (inclusive) means that this is the toolbar pagerank of the page. Finally, if this value is not set it means that the toolbar pagerank is equivalent to: quality_bakery::FakeprUtils::EstimatePreDemotionFromPagerankNearestSeeds( basic_info.pagerank_ns()) calle |
| PerDocData | `freshboxArticleScores` | `integer()` | Stores scores of freshness-related classifiers: freshbox article score, live blog score and host-level article score. The encoding/decoding API is in quality/freshness/freshbox/goldmine/freshbox_annotation_encoder.h. To use this field, you MUST join g/pq-classifiers-announce and add your use case at |
| PerDocData | `nsrIsElectionAuthority` | `boolean()` | This field is propagated to shards. It will also be populated at serving time by go/web-signal-joins (see b/168114815). This field is deprecated - used the equivalent field inside nsr_data_proto instead. |
| PerDocData | `IsAnchorBayesSpam` | `boolean()` | Is this document considered spam by the anchor bayes classifier? |
| PerDocData | `pagerank0` | `number()` | *(no description provided in leak)* |
| PerDocData | `SpamWordScore` | `integer()` | The spamword score is represented in 7-bits, going from 0 to 127. |
| PerDocData | `semanticDateInfo` | `integer()` | Info is encoded using a SemanticDate specific format. Contains confidence scores for day/month/year components as well as various meta data required by the freshness twiddlers. |
| PerDocData | `ScaledLinkAgeSpamScore` | `integer()` | End DEPRECATED ------------------------------------------------------------ Link age score is represented as a 7-bit integer, going from 0 to 127. |
| PerDocData | `spambrainDomainSitechunkData` | `GoogleApi.ContentWarehouse.V1.Model.SpamBrainData.t` | Domain sitechunk level scores coming from spambrain. |
| PerDocData | `freshnessEncodedSignals` | `String.t` | Stores freshness and aging related data, such as time-related quality metrics predicted from url-pattern level signals. Use the encoding decoding API in quality/freshness/docclassifier/aging/encoded-pattern-signals.h This field is deprecated. |
| PerDocData | `compressedQualitySignals` | `GoogleApi.ContentWarehouse.V1.Model.CompressedQualitySignals.t` | *(no description provided in leak)* |

**QualityNsrNsrData** (boost/demotion/override subset) - 23 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| QualityNsrNsrData | `siteChunkSource` | `String.t` | These are only annotated in the Goldmine NSR annotator. |
| QualityNsrNsrData | `chardVariance` | `number()` | *(no description provided in leak)* |
| QualityNsrNsrData | `chardScoreVariance` | `list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrVersionedFloatSignal.t)` | Site-level Chard Variance for all pages of a site. |
| QualityNsrNsrData | `nsrdataFromFallbackPatternKey` | `boolean()` | If true indicates that we do not have NSR data computed for the chunk, and instead the data is coming from an average of other host chunks. |
| QualityNsrNsrData | `nsr` | `number()` | *(no description provided in leak)* |
| QualityNsrNsrData | `siteChunk` | `String.t` | Primary NSR sitechunk. In most of the cases it's same as HOST_LEVEL_V3 sitechunked canonical url of the document. In rare, but important cases it's based on page markup (see quality/nsr/util/sitechunker.h for details). |
| QualityNsrNsrData | `nsrEpoch` | `String.t` | The epoch from which this NSR value is coming from. |
| QualityNsrNsrData | `nsrOverrideBid` | `number()` | This signal is used to unconditionally override NSR as a bid in Q*. Should only be used in case of emergency (see go/nsr-override-bid). To have any effect, the value should be present and greater than 0.001. |
| QualityNsrNsrData | `siteQualityStddev` | `number()` | Estimate of site's PQ rating stddev--spread of the page-level PQ ratings of a site. Note this is different from nsr_variance which predicts error of NSR itself from the aggregated site-level rating. |
| QualityNsrNsrData | `secondarySiteChunk` | `String.t` | Secondary NSR sitechunk. When present, it provides more granular chunking than primary sitechunks (see quality/nsr/util/sitechunker.h for details). |
| QualityNsrNsrData | `versionedData` | `list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrNSRVersionedData.t)` | Versioned map of NSR values for experimenting with the next release. |
| QualityNsrNsrData | `isElectionAuthority` | `boolean()` | Bit to determine whether the site has the election authority signal, as computed by go/election-authority |
| QualityNsrNsrData | `priorAdjustedNsr` | `list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrVersionedFloatSignal.t)` | NSR - prior. Estimate of whether the site is above/below average NSR in its slice. |
| QualityNsrNsrData | `vlqNsr` | `number()` | NSR from a headroom model targeting low-quality video sites. |
| QualityNsrNsrData | `nsrVariance` | `number()` | *(no description provided in leak)* |
| QualityNsrNsrData | `smallPersonalSite` | `number()` | Score of small personal site promotion go/promoting-personal-blogs-v1 |
| QualityNsrNsrData | `isVideoFocusedSite` | `boolean()` | Bit to determine whether the site has mostly video content, but is not hosted on any known video-hosting domains. Site is considered to be video-focused, if it has > 50% of the URLs with watch pages (with smoothing prior). ariane/4045246 |
| QualityNsrNsrData | `siteQualityStddevs` | `list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrVersionedFloatSignal.t)` | *(no description provided in leak)* |
| QualityNsrNsrData | `videoScore` | `number()` | *(no description provided in leak)* |
| QualityNsrNsrData | `shoppingScore` | `number()` | *(no description provided in leak)* |
| QualityNsrNsrData | `localityScore` | `number()` | Locality score of the site, i.e. the locality component of the LocalAuthority signal (see go/pq-localauthority). |
| QualityNsrNsrData | `isCovidLocalAuthority` | `boolean()` | Bit to determine whether the site has the local authority covid signal, as computed by go/covid-local-authority |
| QualityNsrNsrData | `vlq` | `number()` | Score of the Video LQ model. |

**IndexingSignalAggregatorAgeWeightedCoverageData** - 14 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| IndexingSignalAggregatorAgeWeightedCoverageData | `chances` | `float()` | Numbers below are all total in the decayed manner. To get rate of impression/clicks, divide by chances. |
| IndexingSignalAggregatorAgeWeightedCoverageData | `clicksBad` | `float()` | *(no description provided in leak)* |
| IndexingSignalAggregatorAgeWeightedCoverageData | `clicksGood` | `float()` | *(no description provided in leak)* |
| IndexingSignalAggregatorAgeWeightedCoverageData | `clicksImage` | `float()` | *(no description provided in leak)* |
| IndexingSignalAggregatorAgeWeightedCoverageData | `clicksTotal` | `float()` | *(no description provided in leak)* |
| IndexingSignalAggregatorAgeWeightedCoverageData | `clicksUnclassified` | `float()` | *(no description provided in leak)* |
| IndexingSignalAggregatorAgeWeightedCoverageData | `dwells` | `float()` | Dwells from KnowledgePanel and WebAnswers. |
| IndexingSignalAggregatorAgeWeightedCoverageData | `firstCoveragePagerankNs` | `integer()` | The pagerank when the url was serving for the first time. |
| IndexingSignalAggregatorAgeWeightedCoverageData | `intervalData` | `GoogleApi.ContentWarehouse.V1.Model.IndexingSignalAggregatorAdaptiveIntervalData.t` | Interval Data to track the average time between clicks_total, clicks_good, and ctr_weighted_impression. |
| IndexingSignalAggregatorAgeWeightedCoverageData | `lastDwellDateInDays` | `integer()` | Indicates the date when this document received the last KnowledgePanel or WebAnswer dwell. Note: The date is identified in terms of number of days since Epoch. |
| IndexingSignalAggregatorAgeWeightedCoverageData | `lastGoodClickDateInDays` | `integer()` | Indicates the date when this document received the last good click. Note: The date is identified in terms of number of days since Epoch. |
| IndexingSignalAggregatorAgeWeightedCoverageData | `lastLuDwellDateInDays` | `integer()` | Indicates the date when this document received the last LocalUniversal dwell. Note: The date is identified in terms of number of days since Epoch. |
| IndexingSignalAggregatorAgeWeightedCoverageData | `luDwells` | `float()` | Dwells from LocalUniversal. |
| IndexingSignalAggregatorAgeWeightedCoverageData | `lastPseudoImpressionsDateInDays` | `integer()` | Indicates the date when this document received the last pseudo-impression. I.e., when it was retrieved as a result but GWS would not show it because of the document's age in the index. Note: The date is identified in terms of number of days since Epoch. |

**IndexingSignalAggregatorSccSignal** - 4 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| IndexingSignalAggregatorSccSignal | `clicksBad` | `float()` | *(no description provided in leak)* |
| IndexingSignalAggregatorSccSignal | `clicksImage` | `float()` | *(no description provided in leak)* |
| IndexingSignalAggregatorSccSignal | `clicksTotal` | `float()` | *(no description provided in leak)* |
| IndexingSignalAggregatorSccSignal | `numImageUrls` | `float()` | This represents the number of urls with image clicks. A url can have both image and non-image clicks, in which case we set num_image_urls to be the ratio of image_clicks vs total clicks. For example, if a url has 10 total clicks and 7 image clicks, num_image_urls will be set to 0.7. |

**IndexingSignalAggregatorAdaptiveIntervalData** - 8 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| IndexingSignalAggregatorAdaptiveIntervalData | `clicksGoodInterval` | `float()` | *(no description provided in leak)* |
| IndexingSignalAggregatorAdaptiveIntervalData | `clicksGoodPriorWeight` | `float()` | *(no description provided in leak)* |
| IndexingSignalAggregatorAdaptiveIntervalData | `clicksTotalInterval` | `float()` | *(no description provided in leak)* |
| IndexingSignalAggregatorAdaptiveIntervalData | `clicksTotalPriorWeight` | `float()` | *(no description provided in leak)* |
| IndexingSignalAggregatorAdaptiveIntervalData | `dwellsInterval` | `float()` | *(no description provided in leak)* |
| IndexingSignalAggregatorAdaptiveIntervalData | `dwellsPriorWeight` | `float()` | *(no description provided in leak)* |
| IndexingSignalAggregatorAdaptiveIntervalData | `luDwellsInterval` | `float()` | *(no description provided in leak)* |
| IndexingSignalAggregatorAdaptiveIntervalData | `luDwellsPriorWeight` | `float()` | *(no description provided in leak)* |

**IndexingSignalAggregatorUrlScore** - 1 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| IndexingSignalAggregatorUrlScore | `isImportant` | `boolean()` | Whether this url has important signal. Used for keeping patterns that match too few URLs but some of them have good clicks. |

**IndexingSignalAggregatorUrlPatternSignals** - 1 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| IndexingSignalAggregatorUrlPatternSignals | `pagerankScore` | `GoogleApi.ContentWarehouse.V1.Model.IndexingSignalAggregatorAggregatedScore.t` | *(no description provided in leak)* |

**WeboftrustLiveResultDocBoostData** - 2 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| WeboftrustLiveResultDocBoostData | `boostLevel` | `number()` | Identifies the degree to which the existence of this LiveResult should boost a query's score (when the query is performed within the hot_times range). This field is always in the range [0,1]. A missing field, a value of 0, or a value outside the legal range indicates that no boosting is performed. A value of 1 indicates that the maximum level of boosting will be applied. This field will be updated from time to time based on CTR and other signals. |
| WeboftrustLiveResultDocBoostData | `hotTimes` | `GoogleApi.ContentWarehouse.V1.Model.WeboftrustTimeRange.t` | Specifies the time range within which this LiveResult is relevant. Used for deciding whether the rank of the corresponding page should be boosted. For example, this range can be set to encompass a few days before and after a sports game to which the page refers. If this field is missing, no boosting is performed. Specifying that a page should always be boosted is not recommended, but can be accomplished by setting hot_times.start_unix_time=0 and hot_time.end_unix_time=0x7fffffff. Note that multi |

**ImageContentQueryBoost** - 1 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| ImageContentQueryBoost | `queryboost` | `list(GoogleApi.ContentWarehouse.V1.Model.ImageContentQueryBoostQueryBoost.t)` | *(no description provided in leak)* |

**ImageContentQueryBoostQueryBoost** - 2 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| ImageContentQueryBoostQueryBoost | `boost` | `number()` | Score multiplier (fully normalized 1 is nop). |
| ImageContentQueryBoostQueryBoost | `query` | `String.t` | Canonicalized query string. |

---

### Patents relevant to Stage 11

#### US8682892B1: Ranking search results

- **Core concept:** A site-wide quality multiplier (group-specific modification factor) is computed from independent incoming link counts and reference query counts, then applied on top of individual page scores. Invented by Navneet Panda.
- **Connected leak modules:** `QualityNsrNsrData`, `CompressedQualitySignals`, `QualityNsrPQData`
- **SEO action:** Prune or fix your weak pages. Site-wide quality is a multiplier, so bad pages tax your good ones. The leak's nsr, pandaDemotion, babyPandaV2Demotion, and siteQualityStddev fields are the direct implementation.
- **SEO claims (6):**
  1. [general] Resources are grouped (e.g., by site/domain) and each group gets a group-specific modification factor
  2. [general] The modification factor is based on the count of independent incoming links to the group
  3. [general] The modification factor is also based on the count of reference queries (queries referencing the site)
  4. [general] The modification factor acts as a multiplier on individual page scores within the group
  5. [general] Bad pages in a group drag down the group's modification factor, affecting all pages in the group
  6. [general] Independent links (from unique domains) count more than duplicate links

#### US7716225B1: Ranking documents based on user behavior and/or feature data

- **Core concept:** The Reasonable Surfer model: links are weighted by the probability that a user will click them, based on features like position, font size, color, anchor text, and user behavior data.
- **Connected leak modules:** `AnchorsAnchor`, `QualityNavboostCrapsCrapsClickSignals`, `IndexingDocjoinerAnchorStatistics`, `CompressedQualitySignals`
- **SEO action:** Put the links you want to count in the main content where people actually click, not in the footer or sidebar. The leak's pagerankWeight and sourceType fields in AnchorsAnchor confirm link weight varies by source quality and click probability.
- **SEO claims (5):**
  1. [general] Links do not pass equal weight; the probability of a user clicking a link determines its ranking contribution
  2. [general] Link features that affect weight include: font size of anchor text, position in document (above/below fold, sidebar, footer, list position), font color and attributes, number of words in anchor text, actual words in anchor text, commerciality of anchor text, image link aspect ratio, context words before/after link, topical cluster of anchor text, whether link is same-host/domain
  3. [general] Source document features include: URL, website, number of links in document, presence of other words, topical cluster
  4. [general] User behavior data is used to train a model that predicts click probability for each link
  5. [general] The model generates rules from analyzing which links users selected versus did not select

#### US7308643B1: Anchor tag indexing in a web crawler system

- **Core concept:** Anchor text from linking documents is indexed with the target document, not the source  -  enabling pages to rank for terms found only in their inbound anchor text.
- **Connected leak modules:** `IndexingDocjoinerAnchorStatistics`, `AnchorsAnchor`, `PerDocData`
- **SEO action:** Write anchors that describe the target page. Those words become part of how the target is indexed. The leak's anchorCount, offdomainAnchorCount, and spamLog10Odds in IndexingDocjoinerAnchorStatistics confirm anchor text is a primary indexing input.
- **SEO claims (6):**
  1. [general] Anchor text associated with a URL is extracted and stored as part of an anchor map
  2. [general] Anchor maps associate outbound URLs with the text surrounding the link in the source document
  3. [general] Target documents are indexed using both their own content and the anchor text from all linking documents
  4. [general] This enables indexing of URLs that contain no textual content (e.g., images) via their anchor text
  5. [general] A sorted anchor map orders pairings by target document identifier for efficient lookup
  6. [general] Anchor text provides extrinsic information about documents  -  what others say about a page matters

#### US9165040B1: Producing a ranking for pages using distances in a web-link graph

- **Core concept:** Ranking pages by computing shortest distances from a set of trusted seed pages through the link graph, where link lengths increase with the number of outbound links from the source page.
- **Connected leak modules:** `PerDocData`, `AnchorsAnchor`, `CompressedQualitySignals`, `QualityNsrNsrData`
- **SEO action:** Chase links from sites the trusted hubs of your niche already link to. One link two hops from a seed beats fifty from nowhere. The leak's homepagePagerankNs and siteAuthority confirm proximity-to-trust scoring.
- **SEO claims (7):**
  1. [general] A set of trusted seed pages is selected as the starting point for distance computation
  2. [general] Link length is computed as a function of the number of outgoing links from the source page  -  more outbound links means longer link length
  3. [general] Link length formula: α + log(|q|_out), where α is a non-negative value and |q|_out is out-degree
  4. [general] Shortest distance from seeds to a page determines its ranking score
  5. [general] Each seed page has a weight and initial distance; seeds with higher trust have shorter initial distances
  6. [general] Ranking score uses k shortest distances from k nearest seeds
  7. [general] Spam pages far from trusted seeds receive low scores naturally

#### US9183499B1: Evaluating quality based on neighbor features

- **Core concept:** A quality model computes a second quality score for an entity (website/page) using not just its own features, but also the quality scores of neighbor entities that link to it. Quality propagates through the link graph iteratively as the model is periodically retrained.
- **Connected leak modules:** `QualityNsrNsrData`, `QualityNsrPQData`, `AnchorsAnchor`, `Anchors`, `IndexingDocjoinerAnchorStatistics`, `CompressedQualitySignals`, `PerDocData`, `QualityNsrNsrDataClusterUplift`
- **SEO action:** Your site's quality score is influenced by the quality of sites that link to you - links from high-quality neighbors boost you more. But the mechanism is bidirectional and iterative: quality 'smears' across the graph over time, so link neighborhood matters holistically. Also, layout quality and user engagement metrics (CTR, dwell time) are direct inputs to the quality model. Improve your page layout and user engagement signals alongside link building.
- **SEO claims (7):**
  1. [general] A second quality score for a candidate entity is computed using a quality model that takes as inputs: a first quality score for the entity, neighbor features (quality scores of linked-to neighbor entities), and entity-specific feature values determined independent of neighbors.
  2. [general] Neighbor entities are identified by links: a neighbor is an entity that includes a hyperlink referencing the candidate entity, or an entity hosted on the same host data processing apparatus.
  3. [general] The neighbor feature includes an average neighbor quality score, computed as the average of quality scores of the entities linking to the candidate.
  4. [general] Entity-specific features include: a layout score indicating the quality of the visual layout of the entity; a selection rate (click-through rate) indicating how often the entity is selected as a search result; and a selection duration indicating the average time the entity is displayed on a user device when selected.
  5. [general] Quality scores propagate ('smear') from entity to entity across the link graph as the model is iteratively applied and retrained, meaning the quality of distant neighbors eventually influences a candidate's score.
  6. [general] Entities with high quality scores may be indexed more frequently by the search engine than entities with low quality scores, making quality a crawl-rate signal.
  7. [general] An entity can be a set of websites sharing a common characteristic, not just a single page, allowing quality scoring at the site-group level.

#### US8694511B1: Modifying search result ranking based on populations

- **Core concept:** Click data for a document is aggregated at multiple population levels (country-specific, language-specific, generic), with broader populations deemphasized relative to narrower ones, producing a quality-of-result statistic used as a ranking input.
- **Connected leak modules:** `QualityNavboostCrapsCrapsClickSignals`, `QualityNavboostCrapsCrapsData`, `QualityNavboostCrapsStatsWithWeightsProto`, `QualityNavboostCrapsFeatureCrapsData`, `CompressedQualitySignals`, `PerDocData`, `IndexingDupsLocalizedLocalizedCluster`
- **SEO action:** Google weights country+language-specific click data more than language-wide or global click data. If your content targets a specific country, ensure your click performance is strong in that specific locale - global CTR matters less than locale-specific CTR. Dwell time weights each click, so longer visits in your target country amplify your ranking signal. The leak's NavboostCraps modules with per-country/per-language aggregation and the LocalizedCluster module confirm this population-based click weighting is live. The prior model means even new pages can get estimated quality scores.
- **SEO claims (8):**
  1. [general] Click data for a document represents selections weighted by viewing time (dwell time), with each selection associated with a specific country and language.
  2. [general] First click data aggregates weighted selections for the same country and language; second click data aggregates weighted selections for the same language across countries.
  3. [general] The second (broader, language-level) click data is deemphasized relative to the first (narrower, country+language-level) click data when the query language matches the user interface language.
  4. [general] Deemphasis is applied via a smoothing factor based on the amount of first click data available - more country-specific data means more deemphasis of language-level data.
  5. [general] The quality of result statistic is calculated by combining first click data with deemphasized second click data, and provided as an input to the document's ranking.
  6. [general] Deemphasis also considers whether the document's language matches the user interface language.
  7. [general] Click fractions are computed at both levels, and the broader-level data is deemphasized when the first click fraction is less than the second click fraction.
  8. [general] A prior model estimates what the implicit feedback should be for results too infrequent or too recent to have sufficient historical click data.

#### US8661029B1: Modifying search result ranking based on implicit user feedback

- **Core concept:** Clicks and dwell time are used as implicit user feedback to re-rank search results. Views are weighted by viewing length, classified into time categories, and combined into a relevance measure.
- **Connected leak modules:** `QualityNavboostCrapsCrapsClickSignals`, `QualityNavboostCrapsCrapsData`, `CompressedQualitySignals`
- **SEO action:** Win the click and the stay: titles that match the page, pages that answer in the first screen. The leak's goodClicks, badClicks, lastLongestClicks, and unsquashedClicks fields are the direct implementation of this patent.
- **SEO claims (8):**
  1. [general] Document relevance is determined by the ratio of longer views to total views
  2. [general] Individual selections (clicks) are tracked within the context of the search query
  3. [general] Document views are weighted based on viewing length information to produce weighted views
  4. [general] Views are classified into viewing time categories (short, medium, long) with different weights
  5. [general] Weighting can use continuous or discontinuous functions applied to view durations
  6. [general] A viewing length differentiator adjusts weighting based on query category  -  different queries have different expected dwell times
  7. [general] User type also affects weighting  -  different users' clicks carry different weight
  8. [general] The rank modifier engine uses this implicit feedback to cause re-ranking of search results

#### US9514194B1: Website duration performance based on category durations

- **Core concept:** Site quality is measured by comparing a website's user visit duration against category-level duration benchmarks  -  sites are scored by how many categories they exceed duration thresholds in, weighted by category association strength, with direct navigation visits boosted and short clicks discounted.
- **Connected leak modules:** `QualityNavboostCrapsCrapsClickSignals`, `QualityNsrNsrData`, `CompressedQualitySignals`
- **SEO action:** Focus on increasing dwell time relative to your topical categories. Build direct traffic (brand searches, bookmarks, typed URLs)  -  these visits are boosted in duration scoring. Ensure users don't bounce back to search quickly. Being strong in multiple relevant categories compounds your duration performance score.
- **SEO claims (8):**
  1. [general] Website duration score is proportional to duration measurements (time between requesting a resource and requesting another resource)
  2. [general] Category duration scores are determined for each category the website belongs to, based on the website duration score
  3. [general] Duration performance score is based on the ratio of categories where duration meets a threshold vs total categories
  4. [general] Category weights (strength of association between category and website) multiply the category duration score
  5. [general] Duration measurements from direct navigation (typing URL, bookmark) are boosted  -  indicative of positive quality assessment
  6. [general] Duration measurements from search result clicks are NOT boosted
  7. [general] Last visited duration times are discounted to filter out short clicks where user navigates back quickly
  8. [general] Duration measurements where user requests a resource from another website are discounted

#### US8819006B1: Rich content for query answers

- **Core concept:** When a question query receives an answer, rich content (images, video) is selected by generating a contextual query combining question+answer terms, then filtering for items that contextualize BOTH the question and answer  -  items only relevant to one are demoted.
- **Connected leak modules:** `PerDocData`, `RepositoryWebref`
- **SEO action:** Use descriptive alt text, captions, and surrounding context for images near answer content on your pages. Images that contextualize both the question and answer topic are more likely to appear in rich answer results. Ensure your images are properly labeled with relevant entity information.
- **SEO claims (8):**
  1. [general] A contextual query is generated combining elements from both the question query and the answer
  2. [general] Three sets of rich content items are retrieved: responsive to contextual query, responsive to question alone, and responsive to answer alone
  3. [general] First rich content items (in contextual set but NOT in both question and answer sets) meet the context condition and are preferentially selected
  4. [general] Second rich content items (in contextual set AND in question or answer set) are demoted relative to first items
  5. [general] Demotion of second items is proportional to their ordinal position in the question or answer set
  6. [general] Items appearing in both the question and answer sets receive a harsher demotion than items in only one
  7. [general] Rich content items are non-textual content (images, video, audio)
  8. [general] The selected rich content items are displayed alongside the answer in search results

#### US10025868B1: Preferred sites

- **Core concept:** Users explicitly identify preferred sites (by domain name) through direct input or accepting recommendations. Search results referencing preferred sites receive presentation adjustments (visual indicators, ranking boosts) and are eligible for more aggressive ranking changes than inferred preferences.
- **Connected leak modules:** `BiasingPerDocData`, `BiasingPerDocData2`, `PerDocData`, `QualityNsrNsrData`, `IndexingDupsLocalizedLocalizedCluster`, `LocalWWWInfo`, `LocalWWWInfoCluster`, `SdrPageAnchorsSitelink`
- **SEO action:** Users can explicitly mark your site as a 'preferred site,' which gives you a ranking boost and visual distinction in their search results. Encourage users to bookmark/return to your site - Google uses visit history to recommend your domain as a preferred site. The locally relevant host requirement means your subdomain/URL structure should match the user's locale and language. The leak's BiasingPerDocData and BiasingPerDocData2 modules confirm per-document biasing based on user preferences is live. Build brand loyalty to increase the chance users accept your site as preferred.
- **SEO claims (8):**
  1. [general] Site preference data identifies preferred sites for a user, each specified by domain name only, established through explicit user acceptance of a recommendation during a prior session.
  2. [general] Only search results referencing the domain name of a preferred site AND including a resource locator referencing a locally relevant host within that domain are eligible for presentation adjustment.
  3. [general] Preferred sites receive a visual indicator: the address of the resource is displayed in a different text format (e.g., italicized) compared to non-preferred sites.
  4. [general] The ranking of search results referencing preferred sites is adjusted (boosted) based on the preference.
  5. [general] Candidate sites for recommendation are identified from user site data (previously visited resource locators), grouped by domain name, and scored based on per-site user metrics.
  6. [general] Recommendation scores based on per-site user metrics determine which sites to recommend as preferred; sites exceeding a threshold are recommended.
  7. [general] The locally relevant host is determined by geographic location or preferred language associated with the user identifier.
  8. [general] Ranking adjustments for explicitly identified preferred sites are more aggressive than for inferred preferred sites, because there is high confidence the user desires these results.

#### US8996520B2: Ranking of native application content

- **Core concept:** Native application scores are normalized to a common scale with web resource scores using a normalization factor derived from apps that have corresponding web resources. This allows unified ranking of web pages and native apps in search results.
- **Connected leak modules:** `QualityCalypsoAppsLink`, `IndexingEmbeddedContentPageSizeInfo`, `SmartphonePerDocData`, `IndexingConverterLocalizedAlternateName`, `IndexingCrawlerIdServingDocumentIdentifier`, `PerDocData`, `CompressedQualitySignals`
- **SEO action:** If you have a native app, ensure it has corresponding web resources so Google can normalize scores and rank your app alongside web results. App scores use link signals (both app-to-app and web-to-app links), download counts, and app page content. Deep linking from your web pages to app content creates web-to-app links that boost your app's score. The leak's QualityCalypsoAppsLink module confirms Google tracks app linking. Ensure your app content is indexed via Firebase App Indexing or equivalent. Cross-attribute quality signals between your web and app properties.
- **SEO claims (8):**
  1. [general] Web resource scores and native application scores are normalized to a common scale using a normalization factor derived from apps that have corresponding web resources, enabling unified ranking.
  2. [general] The normalization factor is determined by linearly regressing native application scores as a variable dependent on the corresponding web resource scores.
  3. [general] Native application scores are based on: number of links to the app (including application links from other apps and web links from web resources) and quality scores for each link.
  4. [general] Native application scores are also based on the number of downloads of the application.
  5. [general] Application page data from an index of application pages (describing content of each app page) is used with the search query to generate app scores.
  6. [general] Device-specific data (whether the app is installed, frequency of use on the device) is used to generate personalized app scores.
  7. [general] Normalization is not performed for web resources and corresponding apps with relatively disparate scores in their respective corpora, preventing high-quality web pages from being penalized by low-quality corresponding apps.
  8. [general] Relevance and quality signals are cross-attributed for web page resources and corresponding native applications, reducing underserving effects.

#### US11036804B1: Device specific adjustment based on resource utilities

- **Core concept:** Search results are adjusted based on the querying device type  -  resources with positive utility for that device type are boosted relative to resources without, but navigational queries are exempt from this adjustment.
- **Connected leak modules:** `PerDocData`, `CompressedQualitySignals`
- **SEO action:** Ensure your pages are categorized for the correct device types. If you have Android-specific or iOS-specific content, properly mark it. Responsive design that works across all device types ensures positive utility classification. Navigational/branded queries bypass device adjustments, so brand strength protects cross-device rankings.
- **SEO claims (8):**
  1. [general] Device type identifier is received with each query, identifying one of multiple device types
  2. [general] Resources are classified into subsets: those with positive utility for the device type and those without
  3. [general] Search results referencing resources with positive utility for the querying device are boosted relative to those without
  4. [general] The adjustment operation is skipped for navigational queries  -  queries indicating intent to identify a particular resource/website
  5. [general] Navigational query determination is based on navigation metrics of resources identified by the search engine
  6. [general] Resources categorized as corresponding to the first device type AND not the second have positive utility for the first
  7. [general] Resources categorized as corresponding to the second device type AND not the first do not have positive utility for the first
  8. [general] Boosting increases search scores of resources in the positive-utility subset relative to the non-positive-utility subset

#### US11893034B2: Distance based search ranking demotion

- **Core concept:** Local search results are demoted when the user's device is geographically distant from the business location AND there are closer local results or high-scoring non-local results, with a preservation threshold protecting information-rich local documents from demotion.
- **Connected leak modules:** `PerDocData`, `QualityNsrNsrData`, `CompressedQualitySignals`
- **SEO action:** Ensure your Google Business Profile location data is accurate and consistent with your physical location. If you serve multiple locations, create location-specific pages. High location-independent relevance (strong content, links, authority) can protect you from distance-based demotion even for distant users.
- **SEO claims (7):**
  1. [general] Local documents with locations far from the user device are eligible for demotion when a proximity measure exceeds a maximum locality distance
  2. [general] Demotion only occurs if there is at least one other local document within a threshold distance of the user, OR a non-local document with a sufficiently high search score
  3. [general] A location-independent search score component can preclude demotion  -  if the document's relevance without locality boost meets a preservation threshold, it is protected
  4. [general] Demotion is scaled by a sigmoid function based on the local intent measure of the query  -  higher local intent means stronger demotion for distant results
  5. [general] Proximity can be measured by distance (miles) or by political region co-location (same state, same city)
  6. [general] Maximum locality distance can vary by document type (e.g., restaurants have smaller radius than medical clinics)
  7. [general] Demotion adjusts the search score so the distant local result ranks below sufficiently ranked non-local results

#### US8051076B1: Demotion of repetitive search results

- **Core concept:** Apparatus, systems and methods for demoting repetitive search results are disclosed. Search results that are identified in both first set of search results and a second set of search results are determined to be repetitive search results.
- **Connected leak modules:** `CompressedQualitySignals`, `NlpSemanticParsingQRefAnnotation`, `PerDocData`, `QualityNavboostCrapsCrapsClickSignals`, `QualityNavboostCrapsCrapsData`, `QualityNsrNsrData`, `QualityNsrPQData`, `QualityOrbitAsteroidBeltDocumentIntentScores`, `QualityPreviewSnippetRadishFeatures`, `QualityRankembedMustangMustangRankEmbedInfo`, `QualityTimebasedLastSignificantUpdate`, `QualityTimebasedSyntacticDate`, `SmartphonePerDocData`, `SnippetExtraInfo`, `SnippetExtraInfoSnippetCandidateInfo`
- **SEO action:** Write titles that match content. goodClicks and lastLongestClicks are key NavBoost signals. Avoid triggers for demotion: low quality, spam patterns, anchor mismatches. Update content meaningfully. lastSignificantUpdate tracks magnitude of changes.
- **SEO claims (15):**
  1. [relevance_scoring] In some implementations, the search engine 104 can derive a relevance score for each search result and rank the search results 111 according to the relevance scores.
  2. [demotion_penalty] A computer implemented method for demoting search results, comprising: identifying a first set of search results responsive to a first query during a search session, each search result of the first set of search results having a corresponding relevancy score, and the first set of search results being ranked according to relevancy scores;
  3. [quality_scoring] For example, page rank scores of the web pages, e.g., scores associated with the quality of web pages as measured by the number of other sites linking to the web pages, can be combined with the IR scores to generate the relevancy scores.
  4. [click_engagement] The session search results data store 116 can store a set of ranked search results 111 for each query 109 ;
  5. [freshness_temporal] identifying one or more candidate search results, candidate search results being repetitive search results that have a relevancy score greater than the relevancy threshold, the candidate search results comprising a first candidate search result, the first candidate search result having a ranking in the second set of search results according to relevancy scores;
  6. [query_understanding] Only demoting the search result 604 is based on the interpretation of the selection of the search result 606 in the first set of search results 601 as a signal that the user has reviewed the selected search result 606 and all higher-ranked search results, e.g., search result 604 .
  7. [passage_snippet_answer] Search results can include, for example, lists of web page titles, snippets of text extracted from those web pages, and hypertext links to those web pages, and may be grouped into a predetermined number of (e.g., ten) search results.
  8. [mobile_device] A computer implemented method for demoting search results, comprising: identifying a first set of search results responsive to a first query during a search session, each search result of the first set of search results having a corresponding relevancy score, and the first set of search results being ranked according to relevancy scores;
  9. [ml_neural] The IR scores can be computed from, for example, dot products of feature vectors corresponding to the query and document content of a web page.
  10. [click_engagement] identifying a second set of search results responsive to a second query during the search session, each search result of the second set of search results having a corresponding relevancy score, and the second set of search results being ranked according to relevancy scores, wherein the second query is different from the first query;
  11. [demotion_penalty] demoting the first candidate search result in the second set of search results by lowering the ranking of the first candidate search result in the second set of search results;
  12. [demotion_penalty] and after demoting the first candidate search result in the second set of search results, providing the second set of search results in a response to the second query;
  13. [general] The method of claim 1 , wherein determining a relevancy threshold comprises: determining whether a relevancy difference measure based on the relevancy scores of two or more search results of the second set of search results equals or exceeds a relevancy difference threshold;
  14. [general] identifying a highest relevancy score of the relevancy scores of the two or more search results for which the relevancy difference measure equals or exceeds the relevancy difference threshold;
  15. [general] and setting the relevancy threshold to a value that is based on the highest relevancy score.

---

### SEO actions

- **Prune or fix your weak pages - they tax your entire site.** Patent US8682892B1 confirms that "bad pages in a group drag down the group's modification factor, affecting all pages in the group." The leak's `pandaDemotion`, `babyPandaV2Demotion`, `lowQuality`, and `siteQualityStddev` fields are the direct implementation. Every low-quality page on your domain lowers the site-wide multiplier applied to all your pages. The `siteQualityStddev` field specifically measures the spread of page-level quality ratings - a high stddev (great pages mixed with terrible ones) is worse than a consistent medium quality.

- **Earn independent (unique-domain) links, not volume links.** US8682892B1 states "independent links (from unique domains) count more than duplicate links." US9165040B1 adds that "Link length is computed as a function of the number of outgoing links from the source page" - a link from a page with few outbound links passes more authority. The `crapsAbsoluteHostSignals` field tracks host-level impression data. Focus on link diversity over link quantity, and seek links from pages that don't link out to hundreds of other sites.

- **Put important links in main content, not footers or sidebars.** Patent US7716225B1's Reasonable Surfer model weights links by click probability based on position, font size, and other features. The `anchorMismatchDemotion` field shows Google validates anchor text against page content. Links in the main body where users actually click pass more weight. US7308643B1 confirms anchor text is indexed with the target page, so descriptive anchor text that matches the target page's content is essential.

- **Build direct traffic (brand searches, bookmarks, typed URLs).** Patent US9514194B1 states that "duration measurements from direct navigation are boosted" while "duration measurements from search result clicks are NOT boosted." The `IndexingSignalAggregatorAgeWeightedCoverageData` module's `clicksGood` and `dwells` fields track this. Direct navigation sends stronger quality signals than search clicks. Build brand awareness so users type your URL or bookmark your site.

- **Avoid exact-match domains with thin content.** The `exactMatchDomainDemotion` field confirms Google demotes EMDs when content quality doesn't match the domain-query match. If you have an EMD, you must have proportionally higher content quality to overcome the built-in demotion. The `navDemotion` field similarly demotes navigational targets that fail quality thresholds.

- **Ensure your pages work well on the querying device.** Patent US11036804B1 confirms device-specific boosting - resources with "positive utility for the querying device are boosted." The `PerDocData.smartphoneData`, `voltData`, and `desktopInterstitials` fields carry device-specific signals. Mobile-friendly pages get a twiddler boost on mobile queries, while interstitial-heavy pages get demoted on desktop.

- **Produce high-quality product reviews to earn review-specific boosts.** The `productReviewPReviewPage`, `productReviewPUhqPage`, `productReviewPPromotePage`, `productReviewPPromoteSite`, `productReviewPDemotePage`, and `productReviewPDemoteSite` fields implement a dual page-level and site-level promotion/demotion system. High-quality review pages get boosted; low-quality ones get demoted - at both the individual page and entire site level. The UHQ (Ultra High Quality) page detection means Google has a specific classifier for identifying the best review pages.

- **Maintain content freshness to preserve twiddler boosts.** The `PerDocData.datesInfo` field is explicitly "Used in FreshnessTwiddler" and `semanticDateInfo` contains "meta data required by the freshness twiddlers." The `freshboxArticleScores` and `freshnessEncodedSignals` fields track freshness classifiers. Stale content with declining click-through rates sees its NavBoost and freshness twiddler signals decay. Update important pages regularly so the `lastSignificantUpdate` timestamp stays current.

- **Monitor per-corpus and per-locale click performance for twiddler eligibility.** US8694511B1 confirms country+language-specific click data is weighted more than global data. The `QualityNavboostCrapsCrapsData` module with per-country, per-language, per-device slicing confirms per-locale twiddler adjustments. US10025868B1 shows that preferred-site boosting is locale-specific - your subdomain/URL structure should match the user's locale. The `PerDocData.queriesForWhichOfficial` field tracks official page status per (query, country, language) triple.

- **Avoid SERP-like pages and scam patterns.** The `serpDemotion` field demotes pages that look like search results pages. The `scamness` field (0-1023 range) and `unauthoritativeScore` field demote scam and unauthoritative content. Multiple 7-bit spam scores (DocLevelSpamScore, KeywordStuffingScore, GibberishScore, SpamWordScore, uacSpamScore) each have trigger thresholds - exceeding any threshold can activate a demotion twiddler. The `PerDocData.hostAge` field enables spam sandboxing of new domains.

- **Leverage time-windowed boosting for live and event content.** The `WeboftrustLiveResultDocBoostData` module provides `boostLevel` (0-1 range) and `hotTimes` (time range) for event-based boosting. If you publish live results (sports scores, election results, breaking news), ensure your content is fresh during the relevant time window to capture the boost. Outside the hot times window, the boost does not apply.

- **If you have a native app, connect it to your web content.** Patent US8996520B2 confirms Google normalizes app and web scores using regression. The `PerDocData.appsLink` and `launchAppInfo` fields track web-to-app relationships. Deep linking from web pages to app content creates web-to-app links that boost your app's score, and quality signals are cross-attributed between web and app properties.

- **Publish under consistent author identity and build topical authority.** Patent US9183499B1 confirms quality propagates through the link graph - links from high-quality neighbors boost you more. The `experimentalNsrTeamData` and `topicEmbeddingsVersionedData` fields carry topical authority signals. The `QualityNsrNsrData.smallPersonalSite` field shows Google actively promotes small personal sites. Build consistent topical authority in your niche to accumulate neighbor-quality benefits.

---
