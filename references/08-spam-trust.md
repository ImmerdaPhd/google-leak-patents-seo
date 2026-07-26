# Stage 8: Spam, Penalty & Trust Systems

**Leak modules (10):** `SpamBrainScore`, `SpamBrainData`, `WeboftrustLiveResultDocBoostData`, `WeboftrustLiveResultsDocAttachments`, `WeboftrustLiveResultProviderDocAttachment`, `IndexingDocjoinerAnchorSpamInfo`, `IndexingDocjoinerAnchorPhraseSpamInfo`, `IndexingDocjoinerAnchorTrustedInfo`, `PerDocData` (spam/trust subset), `CompressedQualitySignals` (spam/trust subset), `QualityNsrNsrData` (spam/trust subset)

**Relevant patents (7):** US8554769B1, US7603350B1, US8818995B1, US8452746B2, US9183499B1, US9558233B1, US10270791B1

### What Happens Here

Google runs multiple independent spam classifiers (SpamBrain, anchor spam, gibberish, keyword stuffing, link spam, hacked-site detection) and trust systems (TrustRank-style propagation, web-of-trust live result boosting, authority/quality scoring) that can demote, penalize, or promote documents. These systems operate at both the page level and the site/sitechunk level, and they interact: a site flagged by SpamBrain sees all its pages demoted, while a site with high neighbor quality scores sees its pages promoted. Trust is not a single score but a layered system of annotations, label-based propagation, and link-graph quality transfer that determines which documents survive the ranking pipeline.

### How this works

**1. SpamBrain is Google's ML-based spam classifier with versioned, multi-level scoring.** The `SpamBrainScore` module carries `sbScore` ("The value corresponding to this version") and `versionId` ("The version id (derived from the epoch - larger number means newer score"). The `SpamBrainData` module wraps this as `versionedData` ("Versioned scores of SB classifiers") - a list of SpamBrainScore entries, meaning Google maintains multiple versions of spam scores and can compare them across model versions. At the PerDocData level, `PerDocData.spambrainData` is "Host-v1 sitechunk level scores coming from spambrain" and `PerDocData.spambrainDomainSitechunkData` is "Domain sitechunk level scores coming from spambrain" - so SpamBrain operates at both the host and domain-sitechunk granularity. The `PerDocData.spambrainTotalDocSpamScore` ("The document total spam score identified by spambrain, going from 0 to 1") is the per-document aggregate. At the NSR level, `QualityNsrNsrData.spambrainLavcScore` is "The SpamBrain LAVC score, as of July 2022. See more information at go/cloverfield-lavc-deck" and `spambrainLavcScores` is its versioned list. Patent **US8452746B2** (Detecting spam search results) describes the system: "An annotation file is analyzed for each context-processed search result to determine whether a corresponding entry refers to spam, and results flagged as spam are removed from the result set before presentation to the user" and "Each annotation file entry comprises a link to a web page, and the system determines whether the linked web page contains spam." The `IndexingDocjoinerDataVersion` module confirms this annotation-based approach with entries like `spamBrainSpamBrainPageClassifierAnnotation`, `spamBrainSpamBrainData`, `spambrainDomainSitechunkData`, `spamCookbookCookbookAnnotations`, `spamCookbookCookbookSitechunkAnnotations`, `spamHackedSitesDocSpamInfo`, `spamHackedSitesGpgbGpgbNgramStats`, `spamHackedSitesWordFrequencies`, `spamContentAnchorDist`, `spamContentAuthenticAuthenticTextAnnotation`, `spamContentImageMapPb`, `spamContentSiteAgeStats`, `spamScamScamness`, `spamScamUnauthoritativeSite`, `spamGooglebombsGooglebombsAnnotation`, `spamJsJsInfo`, `spamTokensSpamTokensAnnotation`, `spamFatpingIndexFeed`, `spamGodclusterAffIdAnnotation`, and `spamGodclusterServerHeaderAnnotation` - each is a versioned spam annotation tracked independently.

**2. Anchor spam detection is a multi-signal system with demotion periods and trusted-source comparison.** The `IndexingDocjoinerAnchorSpamInfo` module (21 attributes) is the most detailed spam module in the leak. It tracks: `spamProbability` ("Predicted probability of spam"), `spamPenalty` ("Combined penalty for anchor demotion"), `processed` ("Total number of processed anchors"), `demoted` ("How many anchors were demoted"), `demotedAll` ("Demoted all anchors in the period or only anchors classified as spam"), `demotedStart` / `demotedEnd` ("Start date / End date of the demotion period"), `anchorStart` / `anchorEnd` ("Start date of the first anchor / End date of the last anchor of the document"), `anchorFraq` ("Ratio of spam demoted period to all anchor period"), `phraseCount` ("How many spam phrases found in the anchors among unique domains"), `phraseFraq` ("Spam phrases fraction of all anchors of the document"), `phraseRate` ("Average daily rate of spam anchor discovery"), `sampled` ("True if anchors were sampled during observation phrase"), `spamDebugInfo` ("Additional debug information about computation of spam probability"), and trusted-source comparison fields: `trustedTarget` ("True if is this URL is on trusted source"), `trustedTotal` ("Total number of trusted sources for this URL"), `trustedDemoted` ("Number of trusted anchors used in computation of spam probability"), `trustedMatching` ("Number of trusted anchors with anchor text matching spam terms"), `trustedExamples` ("Examples of trusted sources"), and `sources` ("Detailed information about trusted sources and match computation"). The `IndexingDocjoinerAnchorPhraseSpamInfo` module (9 attributes) provides phrase-level granularity: `phraseAnchorSpamCount` ("How many spam phrases found in the anchors among unique domains"), `phraseAnchorSpamDays` ("Over how many days 80% of these phrases were discovered"), `phraseAnchorSpamStart` / `phraseAnchorSpamEnd` ("Time when anchor spam spike started / ended with padding"), `phraseAnchorSpamFraq` ("Spam phrases fraction of all anchors of the document"), `phraseAnchorSpamRate` ("Average daily rate of spam anchor discovery"), `phraseAnchorSpamProcessed` ("Total number of observed anchors"), and `phraseAnchorSpamDemoted` ("Total number of demoted anchors"). The `IndexingDocjoinerAnchorTrustedInfo` module provides the trusted-source baseline: `trustedScore` ("Fraction of pages with newsy anchors on the site, >0 for trusted sites"), `phrasesScore` ("Count of anchors classified as spam using anchor text"), and `matchedScore` ("Difference in KL-divergence from spam and non-spam anchors. Value >0 indicate that anchor text from this trusted source is similar to anchors classified as spam which means that spammy anchors are legitimate"). Patent **US10270791B1** (Search entity transition matrix) connects directly: "Anchor text quality is evaluated using transition probabilities: anchor text is compared to queries with high transition probability to the target document" and "Documents with anchor text similar to high-transition-probability queries get ranking boosts" and "Spam detection: if a session is identified as spam, transition probabilities propagate spam scores to associated queries" and "Spam scores modify quality-of-results statistics: quality statistic is scaled by (1 - spam_score)."

