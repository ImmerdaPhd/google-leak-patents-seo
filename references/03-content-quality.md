# Stage 3: Content Quality & Site-Level Scoring

**Leak modules (6):** `PerDocData`, `QualityNsrNsrData`, `QualityNsrPQData`, `CompressedQualitySignals`, `QualityNsrNsrDataMetadata`, `QualityCopiaFireflySiteSignal`

**Relevant patents (5):** US8682892B1, US9031929B1, US9760641B1, US8195654B1, US11354342B2

### How this works

**1. NSR (Navneet Site Rank) is a site-wide quality multiplier applied to every page on the site.** `QualityNsrNsrData.nsr` is the core site-level score, and `QualityNsrNsrData.siteChunk` is "Primary NSR sitechunk. In most of the cases it's same as HOST_LEVEL_V3 sitechunked canonical url of the document" - this is how Google groups pages into a site for scoring. Patent **US8682892B1** (Panda, by Navneet Panda) describes the mechanism: "Resources are grouped (e.g., by site/domain) and each group gets a group-specific modification factor ... The modification factor is based on the count of independent incoming links to the group ... also based on the count of reference queries ... The modification factor acts as a multiplier on individual page scores within the group ... Bad pages in a group drag down the group's modification factor." The leak's `CompressedQualitySignals.pandaDemotion` ("encoding of Panda fields in the proto SiteQualityFeatures"), `babyPandaV2Demotion` ("New BabyPanda demotion, applied on top of Panda"), and `QualityNsrNsrData.siteQualityStddev` ("Estimate of site's PQ rating stddev -- spread of the page-level PQ ratings of a site") are the direct implementation. A high stddev (wide quality spread across pages) signals inconsistency that the multiplier penalizes.

**2. Site quality is computed from brand-query volume and click diversity, not just links.** Patent **US9031929B1** (site quality score) and its continuation **US9760641B1** specify: "First count: unique queries that include a reference to the particular site (brand queries) ... Second count: unique queries where the user clicked through to the site (association queries) ... Site quality score is determined based on both counts." The leak's `QualityNsrNsrData.impressions` ("Site-level impressions"), `QualityNsrNsrData.pnav` / `pnavClicks` ("Fractional signals" / "denominator for the pnav computation"), and `QualityNsrNsrData.directFrac` are the aggregated query-stream signals behind these counts. `QualityCopiaFireflySiteSignal` adds per-site article production metrics: `numOfArticles8`, `numOfArticlesByPeriods` ("number of articles ... sliced by 30 days"), `numOfUrlsByPeriods`, `dailyClicks`, `dailyGoodClicks`, and `totalImpressions` - this is the "diversity of demand" signal the patent describes, measured as a rolling time series.

**3. Machine-learned quality predictors emulate human rater judgments at scale.** Patent **US8195654B1** (prediction of human ratings) states: "A statistical model relates human ratings of documents to objective signals ... trained on pairs of (objective signals, human relevance evaluations) ... Once trained, the model predicts human ratings for new query/document pairs." The leak contains multiple such predictors. `QualityNsrNsrData.chardEncoded` / `chardScoreEncoded` is "Site-level chard score: site quality predictor based on content." `QualityNsrNsrData.tofu` is "site quality predictor based on content." `QualityNsrPQData.rhubarb` is "Site-URL delta signals based quality score computed in Goldmine via the Rhubarb model." `QualityNsrPQData.keto` is a "Keto score." `QualityNsrPQData.vlq` is "URL-level score of the VLQ model" and `QualityNsrNsrData.vlqNsr` is "NSR from a headroom model targeting low-quality video sites." Each of these is a trained model predicting a facet of human quality judgment - and `CompressedQualitySignals.lowQuality` ("S2V low quality score: converted from quality_nsr.NsrData, applied in Qstar") is where the combined output is applied in the main ranker (Q*).

**4. Information gain penalizes content that merely repeats what already exists.** Patent **US11354342B2** (contextual estimation of link information gain) explains: "Documents are scored based on information gain relative to previously viewed documents ... Documents providing unique, additive information receive higher information gain scores ... Documents that duplicate or rehash existing content receive lower scores." The leak's `PerDocData.OriginalContentScore` ("The original content score is represented as 7-bits, going from 0 to 127 ... Only pages with little content have this field ... ranges from 0 to 512") is the per-page originality signal, and `CompressedQualitySignals.scamness` ("Scam model score. Used as one of the web page quality qstar signals. Value range from 0 to 1023") and `unauthoritativeScore` ("Unauthoritative score. Used as one of the web page quality qstar signals") are related quality gates. `PerDocData.bodyWordsToTokensRatioTotal` / `bodyWordsToTokensRatioBegin` ("The body words over tokens ratios for the beginning part and whole doc") measure content density - thin pages with high template-to-text ratios score poorly.

**5. Spam and demotion signals are layered on top of quality.** `PerDocData` carries a battery of spam scores: `DocLevelSpamScore` ("document spam score ... 7-bits, going from 0 to 127"), `KeywordStuffingScore`, `SpamWordScore`, `GibberishScore`, `ScaledSpamScoreYoram` / `ScaledSpamScoreEric` ("Spamscores are represented as a 7-bit integer, going from 0 to 127"), `spambrainTotalDocSpamScore` ("document total spam score identified by spambrain, going from 0 to 1"), `spamrank` ("likelihood that this document links to known spammers. Its value is between 0 and 65535"), `IsAnchorBayesSpam` ("Is this document considered spam by the anchor bayes classifier?"), and `spamtokensContentScore` ("Used in SiteBoostTwiddler to determine whether a page is UGC Spam"). `CompressedQualitySignals` adds demotion flags: `exactMatchDomainDemotion` ("converted from QualityBoost.emd.boost"), `navDemotion`, `serpDemotion` ("applied in Qstar"), `anchorMismatchDemotion` ("converted from QualityBoost.mismatched.boost"), and `productReviewPDemotePage` / `productReviewPDemoteSite` ("Product review demotion/promotion confidences"). These are the Q*-applied multipliers that the Panda patent (US8682892B1) describes as "group-specific modification factor" - each is a lever that can suppress a page or site.

