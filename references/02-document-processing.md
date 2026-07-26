# Stage 2: Document Processing & Indexing

**Leak modules (9):** `CompositeDoc`, `CompositeDocIndexingInfo`, `GDocumentBase`, `IndexingDocjoinerDataVersion`, `IndexingSignalAggregatorAggregatedScore`, `IndexingSignalAggregatorAgeWeightedCoverageData`, `IndexingEmbeddedContentPageSizeInfo`, `IndexingUrlPatternUrlTreeUrlTreeNode`, `GoodocDocumentPage`

**Relevant patents (6):** US7716225B1, US7308643B1, US7627613B1, US7536408B2, US9081861B2, US8140505B1

### How this works

**1. The CompositeDoc is the central indexed object - everything attaches to it.** After crawling, the raw fetch reply is transformed into a `CompositeDoc`, which is the unit that flows through indexing and into serving. `CompositeDoc.doc` holds a `GDocumentBase` (the parsed document), `CompositeDoc.perDocData` holds per-document quality signals, `CompositeDoc.anchors` holds inbound anchor data, `CompositeDoc.anchorStats` holds anchor statistics, and `CompositeDoc.qualitysignals` holds `CompressedQualitySignals`. Critically, `CompositeDoc.ContentChecksum96` is "visible content checksum as computed by repository::parsehandler::checksum::Checksum96bitsParseHandler" - this is the fingerprint used for duplicate detection (US7627613B1: "Newly crawled documents are fingerprinted and compared against existing documents"). `CompositeDoc.forwardingdup` and `CompositeDoc.extradup` list the duplicate cluster members, and `CompositeDoc.localizedvariations` + `CompositeDoc.alternatename` handle hreflang/locale variants. The `CompositeDocIndexingInfo.crawlStatus` field ("One of the enum values in converter.CrawlStatus.State ... The document is roboted if the value is converter.CrawlStatus::ROBOTED") is where robots-disallowed pages are flagged, and `convertToRobotedReason` records *why* a page was treated as roboted.

**2. Canonicalization and near-duplicate detection suppress redundant indexing.** `GDocumentBase.Repid` is "the webmirror representative id of the canonical url. Urls with the same repid are considered as dups in webmirror," and `GDocumentBase.ecnFp` is "96-bit fingerprint of the canonical url's webmirror equivalence class name." Patent **US9081861B2** (URL canonicalization via conditional entropy) explains the mechanism: "URL parameters are classified as relevant or irrelevant using conditional entropy between parameter values and content fingerprints ... Canonical URLs are determined by removing irrelevant parameters." Patent **US8140505B1** (near-duplicate detection) adds: "Document fingerprints are generated from weighted features ... Near-duplicate detection uses hamming distance: documents are near-duplicates when fingerprints differ in at most k bits ... When a document is identified as a near-duplicate, its outgoing links are NOT extracted for crawling." The leak's `CrawlerChangerateUrlChange.simhashV2` and `CrawlerChangerateUrlVersion.shingleSimhash` ("The simhash value obtained from shingles") are the fingerprint types these patents describe - and the suppression of link extraction from duplicates means a near-duplicate page passes **no** link equity.

**3. The DataVersion ledger tracks 537 signal versions per document.** `IndexingDocjoinerDataVersion` is a 537-field protobuf where each field is a `VersionInfo` tracking when a specific signal or annotation was last computed for this document. The field names map to signal families: `qualityNavboostCrapsCrapsData`, `qualityAnchorsOutdegreeOutdegreeInfo`, `qualityNsrPqData`, `spamHackedSitesDocSpamInfo`, `indexingMobileSpeedPageSpeedFieldData`, `qualitySalientStuffSalientStuffSet`, `repositoryWebrefWebrefEntities`, and so on. This is the versioning backbone that lets the indexing pipeline know whether a signal is stale and needs recompute - it's why a reprocessed document can overwrite an old one (`CompositeDocIndexingInfo.rowTimestamp`: "The timestamp ... to represent doc version, which is used in the downstream processing ... the system can respect the reprocessed version to overwrite old data in storage"). The `noLongerCanonicalTimestamp` field ("the timestamp in microseconds when the URL stopped being canonical ... used by dups during canonical flip") shows canonical changes are version-tracked events.

**4. Phrase-based indexing scores topical completeness, not just keyword presence.** Patent **US7536408B2** (phrase-based indexing) describes how "phrases are identified that predict the presence of other phrases in documents ... A prediction measure relates the actual co-occurrence rate of two phrases to their expected co-occurrence ... Topic completeness is measurable - documents covering related phrases score higher." The leak implements this through the `IndexingUrlPatternUrlTreeUrlTreeNode`, which builds a decision tree over URL patterns: `splittingFeature` is the feature used to split a node, and `splittingFeatureScore` is "the information gain of content features when selecting this splitting feature to split the node." This is the mechanism by which Google learns which content features (phrases, term co-occurrences) discriminate quality URLs within a pattern - the tree partitions URLs by their content features, and the information gain tells the indexer which features matter. `CompositeDocIndexingInfo.urlPatternSignals` ("UrlPatternSignals for this doc, used to compute document score in LTG") carries the per-URL output of this tree into scoring.

