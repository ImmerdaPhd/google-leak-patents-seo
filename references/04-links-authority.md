# Stage 4: Link Analysis & Authority Computation

**Leak modules (8):** `AnchorsAnchor`, `AnchorsAnchorSource`, `Anchors`, `AnchorsRedundantAnchorInfo`, `IndexingDocjoinerAnchorStatistics`, `IndexingDocjoinerAnchorSpamInfo`, `IndexingDocjoinerAnchorPhraseSpamInfo`, `KaltixPerDocData`

**Relevant patents (7):** US6285999B1, US7716225B1, US9165040B1, US7308643B1, US9953049B1, US9400849B1, US10270791B1

### How this works

**1. PageRank is still computed and stored per document.** `GDocumentBase.PagerankNS` is "Pagerank-NearestSeeds ... the production PageRank value teams should use." `PerDocData.homepagePagerankNs` is "The page-rank of the homepage of the site." `PerDocData.toolbarPagerank` is "A copy of the value stored in /namespace/indexing/wwwglobal//fakepr/* ... A value between 0 and 10." Patent **US6285999B1** (PageRank) defines the algorithm: "A page's rank is determined by the ranks of pages linking to it, weighted by their outbound link count ... Links from important pages carry more weight ... A damping factor models the probability that a random surfer continues clicking links versus jumping to a random page." The leak's `AnchorsAnchor.pagerankWeight` ("Weight to be stored in linkmaps for pageranker") is the per-link weight that feeds the iterative computation, and `AnchorsAnchorSource.pagerankNs` ("uint16 scale") and `AnchorsAnchorSource.indyrank` ("uint16 scale") are the source-page authority values. The `KaltixPerDocData.KaltixRank` ("approx. 2 bytes for top 1B") is a Kaltix (Google's post-PageRank ranking system) score stored per doc.

**2. Links do not pass equal weight - the Reasonable Surfer model weights by click probability.** Patent **US7716225B1** (Reasonable Surfer) states: "Links do not pass equal weight; the probability of a user clicking a link determines its ranking contribution ... Link features that affect weight include: font size of anchor text, position in document (above/below fold, sidebar, footer, list position), font color and attributes, number of words in anchor text ... whether link is same-host/domain." The leak implements this precisely. `AnchorsAnchor.fontsize` records the anchor's font size. `AnchorsAnchor.sourceType` "records the quality of the anchor's source page and is correlated with but not identical to the index tier ... TYPE_HIGH_QUALITY are from base documents ... TYPE_LOW_QUALITY are from documents of low quality." `AnchorsAnchor.weight` ("weights are 0-127") is the per-link weight. `AnchorsAnchor.locality` ("the quality of an anchor is measured by its 'locality' and 'bucket'") and `AnchorsAnchor.bucket` encode the link's quality tier. `AnchorsAnchor.context2` ("a hash of terms near the anchor") and `AnchorsAnchor.fullLeftContext` / `fullRightContext` capture the surrounding-text features the patent lists. `AnchorsAnchor.isLocal` ("roughly indicates whether an anchor's source and target pages are on the same domain") implements the same-host/domain feature. `AnchorsAnchor.parallelLinks` ("The number of additional links from the same source page to the same target domain") captures link dilution on the source page.

**3. Anchor text is indexed with the target document, providing extrinsic ranking signals.** Patent **US7308643B1** (anchor tag indexing) explains: "Anchor text associated with a URL is extracted and stored as part of an anchor map ... Target documents are indexed using both their own content and the anchor text from all linking documents ... This enables indexing of URLs that contain no textual content (e.g., images) via their anchor text." The leak's `AnchorsAnchor.text` ("Space-delimited anchor words") and `AnchorsAnchor.origText` ("Original text, including capitalization and punctuation") are the indexed anchor strings. `IndexingDocjoinerAnchorStatistics.anchorCount`, `offdomainAnchorCount`, `ondomainAnchorCount`, `onsiteAnchorCount`, `localAnchorCount`, `nonLocalAnchorCount`, `baseAnchorCount`, `mediumCorpusAnchorCount`, `lowCorpusAnchorCount`, `topPrOnsiteAnchorCount`, `topPrOffdomainAnchorCount`, and `topPrOndomainAnchorCount` are the aggregate counts that determine how much anchor-text weight a page receives. The `topPr*` fields ("According to anchor quality bucket, anchor with pagrank > 51000 is the best anchor. anchors with pagerank < 47000 are all same") show that Google buckets anchors by source PageRank and counts only high-PR anchors in the top tier.