### SEO actions
- **Prune or fix weak pages - site quality is a multiplier.** US8682892B1: "Bad pages in a group drag down the group's modification factor, affecting all pages." `siteQualityStddev` measures the spread; high variance hurts.
- **Build brand demand.** US9031929B1/US9760641B1: site quality is partly a function of unique brand-reference queries and click-through query diversity. `pnav`, `impressions`, and `directFrac` track this.
- **Write to the Quality Rater Guidelines.** US8195654B1: models are trained on human rater evaluations. `chard`, `tofu`, `rhubarb`, `keto` are the ML predictors - build what raters rate well.
- **Add unique information, don't rehash.** US11354342B2: information gain scoring penalizes duplicative content. `OriginalContentScore` directly measures originality.
- **Avoid spam patterns across all signals.** `DocLevelSpamScore`, `KeywordStuffingScore`, `spambrainTotalDocSpamScore`, `spamrank`, and `IsAnchorBayesSpam` are independent classifiers - tripping any one applies a demotion in Q*.

### Leak attributes relevant to Stage 3

**PerDocData** - 132 attributes

| Attribute | Type | Description |
|---|---|---|
| `scienceDoctype` | integer() | Scholar/Science Document type: <0 == not a Science Document -- default 0 == Science doc fully visible >0 == Science doc but limited visibility, the number is the visible terms |
| `ScaledExptIndyRank2` | integer() | experimental |
| `videoLanguage` | GoogleApi.ContentWarehouse.V1.Model.QualityVidyaVideoLanguageVideoLanguage.t | Audio-based language classified by Automatic Language Identification (only for watch pages). |
| `phildata` | GoogleApi.ContentWarehouse.V1.Model.PhilPerDocData.t | *(no description provided in leak)* |
| `uacSpamScore` | integer() | The uac spam score is represented in 7 bits, going from 0 to 127. Threshold is 64. Score >= 64 is considered as uac spam. |
| `DEPRECATEDAuthorObfuscatedGaia` | list(String.t) | The obfuscated google profile gaia id(s) of the author(s) of the document. This field is deprecated, use the string version. |
| `spamtokensContentScore` | number() | For SpamTokens content scores. Used in SiteBoostTwiddler to determine whether a page is UGC Spam. See go/spamtokens-dd for details. |
| `webrefEntities` | GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefWebrefMustangAttachment.t | WebRef entities associated to the document. See go/webref for details. |
| `PremiumData` | GoogleApi.ContentWarehouse.V1.Model.PremiumPerDocData.t | Additional metadata for Premium document in the Google index. |
| `spamMuppetSignals` | GoogleApi.ContentWarehouse.V1.Model.SpamMuppetjoinsMuppetSignals.t | Contains hacked site signals which will be used in query time joins. As of Oct'19, the field is stored in a separate corpus. It'll only be populated for in-flight requests between retrieve and full-score in perdocdata. So no extra storage is needed on muppet side. |
| `knexAnnotation` | GoogleApi.ContentWarehouse.V1.Model.SocialPersonalizationKnexAnnotation.t | For indexing k'nex annotations for FreshDocs. |
| `smartphoneData` | GoogleApi.ContentWarehouse.V1.Model.SmartphonePerDocData.t | Additional metadata for smartphone documents in the Google index. |
| `semanticDateConfidence` | integer() | DEPRECATED: semantic_date_confidence replaced by semantic_date_info. |
| `trendspamScore` | integer() | For now, the count of matching trendspam queries. |
| `ScaledSpamScoreYoram` | integer() | Spamscores are represented as a 7-bit integer, going from 0 to 127. |
| `numUrls` | integer() | Total number of urls encoded in the url section = # of alternate urls + 1 |
| `datesInfo` | String.t | Stores dates-related info (e.g. page is old based on its date annotations). Used in FreshnessTwiddler. Use encode/decode functions from quality/timebased/utils/dates-info-helper-inl.h |
| `pagerank2` | number() | *(no description provided in leak)* |
| `nsrDataProto` | GoogleApi.ContentWarehouse.V1.Model.QualityNsrNsrData.t | Stripped site-level signals, not present in the explicit nsr_* fields, nor compressed_quality_signals. |
| `fringeQueryPrior` | GoogleApi.ContentWarehouse.V1.Model.QualityFringeFringeQueryPriorPerDocData.t | Contains encoded FringeQueryPrior information. Unlikely to be meaningful for anyone other than fringe-ranking team. Contact fringe-ranking team if any questions, but do NOT use directly without consulting them. |
| `kaltixdata` | GoogleApi.ContentWarehouse.V1.Model.KaltixPerDocData.t | *(no description provided in leak)* |
| `ymylHealthScore` | integer() | Stores scores of ymyl health classifier as defined at go/ymyl-classifier-dd. To use this field, you MUST join g/pq-classifiers-announce and add your use case at |
| `authorObfuscatedGaiaStr` | list(String.t) | *(no description provided in leak)* |
| `lastSignificantUpdate` | String.t | Last significant update of the document. This is sourced from the quality_timebased.LastSignificantUpdate proto as computed by the LSUSelector from various signals. The value is a UNIX timestamp in seconds. |
| `spambrainData` | GoogleApi.ContentWarehouse.V1.Model.SpamBrainData.t | Host-v1 sitechunk level scores coming from spambrain. |
| `DEPRECATEDQuarantineWhitelist` | boolean() | *(no description provided in leak)* |
| `tundraClusterId` | integer() | This field is propagated to shards. Stores clustering information on a site level for the Tundra project. This field is deprecated - used the equivalent field inside nsr_data_proto instead. |
| `bodyWordsToTokensRatioTotal` | number() | *(no description provided in leak)* |
| `homepagePagerankNs` | integer() | The page-rank of the homepage of the site. Copied from the cdoc.doc().pagerank_ns() of the homepage. |
| `topPetacatTaxId` | integer() | Top petacat of the site. Used in SiteboostTwiddler to determine result/query matching. |
| `OriginalContentScore` | integer() | The original content score is represented as a 7-bits, going from 0 to 127. Only pages with little content have this field. The actual original content score ranges from 0 to 512. It is encoded with quality_q2::OriginalContentUtil::EncodeOriginalContentScore(). To decode the value, use quality_q2::OriginalContentUtil::DecodeOriginalContentScore(). |
| `contentAttributions` | GoogleApi.ContentWarehouse.V1.Model.ContentAttributions.t | *(no description provided in leak)* |
| `webmirrorEcnFp` | String.t | *(no description provided in leak)* |
| `DocLevelSpamScore` | integer() | The document spam score is represented as a 7-bits, going from 0 to 127. |
| `urlPoisoningData` | GoogleApi.ContentWarehouse.V1.Model.UrlPoisoningData.t | Contains url poisoning data for suppressing spam documents. |
| `Event` | list(GoogleApi.ContentWarehouse.V1.Model.PerDocDebugEvent.t) | Free form debug info. NB2: consider carefully what to save here. It's easy to eat lots of gfs space with debug info that nobody needs... |
| `mediaOrPeopleEntities` | GoogleApi.ContentWarehouse.V1.Model.ImageQualitySensitiveMediaOrPeopleEntities.t | Contains the mids of the 5 most topical entities annotated with selected KG collections. This information is currently used on Image Search to detect cases where results converged to mostly a single person or media entity. More details: go/result-set-convergence. |
| `scaledSelectionTierRank` | integer() | Selection tier rank is a language normalized score ranging from 0-32767 over the serving tier (Base, Zeppelins, Landfills) for this document. This is converted back to fractional position within the index tier by scaled_selection_tier_rank/32767. |
| `pageTags` | list(integer()) | *(no description provided in leak)* |
| `smearingMaxTotalOffdomainAnchors` | integer() | *(no description provided in leak)* |
| `pagerank` | number() | Experimental pageranks (DEPRECATED; only pagerank in MustangBasicInfo is used). |
| `QuarantineInfo` | integer() | bitmask of QuarantineBits (or'd together) used to store quarantine related information. For example: QUARANTINE_WHITELIST \| QUARANTINE_URLINURL. |
| `rosettaLanguages` | list(String.t) | Top two document language BCP-47 codes as generated by the RosettaLanguageAnnotator in the decreasing order of probability. |
| `freshnessEncodedSignals` | String.t | Stores freshness and aging related data, such as time-related quality metrics predicted from url-pattern level signals. Use the encoding decoding API in quality/freshness/docclassifier/aging/encoded-pattern-signals.h This field is deprecated. |
| `imagedata` | GoogleApi.ContentWarehouse.V1.Model.ImagePerDocData.t | *(no description provided in leak)* |
| `videoCorpusDocid` | String.t | *(no description provided in leak)* |
| `queriesForWhichOfficial` | GoogleApi.ContentWarehouse.V1.Model.OfficialPagesQuerySet.t | The set of (query, country, language) triples for which this document is considered to be the official page. For example, www.britneyspears.com would be official for (&quot;britney spears&quot;, &quot;us&quot;, 0) and others (0 is English). |
| `nsrIsCovidLocalAuthority` | boolean() | This field is propagated to shards. In addition, it is populated at serving time by go/web-signal-joins. This field is deprecated - used the equivalent field inside nsr_data_proto instead. |
| `crawlerIdProto` | GoogleApi.ContentWarehouse.V1.Model.LogsProtoIndexingCrawlerIdCrawlerIdProto.t | For crawler-ID variations, the crawling context applied to the document. See go/url, and the description in google3/indexing/crawler_id |
| `ScaledSpamScoreEric` | integer() | *(no description provided in leak)* |
| `biasingdata` | GoogleApi.ContentWarehouse.V1.Model.BiasingPerDocData.t | *(no description provided in leak)* |
| `ScaledExptSpamScoreEric` | integer() | *(no description provided in leak)* |
| `v2KnexAnnotation` | GoogleApi.ContentWarehouse.V1.Model.QualitySherlockKnexAnnotation.t | For indexing v2 k'nex, see/go/knex-v2-doc-annotation for details. |
| `MobileData` | GoogleApi.ContentWarehouse.V1.Model.MobilePerDocData.t | Additional metadata for lowend mobile documents in the Google index. |
| `BookCitationData` | GoogleApi.ContentWarehouse.V1.Model.BookCitationPerDocData.t | the book citation data for each web page, the average size is about 10 bytes |
| `semanticDate` | integer() | SemanticDate, estimated date of the content of a document based on the contents of the document (via parsing), anchors and related documents. Date is encoded as a 32-bits UNIX date (1970 Jan 1 epoch). Confidence is encoded using a SemanticDate specific format. For details of encoding, please refer to quality/freshness/docclassifier/semanticdate/public/semantic_date.proto |
| `biasingdata2` | GoogleApi.ContentWarehouse.V1.Model.BiasingPerDocData2.t | A replacement for BiasingPerDocData that is more space efficient. Once this is live everywhere, biasingdata will be deprecated. |
| `ymylNewsScore` | integer() | Stores scores of ymyl news classifier as defined at go/ymyl-classifier-dd. To use this field, you MUST join g/pq-classifiers-announce and add your use case at |
| `saftLanguageInt` | list(integer()) | Top document language as generated by SAFT LangID. For now we store bare minimum: just the top 1 language value, converted to the language enum, and only when different from the first value in 'languages'. |
| `rsApplication` | GoogleApi.ContentWarehouse.V1.Model.RepositoryAnnotationsRdfaRdfaRichSnippetsApplication.t | Application information associated to the document. |
| `domainAge` | integer() | 16-bit |
| `lastSignificantUpdateInfo` | String.t | Metadata about last significant update. Currently this only encodes the quality_timebased.LastSignificantUpdate.source field which contains the info on the source of the signal. NOTE: Please do not read the value directly. Use helpers from quality/timebased/lastsignificantupdate/lsu-helper.h instead. |
| `pagerank1` | number() | *(no description provided in leak)* |
| `spamCookbookAction` | GoogleApi.ContentWarehouse.V1.Model.SpamCookbookAction.t | Actions based on Cookbook recipes that match the page. |
| `compressedUrl` | String.t | Compressed URL string used for SETI. |
| `extraData` | GoogleApi.ContentWarehouse.V1.Model.Proto2BridgeMessageSet.t | This field is available only in the docjoins: it is cleared before building per-doc data in both Mustang and Teragoogle. (MessageSet is inefficient in space for serving data) Use this for all new fields that aren't needed during serving. Currently this field contains: |
| `socialgraphNodeNameFp` | String.t | For Social Search we store the fingerprint of the SG node name. This is used in one of the superroot's PRE_DOC twiddlers as a lookup key for the full Social Search data. PRE_DOC = twiddlers firing before the DocInfo request is sent to the mustang backend. |
| `urlAfterRedirectsFp` | String.t | These two fingerprints are used for de-duping results in a twiddler. They should only be populated by freshdocs, and will only be present for documents that are chosen to be canonicals in a cluster whose previous canonical is also in the index. Additionally, url_after_redirects_fp is only present if it is different from a fingerprint of the URL. |
| `localizedCluster` | GoogleApi.ContentWarehouse.V1.Model.IndexingDupsLocalizedLocalizedCluster.t | Information on localized clusters, which is the relationship of translated and/or localized pages. |
| `pageregions` | String.t | String that encodes the position ranges for different regions of the document. See &quot;indexer/pageregion.h&quot; for an explanation, and how to decode the string |
| `KeywordStuffingScore` | integer() | The keyword stuffing score is represented in 7 bits, going from 0 to 127. |
| `spambrainTotalDocSpamScore` | number() | The document total spam score identified by spambrain, going from 0 to 1. |
| `noimageframeoverlayreason` | integer() | If not 0, we should not show the image in overlay mode in image snippets |
| `scienceHoldingsIds` | list(String.t) | Deprecated 2016/01/14. |
| `crawlPagerank` | integer() | This field is used internally by the docjoiner to forward the crawl pageranks from original canonicals to canonicals we actually chose; outside sources should not set it, and it should not be present in actual docjoins or the index. |
| `BlogData` | GoogleApi.ContentWarehouse.V1.Model.BlogPerDocData.t | *(no description provided in leak)* |
| `nsrIsVideoFocusedSite` | boolean() | This field is propagated to shards. It will also be populated at serving time by go/web-signal-joins (see b/170607253). Bit indicating whether this site is video-focused, but not hosted on any major known video hosting domains. This field is deprecated - used the equivalent field inside nsr_data_proto instead. |
| `ScaledExptSpamScoreYoram` | integer() | *(no description provided in leak)* |
| `spamrank` | integer() | The spamrank measures the likelihood that this document links to known spammers. Its value is between 0 and 65535. |
| `compressedQualitySignals` | GoogleApi.ContentWarehouse.V1.Model.CompressedQualitySignals.t | *(no description provided in leak)* |
| `videodata` | GoogleApi.ContentWarehouse.V1.Model.VideoPerDocData.t | *(no description provided in leak)* |
| `s3AudioLanguage` | GoogleApi.ContentWarehouse.V1.Model.S3AudioLanguageS3AudioLanguage.t | Primary video's audio language classified by S3 based Automatic Language Identification (only for watch pages). |
| `watchpageLanguageResult` | GoogleApi.ContentWarehouse.V1.Model.WatchpageLanguageWatchPageLanguageResult.t | Language classified by the WatchPageLanguage Model (go/watchpage-language). Only present for watch pages. |
| `appsLink` | GoogleApi.ContentWarehouse.V1.Model.QualityCalypsoAppsLink.t | AppsLink contains Android application IDs in outlinks. It is used to improve results ranking within applications universal. See |
| `desktopInterstitials` | GoogleApi.ContentWarehouse.V1.Model.IndexingMobileInterstitialsProtoDesktopInterstitials.t | Contains desktop interstitials signal for VOLT ranking change. |
| `liveResultsData` | GoogleApi.ContentWarehouse.V1.Model.WeboftrustLiveResultsDocAttachments.t | *(no description provided in leak)* |
| `crowdingdata` | GoogleApi.ContentWarehouse.V1.Model.CrowdingPerDocData.t | *(no description provided in leak)* |
| `nsrSitechunk` | String.t | SiteChunk computed for nsr. It some cases it can use more information than just url (e.g. youtube channels). See NsrAnnotator for details. If sitechunk is longer than --populate_nsr_sitechunk_max_length (default=100), it will not get populated. This field might be compressed and needs to be decoded with quality_nsr::util::DecodeNsrSitechunk. See go/nsr-chunks for more details. This field contains only nontrivial primary chunks. |
| `originalTitleHardTokenCount` | integer() | The number of hard tokens in the title. |
| `hostAge` | integer() | The earliest firstseen date of all pages in this host/domain. These data are used in twiddler to sandbox fresh spam in serving time. It is 16 bit and the time is day number after 2005-12-31, and all the previous time are set to 0. If this url's host_age == domain_age, then omit domain_age Please use //spam/content/siteage-util.h to convert the day between epoch second. Regarding usage of Sentinel values: We would like to check if a value exists in scoring bundle while using in Ranklab AST. For t |
| `inNewsstand` | boolean() | This field indicates whether the document is in the newsstand corpus. |
| `origin` | integer() | *(no description provided in leak)* |
| `launchAppInfo` | GoogleApi.ContentWarehouse.V1.Model.QualityRichsnippetsAppsProtosLaunchAppInfoPerDocData.t | Info on how to launch a mobile app to consume this document's content, if applicable (see go/calypso). |
| `eventsDate` | list(String.t) | Date for Events. A web page might list multiple events with different dates. We only take one date (start date) per event. |
| `homePageInfo` | integer() | *(no description provided in leak)* |
| `GibberishScore` | integer() | The gibberish score is represented in 7 bits, going from 0 to 127. |
| `toolbarPagerank` | integer() | A copy of the value stored in /namespace/indexing/wwwglobal//fakepr/* for this document. A value of quality_bakery::FakeprUtils::kUnknownToolbarPagerank indicates that we don't have toolbar pagerank for this document. A value between 0 and 10 (inclusive) means that this is the toolbar pagerank of the page. Finally, if this value is not set it means that the toolbar pagerank is equivalent to: quality_bakery::FakeprUtils::EstimatePreDemotionFromPagerankNearestSeeds( basic_info.pagerank_ns()) calle |
| `freshboxArticleScores` | integer() | Stores scores of freshness-related classifiers: freshbox article score, live blog score and host-level article score. The encoding/decoding API is in quality/freshness/freshbox/goldmine/freshbox_annotation_encoder.h. To use this field, you MUST join g/pq-classifiers-announce and add your use case at |
| `WhirlpoolDiscount` | number() | *(no description provided in leak)* |
| `ScaledExptIndyRank3` | integer() | experimental |
| `ToolBarData` | GoogleApi.ContentWarehouse.V1.Model.ToolBarPerDocData.t | *(no description provided in leak)* |
| `nsrIsElectionAuthority` | boolean() | This field is propagated to shards. It will also be populated at serving time by go/web-signal-joins (see b/168114815). This field is deprecated - used the equivalent field inside nsr_data_proto instead. |
| `onsiteProminence` | integer() | Onsite prominence measures the importance of the document within its site. It is computed by propagating simulated traffic from the homepage and high craps click pages. It is a 13-bit int. |
| `travelGoodSitesInfo` | GoogleApi.ContentWarehouse.V1.Model.QualityTravelGoodSitesData.t | This field stores information about good travel sites. |
| `IsAnchorBayesSpam` | boolean() | Is this document considered spam by the anchor bayes classifier? |
| `isHotdoc` | boolean() | Set by the FreshDocs instant doc joiner. See //indexing/instant/hotdocs/README and |
| `commercialScore` | number() | A measure of commerciality of the document Score > 0 indicates document is commercial (i.e. sells something) Computed by repository/pageclassifiers/parsehandler-commercial.cc |
| `asteroidBeltIntents` | GoogleApi.ContentWarehouse.V1.Model.QualityOrbitAsteroidBeltDocumentIntentScores.t | For indexing Asteroid Belt intent scores. See go/asteroid-belt for details. |
| `TagPageScore` | integer() | Tag-site-ness of a page, repesented in 7-bits range from 0 to 100. Smaller value means worse tag page. |
| `geodata` | String.t | geo data; approx 24 bytes for 23M U.S. pages |
| `oceandata` | GoogleApi.ContentWarehouse.V1.Model.OceanPerDocData.t | 28 bytes per page, only in the Ocean index |
| `pagerank0` | number() | *(no description provided in leak)* |
| `SpamWordScore` | integer() | The spamword score is represented in 7-bits, going from 0 to 127. |
| `ScaledIndyRank` | integer() | The independence rank is represented as a 16-bit integer, which is multiplied by (max_indy_rank / 65536) to produce actual independence rank values. max_indy_rank is typically 0.84. |
| `bodyWordsToTokensRatioBegin` | number() | The body words over tokens ratios for the beginning part and whole doc. NB: To save space, field body_words_to_tokens_ratio_total is not set if it has the same value as body_words_to_tokens_ratio_begin (e.g., short docs). |
| `topPetacatWeight` | number() | *(no description provided in leak)* |
| `fireflySiteSignal` | GoogleApi.ContentWarehouse.V1.Model.QualityCopiaFireflySiteSignal.t | Contains Site signal information for Firefly ranking change. See |
| `titleHardTokenCountWithoutStopwords` | integer() | Number of hard tokens originally in title without counting the stopwords. |
| `hostNsr` | integer() | Site rank computed for host-level sitechunks. This value encodes nsr, site_pr and new_nsr. See quality_nsr::util::ConvertNsrDataToHostNsr and go/nsr. This field is deprecated - used the equivalent field inside nsr_data_proto instead. |
| `semanticDateInfo` | integer() | Info is encoded using a SemanticDate specific format. Contains confidence scores for day/month/year components as well as various meta data required by the freshness twiddlers. |
| `languages` | list(integer()) | Plausible languages in order of decreasing plausibility. Language values are small, IE < 127 so this should compress to one byte each. |
| `GroupsData` | GoogleApi.ContentWarehouse.V1.Model.GroupsPerDocData.t | 16 bytes of groups2 data: used only in groups2 index |
| `countryInfo` | GoogleApi.ContentWarehouse.V1.Model.CountryCountryAttachment.t | This field stores the country information for the document in the form of CountryAttachment. |
| `brainloc` | GoogleApi.ContentWarehouse.V1.Model.QualityGeoBrainlocBrainlocAttachment.t | Brainloc contains location information for the document. See ariane/273189 for details. |
| `ScaledLinkAgeSpamScore` | integer() | End DEPRECATED ------------------------------------------------------------ Link age score is represented as a 7-bit integer, going from 0 to 127. |
| `ScaledExptIndyRank` | integer() | DEPRECATED ---------------------------------------------------------------- Please do not use these fields in any new code. experimental |
| `shingleInfo` | GoogleApi.ContentWarehouse.V1.Model.ShingleInfoPerDocData.t | *(no description provided in leak)* |
| `productSitesInfo` | GoogleApi.ContentWarehouse.V1.Model.QualityProductProductSiteData.t | This field stores information about product sites. |
| `spambrainDomainSitechunkData` | GoogleApi.ContentWarehouse.V1.Model.SpamBrainData.t | Domain sitechunk level scores coming from spambrain. |
| `voltData` | GoogleApi.ContentWarehouse.V1.Model.IndexingMobileVoltVoltPerDocData.t | Contains page UX signals for VOLT ranking change. See |
| `timeSensitivity` | integer() | Encoded Document Time Sensitivity signal. |
| `servingTimeClusterIds` | GoogleApi.ContentWarehouse.V1.Model.IndexingDocjoinerServingTimeClusterIds.t | A set of cluster ids which are generated in Alexandria and used to de-dup results at serving time. |

**QualityNsrNsrData** - 56 attributes

| Attribute | Type | Description |
|---|---|---|
| `ugcScore` | number() | *(no description provided in leak)* |
| `spambrainLavcScores` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrVersionedFloatSignal.t) | *(no description provided in leak)* |
| `titlematchScore` | number() | Titlematch score of the site, a signal that tells how well titles are matching user queries. |
| `site2vecEmbeddingEncoded` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrNsrDataEncodedEmbedding.t) | Encoded site2vec embedding (to be used in superroot) since the full embeddings take too much space. |
| `smallPersonalSite` | number() | Score of small personal site promotion go/promoting-personal-blogs-v1 |
| `pnavClicks` | number() | denominator for the pnav computation |
| `siteChunkSource` | String.t | These are only annotated in the Goldmine NSR annotator. |
| `clusterUplift` | GoogleApi.ContentWarehouse.V1.Model.QualityNsrNsrDataClusterUplift.t | *(no description provided in leak)* |
| `siteAutopilotScore` | number() | Aggregated value of url autopilot scores for this sitechunk. |
| `isVideoFocusedSite` | boolean() | Bit to determine whether the site has mostly video content, but is not hosted on any known video-hosting domains. Site is considered to be video-focused, if it has > 50% of the URLs with watch pages (with smoothing prior). ariane/4045246 |
| `metadata` | GoogleApi.ContentWarehouse.V1.Model.QualityNsrNsrDataMetadata.t | *(no description provided in leak)* |
| `chromeInTotal` | number() | Site-level Chrome views. |
| `chardVariance` | number() | *(no description provided in leak)* |
| `chardScoreVariance` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrVersionedFloatSignal.t) | Site-level Chard Variance for all pages of a site. |
| `chardScoreEncoded` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrVersionedIntSignal.t) | Site-level Chard (encoded as an int). |
| `nsrdataFromFallbackPatternKey` | boolean() | If true indicates that we do not have NSR data computed for the chunk, and instead the data is coming from an average of other host chunks. |
| `siteQualityStddevs` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrVersionedFloatSignal.t) | *(no description provided in leak)* |
| `clusterId` | integer() | An id for defining clusters of sites. Used in ecosystem experiments (project Tundra). |
| `videoScore` | number() | *(no description provided in leak)* |
| `shoppingScore` | number() | *(no description provided in leak)* |
| `nsr` | number() | *(no description provided in leak)* |
| `localityScore` | number() | Locality score of the site, i.e. the locality component of the LocalAuthority signal (see go/pq-localauthority). |
| `siteChunk` | String.t | Primary NSR sitechunk. In most of the cases it's same as HOST_LEVEL_V3 sitechunked canonical url of the document. In rare, but important cases it's based on page markup (see quality/nsr/util/sitechunker.h for details). |
| `i18nBucket` | integer() | Currently corresponds to i18n_g42_bucket. |
| `chardEncoded` | integer() | Site-level chard score: site quality predictor based on content. |
| `articleScoreV2` | number() | *(no description provided in leak)* |
| `nsrEpoch` | String.t | The epoch from which this NSR value is coming from. |
| `tofu` | number() | Site-level tofu score: site quality predictor based on content. |
| `siteLinkOut` | number() | Aggregated value of url link out scores for this sitechunk. |
| `nsrOverrideBid` | number() | This signal is used to unconditionally override NSR as a bid in Q*. Should only be used in case of emergency (see go/nsr-override-bid). To have any effect, the value should be present and greater than 0.001. |
| `language` | integer() | *(no description provided in leak)* |
| `clutterScores` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrVersionedFloatSignal.t) | *(no description provided in leak)* |
| `host` | String.t | *(no description provided in leak)* |
| `isCovidLocalAuthority` | boolean() | Bit to determine whether the site has the local authority covid signal, as computed by go/covid-local-authority |
| `pnav` | number() | Fractional signals. |
| `siteQualityStddev` | number() | Estimate of site's PQ rating stddev--spread of the page-level PQ ratings of a site. Note this is different from nsr_variance which predicts error of NSR itself from the aggregated site-level rating. |
| `impressions` | number() | Site-level impressions. |
| `directFrac` | number() | *(no description provided in leak)* |
| `vlq` | number() | Score of the Video LQ model. |
| `racterScores` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrVersionedFloatSignal.t) | Site-level AGC classification score (see also go/project-racter-overview). |
| `spambrainLavcScore` | number() | The SpamBrain LAVC score, as of July 2022. See more information at go/cloverfield-lavc-deck. |
| `url` | String.t | *(no description provided in leak)* |
| `secondarySiteChunk` | String.t | Secondary NSR sitechunk. When present, it provides more granular chunking than primary sitechunks (see quality/nsr/util/sitechunker.h for details). |
| `articleScore` | number() | Score from article classification of the site. |
| `site2vecEmbedding` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrNsrDataEmbedding.t) | Site2vec embeddings. |
| `versionedData` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrNSRVersionedData.t) | Versioned map of NSR values for experimenting with the next release. |
| `siteLinkIn` | number() | Average value of the site_link_in for pages in the sitechunk. |
| `ketoVersionedData` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrKetoKetoVersionedData.t) | Keto data. |
| `ymylNewsV2Score` | number() | *(no description provided in leak)* |
| `isElectionAuthority` | boolean() | Bit to determine whether the site has the election authority signal, as computed by go/election-authority |
| `sitePr` | number() | *(no description provided in leak)* |
| `priorAdjustedNsr` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrVersionedFloatSignal.t) | NSR - prior. Estimate of whether the site is above/below average NSR in its slice. |
| `healthScore` | number() | Categorical signals. |
| `clutterScore` | number() | Delta site-level signal in Q* penalizing sites with a large number of distracting/annoying resources loaded by the site (see go/clutter-v0). |
| `vlqNsr` | number() | NSR from a headroom model targeting low-quality video sites. |
| `nsrVariance` | number() | *(no description provided in leak)* |