**5. Signal aggregation produces URL-pattern-level quality estimates from click and impression data.** The `IndexingSignalAggregatorAggregatedScore` module aggregates per-URL scores into pattern-level statistics: `meanScore` ("The aggregated score"), `deviation` ("A number reflecting the deviation of Url scores"), `percentile` ("Score percentile of matching urls"), and `numUrlsMatched` / `numUrlsWithSignal` ("Number of Urls matching the class" / "Not every matching url has a signal"). The `IndexingSignalAggregatorAgeWeightedCoverageData` module adds time-decayed coverage: `chances` ("Numbers below are all total in the decayed manner. To get rate of impression/clicks, divide by chances"), `clicksGood` / `clicksBad` / `clicksTotal`, `impressions`, `lastGoodClickDateInDays` ("the date when this document received the last good click"), and `firstCoveragePagerankNs` ("The pagerank when the url was serving for the first time"). This is the data structure behind patent **US7716225B1**'s "user behavior data is used to train a model that predicts click probability for each link" - the aggregator computes, per URL pattern, the distribution of click quality and impression rates, and the age-weighting (`averageChanceTime`, `coverageTimestamp`) ensures recent behavior dominates.

### SEO actions
- **Consolidate near-duplicates proactively.** US7627613B1 + US8140505B1 confirm duplicates are fingerprinted, clustered, and canonicalized - and near-duplicates have their outgoing links suppressed. Use canonical tags and ensure substantial unique content.
- **Cover related phrases, not just target keywords.** US7536408B2: co-occurrence of related phrases is measurable and scores "topic completeness." Thin topical coverage is detectable via the information-gain tree (`splittingFeatureScore`).
- **Use hreflang and canonical tags correctly.** `CompositeDoc.localizedvariations` and `alternatename` are populated from webmaster-provided markup; errors here cause canonical flips tracked by `noLongerCanonicalTimestamp`.
- **Ensure embedded resources load.** `IndexingEmbeddedContentPageSizeInfo` tracks `numResources` / `numResourcesWithContent` ("Number of resources whose crawl status is CONTENT") - resources that fail to load reduce the indexed page's completeness signal.
- **Keep content dates accurate.** `CompositeDoc.urldate` ("Date in the url extracted by quality/snippets/urldate") and `CompositeDoc.syntacticDate` feed freshness signals; inconsistent dates hurt.

### Leak attributes relevant to Stage 2

**CompositeDoc** - 44 attributes