**3. Trust flows through labeled annotations and web-of-trust relationships, not just link equity.** The `WeboftrustLiveResultDocBoostData` module implements time-bounded trust boosting: `boostLevel` ("Identifies the degree to which the existence of this LiveResult should boost a query's score (when the query is performed within the hot_times range). This field is always in the range [0,1] ... A value of 1 indicates that the maximum level of boosting will be applied. This field will be updated from time to time based on CTR and other signals.") and `hotTimes` ("Specifies the time range within which this LiveResult is relevant. Used for deciding whether the rank of the corresponding page should be boosted."). The `WeboftrustLiveResultsDocAttachments` wraps this as `docBoost` ("Information about potential rank boosting for the document by virtue of its Live Result feed"), and `WeboftrustLiveResultProviderDocAttachment` adds `tag` ("Tag that specifies the use-case within provider's data") and `tagFp` ("A fingerprint of the 'tag' field, automatically calculated during the indexing stage"). Patent **US7603350B1** (TrustRank / Search result ranking based on trust) describes the foundation: "Entities provide annotations (labels) for web content items" and "Trust relationships between entities are stored as tuples (trusting entity, trusted entity, trust value)" and "Trust can be topic-specific - an entity may be trusted for one topic but not another" and "Documents labeled by trusted entities receive ranking boosts" and "Trust is transitive - trust flows through chains of trusted relationships" and "The system computes a trust score for each document based on the trustworthiness of its labelers." Patent **US8818995B1** (Search result ranking based on trust, continuation) adds the user-behavior dimension: "Trust relationships are determined from web visitation patterns: if a user visits a web page associated with an entity, a trust relationship with that entity is established and does not decrease over time, while trust in entities not visited decays over time" and "Documents are associated with annotation label terms provided by entities; when a query term matches an annotation label, the trust rank of the annotating entity is used to adjust the document's relevance score" and "When multiple entities provide the same annotation label for a document, a weight based on the number of instances is applied to each entity's trust rank."

**4. Gibberish and content-quality spam detection uses language-model scoring.** Patent **US8554769B1** (Identifying gibberish content in resources) describes: "A language model score is generated by applying an n-gram language model to the text content of a resource" and "N-gram language models compute the probability of word sequences - gibberish has low probability" and "Gibberish content is generated by: scraping and randomly splicing content, translating from other languages, using low-cost untrained labor, and stitching together unrelated text" and "The system can identify content that reads assembled rather than naturally written." The leak's `PerDocData.GibberishScore` ("The gibberish score is represented in 7 bits, going from 0 to 127") is the direct implementation. Additional content-spam signals in `PerDocData` include: `DocLevelSpamScore` ("The document spam score is represented in 7-bits, going from 0 to 127"), `SpamWordScore` ("The spamword score is represented in 7-bits, going from 0 to 127"), `KeywordStuffingScore` ("The keyword stuffing score is represented in 7 bits, going from 0 to 127"), `ScaledSpamScoreYoram` / `ScaledSpamScoreEric` ("Spamscores are represented as a 7-bit integer, going from 0 to 127"), `ScaledLinkAgeSpamScore` ("Link age score is represented as a 7-bit integer, going from 0 to 127"), `IsAnchorBayesSpam` ("Is this document considered spam by the anchor bayes classifier?"), `uacSpamScore` ("The uac spam score is represented in 7 bits, going from 0 to 127. Threshold is 64. Score >= 64 is considered as uac spam"), `spamrank` ("The spamrank measures the likelihood that this document links to known spammers. Its value is between 0 and 65535"), `trendspamScore` ("For now, the count of matching trendspam queries"), `spamtokensContentScore` ("Used in SiteBoostTwiddler to determine whether a page is UGC Spam"), `spamMuppetSignals` ("Contains hacked site signals which will be used in query time joins"), `urlPoisoningData` ("Contains url poisoning data for suppressing spam documents"), and `spamCookbookAction` ("Actions based on Cookbook recipes that match the page"). Each of these is an independent classifier - tripping any one applies a demotion.

**5. Quality propagation through the link graph determines site-level trust.** Patent **US9183499B1** (Evaluating quality based on neighbor features) describes: "A second quality score for a candidate entity is computed using a quality model that takes as inputs: a first quality score for the entity, neighbor features (quality scores of linked-to neighbor entities), and entity-specific feature values determined independent of neighbors" and "Neighbor entities are identified by links: a neighbor is an entity that includes a hyperlink referencing the candidate entity, or an entity hosted on the same host" and "The neighbor feature includes an average neighbor quality score, computed as the average of quality scores of the entities linking to the candidate" and "Quality scores propagate ('smear') from entity to entity across the link graph as the model is iteratively applied and retrained, meaning the quality of distant neighbors eventually influences a candidate's score." Patent **US9558233B1** (Determining a quality measure for a resource) adds the three-tier system: "A seed score for each seed resource is based on the total number of resources linking to it and the total number of selections of those links" and "Source resources (pages that link to at least one seed) receive a source score based on the seed scores of the seeds they link to" and "Source-referenced resources (pages linked to by source resources) receive a resource score based on the source scores of the sources that link to them - creating a three-tier propagation of quality" and "Source resources with scores below a threshold are classified as 'unqualified,' and their links to source-referenced resources are discounted." The leak's `CompressedQualitySignals` implements the Q*-applied multipliers: `siteAuthority` ("site_authority: converted from quality_nsr.SiteAuthority, applied in Qstar"), `authorityPromotion` ("authority promotion: converted from QualityBoost.authority.boost"), `scamness` ("Scam model score. Used as one of the web page quality qstar signals. Value range from 0 to 1023"), `unauthoritativeScore` ("Unauthoritative score. Used as one of the web page quality qstar signals"), `pandaDemotion` ("encoding of Panda fields in the proto SiteQualityFeatures"), `babyPandaDemotion` / `babyPandaV2Demotion` (BabyPanda demotions), `exactMatchDomainDemotion` (EMD penalty), `navDemotion`, `serpDemotion` ("applied in Qstar"), `anchorMismatchDemotion`, and product review demotions. At the NSR level, `QualityNsrNsrData.chardEncoded` ("Site-level chard score: site quality predictor based on content"), `QualityNsrNsrData.tofu` ("site quality predictor based on content"), and `QualityNsrNsrData.siteQualityStddev` ("Estimate of site's PQ rating stddev - spread of the page-level PQ ratings of a site") provide the site-level quality inputs that feed neighbor-feature computation.