**4. Trust is computed as distance from trusted seed pages through the link graph.** Patents **US9165040B1** and **US9953049B1** (ranking using distances in a web-link graph) describe: "A set of trusted seed pages is selected ... Link length is computed as a function of the number of outgoing links from the source page - more outbound links means longer link length ... Link length formula: α + log(|q|_out) ... Shortest distance from seeds to a page determines its ranking score ... The kth-closest seed (not the nearest) is used to compute ranking score, providing robustness." Patent **US9400849B1** (scalable short paths) confirms this runs at web scale: "The web link graph is divided into shards, each assigned to a different server for parallel processing ... Each server computes the n nearest seeds and respective distances." The leak's `PerDocData.homepagePagerankNs` (homepage authority as a proxy for seed proximity), `CompressedQualitySignals.siteAuthority` ("site_authority: converted from quality_nsr.SiteAuthority, applied in Qstar"), and `AnchorsAnchorSource.outdegree` / `AnchorsAnchorSource.outsites` ("approx num of pointed-to sites") are the inputs - the outdegree directly determines link length in the patent formula (more outbound links = longer link = less trust passed).

**5. Anchor spam is detected, penalized, and can suppress link equity entirely.** `IndexingDocjoinerAnchorSpamInfo` is a rich spam-detection module. `spamProbability` is "Predicted probability of spam." `spamPenalty` is "Combined penalty for anchor demotion." `phraseFraq` is "Spam phrases fraction of all anchors of the document." `phraseRate` is "Average daily rate of spam anchor discovery." `anchorFraq` is "Ratio of spam demoted period to all anchor period." `demoted` / `demotedAll` / `demotedStart` / `demotedEnd` record the demotion window. `IndexingDocjoinerAnchorPhraseSpamInfo` tracks phrase-spike spam: `phraseAnchorSpamStart` / `phraseAnchorSpamEnd` ("Time when anchor spam spike started/ended with padding"), `phraseAnchorSpamRate` ("Average daily rate of spam anchor discovery"), and `phraseAnchorSpamPenalty` ("Combined penalty for anchor demotion"). `IndexingDocjoinerAnchorStatistics.spamLog10Odds` is "The log base 10 odds that this set of anchors exhibits spammy behavior. Computed in the AnchorLocalizer." Patent **US10270791B1** (search entity transition matrix) adds: "Anchor text quality is evaluated using transition probabilities: anchor text is compared to queries with high transition probability to the target document ... Documents with anchor text similar to high-transition-probability queries get ranking boosts" - i.e., anchor text is validated against the natural query stream, and mismatched anchors are devalued. `IndexingDocjoinerAnchorStatistics.badbacklinksPenalized` ("Whether this doc is penalized by BadBackLinks, in which case we should not use improvanchor score") and `penguinPenalty` ("Page-level penguin penalty (0 = good, 1 = bad)") / `penguinTooManySources` ("Doc not scored because it has too many anchor sources") show that the Penguin system can fully suppress anchor-based scoring for penalized pages.

### SEO actions
- **Earn links from authoritative pages, not just many links.** US6285999B1: link weight comes from the source page's rank. `AnchorsAnchorSource.pagerankNs` and `sourceType` (HIGH/MEDIUM/LOW quality) determine how much each link counts - one link from a HIGH_QUALITY base-tier page beats many from LOW_QUALITY blackhole pages.
- **Place important links in main content, not footers/sidebars.** US7716225B1: click probability determines link weight. `AnchorsAnchor.fontsize`, `context2`, and `weight` (0-127) encode this - footer links with small fonts and low click rates pass less equity.
- **Write descriptive anchor text matching natural search queries.** US7308643B1: anchor text is indexed with the target. US10270791B1: anchor text is validated against query transition probabilities - generic or irrelevant anchors are devalued.
- **Get links from sites close to trusted seeds.** US9165040B1/US9953049B1: ranking is proportional to e^(-distance) from seeds. `siteAuthority` and `homepagePagerankNs` reflect this proximity. Links from pages with fewer outbound links (`outdegree`) pass more trust (shorter link length).
- **Avoid anchor spam patterns - they trigger Penguin and phrase-spike penalties.** `spamLog10Odds`, `phraseAnchorSpamRate`, `penguinPenalty`, and `badbacklinksPenalized` can fully suppress anchor scoring. Sudden spikes in anchor discovery (`phraseRate`) are flagged as spam.