| Attribute | Type | Description |
|---|---|---|
| `localizedvariations` | GoogleApi.ContentWarehouse.V1.Model.CompositeDocLocalizedVariations.t | *(no description provided in leak)* |
| `localizedAlternateName` | list(GoogleApi.ContentWarehouse.V1.Model.IndexingConverterLocalizedAlternateName.t) | Localized alternate names are similar to alternate names, except that it is associated with a language different from its canonical. This is the subset of webmaster-provided localized alternate names being in the dup cluster of this document. Used during serving for swapping in the URL based on regional and language preferences of the user. |
| `forwardingdup` | list(GoogleApi.ContentWarehouse.V1.Model.CompositeDocForwardingDup.t) | *(no description provided in leak)* |
| `perDocData` | GoogleApi.ContentWarehouse.V1.Model.PerDocData.t | *(no description provided in leak)* |
| `accessRequirements` | GoogleApi.ContentWarehouse.V1.Model.IndexingPrivacyAccessAccessRequirements.t | Contains necessary information to enforce row level Docjoin access control. |
| `properties` | GoogleApi.ContentWarehouse.V1.Model.DocProperties.t | *(no description provided in leak)* |
| `badSslCertificate` | GoogleApi.ContentWarehouse.V1.Model.IndexingBadSSLCertificate.t | This field is present iff the page has a bad SSL certificate itself or in its redirect chain. |
| `extradup` | list(GoogleApi.ContentWarehouse.V1.Model.CompositeDocExtraDup.t) | *(no description provided in leak)* |
| `subindexid` | list(String.t) | *(no description provided in leak)* |
| `ptoken` | GoogleApi.ContentWarehouse.V1.Model.PtokenPToken.t | Contains information necessary to perform policy decision on the usage of the data assosiated with this cdoc. |
| `richcontentData` | GoogleApi.ContentWarehouse.V1.Model.IndexingConverterRichContentData.t | If present, indicates that some content was inserted, deleted, or replaced in the document's content (in CompositeDoc::doc::Content::Representation), and stores information about what was inserted, deleted, or replaced. |
| `scaledIndyRank` | integer() | to copy to per-doc |
| `cseId` | list(GoogleApi.ContentWarehouse.V1.Model.QualityProseCSEUrlInfo.t) | *(no description provided in leak)* |
| `indexingIntermediate` | String.t | Serialized indexing intermediate data. |
| `docVideos` | list(GoogleApi.ContentWarehouse.V1.Model.ImageRepositoryVideoProperties.t) | Info about videos embedded in the document. |
| `indexinginfo` | GoogleApi.ContentWarehouse.V1.Model.CompositeDocIndexingInfo.t | *(no description provided in leak)* |
| `localinfo` | GoogleApi.ContentWarehouse.V1.Model.LocalWWWInfo.t | *(no description provided in leak)* |
| `storageRowTimestampMicros` | String.t | Row timestamp in CDoc storage. |
| `partialUpdateInfo` | GoogleApi.ContentWarehouse.V1.Model.CompositeDocPartialUpdateInfo.t | Only present in partial cdocs. |
| `additionalchecksums` | GoogleApi.ContentWarehouse.V1.Model.CompositeDocAdditionalChecksums.t | *(no description provided in leak)* |
| `anchors` | GoogleApi.ContentWarehouse.V1.Model.Anchors.t | Mark as non-personal since no personal fields will be populated in |
| `registrationinfo` | GoogleApi.ContentWarehouse.V1.Model.RegistrationInfo.t | Information about the most recent creation and expiration of this domain. It's extracted from domainedge signal. |
| `docAttachments` | GoogleApi.ContentWarehouse.V1.Model.Proto2BridgeMessageSet.t | A generic container to hold document annotations and signals. For a full list of extensions live today, see go/wde. |
| `docinfoPassthroughAttachments` | GoogleApi.ContentWarehouse.V1.Model.Proto2BridgeMessageSet.t | This message set is used for data pushed into the index using the signals framework that is never to be used in Mustang or TG Continuum scoring/snippeting code. Any protocol buffer stored in this message set is automatically returned in a docinfo response - it ends up in the &quot;info&quot; message set in the WWWSnippetResponse, so it can be used in post-doc twiddlers and for display in GWS with no code changes in Mustang or Teragoogle. |
| `docImages` | list(GoogleApi.ContentWarehouse.V1.Model.ImageData.t) | Info about &quot;selected&quot; images associated with the document for which we (already) have ImageData. For each image URL, some fixed number of documents are selected as web referrers for the image URL, and within those selected documents, we say the image is &quot;selected&quot;. Within the remaining documents, we say the image is &quot;rejected&quot;. Note that this distinction is slightly different from selected for indexing. Only images within doc_images where is_indexed_by_imagesearch i |
| `includedcontent` | list(GoogleApi.ContentWarehouse.V1.Model.CompositeDocIncludedContent.t) | *(no description provided in leak)* |
| `porninfo` | GoogleApi.ContentWarehouse.V1.Model.ClassifierPornDocumentData.t | Porn related data used for image and web search porn classification as well as for diagnostics purposes. |
| `urldate` | String.t | Date in the url extracted by quality/snippets/urldate/date-in-url.cc This is given as midnight GMT on the date in question. |
| `embeddedContentInfo` | GoogleApi.ContentWarehouse.V1.Model.IndexingEmbeddedContentEmbeddedContentInfo.t | Data produced by the embedded-content system. This is a thin message, containing only embedded_links_info data for the embedder and JavaScript/CSS embedded links (the embedded-content bigtable also contains snapshots, compressed document trees and all embedded link types). Provided using the index signal API. |
| `richsnippet` | GoogleApi.ContentWarehouse.V1.Model.RichsnippetsPageMap.t | rich snippet extracted from the content of a document. |
| `qualitysignals` | GoogleApi.ContentWarehouse.V1.Model.CompositeDocQualitySignals.t | *(no description provided in leak)* |
| `anchorStats` | GoogleApi.ContentWarehouse.V1.Model.IndexingDocjoinerAnchorStatistics.t | Mark as non-personal since it's an aggregation of anchors. For more details of Search personal data, see go/dma52-search-cdoc-fields. |
| `alternatename` | list(GoogleApi.ContentWarehouse.V1.Model.CompositeDocAlternateName.t) | *(no description provided in leak)* |
| `dataVersion` | GoogleApi.ContentWarehouse.V1.Model.IndexingDocjoinerDataVersion.t | Contains the tracking version of various data fields in CompositeDoc. |
| `syntacticDate` | GoogleApi.ContentWarehouse.V1.Model.QualityTimebasedSyntacticDate.t | *(no description provided in leak)* |
| `url` | String.t | WARNING!!! &quot;url&quot; field in CompositeDoc is optional, and is usually missing: e.g., Docjoin CompositeDoc's don't have CompositeDoc::url. has_url() checking is often useful. So don't rely on CompositeDoc::url unless you're sure otherwise. Usually you want to use CompositeDoc::doc::url instead. |
| `docjoinsOnSpannerCommitTimestampMicros` | String.t | The commit timestamp of a CDoc update to Docjoins on Spanner. |
| `ContentChecksum96` | String.t | Visible content checksum as computed by repository::parsehandler::checksum::Checksum96bitsParseHandler. The value is a Fprint96 in &quot;key format&quot; (i.e., by Fprint96::AsKey()). |
| `liveexperimentinfo` | GoogleApi.ContentWarehouse.V1.Model.CompositeDocLiveExperimentInfo.t | *(no description provided in leak)* |
| `labelData` | GoogleApi.ContentWarehouse.V1.Model.QualityLabelsGoogleLabelData.t | This field associates a document to particular labels and assigns confidence values to them. |
| `sitemap` | GoogleApi.ContentWarehouse.V1.Model.Sitemap.t | Sitelinks: a collection of interesting links a user might be interested in, given they are interested in this document. WARNING: this is different from the crawler Sitemaps (see SitemapsSignals in the attachments). |
| `robotsinfolist` | GoogleApi.ContentWarehouse.V1.Model.CompositeDocRobotsInfoList.t | *(no description provided in leak)* |
| `doc` | GoogleApi.ContentWarehouse.V1.Model.GDocumentBase.t | *(no description provided in leak)* |
| `csePagerankCutoff` | integer() | URL should only be selected for CSE Index if it's pagerank is higher than cse_pagerank_cutoff. |