**6. The spam detection system operates across multiple annotation tracks, each independently versioned.** The `IndexingDocjoinerDataVersion` module reveals the full breadth of spam detection tracks: `spamBrainSpamBrainPageClassifierAnnotation` (ML-based page-level spam), `spamBrainSpamBrainData` (SpamBrain data), `spambrainDomainSitechunkData` (domain-level SpamBrain), `spamCookbookCookbookAnnotations` / `spamCookbookCookbookSitechunkAnnotations` (rule-based spam detection via "Cookbook recipes" - matching `PerDocData.spamCookbookAction`), `spamHackedSitesDocSpamInfo` / `spamHackedSitesGpgbGpgbNgramStats` / `spamHackedSitesWordFrequencies` (hacked-site detection with n-gram statistics), `spamContentAnchorDist` (anchor distribution spam), `spamContentAuthenticAuthenticTextAnnotation` (authenticity detection - likely identifying spun/stitched content per US8554769B1), `spamContentImageMapPb` (image-based spam), `spamContentSiteAgeStats` (site age statistics for spam detection - connecting to `PerDocData.hostAge` which is "used in twiddler to sandbox fresh spam in serving time"), `spamScamScamness` / `spamScamUnauthoritativeSite` (scam and unauthoritative site detection), `spamGooglebombsGooglebombsAnnotation` (Googlebomb detection), `spamJsJsInfo` (JavaScript-based spam/ cloaking), `spamTokensSpamTokensAnnotation` (spam token detection matching `PerDocData.spamtokensContentScore`), `spamFatpingIndexFeed` (feed-based spam), and `spamGodclusterAffIdAnnotation` / `spamGodclusterServerHeaderAnnotation` (affiliate and server-header based spam clustering). Each track has its own `timestampMicros` and `considerationTimestampMicros`, meaning Google can determine when each spam signal was last evaluated and whether it was checked but not found. Patent **US8452746B2** confirms this multi-track approach: "The system identifies spam-related and biased contexts using both offline and query-time processing stages, and context files from providers associated with spam/biased contexts are excluded from processing on direct user queries."



**7. Site age and sandboxing mechanisms use temporal signals to suppress fresh spam.** The `PerDocData.hostAge` field ("The earliest firstseen date of all pages in this host/domain. These data are used in twiddler to sandbox fresh spam in serving time. It is 16 bit and the time is day number after 2005-12-31") is a direct spam-prevention signal. New sites (low `hostAge`) with spam signals are sandboxed more aggressively than established sites - the twiddler system applies stricter demotion thresholds to fresh domains. The `PerDocData.domainAge` field (16-bit) provides a parallel domain-level age signal. The `spamContentSiteAgeStats` entry in `IndexingDocjoinerDataVersion` confirms that site age statistics are tracked as a dedicated spam signal, versioned with `timestampMicros`. Patent **US7603350B1** supports this: "Trust is a computed input, not a subjective assessment" - and the computation includes temporal trust accumulation. Sites must age into trust; there is no shortcut. The `UrlPoisoningData` module (with `numSpamSiblings`, `NotChangedTimeMs` - "Time when the page was last" fetched, and `OriginalCrawlTimeMs` - "Time when the page was" first crawled) tracks URL-level poisoning data for suppressing spam documents, including how many sibling URLs on the same host are flagged as spam. A high `numSpamSiblings` count means the URL lives in a spammy neighborhood, and the `NotChangedTimeMs` vs `OriginalCrawlTimeMs` delta tells Google how long the spam content has been present.

**8. Anchor spam detection uses a multi-layered approach with trusted-source baselines and phrase-level spike detection.** The `IndexingDocjoinerAnchorSpamInfo` module's trusted-source fields reveal a sophisticated comparison mechanism. `trustedTotal` ("Total number of trusted sources for this URL") establishes the baseline of how many high-quality sites link to the document. `trustedDemoted` ("Number of trusted anchors used in computation of spam probability") and `trustedMatching` ("Number of trusted anchors with anchor text matching spam terms") distinguish between trusted anchors that happen to use spam-adjacent text (which may be legitimate) and untrusted anchors using the same text. The `IndexingDocjoinerAnchorTrustedInfo.matchedScore` field ("Difference in KL-divergence from spam and non-spam anchors. Value >0 indicate that anchor text from this trusted source is similar to anchors classified as spam which means that spammy anchors are legitimate") uses KL-divergence to determine whether anchor text that looks spammy is actually legitimate because trusted sources use it too. The `IndexingDocjoinerAnchorPhraseSpamInfo` module adds temporal spike detection: `phraseAnchorSpamStart` / `phraseAnchorSpamEnd` ("Time when anchor spam spike started / ended with padding") and `phraseAnchorSpamDays` ("Over how many days 80% of these phrases were discovered") - if 80% of spam phrases were discovered in a short window, that indicates a coordinated link spam campaign. The `phraseAnchorSpamRate` ("Average daily rate of spam anchor discovery") distinguishes between gradual organic link growth (low rate) and sudden spam blasts (high rate). The `anchorFraq` field in `IndexingDocjoinerAnchorSpamInfo` ("Ratio of spam demoted period to all anchor period") computes what fraction of the document's anchor history was subject to demotion - a high ratio means most of the document's link profile is spammy. Patent **US10270791B1** confirms: "Spam scores modify quality-of-results statistics: quality statistic is scaled by (1 - spam_score)" - the spam probability directly reduces the quality statistic, and the `spamPenalty` field ("Combined penalty for anchor demotion") is the applied multiplier.

### Leak Attributes

**SpamBrainScore** - 2 attributes

| Attribute | Type | Description |
|---|---|---|
| `sbScore` | number() | The value corresponding to this version. |
| `versionId` | integer() | The version id (derived from the epoch - larger number means newer score) |

**SpamBrainData** - 1 attribute

| Attribute | Type | Description |
|---|---|---|
| `versionedData` | list(GoogleApi.ContentWarehouse.V1.Model.SpamBrainScore.t) | Versioned scores of SB classifiers |

**WeboftrustLiveResultDocBoostData** - 2 attributes

| Attribute | Type | Description |
|---|---|---|
| `boostLevel` | number() | Identifies the degree to which the existence of this LiveResult should boost a query's score (when the query is performed within the hot_times range). This field is always in the range [0,1]. A missing field, a value of 0, or a value outside the legal range indicates that no boosting is performed. A value of 1 indicates that the maximum level of boosting will be applied. This field will be updated from time to time based on CTR and other signals. |
| `hotTimes` | GoogleApi.ContentWarehouse.V1.Model.WeboftrustTimeRange.t | Specifies the time range within which this LiveResult is relevant. Used for deciding whether the rank of the corresponding page should be boosted. For example, this range can be set to encompass a few days before and after a sports game to which the page refers. If this field is missing, no boosting is performed. Specifying that a page should always be boosted is not recommended, but can be accomplished by setting hot_times.start_unix_time=0 and hot_time.end_unix_time=0x7fffffff. Note that multi |

**WeboftrustLiveResultsDocAttachments** - 1 attribute