**QualityNsrPQData** - 19 attributes

| Attribute | Type | Description |
|---|---|---|
| `chard` | integer() | URL-level chard prediction (encoded as an int). |
| `chardScoreEncoded` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrVersionedIntSignal.t) | URL-level Chard (encoded as an int). |
| `contentEffort` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrVersionedFloatSignal.t) | LLM-based effort estimation for article pages (see landspeeder/4311817). |
| `deltaAutopilotScore` | number() | *(no description provided in leak)* |
| `deltaLinkIncoming` | number() | *(no description provided in leak)* |
| `deltaLinkOutgoing` | number() | *(no description provided in leak)* |
| `deltaSubchunkAdjustment` | number() | Total deltaNSR adjustment based on subchunks. This is a page-level adjustment (subchunks are retrieved based on the page classification). |
| `keto` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrVersionedFloatSignal.t) | Keto score. |
| `linkIncoming` | number() | *(no description provided in leak)* |
| `linkOutgoing` | number() | *(no description provided in leak)* |
| `numOffdomainAnchors` | number() | The total number of offdomain anchors seen by the NSR pipeline for this page. |
| `page2vecLq` | number() | *(no description provided in leak)* |
| `predictedDefaultNsr` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrVersionedFloatSignal.t) | Predicted default NSR score computed in Goldmine via the NSR default predictor (go/default-nsr-predictor). |
| `rhubarb` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrVersionedFloatSignal.t) | Site-URL delta signals based quality score computed in Goldmine via the Rhubarb model (go/rhubarb-dd). |
| `subchunkData` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrPQDataSubchunkData.t) | *(no description provided in leak)* |
| `tofu` | number() | URL-level tofu prediction. |
| `unversionedRhubarb` | number() | The delta score of the URL-level quality predictor. |
| `urlAutopilotScore` | number() | *(no description provided in leak)* |
| `vlq` | number() | URL-level score of the VLQ model. |