**CompositeDocIndexingInfo** - 23 attributes

| Attribute | Type | Description |
|---|---|---|
| `cdocBuildInfo` | GoogleApi.ContentWarehouse.V1.Model.IndexingDocjoinerCDocBuildInfo.t | To hold extra info for building a final cdoc from raw cdoc and goldmine annotations. |
| `contentProtected` | boolean() | Whether current page is under content protection, i.e. a page has been crawled as an error page, but we preserve its last known good content and keep its crawl_status as converter.CrawlStatus::CONTENT. |
| `convertToRobotedReason` | integer() | If set, indicates that the crawl status was converted to ROBOTED for the reason specified by the enum value in converter.RobotedReasons.ConvertToRobotedReasons. See indexing/converter/proto/converter.proto for details. If unset, then the document was not converted to roboted, and if the document crawl status is ROBOTED, then the document is disallowed (at least to Google) in robots.txt. |
| `crawlStatus` | integer() | One of the enum values in converter.CrawlStatus.State (see indexing/converter/proto/converter.proto for details). Default is converter.CrawlStatus::CONTENT. The document is roboted if the value is converter.CrawlStatus::ROBOTED. |
| `demotionTags` | list(String.t) | *(no description provided in leak)* |
| `errorType` | integer() | One of the enum values in converter.ErrorPageType (see indexing/converter/proto/error-page-detector-enum.proto for detail). Default is converter::ERROR_PAGE_NONE. |
| `freshdocsCorpora` | list(String.t) | *(no description provided in leak)* |
| `hostid` | String.t | The host id of the document. Used chiefly to determine whether the document is part of a parked domain. |
| `ieIdentifier` | String.t | A short descriptive string to help identify the IE application or setup where this CDoc is generated. For example: websearch_m3 This field is for debuggability purposes. |
| `imageIndexingInfo` | GoogleApi.ContentWarehouse.V1.Model.ImageSearchImageIndexingInfo.t | Indexing info about images (i.e. image links missing image data, etc). |
| `indexingTs` | String.t | The timestamp (the time since the Epoch, in microseconds) when the docjoin is exported from indexing. The main purpose of this field is to identify different versions of the same document. |
| `noLongerCanonicalTimestamp` | String.t | If set, the timestamp in microseconds when the URL stopped being canonical. This should never be set for exported canonical documents. This field is used by dups during canonical flip, and by webmain when doc selection switched between desktop and mobile. Union respects this timestamp to prevent old doc being deleted until the new doc is picked up |
| `normalizedClickScore` | number() | This score is calculated by re-mapping the back onto the partition's score distribution, such that the score represents the score of the equivalently ranked organically-selected document. |
| `primaryVertical` | String.t | Vertical membership of the document. - |
| `rawNavboost` | integer() | The raw navboost count for the canonical url without aggregating the navboost from dup urls. This field is used when building forwarding map. |
| `rowTimestamp` | String.t | The timestamp (the time since the Epoch, in microseconds) to represent doc version, which is used in the downstream processing after Raffia. If it's not set, indexing_ts will be used as row_timestamp. The timestamp is generally set by reprocessing to set slightly newer indexing_ts such that the system can respect the reprocessed version to overwrite old data in storage. |
| `selectionTierRank` | number() | Selection tier rank is a language normalized score ranging from 0-1 over the serving tier (Base, Zeppelins, Landfills) for this document. |
| `tracingId` | list(String.t) | The tracing ids is to label the version of url for url status tracking. This repeated field will carry at most 10 tracing id. See more details in go/rich-tracing-design There will be less than 2% base+uz cdocs carrying this field. The major sources of tracing ids include: |
| `urlChangerate` | GoogleApi.ContentWarehouse.V1.Model.CrawlerChangerateUrlChangerate.t | Changerate information for this doc (see crawler/changerate/changerate.proto for details). |
| `urlHistory` | GoogleApi.ContentWarehouse.V1.Model.CrawlerChangerateUrlHistory.t | Url change history for this doc (see crawler/changerate/changerate.proto for details). Note if a doc has more than 20 changes, we only keep the last 20 changes here to avoid adding to much data in its docjoin. |
| `urlPatternSignals` | GoogleApi.ContentWarehouse.V1.Model.IndexingSignalAggregatorUrlPatternSignals.t | UrlPatternSignals for this doc, used to compute document score in LTG (see indexing/signal_aggregator/proto/signal-aggregator.proto for details). |
| `verticals` | list(String.t) | *(no description provided in leak)* |
| `videoIndexingInfo` | GoogleApi.ContentWarehouse.V1.Model.ImageRepositoryVideoIndexingInfo.t | Indexing info about videos. |