| Attribute | Type | Description |
|---|---|---|
| `docBoost` | list(GoogleApi.ContentWarehouse.V1.Model.WeboftrustLiveResultDocBoostData.t) | Information about potential rank boosting for the document by virtue of its Live Result feed. |

**WeboftrustLiveResultProviderDocAttachment** - 2 attributes

| Attribute | Type | Description |
|---|---|---|
| `tag` | String.t | Tag that specifies the use-case within provider's data. It appears as a string in Alexandria signal and in the DocJoins. During the indexing stage this field will be converted to a 64-bit fingerprint to save space. See the "tag_fp" field, below. |
| `tagFp` | String.t | A fingerprint of the "tag" field, automatically calculated during the indexing stage. Will be used as a key for fetching the data. |

**IndexingDocjoinerAnchorSpamInfo** - 21 attributes

| Attribute | Type | Description |
|---|---|---|
| `anchorEnd` | integer() | End date of the last anchor of the document. |
| `anchorFraq` | number() | Ratio of spam demoted period to all anchor period. |
| `anchorStart` | integer() | Start date of the first anchor of the document. |
| `demoted` | integer() | Following field record details of anchor demotion in action. How many anchors were demoted. |
| `demotedAll` | boolean() | Demoted all anchors in the period or only anchors classified as spam. |
| `demotedEnd` | integer() | End date of the demotion period. |
| `demotedStart` | integer() | Start date of the demotion period. |
| `phraseCount` | number() | Following fields record signals used in anchor spam classification. How many spam phrases found in the anchors among unique domains. |
| `phraseFraq` | number() | Spam phrases fraction of all anchors of the document. |
| `phraseRate` | number() | Average daily rate of spam anchor discovery. |
| `processed` | integer() | Total number of processed anchors. |
| `sampled` | boolean() | True if anchors were sampled during observation phrase. |
| `sources` | list(GoogleApi.ContentWarehouse.V1.Model.IndexingDocjoinerAnchorTrustedInfo.t) | Detailed information about trusted sources and match computation. Populated only when --anchorspam_penalizer_debug=true. |
| `spamDebugInfo` | String.t | Additional debug information about computation of spam probability. |
| `spamPenalty` | number() | Combined penalty for anchor demotion. |
| `spamProbability` | number() | Predicted probability of spam. |
| `trustedDemoted` | integer() | Number of trusted anchors used in computation of spam probability. |
| `trustedMatching` | integer() | Number of trusted anchors with anchor text matching spam terms. |
| `trustedTarget` | boolean() | Following fields record details about trusted anchors True if is this URL is on trusted source. |
| `trustedExamples` | String.t | Examples of trusted sources. |
| `trustedTotal` | integer() | Total number of trusted sources for this URL. |

**IndexingDocjoinerAnchorPhraseSpamInfo** - 9 attributes

| Attribute | Type | Description |
|---|---|---|
| `phraseAnchorSpamCount` | number() | How many spam phrases found in the anchors among unique domains. |
| `phraseAnchorSpamDays` | number() | Over how many days 80% of these phrases were discovered. |
| `phraseAnchorSpamDemoted` | integer() | Total number of demoted anchors. |
| `phraseAnchorSpamEnd` | integer() | Time when anchor spam spike ended with padding. |
| `phraseAnchorSpamFraq` | number() | Spam phrases fraction of all anchors of the document. |
| `phraseAnchorSpamPenalty` | number() | Combined penalty for anchor demotion. |
| `phraseAnchorSpamProcessed` | integer() | Total number of observed anchors. |
| `phraseAnchorSpamRate` | number() | Average daily rate of spam anchor discovery. |
| `phraseAnchorSpamStart` | integer() | Time when anchor spam spike started with padding. |

**IndexingDocjoinerAnchorTrustedInfo** - 6 attributes

| Attribute | Type | Description |
|---|---|---|
| `matchedScore` | number() | Difference in KL-divergence from spam and non-spam anchors. Value >0 indicate that anchor text from this trusted source is similar to anchors classified as spam which means that spammy anchors are legitimate. |
| `matchedScoreInfo` | list(String.t) | Detailed debug information about computation of trusted anchors match. Populated only when --anchorspam_penalizer_debug=true |
| `phrasesScore` | number() | Count of anchors classified as spam using anchor text. |
| `site` | String.t | Site name from anchor.source().site(). |
| `text` | list(String.t) | Tokenized text of all anchors from the site. |
| `trustedScore` | number() | Fraction of pages with newsy anchors on the site, >0 for trusted sites. |

**PerDocData** - spam/trust-relevant attributes (subset of 97 total)

| Attribute | Type | Description |
|---|---|---|
| `uacSpamScore` | integer() | The uac spam score is represented in 7 bits, going from 0 to 127. Threshold is 64. Score >= 64 is considered as uac spam. |
| `spamtokensContentScore` | number() | For SpamTokens content scores. Used in SiteBoostTwiddler to determine whether a page is UGC Spam. See go/spamtokens-dd for details. |
| `spamMuppetSignals` | GoogleApi.ContentWarehouse.V1.Model.SpamMuppetjoinsMuppetSignals.t | Contains hacked site signals which will be used in query time joins. As of Oct'19, the field is stored in a separate corpus. |
| `trendspamScore` | integer() | For now, the count of matching trendspam queries. |
| `ScaledSpamScoreYoram` | integer() | Spamscores are represented as a 7-bit integer, going from 0 to 127. |
| `datesInfo` | String.t | Stores dates-related info (e.g. page is old based on its date annotations). Used in FreshnessTwiddler. |
| `spambrainData` | GoogleApi.ContentWarehouse.V1.Model.SpamBrainData.t | Host-v1 sitechunk level scores coming from spambrain. |
| `DocLevelSpamScore` | integer() | The document spam score is represented in 7-bits, going from 0 to 127. |
| `urlPoisoningData` | GoogleApi.ContentWarehouse.V1.Model.UrlPoisoningData.t | Contains url poisoning data for suppressing spam documents. |
| `ScaledSpamScoreEric` | integer() | *(no description provided in leak)* |
| `ScaledExptSpamScoreEric` | integer() | *(no description provided in leak)* |
| `ScaledExptSpamScoreYoram` | integer() | *(no description provided in leak)* |
| `spambrainTotalDocSpamScore` | number() | The document total spam score identified by spambrain, going from 0 to 1. |
| `GibberishScore` | integer() | The gibberish score is represented in 7 bits, going from 0 to 127. |
| `spambrainDomainSitechunkData` | GoogleApi.ContentWarehouse.V1.Model.SpamBrainData.t | Domain sitechunk level scores coming from spambrain. |
| `spamCookbookAction` | GoogleApi.ContentWarehouse.V1.Model.SpamCookbookAction.t | Actions based on Cookbook recipes that match the page. |
| `IsAnchorBayesSpam` | boolean() | Is this document considered spam by the anchor bayes classifier? |
| `KeywordStuffingScore` | integer() | The keyword stuffing score is represented in 7 bits, going from 0 to 127. |
| `SpamWordScore` | integer() | The spamword score is represented in 7-bits, going from 0 to 127. |
| `ScaledLinkAgeSpamScore` | integer() | End DEPRECATED --- Link age score is represented as a 7-bit integer, going from 0 to 127. |
| `spamrank` | integer() | The spamrank measures the likelihood that this document links to known spammers. Its value is between 0 and 65535. |
| `hostAge` | integer() | The earliest firstseen date of all pages in this host/domain. These data are used in twiddler to sandbox fresh spam in serving time. It is 16 bit and the time is day number after 2005-12-31. |
| `domainAge` | integer() | 16-bit |
| `liveResultsData` | GoogleApi.ContentWarehouse.V1.Model.WeboftrustLiveResultsDocAttachments.t | *(no description provided in leak)* |
| `OriginalContentScore` | integer() | The original content score is represented as 7-bits, going from 0 to 127. Only pages with little content have this field. The actual original content score ranges from 0 to 512. |
| `nsrIsElectionAuthority` | boolean() | This field is propagated to shards. It will also be populated at serving time by go/web-signal-joins. This field is deprecated - used the equivalent field inside nsr_data_proto instead. |
| `nsrIsCovidLocalAuthority` | boolean() | This field is propagated to shards. In addition, it is populated at serving time by go/web-signal-joins. This field is deprecated - used the equivalent field inside nsr_data_proto instead. |
| `toolbarPagerank` | integer() | A copy of the value stored in /namespace/indexing/wwwglobal//fakepr/* for this document. A value of quality_bakery::FakeprUtils::kUnknownToolbarPagerank indicates that we don't have toolbar pagerank for this document. |
| `inNewsstand` | boolean() | This field indicates whether the document is in the newsstand corpus. |
| `scaledSelectionTierRank` | integer() | Selection tier rank is a language normalized score ranging from 0-32767 over the serving tier (Base, Zeppelins, Landfills) for this document. |