**CompressedQualitySignals** - 38 attributes

| Attribute | Type | Description |
|---|---|---|
| `ugcDiscussionEffortScore` | integer() | UGC page quality signals. (Times 1000 and floored) |
| `productReviewPPromotePage` | integer() | *(no description provided in leak)* |
| `experimentalQstarDeltaSignal` | number() | This field is |
| `productReviewPDemoteSite` | integer() | Product review demotion/promotion confidences. (Times 1000 and floored) |
| `experimentalQstarSiteSignal` | number() | This field is |
| `exactMatchDomainDemotion` | integer() | Page quality signals converted from fields in proto QualityBoost in quality/q2/proto/quality-boost.proto. To save indexing space, we convert the float values in [0, 1] to integers in range [0, 1023] (use 10 bits). exact_match_domain_demotion: converted from QualityBoost.emd.boost. |
| `nsrVersionedData` | list(GoogleApi.ContentWarehouse.V1.Model.NSRVersionedItem.t) | Versioned NSR score to be used in continuous evaluation of the upcoming NSR version and assess quality impact on various slices. This field is deprecated - used the equivalent field inside nsr_data_proto instead. |
| `nsrConfidence` | integer() | NSR confidence score: converted from quality_nsr.NsrData. This field is deprecated - use nsr_variance inside nsr_data_proto instead. |
| `lowQuality` | integer() | S2V low quality score: converted from quality_nsr.NsrData, applied in Qstar. See quality_nsr::util::ConvertNsrDataToLowQuality. |
| `navDemotion` | integer() | nav_demotion: converted from QualityBoost.nav_demoted.boost. |
| `pqData` | integer() | Encoded page-level PQ signals. |
| `siteAuthority` | integer() | site_authority: converted from quality_nsr.SiteAuthority, applied in Qstar. |
| `crapsNewUrlSignals` | String.t | For craps |
| `babyPandaV2Demotion` | integer() | New BabyPanda demotion, applied on top of Panda. This is meant to replace \|baby_panda_demotion\|. |
| `authorityPromotion` | integer() | authority promotion: converted from QualityBoost.authority.boost |
| `productReviewPUhqPage` | integer() | The possibility of a page being a high quality review page. |
| `crapsAbsoluteHostSignals` | integer() | Impressions, unsquashed, host level, not to be used with compressed ratios. Not to be used in Pattern Data. |
| `productReviewPPromoteSite` | integer() | *(no description provided in leak)* |
| `nsrOverrideBid` | number() | NSR override bid, used in Q* for emergency overrides. This field is deprecated - used the equivalent field inside nsr_data_proto instead. |
| `babyPandaDemotion` | integer() | baby_panda_demotion: converted from QualityBoost.rendered.boost. |
| `serpDemotion` | integer() | serp demotion: applied in Qstar. |
| `anchorMismatchDemotion` | integer() | anchor_mismatch_demotion: converted from QualityBoost.mismatched.boost. |
| `crapsNewHostSignals` | String.t | *(no description provided in leak)* |
| `experimentalQstarSignal` | number() | This field is |
| `pairwiseqScoringData` | GoogleApi.ContentWarehouse.V1.Model.PairwiseQScoringData.t | Deprecated and unused field. |
| `topicEmbeddingsVersionedData` | list(GoogleApi.ContentWarehouse.V1.Model.QualityAuthorityTopicEmbeddingsVersionedItem.t) | Versioned TopicEmbeddings data to be populated later into superroot / used directly in scorers. |
| `scamness` | integer() | Scam model score. Used as one of the web page quality qstar signals. Value range from 0 to 1023. |
| `crapsUnscaledIpPriorBadFraction` | integer() | *(no description provided in leak)* |
| `pandaDemotion` | integer() | This is the encoding of Panda fields in the proto SiteQualityFeatures in quality/q2/proto/site_quality_features.proto. The encoding/decoding is performed using functions from quality_coati::coati_util. |
| `unauthoritativeScore` | integer() | Unauthoritative score. Used as one of the web page quality qstar signals. |
| `experimentalNsrTeamWsjData` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrExperimentalNsrTeamWSJData.t) | This field is |
| `experimentalNsrTeamData` | GoogleApi.ContentWarehouse.V1.Model.QualityNsrExperimentalNsrTeamData.t | This field is |
| `productReviewPReviewPage` | integer() | Fields product_review_p_review_page and product_review_p_uhq_page are for promoting/demoting HQ/LQ review pages in NGS. See go/pr-boosts for details. The possibility of a page being a review page. |
| `pqDataProto` | GoogleApi.ContentWarehouse.V1.Model.QualityNsrPQData.t | Stripped page-level signals, not present in the encoded field 'pq_data'. |
| `pairwiseqVersionedData` | list(GoogleApi.ContentWarehouse.V1.Model.PairwiseQVersionedItem.t) | Versioned PairwiseQ score to be used in continuous evaluation of the upcoming PairwiseQ versions and assess quality impact on various slices. |
| `crapsNewPatternSignals` | String.t | *(no description provided in leak)* |
| `vlqNsr` | integer() | NSR for low-quality videos, converted from quality_nsr.NsrData.vlq_nsr. This field is deprecated - used the equivalent field inside nsr_data_proto instead. |
| `productReviewPDemotePage` | integer() | *(no description provided in leak)* |