**GDocumentBase** - 30 attributes

| Attribute | Type | Description |
|---|---|---|
| `ContentExpiryTime` | integer() | unix secs from epoch |
| `DisplayUrl` | String.t | Sometimes the URL displayed in search results should be different from what gets indexed (e.g. in enterprise, content management systems). If this value is not set, we default to the regular URL. |
| `DocId` | String.t | 64-bit docid of the document (usually fingerprint of URL, but not always). WARNING: This does NOT uniquely identify a document ANYMORE. For a unique identifier across all documents in production please refer to the field 'id().key()' listed above. |
| `ExternalFeedMetadata` | String.t | *(no description provided in leak)* |
| `ExternalHttpMetadata` | String.t | Enterprise-specific external metadata. See |
| `FilterForSafeSearch` | integer() | Deprecated, do not use, this field is not populated since 2012. |
| `IPAddr` | String.t | IP addr in binary (allows for IPv6) |
| `NoArchiveReason` | integer() | *(no description provided in leak)* |
| `NoFollowReason` | integer() | *(no description provided in leak)* |
| `NoImageIndexReason` | integer() | *(no description provided in leak)* |
| `NoImageframeOverlayReason` | integer() | *(no description provided in leak)* |
| `NoIndexReason` | integer() | When these reasons are set to a non zero value, the document should not be indexed, or show a snippet, or show a cache, etc. These reasons are bit maps of indexing.converter.RobotsInfo.RobotedReasons enum values reflecting the places where the restriction was found: //depot/google3/indexing/converter/proto/converter.proto |
| `NoPreviewReason` | integer() | *(no description provided in leak)* |
| `NoSnippetReason` | integer() | *(no description provided in leak)* |
| `NoTranslateReason` | integer() | *(no description provided in leak)* |
| `Pagerank` | integer() | This field is long-deprecated in favour of Pagerank_NS, it is no longer maintained and can break at any moment. |
| `PagerankNS` | integer() | Pagerank-NearestSeeds is a pagerank score for the doc, calculated using NearestSeeds method. This is the production PageRank value teams should use. |
| `Repid` | String.t | is the webmirror representative id of the canonical url. Urls with the same repid are considered as dups in webmirror. WARNING: use this field with caution! The webmirror duprules change frequently, so this value only reflects the duprules at the time when the canonical's docjoin is built. |
| `ScienceMetadata` | GoogleApi.ContentWarehouse.V1.Model.ScienceCitation.t | Citation data for science articles. |
| `URL` | String.t | WARNING: the URL does NOT uniquely identify a document ANYMORE. For a unique identifier across all documents in production please refer to the field 'id().key()' listed above. Reason: foo.bar:/http and foo.bar:/http:SMARTPHONE share the same URL, but the body of the two documents might differ because of different crawl-context (desktop vs. smartphone in this example). |
| `URLAfterRedirects` | String.t | *(no description provided in leak)* |
| `URLEncoding` | integer() | See webutil/urlencoding |
| `content` | GoogleApi.ContentWarehouse.V1.Model.GDocumentBaseContent.t | *(no description provided in leak)* |
| `directory` | list(GoogleApi.ContentWarehouse.V1.Model.GDocumentBaseDirectory.t) | *(no description provided in leak)* |
| `ecnFp` | String.t | 96-bit fingerprint of the canonical url's webmirror equivalence class name as of when this cdoc was exported. |
| `id` | GoogleApi.ContentWarehouse.V1.Model.IndexingCrawlerIdServingDocumentIdentifier.t | The primary identifier of a production document is the document key given in the ServingDocumentIdentifier, which is the same as the row-key in Alexandria, and represents a URL and its crawling context. In your production code, please always assume that the document key is the only way to uniquely identify a document. ## Recommended way of reading: const string& doc_key = cdoc.doc().id().key(); ## CHECK(!doc_key.empty()); More background information can be found in google3/indexing/crawler_id/se |
| `localsearchDocInfo` | GoogleApi.ContentWarehouse.V1.Model.LocalsearchDocInfo.t | Localsearch-specific data. |
| `oceanDocInfo` | GoogleApi.ContentWarehouse.V1.Model.OceanDocInfo.t | Ocean-specific data. |
| `originalcontent` | GoogleApi.ContentWarehouse.V1.Model.GDocumentBaseOriginalContent.t | *(no description provided in leak)* |
| `userAgentName` | String.t | The user agent name used to crawl the URL. See //crawler/engine/webmirror_user_agents.h for the list of user-agents (e.g. crawler::WebmirrorUserAgents::kGoogleBot). NOTE: This field is copied from the first WEBMIRROR FetchReplyClientInfo in trawler_fetch_info column. We leave this field unpopulated if no WEBMIRROR FecthReplyClientInfo is found. As the submission of cl/51488336, Alexandria starts to populate this field. However, docjoins from freshdocs (or any other source), won't have this field |