**CompressedQualitySignals** - spam/trust-relevant attributes (subset of 35 total)

| Attribute | Type | Description |
|---|---|---|
| `exactMatchDomainDemotion` | integer() | Page quality signals converted from fields in proto QualityBoost in quality/q2/proto/quality-boost.proto. To save indexing space, we convert the float values in [0, 1] to integers in range [0, 1023] |
| `navDemotion` | integer() | nav_demotion: converted from QualityBoost.nav_demoted.boost. |
| `siteAuthority` | integer() | site_authority: converted from quality_nsr.SiteAuthority, applied in Qstar. |
| `babyPandaV2Demotion` | integer() | New BabyPanda demotion, applied on top of Panda. This is meant to replace |baby_panda_demotion|. |
| `authorityPromotion` | integer() | authority promotion: converted from QualityBoost.authority.boost |
| `babyPandaDemotion` | integer() | baby_panda_demotion: converted from QualityBoost.rendered.boost. |
| `serpDemotion` | integer() | serp demotion: applied in Qstar. |
| `anchorMismatchDemotion` | integer() | anchor_mismatch_demotion: converted from QualityBoost.mismatched.boost. |
| `scamness` | integer() | Scam model score. Used as one of the web page quality qstar signals. Value range from 0 to 1023. |
| `pandaDemotion` | integer() | This is the encoding of Panda fields in the proto SiteQualityFeatures in quality/q2/proto/site_quality_features.proto. |
| `unauthoritativeScore` | integer() | Unauthoritative score. Used as one of the web page quality qstar signals. |
| `ugcDiscussionEffortScore` | integer() | UGC page quality signals. (Times 1000 and floored) |

**QualityNsrNsrData** - spam/trust-relevant attributes (subset of 40 total)

| Attribute | Type | Description |
|---|---|---|
| `spambrainLavcScores` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrVersionedFloatSignal.t) | *(no description provided in leak)* |
| `siteChunk` | String.t | Primary NSR sitechunk. In most of the cases it's same as HOST_LEVEL_V3 sitechunked canonical url of the document. In rare, but important cases it's based on page markup. |
| `chardEncoded` | integer() | Site-level chard score: site quality predictor based on content. |
| `tofu` | number() | Site-level tofu score: site quality predictor based on content. |
| `siteQualityStddev` | number() | Estimate of site's PQ rating stddev--spread of the page-level PQ ratings of a site. |
| `spambrainLavcScore` | number() | The SpamBrain LAVC score, as of July 2022. See more information at go/cloverfield-lavc-deck. |
| `isElectionAuthority` | boolean() | Bit to determine whether the site has the election authority signal, as computed by go/election-authority |
| `vlqNsr` | number() | NSR from a headroom model targeting low-quality video sites. |
| `siteQualityStddevs` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrVersionedFloatSignal.t) | *(no description provided in leak)* |
| `localityScore` | number() | Locality score of the site, i.e. the locality component of the LocalAuthority signal (see go/pq-localauthority). |
| `isCovidLocalAuthority` | boolean() | Bit to determine whether the site has the local authority covid signal, as computed by go/covid-local-authority |
| `chardVariance` | number() | *(no description provided in leak)* |
| `chardScoreVariance` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrVersionedFloatSignal.t) | Site-level Chard Variance for all pages of a site. |
| `chardScoreEncoded` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrVersionedIntSignal.t) | Site-level Chard (encoded as an int). |
| `secondarySiteChunk` | String.t | Secondary NSR sitechunk. When present, it provides more granular chunking than primary sitechunks. |
| `smallPersonalSite` | number() | Score of small personal site promotion go/promoting-personal-blogs-v1 |
| `isVideoFocusedSite` | boolean() | Bit to determine whether the site has mostly video content, but is not hosted on any known video-hosting domains. |
| `videoScore` | number() | *(no description provided in leak)* |
| `vlq` | number() | Score of the Video LQ model. |




**IndexingDocjoinerDataVersion** - spam annotation tracks (subset of 428 total)

| Attribute | Type | Description |
|---|---|---|
| `spamBrainSpamBrainPageClassifierAnnotation` | VersionInfo | SpamBrain page-level classifier annotation |
| `spamBrainSpamBrainData` | VersionInfo | SpamBrain data annotation |
| `spambrainDomainSitechunkData` | VersionInfo | Domain sitechunk level SpamBrain data |
| `spamCookbookCookbookAnnotations` | VersionInfo | Rule-based Cookbook spam annotations |
| `spamCookbookCookbookSitechunkAnnotations` | VersionInfo | Sitechunk-level Cookbook spam annotations |
| `spamHackedSitesDocSpamInfo` | VersionInfo | Hacked-site document spam info |
| `spamHackedSitesGpgbGpgbNgramStats` | VersionInfo | Hacked-site n-gram statistics |
| `spamHackedSitesWordFrequencies` | VersionInfo | Hacked-site word frequency analysis |
| `spamContentAnchorDist` | VersionInfo | Anchor distribution spam |
| `spamContentAuthenticAuthenticTextAnnotation` | VersionInfo | Authentic text annotation (spun/stitched content detection) |
| `spamContentImageMapPb` | VersionInfo | Image-based spam mapping |
| `spamContentSiteAgeStats` | VersionInfo | Site age statistics for spam detection |
| `spamScamScamness` | VersionInfo | Scam model annotation |
| `spamScamUnauthoritativeSite` | VersionInfo | Unauthoritative site annotation |
| `spamGooglebombsGooglebombsAnnotation` | VersionInfo | Googlebomb detection annotation |
| `spamJsJsInfo` | VersionInfo | JavaScript spam/cloaking info |
| `spamTokensSpamTokensAnnotation` | VersionInfo | Spam token annotation |
| `spamFatpingIndexFeed` | VersionInfo | Feed-based spam (fatping) |
| `spamGodclusterAffIdAnnotation` | VersionInfo | Affiliate ID spam clustering |
| `spamGodclusterServerHeaderAnnotation` | VersionInfo | Server header spam clustering |