**QualityNsrNsrDataMetadata** - 11 attributes

| Attribute | Type | Description |
|---|---|---|
| `encodedLookupInformation` | String.t | Encoded lookup information. The fields set above are expensive to store. Storing them in docjoins is fine, but we cannot store them in MDU shards. In order for the MDU shards to display field provenance information, we store them as a bitfield. For details about the encoding and decoding scheme, see quality_nsr::util::EncodeMetadataLookupInformation. We expect this to occupy 8 bytes as long as there are less than 64 fields in NsrData proto, 12 bytes between 64 and 92 fields, etc. |
| `goldmineLookupKeyPerField` | map() | Same as raffia_lookup_key_per_field. Note that the goldmine_lookups have priority; if a field appears in both goldmine and raffia entries, it means it was taken from goldmine. If it's missing here but present in raffia_lookup_key_per_field, it was taken from raffia. |
| `goldmineLookupKeys` | list(String.t) | The lookup keys attempted by goldmine. Note that goldmine only runs for urls which can be chunked differently than raffia; in those cases, goldmine related fields are empty. |
| `lastTimeProcessedGoldmineInSeconds` | String.t | *(no description provided in leak)* |
| `lastTimeProcessedMduInSeconds` | String.t | This field is populated only during MDU population, so it's |
| `lastTimeProcessedRaffiaInSeconds` | String.t | Records the last time each system has processed the proto. These are recorded as seconds from the unix epoch. Ideally these fields would be google.protobuf.Timestamp, but the scoring bundle (which depends on this proto) does not understand proto3 syntax. See cl/500942047 for details. |
| `nsrChunksWithSourceInfo` | GoogleApi.ContentWarehouse.V1.Model.QualityNsrNsrChunksWithSourceInfo.t | Stores the NSRChunks (computed by goldmine) which were used to populate the data. |
| `raffiaLookupKey` | String.t | *(no description provided in leak)* |
| `raffiaLookupKeyPerField` | map() | Returns the raffia lookup key per each field in the NsrData proto (with exclusion of the Metadata sub-message (i.e. this)). It contains information like 3 : 1, meaning that the field inside NsrData with id '3' (in this case 'host') has been taken by raffia from the raffia lookup key at index 1. |
| `raffiaLookupKeys` | list(String.t) | This is an internal field set by Raffia, to indicate which lookup keys have been attempted to populate the NsrData for this document. This will allow us to determine which key has been used to populate each field in the proto. The keys are ordered by lookup priority; raffia will give priority to earlier keys, and only take fields from later keys if they are missing. |
| `raffiaSignalMergerUrl` | String.t | The url used by NsrSignalMerger ( |

**QualityCopiaFireflySiteSignal** - 15 attributes

| Attribute | Type | Description |
|---|---|---|
| `dailyClicks` | String.t | *(no description provided in leak)* |
| `dailyGoodClicks` | String.t | *(no description provided in leak)* |
| `dataTimeSec` | String.t | *(no description provided in leak)* |
| `firstBoostedTimeSec` | String.t | *(no description provided in leak)* |
| `impressionsInBoostedPeriod` | String.t | *(no description provided in leak)* |
| `latestBylineDateSec` | String.t | *(no description provided in leak)* |
| `latestFirstseenSec` | String.t | *(no description provided in leak)* |
| `numOfArticles8` | String.t | *(no description provided in leak)* |
| `numOfArticlesByPeriods` | list(String.t) | number of articles (lattice article score is 0.8 or more) sliced by 30 days (num_of_articles_by_periods[0] is the newest). |
| `numOfGamblingPages` | String.t | *(no description provided in leak)* |
| `numOfUrls` | String.t | *(no description provided in leak)* |
| `numOfUrlsByPeriods` | list(String.t) | number of urls sliced by 30 days (num_of_urls_by_periods[0] is the newest). |
| `recentImpForQuotaSystem` | String.t | *(no description provided in leak)* |
| `siteFp` | String.t | Hash value of the site. This will be used by our experiment and analysis. |
| `totalImpressions` | String.t | *(no description provided in leak)* |

### Patents relevant to Stage 3

##### US8682892B1 - Ranking search results

- **Core concept:** A site-wide quality multiplier (group-specific modification factor) is computed from independent incoming link counts and reference query counts, then applied on top of individual page scores. Invented by Navneet Panda.
- **Connected leak modules:** `QualityNsrNsrData`, `CompressedQualitySignals`, `QualityNsrPQData`
- **SEO claims:**
  - Resources are grouped (e.g., by site/domain) and each group gets a group-specific modification factor
  - The modification factor is based on the count of independent incoming links to the group
  - The modification factor is also based on the count of reference queries (queries referencing the site)
  - The modification factor acts as a multiplier on individual page scores within the group
  - Bad pages in a group drag down the group's modification factor, affecting all pages in the group
  - Independent links (from unique domains) count more than duplicate links
- **SEO action:** Prune or fix your weak pages. Site-wide quality is a multiplier, so bad pages tax your good ones. The leak's nsr, pandaDemotion, babyPandaV2Demotion, and siteQualityStddev fields are the direct implementation.

##### US9031929B1 - Site quality score

- **Core concept:** A site quality score is computed from two counts: unique queries that reference the site by name, and unique queries followed by user clicks to the site. The ratio and volume of these signals determine quality.
- **Connected leak modules:** `QualityNsrNsrData`, `QualityNavboostCrapsCrapsClickSignals`, `CompressedQualitySignals`
- **SEO claims:**
  - First count: unique queries that include a reference to the particular site (brand queries)
  - Second count: unique queries where the user clicked through to the site (association queries)
  - Site quality score is determined based on both counts
  - The score reflects how many distinct queries lead users to the site - diversity of demand
  - Clicks that lead to longer dwell are treated differently from quick bounces
  - The site quality score is used to modify ranking of pages from that site
- **SEO action:** Plan quality site-wide, not page-by-page. Ask of every section: would users pick this by name? The leak's nsr, impressions, and absoluteImpressions fields confirm site-level query/click aggregation.

##### US9760641B1 - Site quality score

- **Core concept:** Continuation of US9031929B1 - the same site quality scoring method using brand query counts and click-through query counts, filed as a continuation patent.
- **Connected leak modules:** `QualityNsrNsrData`, `QualityNavboostCrapsCrapsClickSignals`, `CompressedQualitySignals`
- **SEO claims:**
  - Same mechanism as US9031929B1: unique brand reference queries + click-associated queries = site quality score
  - Continuation patent (filed 2015, granted 2017) confirms ongoing investment in site-level quality scoring
  - The method remained relevant as Google's search system evolved
  - Quality scoring from query streams is a persistent, multi-year investment
- **SEO action:** Nothing new here, and that is the point: treat site-level quality as a standing budget line, not a one-off fix. The leak confirms NSR scoring is still active with 58+ fields in QualityNsrNsrData.

##### US8195654B1 - Prediction of human ratings or rankings of information retrieval quality

- **Core concept:** Statistical models are trained on human quality rater evaluations paired with objective signals (click data, query logs, document features) to predict quality ratings at scale without human review.
- **Connected leak modules:** `QualityNsrNsrData`, `QualityNsrPQData`, `CompressedQualitySignals`, `PerDocData`
- **SEO claims:**
  - A statistical model relates human ratings of documents to objective signals generated from documents, search queries, and query logs
  - The model is trained on pairs of (objective signals, human relevance evaluations)
  - Once trained, the model predicts human ratings for new query/document pairs
  - Predicted ratings are used to rank search results without requiring actual human review
  - Objective signals include click-through rates, result position, query features, and document features
  - The model can be retrained as new human ratings become available
- **SEO action:** Read the Quality Rater Guidelines like a spec. Models are trained to predict those judgements at scale, so build what raters would rate well. The leak's chard, keto, rhubarb, and tofu quality predictors are the ML implementations.

##### US11354342B2 - Contextual estimation of link information gain

- **Core concept:** Information gain scoring: a document is scored on what new information it adds beyond documents the user has already seen. Documents that merely repeat existing information score lower.
- **Connected leak modules:** `PerDocData`, `QualityNsrPQData`, `CompressedQualitySignals`
- **SEO claims:**
  - Documents are scored based on information gain relative to previously viewed documents
  - The system tracks what information a user has already consumed
  - Documents providing unique, additive information receive higher information gain scores
  - Documents that duplicate or rehash existing content receive lower scores
  - Information gain is contextual - it depends on what the user has already seen
  - The score can be used to rank documents and prioritize novel content
- **SEO action:** Before publishing, name what your page adds that the current top results lack. If the answer is nothing, do not publish. The leak's OriginalContentScore in PerDocData directly measures content originality.

---