**IndexingDocjoinerDataVersion** - 537 attributes (version-tracking fields; summarized)

This module is a giant versioning ledger. Each attribute is a `VersionInfo` entry that tracks when a particular signal/annotation was last updated for a document. Rather than list all 537 fields, here is the breakdown by signal family (attribute-name substring counts):

| Signal family | # of versioned fields |
|---|---|
| `quality` | 118 |
| `indexing` | 113 |
| `repository` | 65 |
| `ocean` | 31 |
| `image` | 30 |
| `news` | 27 |
| `knowledge` | 27 |
| `spam` | 20 |
| `content` | 17 |
| `video` | 16 |
| `shopping` | 15 |
| `nsr` | 10 |
| `anchor` | 9 |
| `videoCrawl` | 8 |
| `mobile` | 7 |
| `richsnippet` | 6 |
| `navboost` | 5 |
| `fresh` | 5 |
| `realtime` | 5 |
| `local` | 4 |
| `social` | 4 |
| `geopoint` | 2 |
| `timebased` | 1 |
| `porn` | 0 |

Representative field names (first 30):
- `timeAnnotationTags`
- `photosGeoAnnotation`
- `repositoryAnnotationsSnippetSegmentSnippetSegmentAnnotations`
- `oceanRightsOptOutRequest`
- `qualityAuthorshipAuthorAnnotations`
- `newsCorpusPositionRankAnnotations`
- `babelEncoderBabelEncodings`
- `sitemapsSitemapsSignals`
- `repositoryWikipediaSentenceCompressionAnnotation`
- `indexingConverterFileMetaInfo`
- `indexingAnnotationsDocImportance`
- `qualitySosGoldmineSosAnnotation`
- `qualityNavboostCrapsCrapsData`
- `qualityAnchorsOutdegreeOutdegreeInfo`
- `knowledgeMiningFactsProductCompositionSignal`
- `udrConverterProductBlockData`
- `qualityTangramInformationTypes`
- `videoCrawlVideoScoringSignals`
- `qualityPanopticStorytimeScoringSignals`
- `foundationSplinterSignal`
- `qualityResultFilteringIndexingClusterAnnotations`
- `analyticsSiteidAnalyticsPropertyAnnotation`
- `localyp`
- `qualitySalientStuffSalientStuffSet`
- `oceanReviewsForWork`
- `indexingMobileSpeedPageSpeedFieldData`
- `nlpAtcClaraAnnotation`
- `udrConverterDocumentShoppingData`
- `repositoryAnnotationsSporeSporeEtlInputAnnotations`
- `nlxDocAnnotation`
- *...and 507 more.*

Fields with explicit descriptions:
- `navboost` - BEGIN DATA FIELDS
- `nsrFdpData` - Must be used together with quality_nsr_nsr_data
- `spambrainDomainSitechunkData` - END DATA FIELDS

**IndexingSignalAggregatorAggregatedScore** - 23 attributes

| Attribute | Type | Description |
|---|---|---|
| `deviation` | float() | A number reflecting the deviation of Url scores. |
| `m2` | float() | State variables for West & Chan variance algorithm used to be stored here directly. Now they are stored inside RunningMeanAndVarianceInternalState. |
| `maxScoreUrl` | GoogleApi.ContentWarehouse.V1.Model.IndexingSignalAggregatorUrlScore.t | Input UrlScore with max score. |
| `mean` | float() | *(no description provided in leak)* |
| `meanScore` | float() | Overall stats that are only available in final aggregation results. The aggregated score. |
| `minScoreUrl` | GoogleApi.ContentWarehouse.V1.Model.IndexingSignalAggregatorUrlScore.t | Input UrlScore with min score. |
| `numImportantUrls` | String.t | *(no description provided in leak)* |
| `numUrlsMatched` | String.t | Final Stats that are also available in intermediate output. Number of Urls matching the class. |
| `numUrlsWithSignal` | String.t | Not every matching url has a signal. |
| `patternLayer` | String.t | Experimental layer of the corresponding pattern. |
| `patternsUsedInMediation` | list(String.t) | Optionally populated in mediators. A list of patterns that actually contributed to the final mediated signal. |
| `percentile` | list(float()) | Score percentile of matching urls. If present, it has N entries for buckets of roughly equal number of urls. N is specified the aggregation. The value is the min score in that bucket. |
| `runningMeanAndVarianceInternalState` | GoogleApi.ContentWarehouse.V1.Model.IndexingSignalAggregatorRunningMeanAndVarianceInternalState.t | *(no description provided in leak)* |
| `samples` | list(GoogleApi.ContentWarehouse.V1.Model.IndexingSignalAggregatorUrlScore.t) | Random samples. |
| `scores` | list(float()) | for calculating percentile |
| `signalId` | integer() | For debugging purposes, this is an id of the signal associated with this AggregatedScore. For pattern score, this may be the length of the pattern. |
| `singleUrlScore` | GoogleApi.ContentWarehouse.V1.Model.IndexingSignalAggregatorUrlScore.t | If this field presents, it is for a single url. No other field should appear. |
| `totalScore` | float() | summation varaible used to get mean |
| `totalScoreLow` | float() | low-order part of total_score |
| `totalScoreSqr` | float() | summation variable for calculating deviation note, these are now only used for legacy and debugging purposes |
| `totalScoreSqrLow` | float() | low order part of total_score_sq |
| `totalWeight` | float() | for calculating weighted mean/dev |
| `totalWeightLow` | float() | low order part of total_weight |