**UrlPoisoningData** - 4 attributes

| Attribute | Type | Description |
|---|---|---|
| `numSpamSiblings` | integer() | *(no description provided in leak)* |
| `NotChangedTimeMs` | String.t | fetched from the web. Time when the page was last |
| `OriginalCrawlTimeMs` | String.t | Time when the page was |
| `url` | String.t | when it is fetched from the repository. URL of the document for debugging |

### Patent Analysis

##### US8554769B1 - Identifying gibberish content in resources

- **Core concept:** Language model scoring is used to detect gibberish, spun, and stitched-together content. N-gram probability analysis identifies text that reads as assembled rather than written.
- **Connected leak modules:** `PerDocData`, `CompressedQualitySignals`, `QualityNsrNsrData`
- **SEO claims:**
  - A language model score is generated by applying an n-gram language model to the text content of a resource
  - A query stuffing score is generated to detect keyword stuffing
  - N-gram language models compute the probability of word sequences - gibberish has low probability
  - Gibberish content is generated by: scraping and randomly splicing content, translating from other languages, using low-cost untrained labor, and stitching together unrelated text
  - The system can identify content that reads assembled rather than naturally written
  - Multiple scoring signals (language model score + query stuffing score) are combined for classification
- **SEO action:** If a page reads assembled rather than written, fix it or kill it. Language-model detection is patented, deployed tech. The leak's `GibberishScore`, `KeywordStuffingScore`, `DocLevelSpamScore`, and `spambrainTotalDocSpamScore` fields are the direct implementation.

##### US7603350B1 - Search result ranking based on trust (TrustRank)

- **Core concept:** Search results are ranked by trust scores associated with entities that provide labels/annotations for documents. Trust flows through labeled references from trusted entities.
- **Connected leak modules:** `CompressedQualitySignals`, `QualityNsrNsrData`, `PerDocData`
- **SEO claims:**
  - Entities provide annotations (labels) for web content items
  - Trust relationships between entities are stored as tuples (trusting entity, trusted entity, trust value)
  - Trust can be topic-specific - an entity may be trusted for one topic but not another
  - Documents labeled by trusted entities receive ranking boosts
  - Trust is transitive - trust flows through chains of trusted relationships
  - The system computes a trust score for each document based on the trustworthiness of its labelers
  - Trust is a computed input, not a subjective assessment
- **SEO action:** Earn endorsements from sources your niche already trusts. Trust flows through labelled references, not claims about yourself. The leak's `unauthoritativeScore`, `scamness`, and `siteAuthority` fields confirm trust is quantified.

##### US8818995B1 - Search result ranking based on trust (continuation)

- **Core concept:** Search results are ranked according to trust factors derived from trust relationships between users and entities that have annotated/labeled documents. Trust ranks of annotators adjust the IR scores of documents they have labeled.
- **Connected leak modules:** `QualityLabelsGoogleLabelData`, `QualitySherlockKnexAnnotation`, `RepositoryWebrefEntityJoin`, `RepositoryWebrefWebrefEntities`, `WeboftrustLiveResultDocBoostData`, `WeboftrustLiveResultsDocAttachments`, `CompressedQualitySignals`
- **SEO claims:**
  - Trust relationships are determined from web visitation patterns: if a user visits a web page associated with an entity, a trust relationship with that entity is established and does not decrease over time, while trust in entities not visited decays over time
  - Documents are associated with annotation label terms provided by entities; when a query term matches an annotation label, the trust rank of the annotating entity is used to adjust the document's relevance score
  - Trust relationships propagate transitively: if the user trusts entity A and entity A trusts entity B, the user's trust in entity B is inferred
  - A link from a user's web page to an entity's page establishes a trust relationship between the user and that entity
  - A 'vanity list' on an entity's page listing users who trust that entity is used to identify trust relationships
  - When multiple entities provide the same annotation label for a document, a weight based on the number of instances is applied to each entity's trust rank, and the weighted trust ranks are aggregated to generate an aggregated trust rank that adjusts the document's relevance score
  - User input at an entity's web page (e.g., commenting, interacting) maintains the strength of the trust relationship with that entity
- **SEO action:** Google tracks trust relationships derived from user browsing behavior and uses them to weight annotations/labels on your content. Encourage repeat visits and user engagement - trust decays for sites users don't revisit. Getting annotations/labels from trusted entities boosts relevance scores. The leak's Weboftrust and GoogleLabelData modules confirm this trust-annotation system is live.

##### US8452746B2 - Detecting spam search results for context processed search queries

- **Core concept:** A programmable search engine processes context files from third-party content providers that define query preprocessing and result postprocessing. Spam and biased contexts/results are identified using annotation files, and results flagged as spam are removed before presentation.
- **Connected leak modules:** `SpamBrainScore`, `SpamBrainData`, `SpamMuppetjoinsMuppetSignals`, `IndexingDocjoinerAnchorSpamInfo`, `IndexingDocjoinerAnchorPhraseSpamInfo`, `SpamCookbookAction`, `QualityLabelsGoogleLabelData`, `QualitySherlockKnexAnnotation`
- **SEO claims:**
  - Context files from third-party content providers contain commands for preprocessing search queries and postprocessing search results, used to generate context-processed search queries
  - An annotation file is analyzed for each context-processed search result to determine whether a corresponding entry refers to spam, and results flagged as spam are removed from the result set before presentation
  - Each annotation file entry comprises a link to a web page, and the system determines whether the linked web page contains spam
  - Context files can refer to related context files, enabling cascading context processing across multiple provider contexts
  - Preprocessing commands can evaluate property values of the query against predefined properties or modify the search query input before execution
  - The system identifies spam-related and biased contexts using both offline and query-time processing stages, and context files from providers associated with spam/biased contexts are excluded from processing on direct user queries
  - Annotation labels can be selected by users to generate new search results associated with the selected labels, enabling user-driven filtering