### Leak attributes relevant to Stage 4

**AnchorsAnchor** - 39 attributes

| Attribute | Type | Description |
|---|---|---|
| `creationDate` | integer() | used for history - the first and last time we have seen this anchor. creation_date also used for Freshdocs Twitter indexing, a retweet is an anchor of the original tweet. This field records the time when a retweet is created. |
| `origText` | String.t | Original text, including capitalization and punctuation. Runs of whitespace are collapsed into a single space. |
| `context2` | integer() | This is a hash of terms near the anchor. (This is a second-generation hash replacing the value stored in the 'context' field.) |
| `fontsize` | integer() | *(no description provided in leak)* |
| `experimental` | boolean() | If true, the anchor is for experimental purposes and should not be used in serving. |
| `fragment` | String.t | The URL fragment for this anchor (the foo in |
| `sourceType` | integer() | is to record the quality of the anchor's source page and is correlated with but not identical to the index tier of the source page. In the docjoins built by the indexing pipeline (Alexandria), - Anchors marked TYPE_HIGH_QUALITY are from base documents. - Anchors marked TYPE_MEDIUM_QUALITY are from documents of medium quality (roughly but not exactly supplemental tier documents). - Anchors marked TYPE_LOW_QUALITY are from documents of low quality (roughly but not exactly blackhole documents). Not |
| `pagerankWeight` | number() | Weight to be stored in linkmaps for pageranker |
| `isLocal` | boolean() | The bit ~roughly~ indicates whether an anchor's source and target pages are on the same domain. Note: this plays no role in determining whether an anchor is onsite, ondomain, or offdomain in mustang (i.e., the bit above). |
| `originalTargetDocid` | String.t | The docid of the anchor's original target. This field is available if and only if the anchor is forwarded. |
| `fullLeftContext` | list(String.t) | The full context. These are not written out in the linklogs. |
| `expired` | boolean() | true iff exp domain |
| `catfishTags` | list(integer()) | CATfish tags attached to a link. These are similar to link tags, except the values are created on the fly within Cookbook. See: |
| `deletionDate` | integer() | *(no description provided in leak)* |
| `linkTags` | list(integer()) | Contains info on link type, source page, etc. |
| `forwardingTypes` | integer() | How the anchor is forwarded to the canonical, available only for forwarded anchors (i.e., the field is set). The forwarding types are defined in URLForwardingUtil (segindexer/segment-indexer-util.h). Always use URLForwardingUtil to access this field and use URLForwardingUtil::GetAnchorForwardingReason to get the explanation how the anchor is forwarded to the canonical. NOTE: Use with caution as it is only set for docjoins generated using the urlmap from repository/updater. |
| `possiblyOldFirstseenDate` | boolean() | DEPRECATED. It used to be set if firstseen_date is not set. It's to indicate that the anchor is possibly old, but we don't have enough information to tell until the linkage map is updated. TODO(hxu) rename it to possibly_old_firstseen_date_DEPRECATED after clean up other dependencies. |
| `locality` | integer() | For ranking purposes, the quality of an anchor is measured by its &quot;locality&quot; and &quot;bucket&quot;. See quality/anchors/definitions.h for more information. |
| `demotionreason` | integer() | DEPRECATED |
| `parallelLinks` | integer() | The number of additional links from the same source page to the same target domain. Not populated if is_local is true. |
| `text` | String.t | Space-delimited anchor words. Text that needs segmentation (like CJK or Thai) is unsegmented, since we set FLAGS_segment_during_lexing to false in mr-linkextractor.cc . |
| `source` | GoogleApi.ContentWarehouse.V1.Model.AnchorsAnchorSource.t | *(no description provided in leak)* |
| `bucket` | integer() | *(no description provided in leak)* |
| `fullRightContext` | list(String.t) | *(no description provided in leak)* |
| `targetUrlEncoding` | integer() | A given target URL may be found in different encodings in different documents. We store the URL encoding with each source anchor so that we can count them later to find the encoding most likely to be expected by the Web site. Around 0.7% of target URLs are expected to require a non-default value here. The default value 0 is referenced in C++ as webutil::kDefaultUrlEncoding. See also webutil/urlencoding. |
| `compressedOriginalTargetUrl` | String.t | The anchor's original target url, compressed. Available only in Alexandria docjoins when the anchor is forwarded. |
| `firstseenDate` | integer() | # days past Dec 31, 1994, 23:00:00 UTC (Unix time @788914800) that this link was first seen. Should never occupy more than 15 bits. NOTE: this is NOT the same as creation_date; firstseen_date is filled during link extraction |
| `setiPagerankWeight` | number() | TEMPORARY |
| `context` | integer() | *(no description provided in leak)* |
| `linkAdditionalInfo` | GoogleApi.ContentWarehouse.V1.Model.Proto2BridgeMessageSet.t | Additional information related to the anchor, such as additional anchor text or scores. |
| `type` | integer() | DEPRECATED: Now in link_tags |
| `firstseenNearCreation` | boolean() | true if we think 'firstseen_date' is an accurate estimate of when the link was actually added to the source page. false if it may have existed for some time before we saw it. |
| `lastUpdateTimestamp` | integer() | Used for history and freshness tracking - the timestamp this anchor is updated in indexing. |
| `offset` | integer() | This is the offset for the first term in the anchor - it can be used as a unique ID for the anchor within the document and compared against all per-tag data. This is measured in bytes from the start of the document. We write this out to the linklogs to recover the original order of links after source/target forwarding. This is necessary for computing the global related data. |
| `weight` | integer() | weights are 0-127 |
| `deleted` | boolean() | *(no description provided in leak)* |
| `encodedNewsAnchorData` | integer() | Encoded data containing information about newsiness of anchor. Populated only if anchor is classified as coming from a newsy, high quality site. Encoded data for anchor sources are being stored in googledata/quality/freshness/news_anchors/encoded_news_anchors_data.txt Scores are being computed with quality/freshness/news_anchors/ routines. |
| `compressedImageUrls` | list(String.t) | If the anchor contained images, these image urls are stored here in compressed form. |
| `timestamp` | String.t | This field is DEPRECATED and no longer filled. For source page crawl timestamp, use Source.crawl_timestamp. Next tag id should be 62. |

**AnchorsAnchorSource** - 25 attributes

| Attribute | Type | Description |
|---|---|---|
| `additionalInfo` | GoogleApi.ContentWarehouse.V1.Model.Proto2BridgeMessageSet.t | Additional information related to the source, such as news hub info. |
| `cluster` | integer() | anchor++ cluster id |
| `compressedUrl` | String.t | compressed source url |
| `crawlTimestamp` | String.t | Source page crawl timestamp. |
| `docid` | String.t | The docid field used to be &quot;required&quot;, but it is now &quot;optional&quot; because it is not present when anchors are stored in webtable. When anchors are stored as part of docjoin files in the segment indexer, however, docid should be considered required. |
| `doclength` | integer() | necessary for anything? |
| `homePageInfo` | integer() | Information about if the source page is a home page. It can be one of the enum values defined in PerDocData::HomePageInfo (NOT_HOMEPAGE, NOT_TRUSTED, PARTIALLY_TRUSTED, and FULLY_TRUSTED). |
| `indyrank` | integer() | uint16 scale |
| `ipaddr` | integer() | DEPRECATED, use packed_ipaddress |
| `language` | integer() | default -> English |
| `linkhash` | String.t | 0 -> no hash |
| `localCountryCodes` | list(integer()) | Countries to which the source page is local/most relevant; stored as III identifiers for country/region codes (see |
| `nsr` | integer() | This NSR value has range [0,1000] and is the original value [0.0,1.0] multiplied by 1000 rounded to an integer. |
| `outdegree` | integer() | *(no description provided in leak)* |
| `outsites` | integer() | approx num of pointed-to sites |
| `packedIpaddress` | String.t | string in IPAddress::ToPackedString() format. |
| `pageTags` | list(integer()) | Page tags are described by enum PageTag in PerDocData. Page tags are used in anchors to identify properties of the linking page. These are DEPRECATED: in the future, use link_tags instead. DEPRECATED |
| `pagerank` | integer() | uint16 scale |
| `pagerankNs` | integer() | unit16 scale |
| `seglanguage` | integer() | DEPRECATED |
| `site` | String.t | *(no description provided in leak)* |
| `spamrank` | integer() | uint16 scale |
| `spamscore1` | integer() | deprecated, to be removed after October 20. 0-127 scale |
| `spamscore2` | integer() | 0-127 scale |
| `webtableKey` | String.t | Webtable key of source |

**Anchors** - 11 attributes

| Attribute | Type | Description |
|---|---|---|
| `anchor` | list(GoogleApi.ContentWarehouse.V1.Model.AnchorsAnchor.t) | *(no description provided in leak)* |
| `homepageAnchorsDropped` | String.t | The total # of local homepage anchors dropped in AnchorAccumulator. |
| `indexTier` | integer() | The index tier from which the anchors were extracted. Note that this is only valid in the anchor record written by linkextractor. The value can be one of the enum values defined in segindexer/types.h. |
| `localAnchorsDropped` | String.t | The total # of local non-homepage anchors dropped in AnchorAccumulator. |
| `nonlocalAnchorsDropped` | String.t | The total # of non-local anchors dropped in AnchorAccumulator. |
| `redundantAnchorsDropped` | String.t | The *_anchors_dropped fields below are not populated by Alexandria, which uses cdoc.anchor_stats instead. The total # of redundant anchors dropped in linkextractor. |
| `redundantanchorinfo` | list(GoogleApi.ContentWarehouse.V1.Model.AnchorsRedundantAnchorInfo.t) | *(no description provided in leak)* |
| `supplementalAnchorsDropped` | String.t | The total # of supplemental anchors dropped in AnchorAccumulator. ## DEPRECATED. |
| `targetDocid` | String.t | may be implicit |
| `targetSite` | String.t | HOST_LEVEL site chunking. |
| `targetUrl` | String.t | This is produced during link extraction but not written out in the linklogs in order to save space. |

**AnchorsRedundantAnchorInfo** - 3 attributes

| Attribute | Type | Description |
|---|---|---|
| `anchorsDropped` | String.t | *(no description provided in leak)* |
| `domain` | String.t | *(no description provided in leak)* |
| `text` | String.t | *(no description provided in leak)* |

**IndexingDocjoinerAnchorStatistics** - 50 attributes

| Attribute | Type | Description |
|---|---|---|
| `penguinLastUpdate` | integer() | BEGIN: Penguin related fields. Timestamp when penguin scores were last updated. Measured in days since Jan. 1st 1995. |
| `anchorCount` | integer() | *(no description provided in leak)* |
| `badbacklinksPenalized` | boolean() | Whether this doc is penalized by BadBackLinks, in which case we should not use improvanchor score in mustang ascorer. |
| `penguinPenalty` | number() | Page-level penguin penalty (0 = good, 1 = bad). |
| `minHostHomePageLocalOutdegree` | integer() | Minimum local outdegree of all anchor sources that are host home pages as well as on the same host as the current target URL. |
| `droppedRedundantAnchorCount` | integer() | Sum of anchors_dropped in the repeated group RedundantAnchorInfo, but can go higher if the latter reaches the cap of kMaxRecordsToKeep. (indexing/docjoiner/anchors/anchor-loader.cc), currently 10,000 |
| `nonLocalAnchorCount` | integer() | *(no description provided in leak)* |
| `mediumCorpusAnchorCount` | integer() | *(no description provided in leak)* |
| `penguinEarlyAnchorProtected` | boolean() | Doc is protected by goodness of early anchors. |
| `droppedHomepageAnchorCount` | integer() | *(no description provided in leak)* |
| `redundantanchorinfoforphrasecap` | list(GoogleApi.ContentWarehouse.V1.Model.IndexingDocjoinerAnchorStatisticsRedundantAnchorInfoForPhraseCap.t) | *(no description provided in leak)* |
| `forwardedOffdomainAnchorCount` | integer() | *(no description provided in leak)* |
| `droppedNonLocalAnchorCount` | integer() | *(no description provided in leak)* |
| `perdupstats` | list(GoogleApi.ContentWarehouse.V1.Model.IndexingDocjoinerAnchorStatisticsPerDupStats.t) | *(no description provided in leak)* |
| `onsiteAnchorCount` | integer() | *(no description provided in leak)* |
| `droppedLocalAnchorCount` | integer() | *(no description provided in leak)* |
| `penguinTooManySources` | boolean() | Doc not scored because it has too many anchor sources. END: Penguin related fields. |
| `forwardedAnchorCount` | integer() | *(no description provided in leak)* |
| `anchorSpamInfo` | GoogleApi.ContentWarehouse.V1.Model.IndexingDocjoinerAnchorSpamInfo.t | This structure contains signals and penalties of AnchorSpamPenalizer. It replaces phrase_anchor_spam_info above, that is deprecated. |
| `lowCorpusAnchorCount` | integer() | *(no description provided in leak)* |
| `lowCorpusOffdomainAnchorCount` | integer() | *(no description provided in leak)* |
| `baseAnchorCount` | integer() | *(no description provided in leak)* |
| `minDomainHomePageLocalOutdegree` | integer() | Minimum local outdegree of all anchor sources that are domain home pages as well as on the same domain as the current target URL. |
| `skippedAccumulate` | integer() | A count of the number of times anchor accumulation has been skipped for this document. Note: Only used when canonical. |
| `topPrOnsiteAnchorCount` | integer() | According to anchor quality bucket, anchor with pagrank > 51000 is the best anchor. anchors with pagerank < 47000 are all same. |
| `pageMismatchTaggedAnchors` | integer() | *(no description provided in leak)* |
| `spamLog10Odds` | number() | The log base 10 odds that this set of anchors exhibits spammy behavior. Computed in the AnchorLocalizer. |
| `redundantanchorinfo` | list(GoogleApi.ContentWarehouse.V1.Model.IndexingDocjoinerAnchorStatisticsRedundantAnchorInfo.t) | *(no description provided in leak)* |
| `pageFromExpiredTaggedAnchors` | integer() | Set in SignalPenalizer::FillInAnchorStatistics. |
| `baseOffdomainAnchorCount` | integer() | *(no description provided in leak)* |
| `phraseAnchorSpamInfo` | GoogleApi.ContentWarehouse.V1.Model.IndexingDocjoinerAnchorPhraseSpamInfo.t | Following signals identify spike of spammy anchor phrases. Anchors created during the spike are tagged with LINK_SPAM_PHRASE_SPIKE. |
| `anchorPhraseCount` | integer() | The number of unique anchor phrases. Capped by the constant kMaxAnchorPhraseCountInStats (=5000) defined in indexing/docjoiner/anchors/anchor-manager.cc. |
| `ondomainAnchorCount` | integer() | *(no description provided in leak)* |
| `totalDomainsAbovePhraseCap` | integer() | Number of domains above per domain phrase cap. We see too many phrases in the domains. |
| `totalDomainsSeen` | integer() | Number of domains seen in total. |
| `topPrOffdomainAnchorCount` | integer() | *(no description provided in leak)* |
| `scannedAnchorCount` | integer() | The total number of anchors being scanned from storage. |
| `localAnchorCount` | integer() | *(no description provided in leak)* |
| `linkBeforeSitechangeTaggedAnchors` | integer() | *(no description provided in leak)* |
| `globalAnchorDelta` | integer() | Metric of number of changed global anchors computed as, size(union(previous, new) - intersection(previous, new)). |
| `topPrOndomainAnchorCount` | integer() | *(no description provided in leak)* |
| `mediumCorpusOffdomainAnchorCount` | integer() | *(no description provided in leak)* |
| `offdomainAnchorCount` | integer() | *(no description provided in leak)* |
| `totalDomainPhrasePairsSeenApprox` | integer() | Number of domain/phrase pairs in total -- i.e. how many anchors we would have if the domain/phrase cutoff was set to 1 instead of 200. This is &quot;approx&quot; for large anchor clusters because there can be double counting when the LRU cache forgets about rare domain/phrase pairs. |
| `skippedOrReusedReason` | String.t | Reason to skip accumulate, when skipped, or Reason for reprocessing when not skipped. |
| `anchorsWithDedupedImprovanchors` | integer() | The number of anchors for which some ImprovAnchors phrases have been removed due to duplication within source org. |
| `fakeAnchorCount` | integer() | *(no description provided in leak)* |
| `redundantAnchorForPhraseCapCount` | integer() | Total anchor dropped due to exceed per domain phrase cap. Equals to sum of anchors_dropped in the repeated group RedundantAnchorInfoForPhraseCap, but can go higher if the latter reaches the cap of kMaxDomainsToKeepForPhraseCap (indexing/docjoiner/anchors/anchor-loader.h), currently 1000. |
| `totalDomainPhrasePairsAboveLimit` | integer() | The following should be equal to the size of the following repeated group, except that it can go higher than 10,000. |
| `timestamp` | integer() | Walltime of when anchors were accumulated last. |

**IndexingDocjoinerAnchorSpamInfo** - 22 attributes

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
| `phraseDays` | number() | Over how many days 80% of these phrases were discovered. |
| `phraseFraq` | number() | Spam phrases fraction of all anchors of the document. |
| `phraseRate` | number() | Average daily rate of spam anchor discovery. |
| `processed` | integer() | Total number of processed anchors. |
| `sampled` | boolean() | True if anchors were sampled during observation phrase. |
| `sources` | list(GoogleApi.ContentWarehouse.V1.Model.IndexingDocjoinerAnchorTrustedInfo.t) | Detailed information about trusted sources and match computation. Populated only when --anchorspam_penalizer_debug=true. |
| `spamDebugInfo` | String.t | Additional debug information about computation of spam probability. |
| `spamPenalty` | number() | Combined penalty for anchor demotion. |
| `spamProbability` | number() | Predicted probability of spam. |
| `trustedDemoted` | integer() | Number of trusted anchors used in computation of spam probability. |
| `trustedExamples` | String.t | Examples of trusted sources. |
| `trustedMatching` | integer() | Number of trusted anchors with anchor text matching spam terms. |
| `trustedTarget` | boolean() | Following fields record details about trusted anchors True if is this URL is on trusted source. |
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

**KaltixPerDocData** - 3 attributes

| Attribute | Type | Description |
|---|---|---|
| `KaltixRank` | integer() | approx. 2 bytes for top 1B |
| `LocalKaltixRank` | integer() | empty for now |
| `SiteKaltixRank` | integer() | empty for now |

### Patents relevant to Stage 4

##### US6285999B1 - Method for node ranking in a linked database

- **Core concept:** PageRank: assigning importance scores to pages in a linked database based on the recursive weighted sum of incoming links, where each page's score is distributed among its outbound links.
- **Connected leak modules:** `PerDocData`, `QualityNsrNsrData`, `CompressedQualitySignals`, `AnchorsAnchor`
- **SEO claims:**
  - A page's rank is determined by the ranks of pages linking to it, weighted by their outbound link count
  - Links from important pages carry more weight than links from unimportant pages
  - A damping factor models the probability that a random surfer continues clicking links versus jumping to a random page
  - The rank computation is iterative and converges to a steady-state distribution
  - Pages with no inbound links receive a minimum rank from the damping factor
- **SEO action:** Spend effort earning references from pages that are themselves referenced. Being cited is the game, not link count. The leak confirms pagerank and pagerankNs are still actively computed for every indexed document.

##### US7716225B1 - Ranking documents based on user behavior and/or feature data

- **Core concept:** The Reasonable Surfer model: links are weighted by the probability that a user will click them, based on features like position, font size, color, anchor text, and user behavior data.
- **Connected leak modules:** `AnchorsAnchor`, `QualityNavboostCrapsCrapsClickSignals`, `IndexingDocjoinerAnchorStatistics`, `CompressedQualitySignals`
- **SEO claims:**
  - Links do not pass equal weight; the probability of a user clicking a link determines its ranking contribution
  - Link features that affect weight include: font size of anchor text, position in document (above/below fold, sidebar, footer, list position), font color and attributes, number of words in anchor text, actual words in anchor text, commerciality of anchor text, image link aspect ratio, context words before/after link, topical cluster of anchor text, whether link is same-host/domain
  - Source document features include: URL, website, number of links in document, presence of other words, topical cluster
  - User behavior data is used to train a model that predicts click probability for each link
  - The model generates rules from analyzing which links users selected versus did not select
- **SEO action:** Put the links you want to count in the main content where people actually click, not in the footer or sidebar. The leak's pagerankWeight and sourceType fields in AnchorsAnchor confirm link weight varies by source quality and click probability.

##### US9165040B1 - Producing a ranking for pages using distances in a web-link graph

- **Core concept:** Ranking pages by computing shortest distances from a set of trusted seed pages through the link graph, where link lengths increase with the number of outbound links from the source page.
- **Connected leak modules:** `PerDocData`, `AnchorsAnchor`, `CompressedQualitySignals`, `QualityNsrNsrData`
- **SEO claims:**
  - A set of trusted seed pages is selected as the starting point for distance computation
  - Link length is computed as a function of the number of outgoing links from the source page - more outbound links means longer link length
  - Link length formula: α + log(|q|_out), where α is a non-negative value and |q|_out is out-degree
  - Shortest distance from seeds to a page determines its ranking score
  - Each seed page has a weight and initial distance; seeds with higher trust have shorter initial distances
  - Ranking score uses k shortest distances from k nearest seeds
  - Spam pages far from trusted seeds receive low scores naturally
- **SEO action:** Chase links from sites the trusted hubs of your niche already link to. One link two hops from a seed beats fifty from nowhere. The leak's homepagePagerankNs and siteAuthority confirm proximity-to-trust scoring.

##### US7308643B1 - Anchor tag indexing in a web crawler system

- **Core concept:** Anchor text from linking documents is indexed with the target document, not the source - enabling pages to rank for terms found only in their inbound anchor text.
- **Connected leak modules:** `IndexingDocjoinerAnchorStatistics`, `AnchorsAnchor`, `PerDocData`
- **SEO claims:**
  - Anchor text associated with a URL is extracted and stored as part of an anchor map
  - Anchor maps associate outbound URLs with the text surrounding the link in the source document
  - Target documents are indexed using both their own content and the anchor text from all linking documents
  - This enables indexing of URLs that contain no textual content (e.g., images) via their anchor text
  - A sorted anchor map orders pairings by target document identifier for efficient lookup
  - Anchor text provides extrinsic information about documents - what others say about a page matters
- **SEO action:** Write anchors that describe the target page. Those words become part of how the target is indexed. The leak's anchorCount, offdomainAnchorCount, and spamLog10Odds in IndexingDocjoinerAnchorStatistics confirm anchor text is a primary indexing input.

##### US9953049B1 - Producing a ranking for pages using distances in a web-link graph

- **Core concept:** Ranks pages by computing shortest distances from a set of trusted seed pages through the web link graph, where link lengths increase with the number of outgoing links from the source page - pages closer to seeds rank higher.
- **Connected leak modules:** `link_analysis`, `pagerank`, `ranking`, `trust`, `link_graph`
- **SEO claims:**
  - Pages are ranked by shortest distance from a set of trusted seed pages through the link graph
  - Link length is a function of the number of outgoing links from the source page: more outgoing links = longer link length
  - Link length formula: alpha + log(|q|_out), where alpha = -log(damping factor) and |q|_out = number of outgoing links
  - The kth-closest seed (not the nearest) is used to compute ranking score, providing robustness against seed selection bias
  - Ranking score is proportional to e^(-D(p)), where D(p) is the kth shortest distance
  - Seed pages have predetermined weights, and initial distance = -log(weight)
  - Pages reachable via shorter paths from trusted seeds are ranked higher
- **SEO action:** This is TrustRank-style distance-based ranking. Pages closer to trusted seed sites rank higher. Build links from sites that are themselves close to seed/trusted sites. Links from pages with fewer outgoing links carry more weight (each link's value is diluted by total outbound links). Focus on getting links from authoritative, well-connected sites rather than many links from obscure sites.

##### US9400849B1 - Scalable system for determining short paths within web link network

- **Core concept:** Scales distance-based link ranking to web-scale graphs by sharding the directed link graph across multiple servers, computing nearest seeds and distances in parallel for each shard.
- **Connected leak modules:** `link_analysis`, `pagerank`, `ranking`, `link_graph`, `infrastructure`
- **SEO claims:**
  - The web link graph is divided into shards, each assigned to a different server for parallel processing
  - Each server computes the n nearest seeds and respective distances for nodes in its shard
  - Distances are stored in per-server distance tables for ranking computation
  - Seed resources are explicitly designated - nodes representing identified web resources become seeds
  - The system finds n nearest seeds (typically 3) rather than a single nearest seed for robustness
  - Web resources are ranked based on the computed distances to seeds
- **SEO action:** Confirms that Google's link graph analysis operates at massive scale with parallel computation. Your site's position in the link graph relative to trusted seeds is computed across distributed systems. Focus on being linked from sites that are themselves well-connected to the trusted seed set - the distance metric is computed globally.

##### US10270791B1 - Search entity transition matrix and applications of the transition matrix

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
- **SEO action:** Anchor text is evaluated for quality based on its relationship to queries that naturally lead to the target document. Generic or irrelevant anchor text that doesn't match the document's natural query transition pattern may be devalued. Build natural anchor text that matches what users actually search for when seeking your content. Avoid manipulative anchor text patterns.

---

*Attribute descriptions are verbatim from the leak. Patent claim lines are model-extracted paraphrases: verify against Google Patents before quoting them directly.*


---