**IndexingSignalAggregatorAgeWeightedCoverageData** - 27 attributes

| Attribute | Type | Description |
|---|---|---|
| `averageChanceTime` | float() | Weighted averged timestamps of the decayed chances. |
| `chances` | float() | Numbers below are all total in the decayed manner. To get rate of impression/clicks, divide by chances. |
| `clicksBad` | float() | *(no description provided in leak)* |
| `clicksGood` | float() | *(no description provided in leak)* |
| `clicksImage` | float() | *(no description provided in leak)* |
| `clicksTotal` | float() | *(no description provided in leak)* |
| `clicksUnclassified` | float() | *(no description provided in leak)* |
| `coverageTimestamp` | String.t | Epoch seconds at which this weighted coverage data was calculated. |
| `ctrWeightedImpressions` | float() | *(no description provided in leak)* |
| `dwells` | float() | Dwells from KnowledgePanel and WebAnswers. |
| `firstBaseCoverageTimestamp` | String.t | Epoch seconds at which this url first gets coverage in BASE. |
| `firstCoveragePagerankNs` | integer() | The pagerank when the url was serving for the first time. |
| `firstCoverageTimestamp` | String.t | Epoch seconds at which this url first gets coverage data. |
| `firstseen` | String.t | *(no description provided in leak)* |
| `impressions` | float() | *(no description provided in leak)* |
| `intervalData` | GoogleApi.ContentWarehouse.V1.Model.IndexingSignalAggregatorAdaptiveIntervalData.t | Interval Data to track the average time between clicks_total, clicks_good, and ctr_weighted_impression. |
| `language` | integer() | *(no description provided in leak)* |
| `lastDwellDateInDays` | integer() | Indicates the date when this document received the last KnowledgePanel or WebAnswer dwell. Note: The date is identified in terms of number of days since Epoch. |
| `lastGoodClickDateInDays` | integer() | Indicates the date when this document received the last good click. Note: The date is identified in terms of number of days since Epoch. |
| `lastImpressionDateInDays` | integer() | Indicates the date when this document received the last impression. Note: The date is identified in terms of number of days since Epoch. |
| `lastLuDwellDateInDays` | integer() | Indicates the date when this document received the last LocalUniversal dwell. Note: The date is identified in terms of number of days since Epoch. |
| `lastPseudoImpressionsDateInDays` | integer() | Indicates the date when this document received the last pseudo-impression. I.e., when it was retrieved as a result but GWS would not show it because of the document's age in the index. Note: The date is identified in terms of number of days since Epoch. |
| `luDwells` | float() | Dwells from LocalUniversal. |
| `repid` | String.t | Repid in Alexandria pipeline. |
| `totalChances` | String.t | Total number of chances on this urls (not decayed). |
| `url` | String.t | *(no description provided in leak)* |
| `urlfp` | String.t | Temporary variable, only used during mapreduce. |

**IndexingEmbeddedContentPageSizeInfo** - 5 attributes

| Attribute | Type | Description |
|---|---|---|
| `numImages` | integer() | Images are also resources. num_images <= num_resources. |
| `numImagesWithContent` | integer() | Number of images whose crawl status is CONTENT. |
| `numResources` | integer() | Numbers below don't include embedder. |
| `numResourcesWithContent` | integer() | Number of resources whose crawl status is CONTENT. |
| `sumHttpResponseLength` | integer() | Sum of embedder and all referenced resources. |

**IndexingUrlPatternUrlTreeUrlTreeNode** - 8 attributes

| Attribute | Type | Description |
|---|---|---|
| `indexOfSubTreeWithSplittingFeature` | integer() | *(no description provided in leak)* |
| `indexOfSubTreeWithoutSplittingFeature` | integer() | *(no description provided in leak)* |
| `parent` | integer() | *(no description provided in leak)* |
| `pathFromRoot` | String.t | The path from root to current node. This is only used for debugging. |
| `patternId` | String.t | This is only used in leaf nodes which represents a url pattern. It is the fingerprint of the splitting url features from root to the leaf. |
| `payload` | GoogleApi.ContentWarehouse.V1.Model.Proto2BridgeMessageSet.t | *(no description provided in leak)* |
| `splittingFeature` | GoogleApi.ContentWarehouse.V1.Model.IndexingUrlPatternUrlTreeUrlFeature.t | *(no description provided in leak)* |
| `splittingFeatureScore` | float() | The information gain of content features when selecting this splitting feature to split the node. |