- **SEO action:** Google uses annotation files to flag spam in programmable search contexts - your site can be removed from results if flagged as spam in these annotations. Avoid patterns that trigger spam detection. The leak's SpamBrainScore, SpamBrainData, and AnchorSpamInfo modules confirm Google actively tracks spam signals at the anchor and document level.

##### US9183499B1 - Evaluating quality based on neighbor features

- **Core concept:** A quality model computes a second quality score for an entity using not just its own features, but also the quality scores of neighbor entities that link to it. Quality propagates through the link graph iteratively as the model is periodically retrained.
- **Connected leak modules:** `QualityNsrNsrData`, `QualityNsrPQData`, `AnchorsAnchor`, `Anchors`, `IndexingDocjoinerAnchorStatistics`, `CompressedQualitySignals`, `PerDocData`, `QualityNsrNsrDataClusterUplift`
- **SEO claims:**
  - A second quality score for a candidate entity is computed using a quality model that takes as inputs: a first quality score for the entity, neighbor features (quality scores of linked-to neighbor entities), and entity-specific feature values determined independent of neighbors
  - Neighbor entities are identified by links: a neighbor is an entity that includes a hyperlink referencing the candidate entity, or an entity hosted on the same host data processing apparatus
  - The neighbor feature includes an average neighbor quality score, computed as the average of quality scores of the entities linking to the candidate
  - Entity-specific features include: a layout score indicating the quality of the visual layout of the entity; a selection rate (click-through rate); and a selection duration indicating the average time the entity is displayed when selected
  - Quality scores propagate ('smear') from entity to entity across the link graph as the model is iteratively applied and retrained, meaning the quality of distant neighbors eventually influences a candidate's score
  - Entities with high quality scores may be indexed more frequently by the search engine than entities with low quality scores, making quality a crawl-rate signal
  - An entity can be a set of websites sharing a common characteristic, not just a single page, allowing quality scoring at the site-group level
- **SEO action:** Your site's quality score is influenced by the quality of sites that link to you - links from high-quality neighbors boost you more. The mechanism is bidirectional and iterative: quality 'smears' across the graph over time. Layout quality and user engagement metrics (CTR, dwell time) are direct inputs. The leak's `siteQualityStddev` and `chardEncoded` fields feed this neighbor-feature model.

##### US9558233B1 - Determining a quality measure for a resource

- **Core concept:** A three-tier quality scoring system: seed resources are scored based on link count and link selection quality (click duration); source resources linking to seeds inherit seed scores; and source-referenced resources inherit source scores. Low-quality sources are discounted.
- **Connected leak modules:** `AnchorsAnchor`, `Anchors`, `AnchorsAnchorSource`, `IndexingDocjoinerAnchorStatistics`, `AnchorsRedundantAnchorInfo`, `QualityNsrNsrData`, `QualityNsrPQData`, `CompressedQualitySignals`, `PerDocData`
- **SEO claims:**
  - A seed score for each seed resource is based on the total number of resources linking to it and the total number of selections of those links, where each selection is a user navigation to the seed resource
  - The seed score is based on a ratio between total selections of links to the seed and total number of resources linking to the seed - effectively a per-link click-through rate
  - A selection quality score is determined for each click on a link to the seed, based on click duration (dwell time), with clicks classified as short, medium, or long clicks
  - Source resources (pages that link to at least one seed) receive a source score based on the seed scores of the seeds they link to
  - Source-referenced resources (pages linked to by source resources) receive a resource score based on the source scores of the sources that link to them - creating a three-tier propagation of quality
  - Source resources with scores below a threshold are classified as 'unqualified,' and their links to source-referenced resources are discounted from the total link count during ranking
  - Anchor text from source resources is broken into n-grams, and the source score is assigned to each n-gram, creating n-gram quality scores that can adjust query-level rankings
  - An n-gram score for each n-gram is determined based on source scores assigned to that n-gram across all source resources whose anchor text contains the n-gram - this adjusts rank scores for queries containing matching n-grams
- **SEO action:** Google scores link quality in three tiers: seeds, sources, and referenced resources. Links from 'qualified' sources (those that link to high-quality seeds) pass more weight. Links from 'unqualified' sources are discounted. Anchor text n-grams carry the source's quality score. Focus on earning links from pages that themselves link to authoritative sites.

##### US10270791B1 - Search entity transition matrix and applications

- **Core concept:** Builds a transition matrix capturing relationship strengths between search entities (queries, documents, sessions, ads) from search history data, used for spam detection, ranking adjustments, and anchor text quality evaluation.
- **Connected leak modules:** `link_analysis`, `anchor_text`, `spam_detection`, `ranking`, `navboost`, `quality`
- **SEO claims:**
  - Transition probabilities between search entities (queries, documents, sessions) are computed from search history data
  - Spam detection: if a session is identified as spam, transition probabilities propagate spam scores to associated queries
  - Spam scores modify quality-of-results statistics: quality statistic is scaled by (1 - spam_score)
  - Anchor text quality is evaluated using transition probabilities: anchor text is compared to queries with high transition probability to the target document
  - Anchor text similarity is measured both textually (edit distance) and semantically (using transition probabilities between queries)
  - Documents with anchor text similar to high-transition-probability queries get ranking boosts
  - Trending queries are identified by detecting increases in transition probability over time
- **SEO action:** Anchor text is evaluated for quality based on its relationship to queries that naturally lead to the target document. Generic or irrelevant anchor text that doesn't match the document's natural query transition pattern may be devalued. Build natural anchor text that matches what users actually search for when seeking your content.

### SEO actions

- **Never buy or build manipulative anchor text patterns.** The `IndexingDocjoinerAnchorSpamInfo` module tracks `spamProbability`, `phraseRate` ("Average daily rate of spam anchor discovery"), `phraseFraq` ("Spam phrases fraction of all anchors"), and applies a `spamPenalty` ("Combined penalty for anchor demotion") with specific `demotedStart` / `demotedEnd` demotion periods. US10270791B1 confirms anchor text is compared to natural query transition patterns - anchor text that doesn't match what users actually search for is devalued. A sudden spike in anchor text with identical phrases across many domains triggers `phraseAnchorSpamStart` / `phraseAnchorSpamEnd` spike detection.
- **Write naturally - gibberish and stitched content is detected by language models.** US8554769B1 confirms n-gram language models compute the probability of word sequences. The `GibberishScore` (0-127), `SpamWordScore`, `KeywordStuffingScore`, and `DocLevelSpamScore` are independent classifiers. Content generated by scraping, splicing, translating, or stitching unrelated text is identified as "assembled rather than naturally written." If you use AI-generated content, ensure it reads as coherent, naturally-written prose - low n-gram probability scores will flag it.
- **Earn links from sites that themselves link to authoritative sources.** US9558233B1's three-tier system means links from "qualified" sources (pages linking to high-quality seeds) pass more weight, while links from "unqualified" sources (below threshold) are discounted. US9183499B1 confirms quality propagates through the link graph - your quality score is influenced by the average quality of your link neighbors. Focus link building on sites that already link to authoritative destinations in your niche.
- **Monitor for hacked-site signals.** The `IndexingDocjoinerDataVersion` module tracks `spamHackedSitesDocSpamInfo`, `spamHackedSitesGpgbGpgbNgramStats`, and `spamHackedSitesWordFrequencies` - Google detects hacked content via n-gram statistics and word frequency analysis. The `PerDocData.spamMuppetSignals` field carries "hacked site signals which will be used in query time joins." Regularly monitor your site for unauthorized content injection, especially pharmaceutical, gambling, or pornographic spam that attackers inject into legitimate pages.
- **Build trust through repeat visits and user engagement.** US8818995B1 confirms that "trust relationships are determined from web visitation patterns" and "trust in entities not visited decays over time." The `WeboftrustLiveResultDocBoostData` with its `boostLevel` (updated "from time to time based on CTR and other signals") shows that trust boosting is dynamic and CTR-dependent. Encourage return visits, build email lists, create content that earns bookmarks - these user behaviors establish and maintain trust relationships that boost rankings.
- **Understand that SpamBrain operates at page, host, and domain-sitechunk levels simultaneously.** The `PerDocData.spambrainData` (host-v1 sitechunk), `PerDocData.spambrainDomainSitechunkData` (domain sitechunk), `PerDocData.spambrainTotalDocSpamScore` (document, 0-1), and `QualityNsrNsrData.spambrainLavcScore` (site-level LAVC) show four levels of SpamBrain scoring. A spam signal at any level can affect all pages on the site. The versioned scoring (`SpamBrainScore.versionId` derived from epoch) means scores are re-evaluated as models update - a site that was clean under one model version may be flagged under the next.
- **Avoid all spam patterns simultaneously - the classifiers are independent.** The leak reveals at least 15 independent spam classifiers: `DocLevelSpamScore`, `GibberishScore`, `KeywordStuffingScore`, `SpamWordScore`, `spambrainTotalDocSpamScore`, `spamrank`, `IsAnchorBayesSpam`, `uacSpamScore`, `spamtokensContentScore`, `trendspamScore`, `ScaledSpamScoreYoram`/`Eric`, `ScaledLinkAgeSpamScore`, plus the Cookbook rule-based system, hacked-site detection, Googlebomb detection, and scam/unauthoritative site detection. Tripping any one applies a demotion in Q* via `CompressedQualitySignals`. The `hostAge` field is "used in twiddler to sandbox fresh spam in serving time" - new sites with spam signals get sandboxed more aggressively than established sites.
- **Audit your link profile for phrase-level spam patterns.** The `IndexingDocjoinerAnchorPhraseSpamInfo` module tracks `phraseAnchorSpamCount` ("How many spam phrases found in the anchors among unique domains"), `phraseAnchorSpamRate` ("Average daily rate of spam anchor discovery"), and `phraseAnchorSpamDays` ("Over how many days 80% of these phrases were discovered"). If 80% of your anchor text phrases were discovered in a short window, that indicates a coordinated campaign. Use Google Search Console's link report to audit anchor text diversity - if a disproportionate number of linking domains use identical anchor text, you may be flagged.
- **Understand that the `spamContentSiteAgeStats` annotation uses site age as a spam signal.** The `IndexingDocjoinerDataVersion` module tracks `spamContentSiteAgeStats` as a versioned annotation. Combined with `PerDocData.hostAge` ("used in twiddler to sandbox fresh spam in serving time"), this means new sites are under heightened scrutiny. Build trust gradually - the first months of a new domain are the most vulnerable to spam sandboxing. Avoid aggressive link building, automated content generation, or any borderline tactics during this establishment period.
- **Monitor for affiliate and server-header spam signals.** The `spamGodclusterAffIdAnnotation` and `spamGodclusterServerHeaderAnnotation` entries in `IndexingDocjoinerDataVersion` show Google tracks affiliate IDs and server headers for spam clustering. If your site shares hosting infrastructure or affiliate relationships with known spam sites, you may be clustered with them. Use dedicated hosting, monitor your server headers for anomalies, and be cautious with shared affiliate programs that also enroll low-quality sites.- **Recognize that `spamContentAuthenticAuthenticTextAnnotation` detects spun and stitched content.** The `IndexingDocjoinerDataVersion` module includes `spamContentAuthenticAuthenticTextAnnotation` - an annotation specifically for text authenticity. Patent **US8554769B1** confirms this system identifies "content that reads assembled rather than naturally written" using n-gram language models. Content that has been scraped, randomly spliced, machine-translated without human review, or stitched from unrelated sources will trigger this annotation. Write original content or thoroughly edit AI-generated content to ensure natural prose flow.
- **Monitor for `spamGodclusterAffIdAnnotation` if you run affiliate sites.** Google clusters sites by affiliate ID and server headers. If other sites in your affiliate cluster are spammy, your site may inherit negative signals. Choose affiliate programs with quality standards, and periodically audit what other sites share your affiliate IDs.- **Understand that the `spamFatpingIndexFeed` annotation tracks feed-based spam.** The `IndexingDocjoinerDataVersion` module includes `spamFatpingIndexFeed` - an annotation for spam detected through feed indexing. If your RSS/Atom feeds contain spam patterns, scraped content, or excessive promotional links, this annotation will flag it. Keep your feeds clean and representative of your actual content quality.
- **Use `CompressedQualitySignals.ugcDiscussionEffortScore` as a signal for forum and community sites.** This field ("UGC page quality signals. (Times 1000 and floored)") measures the effort level in user-generated content. If your forum or community platform has low-effort posts (short, spammy, or low-quality UGC), this score will be low and may trigger demotion. Implement quality controls: minimum post length, spam filters, moderation, and reputation systems to maintain UGC effort scores.- **Recognize that the `spamJsJsInfo` annotation tracks JavaScript-based cloaking and spam.** The `IndexingDocjoinerDataVersion` module includes `spamJsJsInfo` - JavaScript spam information. Google renders JavaScript and compares the rendered content against the raw HTML. If your JavaScript injects spam keywords, hidden links, or cloaked content that differs from what crawlers see, this annotation will flag it. Ensure your JavaScript enhances rather than manipulates content. Avoid cloaking scripts, hidden text injection, or doorways created via JS. The rendered DOM is what Google evaluates - there is no safe hiding place in JavaScript.

- **Remember that the `spamGooglebombsGooglebombsAnnotation` tracks Googlebomb patterns.** A Googlebomb occurs when many sites link to a target with identical anchor text to manipulate rankings for a specific (often humorous or political) query. The `IndexingDocjoinerDataVersion` module tracks this as a versioned annotation. While Googlebombs are historically associated with political pranks, the same pattern - coordinated identical anchor text across many domains - can trigger this annotation even in commercial contexts. Diversify your anchor text naturally.


---