**GoodocDocumentPage** - *module not present in the leak dataset (referenced in patent `connected_leak_modules` only).*


### Patents relevant to Stage 2

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

##### US7627613B1 - Duplicate document detection in a web crawler system

- **Core concept:** Duplicate documents are detected at crawl time using content fingerprints, clustered together, and one canonical version is selected to represent the cluster in search results.
- **Connected leak modules:** `PerDocData`, `IndexingDocjoinerAnchorStatistics`, `QualityNsrNsrData`
- **SEO claims:**
  - Newly crawled documents are fingerprinted and compared against existing documents
  - Documents sharing the same content are identified as duplicates
  - Duplicate documents are clustered into a group
  - One document is selected as the canonical representative of the cluster
  - Information from all duplicates is merged into the canonical document's metadata
  - Duplicate documents are included or excluded from search results based on query intent
  - The system distinguishes between canonical and non-canonical pages at crawl time
- **SEO action:** Consolidate near-duplicates yourself, one page per intent, or Google picks the canonical for you. The leak's anchorMismatchDemotion field confirms mismatched content/anchors across duplicates are penalized.

##### US7536408B2 - Phrase-based indexing in an information retrieval system

- **Core concept:** Documents are indexed based on meaningful phrases and their co-occurrence patterns. Related phrases that predict each other's presence form the basis for topic completeness scoring.
- **Connected leak modules:** `PerDocData`, `QualityNsrNsrData`, `QualityNsrPQData`
- **SEO claims:**
  - Phrases are identified that predict the presence of other phrases in documents
  - A prediction measure relates the actual co-occurrence rate of two phrases to their expected co-occurrence
  - Related phrases are semantically connected (e.g., 'President of the United States' and 'White House')
  - Documents are indexed according to their included phrases and related phrase co-occurrence
  - Phrase extensions (variations and sub-phrases) are also identified and indexed
  - Topic completeness is measurable - documents covering related phrases score higher
  - The system captures topical relationships that individual word matching misses
- **SEO action:** Cover the related phrases a real expert would naturally use. Co-occurrence is measurable, thin coverage shows. The leak's titlematchScore and bodyWordsToTokensRatio fields confirm content density and topical alignment are scored.

##### US9081861B2 - Uniform resource locator canonicalization

- **Core concept:** Uses information theory (conditional entropy) to automatically determine which URL parameters are irrelevant to content identification, then generates canonical URLs that consolidate parameter variations pointing to the same content.
- **Connected leak modules:** `canonicalization`, `crawler`, `indexing`, `dedup`
- **SEO claims:**
  - URL parameters are classified as relevant or irrelevant using conditional entropy between parameter values and content fingerprints
  - A parameter is irrelevant when both H(fingerprint|parameter) and H(parameter|fingerprint) exceed threshold values (high uncertainty in both directions)
  - Canonical URLs are determined by removing irrelevant parameters, consolidating multiple URLs that reference identical content
  - Content fingerprints (e.g., MD5 hashes) are used to identify when different URLs point to the same content
  - The system processes URLs crawled by the web crawler and content downloaded, building a corpus for entropy analysis
  - Irrelevant parameters are stripped to create canonical URLs, reducing redundant crawling and indexing
- **SEO action:** Use canonical tags to proactively consolidate URL parameter variations. Google's system can auto-detect irrelevant parameters, but explicit canonicalization is faster and more reliable. Audit URL parameters in Google Search Console's URL Parameters tool. Ensure session IDs, tracking parameters, and sorting parameters are marked as irrelevant or handled with canonical tags.

##### US8140505B1 - Near-duplicate document detection for web crawling

- **Core concept:** Detects near-duplicate documents during web crawling by generating weighted fingerprints (simhash) and comparing them using hamming distance, with bit permutation tables for efficient similarity matching.
- **Connected leak modules:** `canonicalization`, `dedup`, `crawler`, `indexing`, `link_analysis`
- **SEO claims:**
  - Document fingerprints are generated from weighted features (excluding stop words), where more important features have higher weight and greater influence on the fingerprint
  - Near-duplicate detection uses hamming distance: documents are near-duplicates when fingerprints differ in at most k bits
  - Fingerprints are stored in multiple tables with different permutations applied, enabling efficient similarity search
  - When a document is identified as a near-duplicate, its outgoing links are NOT extracted for crawling (link discovery is suppressed)
  - Near-duplicate documents are skipped to avoid redundant crawling and indexing
- **SEO action:** Avoid publishing near-duplicate content across URLs - Google's simhash-based detection will suppress both indexing and link extraction from duplicates. If you must have similar content (e.g., product variants), ensure substantial unique content differences beyond template boilerplate. Use canonical tags proactively for known duplicate scenarios.

---
