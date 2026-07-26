# Signal catalog

Every leak attribute classified as `core` or `supporting`: 848 of the
14,022 attributes in the leak. Grouped by category, then by module.

This file exists so the skill still works where scripts cannot run. When you can run them, prefer
`python3 scripts/search_signals.py --tier signals` and `python3 scripts/explain.py <field>`, which
are faster and give you the connected patents too.

**core** means the value is used directly in scoring or ordering a document. **supporting** means it
feeds a core signal. How these were assigned, and how much they agree with an independent second
pass, is in `classification_report.md`. Descriptions in quotes are Google's own words.


## content_quality (163)

### QualityNsrNsrData

- `nsrOverrideBid` (**core**) A manual value that replaces the site quality score in ranking when set.
  - Google: "This signal is used to unconditionally override NSR as a bid in Q*. Should only be used in case of emergency (see go/nsr-override-bid). To have any effect, the value should be present and greater than 0.001."
- `smallPersonalSite` (**core**) A promotion score for small personal sites and blogs.
  - Google: "Score of small personal site promotion go/promoting-personal-blogs-v1"
- `articleScore` (supporting) How article-like the site's content is, per a classifier.
  - Google: "Score from article classification of the site."
- `chardEncoded` (supporting) A site-wide predicted content quality score, stored as an integer.
  - Google: "Site-level chard score: site quality predictor based on content."
- `chardScoreEncoded` (supporting) Versioned site-wide predicted content quality scores.
  - Google: "Site-level Chard (encoded as an int)."
- `chardScoreVariance` (supporting) How much predicted content quality varies across the site's pages.
  - Google: "Site-level Chard Variance for all pages of a site."
- `healthScore` (supporting) A site-level score within the categorical health grouping.
  - Google: "Categorical signals."
- `isCovidLocalAuthority` (supporting) Whether the site counts as a local authority for COVID information.
  - Google: "Bit to determine whether the site has the local authority covid signal, as computed by go/covid-local-authority"
- `isElectionAuthority` (supporting) Whether the site counts as an authority on elections.
  - Google: "Bit to determine whether the site has the election authority signal, as computed by go/election-authority"
- `ketoVersionedData` (supporting) The site's keto quality scores across versions.
  - Google: "Keto data."
- `priorAdjustedNsr` (supporting) How far the site's quality sits above or below average for its group.
  - Google: "NSR - prior. Estimate of whether the site is above/below average NSR in its slice."
- `racterScores` (supporting) Site-level scores from a classifier for auto-generated content.
  - Google: "Site-level AGC classification score (see also go/project-racter-overview)."
- `site2vecEmbedding` (supporting) A vector representation of the site.
  - Google: "Site2vec embeddings."
- `site2vecEmbeddingEncoded` (supporting) A compressed vector representation of the site for use in serving.
  - Google: "Encoded site2vec embedding (to be used in superroot) since the full embeddings take too much space."
- `siteAutopilotScore` (supporting) The site-wide aggregate of per-page autopilot scores.
  - Google: "Aggregated value of url autopilot scores for this sitechunk."
- `siteQualityStddev` (supporting) How widely page quality ratings vary across the site.
  - Google: "Estimate of site's PQ rating stddev--spread of the page-level PQ ratings of a site. Note this is different from nsr_variance which predicts error of NSR itself from the aggregated site-level rating."
- `titlematchScore` (supporting) How well the site's page titles match the queries users type.
  - Google: "Titlematch score of the site, a signal that tells how well titles are matching user queries."
- `tofu` (supporting) A site-wide content-based quality prediction.
  - Google: "Site-level tofu score: site quality predictor based on content."
- `versionedData` (supporting) Site quality values kept per version for testing new releases.
  - Google: "Versioned map of NSR values for experimenting with the next release."
- `vlq` (supporting) A score from a model that spots low-quality video sites.
  - Google: "Score of the Video LQ model."
- `vlqNsr` (supporting) A site quality value from a model aimed at low-quality video sites.
  - Google: "NSR from a headroom model targeting low-quality video sites."

### PerDocData

- `OriginalContentScore` (**core**) A score for how original the page's content is, stored for pages with little content.
  - Google: "The original content score is represented as a 7-bits, going from 0 to 127. Only pages with little content have this field. The actual original content score ranges from 0 to 512. It is encoded with quality_q2::OriginalContentUtil::EncodeOriginalContentScore(). To decode the value, use..."
- `BookCitationData` (supporting) Book citation information attached to a web page, about ten bytes per page.
  - Google: "the book citation data for each web page, the average size is about 10 bytes"
- `TagPageScore` (supporting) A 0-100 score for how much the page looks like a thin tag listing page.
  - Google: "Tag-site-ness of a page, repesented in 7-bits range from 0 to 100. Smaller value means worse tag page."
- `bodyWordsToTokensRatioBegin` (supporting) The ratio of real words to tokens in the opening part of the page body.
  - Google: "The body words over tokens ratios for the beginning part and whole doc. NB: To save space, field body_words_to_tokens_ratio_total is not set if it has the same value as body_words_to_tokens_ratio_begin (e.g., short docs)."
- `commercialScore` (supporting) A score for how commercial the page is; above zero means it sells something.
  - Google: "A measure of commerciality of the document Score > 0 indicates document is commercial (i.e. sells something) Computed by repository/pageclassifiers/parsehandler-commercial.cc"
- `desktopInterstitials` (supporting) A signal about interstitials shown on desktop, used by the VOLT ranking change.
  - Google: "Contains desktop interstitials signal for VOLT ranking change."
- `fireflySiteSignal` (supporting) Site-level signal data used by the Firefly ranking change.
  - Google: "Contains Site signal information for Firefly ranking change. See"
- `nsrDataProto` (supporting) A container of site-level quality signals not stored in the separate NSR fields.
  - Google: "Stripped site-level signals, not present in the explicit nsr_* fields, nor compressed_quality_signals."
- `originalTitleHardTokenCount` (supporting) How many hard tokens the original title contained.
  - Google: "The number of hard tokens in the title."
- `pageregions` (supporting) An encoded map of where the different regions of the page start and end.
  - Google: "String that encodes the position ranges for different regions of the document. See &quot;indexer/pageregion.h&quot; for an explanation, and how to decode the string"
- `productSitesInfo` (supporting) Stored information about product sites.
  - Google: "This field stores information about product sites."
- `titleHardTokenCountWithoutStopwords` (supporting) How many hard tokens the title has once stopwords are excluded.
  - Google: "Number of hard tokens originally in title without counting the stopwords."
- `travelGoodSitesInfo` (supporting) Stored information about travel sites judged good.
  - Google: "This field stores information about good travel sites."
- `voltData` (supporting) Page experience signals used by the VOLT ranking change.
  - Google: "Contains page UX signals for VOLT ranking change. See"
- `ymylHealthScore` (supporting) A classifier score for how much the page is health content in a sensitive area.
  - Google: "Stores scores of ymyl health classifier as defined at go/ymyl-classifier-dd. To use this field, you MUST join g/pq-classifiers-announce and add your use case at"
- `ymylNewsScore` (supporting) A classifier score for how much the page is news content in a sensitive area.
  - Google: "Stores scores of ymyl news classifier as defined at go/ymyl-classifier-dd. To use this field, you MUST join g/pq-classifiers-announce and add your use case at"

### CompressedQualitySignals

- `babyPandaDemotion` (**core**) A stored quality demotion value in the Panda family.
  - Google: "baby_panda_demotion: converted from QualityBoost.rendered.boost."
- `babyPandaV2Demotion` (**core**) A newer quality demotion applied on top of the Panda demotion.
  - Google: "New BabyPanda demotion, applied on top of Panda. This is meant to replace |baby_panda_demotion|."
- `lowQuality` (**core**) A low quality score for the site, applied during Q* scoring.
  - Google: "S2V low quality score: converted from quality_nsr.NsrData, applied in Qstar. See quality_nsr::util::ConvertNsrDataToLowQuality."
- `pandaDemotion` (**core**) The encoded Panda site quality demotion for the page.
  - Google: "This is the encoding of Panda fields in the proto SiteQualityFeatures in quality/q2/proto/site_quality_features.proto. The encoding/decoding is performed using functions from quality_coati::coati_util."
- `productReviewPDemoteSite` (**core**) A confidence value used to demote or promote a site for product reviews.
  - Google: "Product review demotion/promotion confidences. (Times 1000 and floored)"
- `ugcDiscussionEffortScore` (**core**) A score for the effort behind user-generated discussion content on the page.
  - Google: "UGC page quality signals. (Times 1000 and floored)"
- `unauthoritativeScore` (**core**) A score for how unauthoritative the page looks, used in quality scoring.
  - Google: "Unauthoritative score. Used as one of the web page quality qstar signals."
- `experimentalNsrTeamData` (supporting) Experimental site quality data kept by the site quality team.
  - Google: "This field is"
- `experimentalNsrTeamWsjData` (supporting) A second experimental site quality data set kept by the site quality team.
  - Google: "This field is"
- `experimentalQstarDeltaSignal` (supporting) An experimental value measuring a change in a Q* scoring signal.
  - Google: "This field is"
- `experimentalQstarSignal` (supporting) An experimental page-level value tested in Q* scoring.
  - Google: "This field is"
- `experimentalQstarSiteSignal` (supporting) An experimental site-level value tested in Q* scoring.
  - Google: "This field is"
- `pqData` (supporting) Encoded page-level page quality signals.
  - Google: "Encoded page-level PQ signals."
- `pqDataProto` (supporting) Page-level quality signals kept outside the encoded page quality field.
  - Google: "Stripped page-level signals, not present in the encoded field 'pq_data'."
- `productReviewPReviewPage` (supporting) The estimated chance that the page is a product review page.
  - Google: "Fields product_review_p_review_page and product_review_p_uhq_page are for promoting/demoting HQ/LQ review pages in NGS. See go/pr-boosts for details. The possibility of a page being a review page."
- `productReviewPUhqPage` (supporting) The estimated chance that the page is a high quality review page.
  - Google: "The possibility of a page being a high quality review page."

### QualityNsrPQData

- `contentEffort` (**core**) A model's estimate of how much effort went into creating the page's content.
  - Google: "LLM-based effort estimation for article pages (see landspeeder/4311817)."
- `chard` (supporting) A page-level predicted content quality score.
  - Google: "URL-level chard prediction (encoded as an int)."
- `chardScoreEncoded` (supporting) Versioned page-level predicted content quality scores.
  - Google: "URL-level Chard (encoded as an int)."
- `deltaSubchunkAdjustment` (supporting) A page-level adjustment to site quality based on the page's topic group.
  - Google: "Total deltaNSR adjustment based on subchunks. This is a page-level adjustment (subchunks are retrieved based on the page classification)."
- `keto` (supporting) The page's keto quality score.
  - Google: "Keto score."
- `predictedDefaultNsr` (supporting) A predicted default site quality score computed for the page.
  - Google: "Predicted default NSR score computed in Goldmine via the NSR default predictor (go/default-nsr-predictor)."
- `rhubarb` (supporting) A page quality score based on how the page differs from its site.
  - Google: "Site-URL delta signals based quality score computed in Goldmine via the Rhubarb model (go/rhubarb-dd)."
- `tofu` (supporting) A page-level content-based quality prediction.
  - Google: "URL-level tofu prediction."
- `unversionedRhubarb` (supporting) The page-level quality predictor's difference score.
  - Google: "The delta score of the URL-level quality predictor."
- `vlq` (supporting) The page's score from the low-quality video model.
  - Google: "URL-level score of the VLQ model."

### QualityFringeFringeQueryPriorPerDocData

- `encodedChardXlqHoaxPrediction` (supporting) A packed model estimate that the page is a hoax.
  - Google: "An encoding of the Chard XLQ-hoax prediction in [0,1]."
- `encodedChardXlqTranslatedPrediction` (supporting) A packed low-quality estimate for translated content on the page.
  - Google: "An encoding of the Chard XLQ prediction on translated content in [0,1]."
- `encodedChardXlqYmylPrediction` (supporting) A packed low-quality estimate for pages about money or health topics.
  - Google: "An encoding of the Chard XLQ-YMYL prediction in [0,1]."
- `encodedDaftScore` (supporting) A packed score for how much the document is about a fringe topic.
  - Google: "An encoding of the Document About Fringe Topic (daft) score in [0, 1]."
- `encodedDocumentFringeVulnerability` (supporting) A packed estimate of how likely this page is to surface fringe content.
  - Google: "An estimate of the vulnerability of this doc to show fringe content, based on the context around the document. Can be interpreted as a 'safe' QScore threshold to use (see go/doc-fringe-vulnerability for more info). Encoded for compactness and to restrict visibility. Please contact fringe-ranking@..."
- `encodedPredictedXlqScoreAndConfidence` (supporting) A packed predicted lowest-quality rating for the page plus its confidence.
  - Google: "A combined encoding of the pXLQ score in [0,1] and the confidence with which that score should be interpreted in [0,1]."
- `encodedProximityScore` (supporting) How similar the page is to known fringe-prone example pages.
  - Google: "A score in [0, 1] representing the similarity of this doc to known fringe-vulnerable 'seeds'. See go/fringe-proximity for more information. Encoded for compactness and to restrict visibility."
- `encodedPseudoraterPxlqScore` (supporting) An automated rater's low-quality severity score for the page.
  - Google: "An encoding of the XLQ pseudorater severity score translated into pXLQ score space in [0,1]. The encoding includes the pseudorater version and confidence."

### QualityShoppingShoppingAttachment

- `datasetModelArticleScore` (supporting) A classifier score for how much the page looks like an article.
  - Google: "Score from the blockbert article classifier model. go/article-understanding-project"
- `datasetModelForumListScore` (supporting) A classifier score for how much the page looks like a forum or Q and A page.
  - Google: "From forum and qna confidence score * 100,"
- `datasetModelMultiProductScore` (supporting) A classifier score for how much the page looks like a multi-product page.
  - Google: "From indexing.ml.PageType.confidence * 100 (DatasetModelAnnotation in cdoc) go/sdu-shopping-page-intro"
- `expiredShoppingPageScore` (supporting) A score for how likely the shopping page is out of date or expired.
  - Google: "From indexing.badpages.CollapserInfo.expired_shopping_page_score * 100"
- `shoppingSiteScore` (supporting) A classifier score for how much the site looks like a shopping site.
  - Google: "From ShoppingSiteClassifier.score * 100"
- `shoppingSiteScoreShopfab` (supporting) A second shopping-site classifier score for the site.
  - Google: "From ShoppingSiteClassifierShopfab.score * 100"

### QualityRankembedMustangMustangRankEmbedInfo

- `additionalFixedPointEncodings` (supporting) Extra encoded copies of the document's ranking embedding.
  - Google: "Each of the repeated elements in this field has the same scheme as 'fixed_point_encoding'; See go/rankembed-astro-rule-set-dd"
- `compressedDocumentEmbedding` (supporting) The document's ranking embedding stored in compressed form.
  - Google: "Each uint64 encodes 8 8-bit values for the quantized document embedding"
- `fixedPointEncoding` (supporting) The document's ranking embedding packed into one encoded string.
  - Google: "This field replaces the above 3 &quot;per-encoding-type-fields&quot;, where the encoding type (and the embedding type) are part of the encoding, and is stored in the first byte. The remaining bytes are the same as the previous 3 fields, but shifted by 1 byte. - byte[0]: encoding type & embedding..."
- `scaledFixedPoint4Encoding` (supporting) A four-bit-per-value encoded copy of the document's ranking embedding.
  - Google: "byte[0]: version - bytes[1...4]: scalar - bytes[5,...]: the values, one byte per 2 values"
- `scaledFixedPoint8Encoding` (supporting) An eight-bit-per-value encoded copy of the document's ranking embedding.
  - Google: "byte[0]: version - bytes[1...4]: scalar - bytes[5,...]: the values, one byte per value"
- `scaledShiftedFixedPoint4Encoding` (supporting) A shifted and scaled compact encoding of the document's ranking embedding.
  - Google: "byte[0]: version - bytes[1...4]: scalar - bytes[5...8]: shift - bytes[9,...]: the values, one byte per 2 values"

### QualitySalientTermsDocData

- `confidence` (supporting) How much data was available when the document's important terms were computed.
  - Google: "confidence is a measurement of how much data we had to compute the SalientTermSet. Range: [0.0, 1.0]"
- `headVolumeRatio` (supporting) The share of all term occurrences taken by the document's top terms.
  - Google: "head_volume_ratio is the ratio of the sum of term frequency of the top K terms over the volume of all terms. Range: [0.0, 1.0]. K is defined by Accumulator2Params::head_size."
- `language` (supporting) The main language of the document's important-terms set.
  - Google: "language is the main language of this SalientTermSet."
- `signalData` (supporting) Per-source details, such as body text, anchors and clicks, behind the term set.
  - Google: "signal_data contains signal-specific (e.g., body, anchors, clicks) data for this SalientTermSet."
- `virtualVolume` (supporting) A measure of how much term data was available for the document.
  - Google: "virtual_volume is a measurement of how much data we had to compute the SalientTermSet. Range: [0.0, +infinity)]."

### ReneEmbedding

- `clusterList` (supporting) Grouping information about the parts of this embedding.
  - Google: "Token information of the embedding vector if available."
- `compressedValue` (supporting) The embedding stored in a compressed form.
  - Google: "Compressed value of the embedding. For example, different versions of starburst signals use different compressor to generate the value."
- `denseFeatureFloatValues` (supporting) Extra feature numbers some models output alongside the embedding.
  - Google: "Optional feature map output from the model. Note: this is not applicable to some models."
- `floatValues` (supporting) The numbers that make up the embedding vector.
  - Google: "Values of the embedding vector."
- `floatValuesBeforeProjection` (supporting) The embedding numbers before they were shrunk to fewer dimensions.
  - Google: "Optional embedding vector prior to projection. Note: this is not applicable to some models."

### QualitySalientTermsSalientTerm

- `label` (supporting) The term itself, either normalized or as originally written.
  - Google: "label can be two things depending on where this message is. When right under a SalientTermSet, it is the normalized term returned by quality_salient_terms::utils::NormalizeTerm() from salient_terms_utils.h. When under another SalientTerm message, it is the original term as found in a signal (see..."
- `originalTerm` (supporting) The different spellings under which this term was found on the page.
  - Google: "original_term are the different ways we found this normalized term in the signals. They are in increasing idf order (the most common version first). An empty string means that this original term is the same as the label field in the parent SalientTerm message. NOTE: Please do not access this field..."
- `salience` (supporting) How important a term is as a descriptor of the document, from zero to one.
  - Google: "salience is the importance of the term as a descriptor in [0, 1] (the higher the more important). This field takes precedence over weight field below. NOTE: Please do not access this field directly. Use quality_salient_terms::utils::GetSalience() from salient_terms_utils.h instead."
- `signalTerm` (supporting) Per-source detail for this term, such as body text, anchors or clicks.
  - Google: "signal_term contains extra signal-specific (e.g., body, anchors, clicks) data for this term."

### DocProperties

- `avgTermWeight` (supporting) The average weighted font size of words in the page body.
  - Google: "The average weighted font size of a term in the doc body"
- `badTitle` (supporting) A flag that the page's title is missing or meaningless.
  - Google: "Missing or meaningless title"
- `numTokens` (supporting) An approximate count of words, tags and punctuation in the page.
  - Google: "The number of tokens, tags and punctuations in the tokenized contents. This is an approximation of the number of tokens, tags and punctuations we end up with in mustang, but is inexact since we drop some tokens in mustang and also truncate docs at a max cap."
- `title` (supporting) The page title taken from the title tag.
  - Google: "Extracted from the title tag of the content. This is typically extracted by TitleMetaCollector defined at google3/segindexer/title-meta-collector.h. Please see its documentation for the format and other caveats."

### QualityNsrPQDataSubchunkData

- `confidence` (supporting) How confident the system is in this topic group's numbers.
  - Google: "Confidence associated with the chunk."
- `deltaNsr` (supporting) How much this topic group shifts the site quality score.
  - Google: "Subchunk delta in nsr."
- `pageWeight` (supporting) How strongly this page belongs to the topic group.
  - Google: "Weight with which this document belong to this subchunk (greater than 0)."
- `type` (supporting) Which topic group this chunk represents, such as health.
  - Google: "Type of this chunk. Eg, ymyl_health, d2v, etc."

### CompositeDoc

- `badSslCertificate` (supporting) Present when the page or its redirects have a bad security certificate.
  - Google: "This field is present iff the page has a bad SSL certificate itself or in its redirect chain."
- `labelData` (supporting) Labels attached to the document, each with a confidence value.
  - Google: "This field associates a document to particular labels and assigns confidence values to them."
- `richcontentData` (supporting) A record that parts of the page's content were inserted, removed, or replaced.
  - Google: "If present, indicates that some content was inserted, deleted, or replaced in the document's content (in CompositeDoc::doc::Content::Representation), and stores information about what was inserted, deleted, or replaced."

### BookCitationPerDocData

- `discretizedCitationScore` (supporting) A bucketed score for how strongly the page cites its main book.
  - Google: "the discretized citation score for the main book. we map the raw score 1.0-20.0 to 0 - 127"
- `previewable` (supporting) Whether the page shows a preview or excerpt of the book.
  - Google: "Is there a preview or excerpt of the book on this document?"
- `secondDiscretizedCitationScore` (supporting) A bucketed score for the page's second book citation.
  - Google: "the discretized score for the second citation"

### ContentAttributions

- `freshdocsOutgoing` (supporting) Content the page credits to other sources, found on the fresh document path.
  - Google: "Selected outgoing attributions extracted on FreshDocs."
- `offlineOutgoing` (supporting) Content the page credits to other sources, found by offline batch jobs.
  - Google: "Selected outgoing attributions extracted via offline MR jobs."
- `onlineOutgoing` (supporting) Content the page credits to other sources, found during online indexing.
  - Google: "Selected outgoing attributions extracted online on Alexandria."

### IndexingMobileVoltCoreWebVitals

- `cls` (supporting) The page's Cumulative Layout Shift score, a measure of visual stability while loading.
  - Google: "Cumulative Layout Shift."
- `fid` (supporting) The page's First Input Delay, how long it takes to react to a first user interaction.
  - Google: "First Input Delay."
- `lcp` (supporting) The page's Largest Contentful Paint time, how long the main content takes to appear.
  - Google: "Largest Contentful Paint."

### ResearchScienceSearchSourceUrlDocjoinInfo

- `petacatInfo` (supporting) Topic classifications assigned to the web page by the Petacat classifier.
  - Google: "Petacat classifications for the web document. Normally the results from calling Petacat come in a PetacatResponse, which is very flexible and extensible. This proto takes most of the flexibility away - only rephil clusters, taxonomic classifications, and binary classifications, with discretized..."
- `scholarInfo` (supporting) Scholar-derived per-page data passed into web search.
  - Google: "Science per-doc data for inclusion in websearch."
- `title` (supporting) The title of the document.
  - Google: "The title of the document."

### RepositoryWebrefDocumentMetadata

- `salientTerms` (supporting) The important terms of the page, copied in when a flag is on.
  - Google: "The salient terms for this document. Only set if --webref_doc_metadata_copy_salient_terms is true. Same motivation as the title field above."
- `title` (supporting) The page title, copied in when a flag is on.
  - Google: "The title of the document. Only set if --webref_doc_metadata_set_title is true. The idea is that we can use this to more easily learn things like: title contains &quot;restaurants&quot; -> more likely to be a list page."

### SmartphonePerDocData

- `isSmartphoneOptimized` (supporting) Whether the page displays properly on smartphones.
  - Google: "Indicates if the page is rendered in a friendly manner on smartphones. We use this field as tri-state: &quot;unset&quot; means the rendering result classification is not available, and &quot;set as false&quot; means that the page is rendered in unfriendly manner on smartphones. See also..."
- `maximumFlashRatio` (supporting) How much of the rendered area the largest Flash object takes up.
  - Google: "The ratio of the area of the largest Flash to the render area."

### BlogPerDocData

- `numMentions` (supporting) How many at-mentions of other users appear in the post.
  - Google: "For replies/reshares. num_mentions = number of times the pattern @foo appears in the document."
- `userQualityScore` (supporting) Quality scores for the author and for the short post itself.
  - Google: "User and doc quality scores for updates (aka microposts)."

### ShingleInfoPerDocData

- `numShingles` (supporting) How many text fingerprints the document contains.
  - Google: "Total number of shingles in the document."
- `source` (supporting) The list of other sources the document's text fingerprints came from.
  - Google: "A list of all sources."

### QualityTimebasedPageType

- `isForumPage` (supporting) Whether the page was classified as a forum page.
  - Google: "Set to true if this page is classified as a forum page."
- `isQnaPage` (supporting) Whether the page was classified as a question-and-answer page.
  - Google: "Set to true if this page is classified as a question answers page."

### QualitySalientTermsSalientTermSet

- `docData` (supporting) Document-level details attached to the set of important terms.
  - Google: "doc_data contain additional salient-term-set-level data."
- `salientTerm` (supporting) The list of terms that best describe the document, most important first.
  - Google: "salient_term is the list of terms that are good descriptors, sorted in decreasing order of weight."

### QualitySalientTermsSignalData

- `confidence` (supporting) How much this source of term data is trusted, from zero to one.
  - Google: "The measurement of how much we trust this signal. Range: [0.0, 1.0] This field is available is both debug and non-debug mode."
- `source` (supporting) Which source the term data came from, such as body text, anchors or clicks.
  - Google: "source is the type of the signal of this SignalData."

### QualityProductProductSiteDataLocaleData

- `boostFactor` (**core**) A multiplier used to boost a shopping site.
  - Google: "Site boosting multiplier."
- `gobiSite` (supporting) Marks a site as one from a shopping domain eligible for boosting on category queries.
  - Google: "Whether this is a gobi site, ie, a site from a gobi domain that should be boosted for a category query with this gobi domain. For example, amazon.com is a gobi store domain for category query [hdtv] but some sites (like askville.amazon.com) from amazon.com should not be boosted."

### FatcatCompactBinaryClassification

- `binaryClassifier` (supporting) Which yes or no classifier produced this label for the page or site.
  - Google: "Either binary_classifier will be set, using the enum above, or binary_classifier_name will be set, if it is not one of the classifiers in the enum - never both."
- `discreteFraction` (supporting) For a site label, what share of the site the label applies to.
  - Google: "A CompactDocClassification will not usually have a weight. For a CompactSiteClassification, this value will be 0...127 corresponding to 0.0...1.0, indicating fraction of the site that this label applies to"

### FatcatCompactTaxonomicClassificationCategory

- `discreteWeight` (supporting) How strongly this topic category applies, on a 0 to 127 scale.
  - Google: "go/petacat-faq#how-should-i-interpret-classification-weights Discrete to reduce size. Range is [0,127], corresponding to [0.0,1.0]."
- `id` (supporting) The numeric id of the topic category assigned, such as Sports.
  - Google: "The category's ID, e.g. 20 for /Sports in the go/verticals4 taxonomy."

### PairwiseQVersionedItem

- `confidenceValue` (supporting) How confident the stored PairwiseQ score is for this version.
  - Google: "The PairwiseQ confidence value corresponding to this version."
- `value` (supporting) A stored PairwiseQ score value for a given version.
  - Google: "The PairwiseQ value corresponding to this version."

### QualityNsrKetoKetoVersionedData

- `siteFrac` (supporting) What share of the site's pages went into computing the site score.
  - Google: "What fraction of the site went into the computation of the site_score. Should be a number in (0, 1]."
- `siteScore` (supporting) A site-wide aggregated keto quality score.
  - Google: "Site-level aggregated keto score."

### VideoContentSearchVideoInfo

- `nsr` (supporting) The stored site quality score for the page hosting the video.
  - Google: "NSR for the video page document."
- `salientTermSet` (supporting) The set of terms judged most important on the page.
  - Google: "Salient term set from the document. This message contains a lot of data and dependencies, so sub-messages are disabled in model evaluation in scorer."

### QualityTravelGoodSitesData

- `totalScore` (supporting) A quality score for the site that decides which site type it is.
  - Google: "Site quality score, which determines the site type."

### QualityShoppingShoppingAttachmentProduct

- `relevanceEmbedding` (supporting) A relevance embedding carried over from the product annotation.
  - Google: "Relevance embedding from ShoppingAnnotation.Product"

### FatcatCompactRephilClustersCluster

- `discreteWeight` (supporting) How strongly a semantic topic cluster applies to the page, on a 0 to 127 scale.
  - Google: "0...127 corresponds to 0.0 - 1.0"

### IndexingMobileInterstitialsProtoDesktopInterstitialsDetails

- `isSmearedSignal` (supporting) Flag saying the interstitial signal was estimated from other URLs rather than measured on this page.
  - Google: "Indicates whether the signal value is &quot;smeared&quot;, e.g. extrapolated from other URLs."

### IndexingMobileInterstitialsProtoInterstitialBasicInfo

- `absoluteBox` (supporting) The on-page position and size of a detected interstitial overlay, in page pixels.
  - Google: "Stores the geometry of detected interstitial in absolute page pixels."

### NSRVersionedItem

- `value` (supporting) A site quality (NSR) value stored for one particular version of that measure.
  - Google: "The NSR value corresponding to this version."

### NlpSaftDocument

- `title` (supporting) The title of the document.
  - Google: "Optional document title."

### QualityNsrNSRVersionedData

- `value` (supporting) The site quality (NSR) value for one version.
  - Google: "The corresponding NSR value."

### QualityRankembedMustangMustangRankEmbedInfoCompressedEmbedding

- `packedValue` (supporting) The embedding numbers packed together to save storage space.
  - Google: "using fixed64 instead of uint64 saves ~14% is storage"

### QualitySalientTermsSignalTermData

- `source` (supporting) Which source this term data came from.
  - Google: "source is the type of the signal of this SignalTermData."

### ReneEmbeddingCluster

- `squaredDistance` (supporting) How far this embedding sits from the center of its cluster.
  - Google: "Squared distance of the current embedding to the cluster center."

### ReneEmbeddingClusterList

- `clusters` (supporting) The list of clusters this embedding falls into.
  - Google: "Clusters."

### ResearchScienceSearchReconciledMetadata

- `topSalientTermLabel` (supporting) The most prominent terms describing what the page body is about.
  - Google: "Top salient term labels that describe the dataset document body."

### ScienceIndexSignal

- `VisiblePrefixTerms` (supporting) An estimate of how much of the document most readers actually get to see.
  - Google: "Length of document prefix that most users are likely to see. Only filled in when we index subscription fulltext but most users see abstracts. This is a conservative guesstimate - e.g., ACM shows fulltext to university/company subscribers (including Google employees) based on user's IP address, but..."

### ShingleSource

- `numShingles` (supporting) How many of the document's text fingerprints came from this source.
  - Google: "Number of shingles originating from this source."

### TeragoogleDocumentInfo

- `averageTermWeight` (supporting) Average weight of the terms in the document, used to scale term weighting.
  - Google: "The average weight of terms in the document. If not available, there will be no term weight averaging: font sizes will be taken literally from the document HTML."

### WWWDocInfo

- `qualityWithoutAdjustment` (**core**) The document's quality score before adjustments.
  - Google: "Quality score (also known as QScore, see go/qscore-faq)."


## entity_author (137)

### RepositoryWebrefDetailedEntityScores

- `connectedness` (supporting) How strongly an entity is related to the other entities on the page, which partly shapes topicality.
  - Google: "Represents how much the entity is connected/related to the other entities in the document. This signal partially influences the topicality score, but it is not totally aligned with it: an entity can be very related to the rest of the document, but not central for understanding it. Likewise, an..."
- `docScore` (supporting) How well a page scores for an entity, used to compare pages for that entity.
  - Google: "How well the document scores for the entity. The score is unnormalized, and serves as a relative ranking signal between different documents for an entity."
- `isAuthor` (supporting) Whether this entity is the author of the page.
  - Google: "True if the entity is the author of the document. This was mainly developed and tuned for news articles (e.g. /m/02x27qn on &quot;www.vogue.com/article/flint-town-netflix&quot;) but is also popluated for other content (e.g. scientific articles). Important: the semantics of this field may change in..."
- `isPublisher` (supporting) Whether this entity is the publisher of the page.
  - Google: "True if the entity is the publisher of the page (e.g. CNN on &quot;"
- `isReferencePage` (supporting) Whether the page's full address matches the entity, making it a reference page.
  - Google: "Set to true iff the entity matches the full URL of the document, meaning that it is a reference page or related page of the entity."
- `normalizedTopicality` (supporting) The share of the page's overall topic that this entity accounts for.
  - Google: "Representation of the topicality score that is normalized in [0, 1] and which sum over all entities in the document is 1. It represents the &quot;proportion&quot; of the document that talks about the entity. This score is less human interpretable as the bucketized topicality score..."
- `profileUrl` (supporting) A link to the author's profile page on the site.
  - Google: "Contains the link to the author's profile url on the platform."
- `relevanceScore` (supporting) A machine-learned score for how relevant the entity is to the page.
  - Google: "Relevance score generated by a Machine Learning entity classifier. This signal is similar to topicality, but machine learning based and supported by EntitySignals, not Webref. See"

### RepositoryWebrefWebrefMustangAttachment

- `categoryConfidenceE2` (supporting) How confident the system is in a category assigned to the page, from 0 to 100.
  - Google: "The confidence of the category. In the range [0, 100]."
- `categoryEncodedMid` (supporting) Category entity IDs attached to the page.
  - Google: "See go/category-annotations-api about the story behind various types of category annotations that are provided using the catmid token and category_encoded_mid fields below. Some of these annotation types are experimental, so please contact related-entities@ if you consider using this data. For..."
- `confidenceE2` (supporting) Confidence scores for each entity found on the page.
  - Google: "The confidence scores of all entities in the encoded_mid array. For space reasons this is also represented as a fixed-point integer with two decimal precision. Convert it to confidence_score using the following formula: float confidence_score = confidence_e2 / 100.0f Should have the same number of..."
- `encodedMid` (supporting) The entities found on the page, listed in order of how central they are.
  - Google: "The int64-encoded MIDs of the entities in the document sorted by topicality score. To convert it to the string form use metaweb::MidToString(encoded_mid) defined in metaweb/util/mid/mid.h Should have the same number of elements as the topicality_e2 field."
- `isAuthorIndex` (supporting) Which of the page's entities are its authors.
  - Google: "The indices of all the reference entities in encoded_mid that are authors of the page. Not packed as in most cases when populated, it contains 1 element."
- `isPublisherIndex` (supporting) Which of the page's entities are its publishers.
  - Google: "The indices of all the reference entities in encoded_mid that are publishers of the page (e.g. /m/cnn on &quot;"
- `referencePageIndex` (supporting) Marks the page as the main reference page for one or more entities.
  - Google: "Only populated when the document is a reference page for an entity. Contains the indices of all reference entities in the encoded_mid and topicality_e2 arrays. Not packed as in most cases when populated, it contains 1 element."
- `topicalityE2` (supporting) How central each entity is to the page, scored 0 to 100.
  - Google: "The topicality scores of all entities in the encoded_mid array. For space reasons this is represented as a fixed-point integer with two decimal points precision. Convert it to topicality_score using the following formula: float topicality_score = topicality_e2 / 100.f Should have the same number of..."

### RepositoryWebrefEntityNameScore

- `confidence` (supporting) How sure the system is that this name really refers to the entity.
  - Google: "Confidence that this name is a trusted name of the entity. A reasonable threshold for name trust is 0.6. A name can be trusted and still have very low score_ratio, esp. if it is ambiguous (e.g. 'mercury') and/or not the dominant interpretation (e.g. &quot;siberian husky&quot; -> /m/06krnsr (a..."
- `extendedScoreRatio` (supporting) Name scores for particular regions where they differ from the language-wide score.
  - Google: "Stores region specific score ratios for the entity when it is significantly different from the language version above."
- `nameMetadata` (supporting) Combined details about a name gathered from the various name sources.
  - Google: "Metadata about this name aggregated from name signals."
- `rangeMetadata` (supporting) Details about the stretch of text that this entity was matched to.
  - Google: "Metadata of segment range, which is annotated by this entity."
- `score` (supporting) The overall score for this entity as a meaning of the name.
  - Google: "The absolute score of that entity. score = artificial_score + volume_based_score"
- `scoreRatio` (supporting) This entity's share of the total score across all entities sharing the name.
  - Google: "Ratio between this entity score and the total score over all entities. This is including the &quot;open world&quot; information if it was estimated."
- `volumeBasedScore` (supporting) The part of a name score that comes from counted sources such as clicks and anchors.
  - Google: "Absolute score that comes from quantitative sources such as navboost clicks, anchors, etc. artificial_score = score - volume_based_score"

### RepositoryWebrefNameScores

- `completeWorldVolume` (supporting) An estimate of how much total usage a name has, including unknown entities.
  - Google: "Approximates volume of this name including entities we don't have in our set. This is useful to estimate the size of the &quot;open world&quot;. For example, this field can be equal to the total number of clicks for the query. Note that for now, we ignore the number of clicks but just use the idf..."
- `contextFringeScore` (supporting) How obscure a full query context name is, on a zero to one scale.
  - Google: "The fringe score in [0, 1] for this context name. This is only populated for full-query context names."
- `contextWeight` (supporting) How much evidence exists for this context name.
  - Google: "The amount of evidence available for this context name."
- `idfScore` (supporting) How rare this name is across the corpus.
  - Google: "The idf of this name."
- `openWorldVolumeModifier` (supporting) An adjustment added to the estimated open world usage of a name.
  - Google: "'Raw' open world is computed based on ngram count data. For some names however, we modify the open world based on entities associated with them. This field contains the additive open world modifier. open_world_volume = raw open world + open_world_volume_modifier"
- `totalScore` (supporting) The overall amount of data backing this name from a source.
  - Google: "The total score of that name/source. It describes how much data we have for that name/source. It can for example be the sum of all the entity scores for this name."

### RepositoryWebrefEntityAnnotations

- `confidenceScore` (supporting) Overall confidence that the entity really is mentioned in the page or query.
  - Google: "The overall confidence that the entity is annotated somewhere in the document or query. For WebRef it is computed as a function of the mention confidences weighted by the importance of each mention, where for documents a mention is of greater importance if it occurs in the title, h1 or anchors. For..."
- `detailedEntityScores` (supporting) Extra detail on how the entity relates to the page, such as being its publisher.
  - Google: "Additional information about how the entity relates to the page, for example whether it is a business entity which published the page."
- `isImplicit` (supporting) Whether the entity is only implied, with no plain mention in the page text.
  - Google: "An entity is marked as implicit if there is no explicit mention of the entity in the content of the page. For instance, all mentions of the entity are in query, url and/or anchors; or the entity has only implicit content mentions."
- `segmentMentions` (supporting) All mentions of the entity, grouped by where they occur such as title or anchors.
  - Google: "All mentions of a given concept grouped by segments. For Webref, there are many different kinds of segment, such as content, title and anchors; while for QRef, there is only one segment called CONTENT. For QRef this field contains the primary output of the annotator, and for WebRef it together with..."
- `topicalityRank` (supporting) The entity's place in the list when entities are sorted by topicality.
  - Google: "Rank of the entity when sorted by topicality score."
- `topicalityScore` (supporting) How closely the entity matches the overall topic of the page.
  - Google: "The WebRef topicality score of the entity for this document. This score indicates how related is the entity to the overall topic of the document. See"

### RepositoryWebrefEntityJoin

- `contextNameInfo` (supporting) Scored names related to the entity that are not used to find mentions.
  - Google: "The context names (with scores) of this entity. The difference to regular names (aka name_info) is that context names are not used for finding mentions in a document as they consist of names somehow related to the entity (e.g. name &quot;fisherman s wharf&quot; for the entity &quot;Gary..."
- `extraData` (supporting) Extra metadata about the entity gathered from its sources.
  - Google: "Additional metadata about the entity, that can be derived from the &quot;raw data&quot; (composite doc, domain specific data...), or come from other sources. Despite its name, this field often contains quite important information."
- `linkInfo` (supporting) All scored relationships this entity has to other entities.
  - Google: "Contains all links (with scores) that Webref knows for this entity. Links are relationships between entities. The data in this field is very important for the quality of the model."
- `nameInfo` (supporting) All scored names known for this entity.
  - Google: "Contains all names (with scores) that Webref knows for this entity. The data in this field is very important for the quality of the model."
- `refconNameInfo` (supporting) Names and name details used by the entity reconciliation system.
  - Google: "Contains names and names metadata used by Refcon."

### RepositoryWebrefReferencePageScores

- `bookScore` (supporting) A score for whether the page is a good book reference page.
  - Google: "Stores score for later offline voting to choose reference pages. If zero, it's not a good book reference page."
- `referencePageScore` (supporting) A score used to pick which page is the reference page for an entity.
  - Google: "Reference page score used to select the reference page owner."
- `selected` (supporting) Whether this entity was chosen as the owner of the reference page.
  - Google: "True if the entity is selected as the reference page owner."
- `singleTopicness` (supporting) Score from 0 to 1 saying how much the page is about just this one entity.
  - Google: "A score in [0, 1] which indicates the single topicness of the entity."
- `singleTopicnessV2` (supporting) Newer version of the single-topicness score meant to replace the old one.
  - Google: "This should have the same semantic as single_topicness, and should replace it in the long term."

### NlpSaftEntity

- `mention` (supporting) The places in the document where this entity is mentioned.
  - Google: "Mentions of the entity in the document."
- `name` (supporting) The main name used for this entity.
  - Google: "Representative entity name."
- `profile` (supporting) The knowledge profile attached to this entity.
  - Google: "Profile for entity."
- `salience` (supporting) How central this entity is to what the document is about.
  - Google: "Score indicating the saliency (centrality) of this entity to the document."
- `type` (supporting) The categories this entity belongs to, such as person, place or TV personality.
  - Google: "Entity types of the entity. These can include SAFT types (/saft/location, /saft/art, /saft/other/living_thing, etc), collections types (/collection/tv_personalities, /collection/statistical_regions, etc), and more. This refers to the type of the entity itself: in &quot;She is on TV&quot;,..."

### PerDocData

- `knexAnnotation` (supporting) Stored k'nex annotations attached to fresh documents.
  - Google: "For indexing k'nex annotations for FreshDocs."
- `queriesForWhichOfficial` (supporting) The query, country and language combinations for which this page counts as the official page.
  - Google: "The set of (query, country, language) triples for which this document is considered to be the official page. For example, www.britneyspears.com would be official for (&quot;britney spears&quot;, &quot;us&quot;, 0) and others (0 is English)."
- `v2KnexAnnotation` (supporting) Stored second-generation k'nex annotations for the document.
  - Google: "For indexing v2 k'nex, see/go/knex-v2-doc-annotation for details."
- `webrefEntities` (supporting) The WebRef entities that the document is about.
  - Google: "WebRef entities associated to the document. See go/webref for details."

### RepositoryWebrefNameInfo

- `aggregatedScores` (supporting) The combined score for a name across all its sources.
  - Google: "The score aggregated from all sources."
- `ngramData` (supporting) Word frequency data for the name, such as how rare it is.
  - Google: "N-gram data (e.g. n-gram IDF)."
- `scores` (supporting) Scores that depend on the name alone, independent of any entity.
  - Google: "The name-specific scores. These scores only depend on the name and are independent of the entity."
- `source` (supporting) The name's score broken down by each source.
  - Google: "The per-source scores."

### NlpSaftDocument

- `annotatedPhrase` (supporting) Phrases marked up in the text that are not clean references to a known entity.
  - Google: "Annotated phrases in the document that are not semantically well-defined mentions of entities."
- `author` (supporting) The name or names of the people credited as authors of the document.
  - Google: "Document author(s)."
- `entity` (supporting) The list of entities that were recognised in the document text.
  - Google: "Entities in the document."
- `focusEntity` (supporting) The single entity that the page is mainly about, such as a Wikipedia subject.
  - Google: "Focus entity. For lexicon articles, like Wikipedia pages, a document is often about a certain entity. This is the local entity id of the focus entity for the document."

### RepositoryWebrefExtraMetadata

- `categoryInfo` (supporting) The category types that apply to an entity.
  - Google: "Information about category types of the entity."
- `entityScores` (supporting) Extra numeric scores attached to the entity.
  - Google: "Additional scores for the entity."
- `equivalentEntityId` (supporting) Other ids meaning the same real-world thing, so query and page mentions can match.
  - Google: "An entity in KG that represents the same (or equivalent) entity in the real world. In particular, this is used for mid-forwarding: when de-duping entities in KG, the old ids represent the exact same entity as the one they were merged with. So when we see one id in the query and the other in a..."
- `latentEntities` (supporting) Other entities strongly implied by this one, such as a player's club.
  - Google: "A list of entities that are latent given this entity. For example, &quot;Lionel Messi&quot; can have the latent entity &quot;FC Barcelona&quot;. The latent entity links are materialized in an offline pipeline using r/w/scripts/latent_entities/latent-entities.pq. For more information, see..."

### RepositoryWebrefMention

- `confidenceScore` (supporting) How sure the annotator is that this exact stretch of text refers to that entity.
  - Google: "A probabilistic score describing how certain the annotator is that this exact range in the document or query refers to the entity. Probability that a mention is correct corresponds to confidence score roughly as follows: 0.3 -> 75% 0.5 -> 87% 0.7 -> 89% 0.9 -> 94% 1.0 -> 98% However if you consider..."
- `detailedMentionScores` (supporting) A breakdown of additional scores for an entity mention.
  - Google: "Additional detailed scores about this mention."
- `priorProbability` (supporting) How likely the mention's wording refers to that entity before context is considered.
  - Google: "The prior probability of the entity for this mention."
- `trustedNameConfidence` (supporting) How confident the system is that this wording is a trusted name for the entity.
  - Google: "Confidence that this name is a trusted name of the entity. This is set only in case the confidence is higher than an internal threshold (see ConceptProbability)."

### RepositoryWebrefWebrefEntity

- `annotatedRelationship` (supporting) Links recorded between entities annotated on the same page.
  - Google: "Information about links (e.g. implications) between the annotated entities."
- `annotations` (supporting) All the markings of this entity found on the page.
  - Google: "All annotations of this entity on the given document."
- `collections` (supporting) The knowledge graph type groups this entity belongs to.
  - Google: "Information about the collections of this entity."

### RepositoryWebrefCategoryInfo

- `allTypes` (supporting) All entity types with their sources and confidences, used by entity scoring.
  - Google: "Contains all types relevant for this entity, along with their provenances and confidences. This field basically replicates information above in a unified way, so that Refcon scroing can make better use of it. If present, Refcon scoring will use all_types, and ignore other fields like freebase_type...."
- `salientCategory` (supporting) Topic categories that often appear together with this entity across documents.
  - Google: "verticals4 categories that cooccur with this entity, aggregated over D2E. See where we read from CompactDocClassification in"
- `wpCategory` (supporting) Category classification taken from Wikipedia categories.
  - Google: "WPCat CategotyResult classification."

### QualitySherlockKnexAnnotationItem

- `calibratedScore` (supporting) A calibrated zero-to-one score for an entity annotation on the document.
  - Google: "in [0, 1]."
- `equivalentMid` (supporting) The knowledge-graph identifier of an equivalent entity.
  - Google: "in /m/ or /g/."
- `score` (supporting) A zero-to-one score for an entity annotation on the document.
  - Google: "in [0, 1]."

### RepositoryWebrefWebrefEntities

- `category` (supporting) Topic categories assigned to the page or query.
  - Google: "Categories of the document or query. This replaces the category_score found under EntityAnnotations."
- `entity` (supporting) The entities found on the page with their confidence and topicality scores.
  - Google: "The annotated entities, with associated confidence scores and metadata. This is the primary output of WebRef/QRef. In case of Webref output, entities are sorted by decreasing topicality score."

### RepositoryWebrefEntityScores

- `commonNgramProb` (supporting) How likely the entity's name is just a common word or phrase.
  - Google: "Probability that the entity is a common ngram (e.g. from dictionary)."
- `entityIdf` (supporting) How rare an entity is across documents.
  - Google: "The final (model omega) idf of an entity. Equals log2(1 / probability of the entity to appear in a document). This probability is currently estimated from its names (i.e. it is a sum of the name frequency weighted by P(entity | name))."

### RepositoryWebrefLinkInfo

- `aggregatedScore` (supporting) The combined score for an entity to entity link across all its sources.
  - Google: "The score aggregated from all sources."
- `source` (supporting) The link's score broken down by each source that supplied it.
  - Google: "The per-source scores."

### RepositoryWebrefFreebaseType

- `score` (supporting) An optional score for how well a type fits the entity.
  - Google: "Optional score. Not present in KG directly but e.g. in WPCat."
- `typeName` (supporting) The readable name of an entity type, such as a person or a business industry.
  - Google: "e.g.: &quot;/business/industry&quot;, &quot;/book/book_subject&quot;, &quot;/people/person&quot;... HRID of the type. May be missing for optimisation reasons in Refcon, but is present for Qref/Webref. At least one of type_name or type_fprint will be present at all times"

### ImageDataMultibangEntitiesMultibangEntity

- `entityId` (supporting) The identifier of a real-world thing the image is linked to.
  - Google: "Entity ID."
- `score` (supporting) How strongly the image is tied to that real-world thing.
  - Google: "Multibang score."

### ImageQualitySensitiveMediaOrPeopleEntities

- `mediaEntitiesId` (supporting) Identifiers of media things such as films or bands linked to the document.
  - Google: "Similar to above, but for media entities (movie name, fictional character, musical band)"
- `peopleEntitiesId` (supporting) Identifiers of the five people the document is most about.
  - Google: "hrid of the 5 people entities with higher topicality in the document"

### NlpSaftDocumentTopic

- `name` (supporting) The name of a topic assigned to the document.
  - Google: "Topic name or identifier."
- `score` (supporting) How strongly the document matches an assigned topic.
  - Google: "Topic score."

### NlpSaftEntityType

- `name` (supporting) The name of the category an entity belongs to, such as person or place.
  - Google: "The type name, like &quot;/saft/person&quot;. See README.entity-types for the inventory of SAFT type tags."
- `score` (supporting) How confident the system is that an entity belongs to this category.
  - Google: "A score for this type."

### RepositoryWebrefCategoryAnnotationHitCatSource

- `confidence` (supporting) How confident the system is that a category describes the page.
  - Google: "Confidence of the category in the range [0.0, 1.0). If a page has the category &quot;NBA&quot; with high confidence we also expect it to have the &quot;Basketball&quot; with high confidence. Categories with a confidence lower than 0.05 are omitted. This can be interpreted as a confidence of 0, i.e...."
- `cumulativeConfidence` (supporting) A calibrated confidence for the category aimed at a target precision.
  - Google: "Calibrated cumulative confidence guaranteeing maxmial recall for a precision target. E.g., At least 90% of documents retrieved with cumulative_confidence >= 0.9 will be relevant. This score is always calibrated per-category to estimate the true cumulative precision and is not set for uncalibrated..."

### RepositoryWebrefFatcatCategory

- `id` (supporting) The identifier of a topic category from the vertical classification system.
  - Google: "The category ID from verticals4. See go/verticals4 and where we read them in"
- `score` (supporting) How heavily this category weighs among the categories assigned.
  - Google: "The relative weight of the category within a distribution."

### RepositoryWebrefMdvcMetadataPerVertical

- `expandedOutputIds` (supporting) Extra concept ids that get annotated whenever this entity is annotated.
  - Google: "Concept ids to annotate whenever this entity is annotated."
- `resolutionPriority` (supporting) Priority deciding which entity resolutions get annotated when several are possible.
  - Google: "Resolution priority for this entity. If there are many possible resolutions to a MDVC understanding, only the ones with the highest priority are annotated."

### RepositoryWebrefNgramContext

- `mention` (supporting) The entities annotated in this piece of context text.
  - Google: "The entities that were annotated on the context"
- `weight` (supporting) How much weight the context carries on the document, based on repeat occurrences.
  - Google: "The weight of the context on the document; depends on how many times we saw the string in the document."

### RepositoryWebrefPreprocessingNameEntityScores

- `priorScore` (supporting) How much evidence there is that this spelling refers to that entity.
  - Google: "An unnormalized measure of how much evidence we have that this name variant refers to the key entity. Should be comparable to all scores from the same source for: - other entities having the same name variant - the open world score computed for this name variant"
- `volumeBasedScore` (supporting) The part of a name's prior score that comes from countable sources.
  - Google: "Prior score come from source that is quantifiable. artificial_score = prior_score - volume_based_score."

### RepositoryWebrefWebrefAnnotationStats

- `docWeight` (supporting) How much weight this document gets when its annotation data is pooled with others.
  - Google: "The relative weight of the document, used when aggregating information from multiple documents."
- `ngramContext` (supporting) Scores for phrases found around an entity mention, weighted by document weight.
  - Google: "Extracted n-grams context scores (in cdoc language, weighted by doc_weight) output if webref_populate_annotation_ngrams is enabled."

### ResearchScienceSearchSourceUrlDocjoinInfo

- `sporeGraphMid` (supporting) Entities recognized on the page that exist in the science knowledge graph.
  - Google: "A set of entities from WebRef annotations that are in SPORE_GRAPH."
- `webrefEntity` (supporting) Entities recognized on the page, copied from the main document record.
  - Google: "A set of entities copied from WebRefEntities on cDoc."

### CompressedQualitySignals

- `topicEmbeddingsVersionedData` (supporting) Versioned topic embedding data for the page that scorers can read directly.
  - Google: "Versioned TopicEmbeddings data to be populated later into superroot / used directly in scorers."

### RepositoryWebrefDocumentMetadata

- `isDisambiguationPage` (supporting) Whether the page is a known disambiguation page.
  - Google: "Set to true if the document is a known disambiguation page, e.g."

### RepositoryWebrefGlobalLinkInfo

- `isBoostedPrimaryWeightLink` (supporting) Flags an entity link that in some cases gets extra weight in primary scoring.
  - Google: "Whether this is a BoostedPrimaryWeight link. For these links in some cases a higher weight is used for primary scoring."

### QualityFringeFringeQueryPriorPerDocData

- `sensitiveEntitiesMids` (supporting) Identifiers of entities on the page that refer to people or groups of people.
  - Google: "MIDs of entities that represent a person or a group of people (aka sensitive entities). See b/290268614 for reference why this is needed in replacement to sensitive_entities_indices."

### RepositoryWebrefSimplifiedCompositeDoc

- `documentMentionSpans` (supporting) The spans of document text that were tagged with entities.
  - Google: "The composite doc spans which were annotated with entities by Webref."

### RepositoryWebrefLatentEntity

- `broaderImportance` (supporting) How strongly a broader entity relates to this one, one score per source.
  - Google: "The relatedness score of the two entities corresponding to each source above."

### RepositoryWebrefCategoryAnnotation

- `hitcat` (supporting) The sources that claim this page belongs to a category.
  - Google: "Sources asserting the category. In the future we may have one calibrated confidence score."

### ImageUnderstandingIndexingLabel

- `entityId` (supporting) Knowledge Graph entity identifier for a label found in the image.
  - Google: "KG entity id."

### NlpSaftMention

- `resolution` (supporting) What a mention itself refers to, which can differ from the entity it belongs to.
  - Google: "Mention-level resolution. This is used for encoding the meaning of the mention rather than the entity. For example, definite references and appositions are resolved to the mid for the concept rather than the entity."

### NlxDataSchemaMention

- `entity` (supporting) Link from a name mentioned in text to the entity it refers to.
  - Google: "The entity that this mention refers to."

### OrionDocEntitiesProto

- `encodedEntity` (supporting) Encoded list of entities found in a document.
  - Google: "This is encoded using EntityCandidate::Encode"

### QualityViewsExtractionClusterInfo

- `clusterSiblingMid` (supporting) Identifiers of other entities belonging to the same group.
  - Google: "The mids of cluster members that are part of the same cluster. Note that cluster members may end up having their own interpretation (EntityInfo which includes a ClusterInfo) or not (eg because they do not explain the full query, and so aqua does not output an interpretation for them). The latter..."

### RepositoryWebrefAnnotatedCategoryInfo

- `mid` (supporting) The knowledge graph identifier of the entity that stands for this category.
  - Google: "The mid of the entity representing the category."

### RepositoryWebrefEntityLinkSource

- `score` (supporting) How much more often two entities appear together than chance would suggest.
  - Google: "Score in [0, \infty) that represents how relatively likely it is to see that entity cooccurring with the main entity (in the entity join). A value of 1.0 means that the two entities are basically independent. The higher the more likely (relatively to the individual entity probabilities) they are to..."

### RepositoryWebrefEntityNameSource

- `entityScore` (supporting) All entity name scores contributed by one source.
  - Google: "All the entity-name scores from that source. Keyed by the EntityNameScore.entity_id field."

### RepositoryWebrefExplainedRangeInfoExplainedRange

- `mention` (supporting) The mention record showing where the text occurs in the document.
  - Google: "SegmentMention describing the occurrence of the token in the document."

### RepositoryWebrefExtendedEntityNameScore

- `scoreRatio` (supporting) The entity's share of the name score for a given region or site.
  - Google: "Score ratio for the entity, same as the EntityNameScore score ratio."

### RepositoryWebrefNgramMention

- `score` (supporting) The average score of the mention across all places the n-gram appeared.
  - Google: "The average score the mention was given across all occurrences of the n-gram."

### RepositoryWebrefPreprocessingNameVariantSignals

- `scores` (supporting) The shared score block for a name variant from one source.
  - Google: "Common prior_score/trust proto This field is shared by all sources providing this kind of data, the information has to be considered in context with the source."

### RepositoryWebrefPreprocessingOriginalNamesOriginalName

- `score` (supporting) How good this original spelling is, based on source authority and frequency.
  - Google: "Score estimating how good this original name is: - some sources are considered more authoritative than others (e.g. KG) - a name found in more sources is better."

### RepositoryWebrefRefconRefconNameInfo

- `namePrior` (supporting) The baseline likelihood that this name is used for the entity.
  - Google: "Name prior to use. We read this from the prior for the &quot;unknown&quot; language."

### RepositoryWebrefSegmentMentions

- `mention` (supporting) List of every spot in this text segment where the entity was mentioned.
  - Google: "A list of all the places the entity in question was annotated within this segment. The (indexing.annotations.goldmine) option is for Goldmine AnnotationsFinder to include Mention only when segment_type=&quot;CONTENT&quot;"

### RepositoryWebrefSupportTransferRule

- `mentionsOnly` (supporting) Setting that lets pages backing one entity also count as backing a related entity.
  - Google: "STBR doesn't just create annotations for STBR targets. It also can modify search result support (useful in PostRef) in order for web pages supporting the STBR source to also support the STBR target. Otherwise in PostRef annotations for STBR targets are going to be demoted, resulting in the STBR..."

### RepositoryWebrefTripleAnnotation

- `confidenceScore` (supporting) How confident the system is in a fact extracted from the page.
  - Google: "Triple annotation confidence_score (value between 0 and 1). Higher values correspond to higher confidence."

### RepositoryWebrefWebrefEntityRelationship

- `linkWeight` (supporting) Strength of the link between two entities found on the page.
  - Google: "The weight of the link."

### ResearchScienceSearchSourceUrlDocjoinInfoWebrefEntityInfo

- `mid` (supporting) The knowledge graph identifier of an entity found on the page.
  - Google: "The KG identifier of the WebrefEntity."

### SocialPersonalizationKnexAnnotationItem

- `mid` (supporting) The identifier of the topic a piece of content or a user profile is tagged with.
  - Google: "This is an MID in the /t/ namespace. We will migrate them to /g/ in Q3'15."

### VideoContentSearchVideoInfo

- `webrefEntities` (supporting) People, places and things identified in the document by the entity service.
  - Google: "Represents a collection of entities returned by the WebRef service. This message contains a lot of data and dependencies, so sub-messages are disabled in model evaluation in scorer."


## spam_demotion (126)

### PerDocData

- `DocLevelSpamScore` (**core**) A 0-127 spam score for the individual document.
  - Google: "The document spam score is represented as a 7-bits, going from 0 to 127."
- `GibberishScore` (**core**) A 0-127 score for how much of the page reads as nonsense text.
  - Google: "The gibberish score is represented in 7 bits, going from 0 to 127."
- `IsAnchorBayesSpam` (**core**) Flag saying the anchor-text Bayes classifier judged this document spam.
  - Google: "Is this document considered spam by the anchor bayes classifier?"
- `KeywordStuffingScore` (**core**) A 0-127 score for how much the page repeats keywords unnaturally.
  - Google: "The keyword stuffing score is represented in 7 bits, going from 0 to 127."
- `ScaledLinkAgeSpamScore` (**core**) A 0-127 score based on the age of links pointing at the page.
  - Google: "End DEPRECATED ------------------------------------------------------------ Link age score is represented as a 7-bit integer, going from 0 to 127."
- `ScaledSpamScoreYoram` (**core**) A 0-127 spam score for the document under the Yoram scheme.
  - Google: "Spamscores are represented as a 7-bit integer, going from 0 to 127."
- `SpamWordScore` (**core**) A 0-127 score for how many spammy words appear on the page.
  - Google: "The spamword score is represented in 7-bits, going from 0 to 127."
- `spamCookbookAction` (**core**) Actions triggered when the page matches a spam Cookbook recipe.
  - Google: "Actions based on Cookbook recipes that match the page."
- `spambrainData` (**core**) SpamBrain scores computed at the host level for this site.
  - Google: "Host-v1 sitechunk level scores coming from spambrain."
- `spambrainDomainSitechunkData` (**core**) SpamBrain scores computed at the domain level for this site.
  - Google: "Domain sitechunk level scores coming from spambrain."
- `spambrainTotalDocSpamScore` (**core**) SpamBrain's overall spam score for the document, from 0 to 1.
  - Google: "The document total spam score identified by spambrain, going from 0 to 1."
- `spamrank` (**core**) A 0-65535 measure of how likely the page is to link to known spammers.
  - Google: "The spamrank measures the likelihood that this document links to known spammers. Its value is between 0 and 65535."
- `spamtokensContentScore` (**core**) A content score used to decide whether a page is user-generated-content spam.
  - Google: "For SpamTokens content scores. Used in SiteBoostTwiddler to determine whether a page is UGC Spam. See go/spamtokens-dd for details."
- `uacSpamScore` (**core**) A 0-127 spam score where 64 or more marks the page as UAC spam.
  - Google: "The uac spam score is represented in 7 bits, going from 0 to 127. Threshold is 64. Score >= 64 is considered as uac spam."
- `urlPoisoningData` (**core**) Data about URL poisoning used to hold back spam documents.
  - Google: "Contains url poisoning data for suppressing spam documents."
- `QuarantineInfo` (supporting) A bitmask of quarantine flags recorded for the document, such as whitelisted or url-in-url.
  - Google: "bitmask of QuarantineBits (or'd together) used to store quarantine related information. For example: QUARANTINE_WHITELIST | QUARANTINE_URLINURL."
- `hostAge` (supporting) The earliest date any page on this host was first seen, used to sandbox fresh spam.
  - Google: "The earliest firstseen date of all pages in this host/domain. These data are used in twiddler to sandbox fresh spam in serving time. It is 16 bit and the time is day number after 2005-12-31, and all the previous time are set to 0. If this url's host_age == domain_age, then omit domain_age Please..."
- `spamMuppetSignals` (supporting) Signals about the site being hacked, joined in at query time.
  - Google: "Contains hacked site signals which will be used in query time joins. As of Oct'19, the field is stored in a separate corpus. It'll only be populated for in-flight requests between retrieve and full-score in perdocdata. So no extra storage is needed on muppet side."
- `trendspamScore` (supporting) How many trending-spam queries the document matches.
  - Google: "For now, the count of matching trendspam queries."

### IndexingDocjoinerAnchorSpamInfo

- `spamPenalty` (**core**) The overall penalty applied for anchor spam.
  - Google: "Combined penalty for anchor demotion."
- `anchorEnd` (supporting) Date of the most recent anchor pointing at the page.
  - Google: "End date of the last anchor of the document."
- `anchorFraq` (supporting) Share of the anchor history that falls in the demoted period.
  - Google: "Ratio of spam demoted period to all anchor period."
- `anchorStart` (supporting) Date of the earliest anchor pointing at the page.
  - Google: "Start date of the first anchor of the document."
- `demoted` (supporting) How many anchors were demoted.
  - Google: "Following field record details of anchor demotion in action. How many anchors were demoted."
- `demotedAll` (supporting) Whether every anchor in the period was demoted or only the spammy ones.
  - Google: "Demoted all anchors in the period or only anchors classified as spam."
- `demotedEnd` (supporting) When the anchor demotion period ends.
  - Google: "End date of the demotion period."
- `demotedStart` (supporting) When the anchor demotion period starts.
  - Google: "Start date of the demotion period."
- `phraseCount` (supporting) How many spam phrases appeared in anchors across unique domains.
  - Google: "Following fields record signals used in anchor spam classification. How many spam phrases found in the anchors among unique domains."
- `phraseDays` (supporting) The number of days over which most of those phrases appeared.
  - Google: "Over how many days 80% of these phrases were discovered."
- `phraseFraq` (supporting) Share of the page's anchors that were spam phrases.
  - Google: "Spam phrases fraction of all anchors of the document."
- `phraseRate` (supporting) Average number of spam anchors found per day.
  - Google: "Average daily rate of spam anchor discovery."
- `processed` (supporting) Total number of anchors processed for this page.
  - Google: "Total number of processed anchors."
- `spamProbability` (supporting) The model's estimated chance that the page's anchors are spam.
  - Google: "Predicted probability of spam."
- `trustedDemoted` (supporting) How many trusted anchors went into the spam probability.
  - Google: "Number of trusted anchors used in computation of spam probability."
- `trustedMatching` (supporting) How many trusted anchors used text matching the spam terms.
  - Google: "Number of trusted anchors with anchor text matching spam terms."

### IndexingDocjoinerAnchorPhraseSpamInfo

- `phraseAnchorSpamPenalty` (**core**) The overall penalty applied for anchor spam.
  - Google: "Combined penalty for anchor demotion."
- `phraseAnchorSpamCount` (supporting) How many spam phrases appeared in anchors across unique domains.
  - Google: "How many spam phrases found in the anchors among unique domains."
- `phraseAnchorSpamDays` (supporting) The number of days over which most of those spam phrases appeared.
  - Google: "Over how many days 80% of these phrases were discovered."
- `phraseAnchorSpamDemoted` (supporting) How many anchors were demoted.
  - Google: "Total number of demoted anchors."
- `phraseAnchorSpamEnd` (supporting) When the burst of spammy anchor text ended.
  - Google: "Time when anchor spam spike ended with padding."
- `phraseAnchorSpamFraq` (supporting) Share of the page's anchors that were spam phrases.
  - Google: "Spam phrases fraction of all anchors of the document."
- `phraseAnchorSpamProcessed` (supporting) How many anchors were looked at in total.
  - Google: "Total number of observed anchors."
- `phraseAnchorSpamRate` (supporting) Average number of spam anchors found per day.
  - Google: "Average daily rate of spam anchor discovery."
- `phraseAnchorSpamStart` (supporting) When the burst of spammy anchor text started.
  - Google: "Time when anchor spam spike started with padding."

### PornFlagData

- `pornWithHighConfidence` (**core**) A flag marking an image as confidently pornographic, which can demote it on non-porn queries.
  - Google: "This field is set to true when we are pretty confident that the image is porn (with higher precision than the img_porn_moderate restrict). In particular, it means that the image might be demoted for non-porn queries when SafeSearch is Off."
- `finalOffensiveScore` (supporting) The final offensive-content score for an image, built from its text and OCR scores.
  - Google: "Final offensive score based on image salient terms and image OCR vulgar and offensive scores."
- `finalViolenceScore` (supporting) The final violence score for an image, combined from several image signals.
  - Google: "Final violence score based on some image signals (brain pixel score, co-clicked images violence score, navboost queries score, etc.)."
- `offensiveSymbolDetection` (supporting) Whether hate symbols such as a swastika were detected in the image.
  - Google: "QuimbyCongas-based detection of offensive symbols in the image (currently swastika and Nazi yellow badge)."
- `qbstOffensiveScore` (supporting) An offensive score for an image derived from the queries people used to reach it.
  - Google: "QBST-based image offensive score, Navboost based"
- `qbstSpoofScore` (supporting) A score for how misleading an image is, derived from query logs.
  - Google: "QBST-based image spoof score, Navboost based, unrelated to the pixel-based score in PornAnnotation."
- `queryTextViolenceScore` (supporting) A violence score for an image summed up from the queries that led to it.
  - Google: "Aggregated navboost query violence score."
- `referrerCounts` (supporting) Counts of pages linking to this image and how adult those pages are.
  - Google: "Information about referrers and their porn classification. For details see classifier/porn/proto/image_porn_classifier_signals.proto."
- `semanticSexualizationScore` (supporting) A model score for how sexualized the image looks.
  - Google: "Starburst-based score predicting sexualization level of the image."

### IndexingDocjoinerAnchorStatistics

- `badbacklinksPenalized` (**core**) Whether the page was penalized for bad backlinks, which suppresses its anchor score.
  - Google: "Whether this doc is penalized by BadBackLinks, in which case we should not use improvanchor score in mustang ascorer."
- `penguinPenalty` (**core**) The page-level Penguin link spam penalty, 0 good to 1 bad.
  - Google: "Page-level penguin penalty (0 = good, 1 = bad)."
- `anchorSpamInfo` (supporting) Bundle of anchor spam signals and penalties for the page.
  - Google: "This structure contains signals and penalties of AnchorSpamPenalizer. It replaces phrase_anchor_spam_info above, that is deprecated."
- `pageFromExpiredTaggedAnchors` (supporting) Count of anchors coming from pages tagged as expired.
  - Google: "Set in SignalPenalizer::FillInAnchorStatistics."
- `penguinEarlyAnchorProtected` (supporting) Whether early good anchors shield the page from a link penalty.
  - Google: "Doc is protected by goodness of early anchors."
- `penguinTooManySources` (supporting) Whether the page was left unscored because it had too many linking sources.
  - Google: "Doc not scored because it has too many anchor sources. END: Penguin related fields."
- `phraseAnchorSpamInfo` (supporting) Bundle of signals about a spike in spammy anchor phrases.
  - Google: "Following signals identify spike of spammy anchor phrases. Anchors created during the spike are tagged with LINK_SPAM_PHRASE_SPIKE."
- `spamLog10Odds` (supporting) Log-odds score that the page's anchor set looks spammy.
  - Google: "The log base 10 odds that this set of anchors exhibits spammy behavior. Computed in the AnchorLocalizer."

### ImageData

- `brainPornScores` (supporting) Scores from image pixels for adult, violent, medical and spoof content.
  - Google: "A [0..1] SafeSearch scores based on image pixels, using Google Brain: porn, csai, violence, medical, and spoof. For porn only, if available prefer final_porn_score as it should be more precise than brain_porn_scores.porn_score."
- `clickMagnetScore` (supporting) How likely the image is to attract clicks from unrelated or bad queries.
  - Google: "A score in (0, 1] to indicate how likely this image is considered as a click magnet based on clicks received from bad queries."
- `finalPornScore` (supporting) A combined adult-content score built from image features, referrers and query clicks.
  - Google: "A [0..1] porn score based on some image-level features (like content score, referrer statistics, navboost queries, etc.). See class RiflePornScorer for more details."
- `hateLogoDetection` (supporting) Detections of hate-related logos found in the picture.
  - Google: "Hate logo detections from the VSS logo_recognition module."
- `isUnwantedContent` (supporting) A flag marking the image as unwanted for the search index.
  - Google: "Field to indicate the image is unwanted for search index. The data is propagated from amarna to alexandria to be annotated in the cdoc. Refer to image/repository/proto/unwanted_content.proto for more info."
- `pornFlagData` (supporting) Adult-content flags used when web and image indexes are combined.
  - Google: "Used by the segindexer for combined www+image indices."

### ClassifierPornSiteData

- `avgPedoPageScore` (supporting) The site's average score for suspected child exploitation pages.
  - Google: "The average pedo page score for the site."
- `numberOfPages` (supporting) How many pages of the site were used to compute these adult content scores.
  - Google: "The number of pages that were used to compute the scores and ratios."
- `numberOfPedoPages` (supporting) How many pages of the site were flagged under the child exploitation restriction.
  - Google: "The number of pages with pedo restrict."
- `sitePornRatio` (supporting) The share of the site's pages that are porn or soft porn.
  - Google: "The ratio of porn/softporn of the site this page belongs to."
- `violenceScore` (supporting) An aggregate of how violent the pages on the site score.
  - Google: "The cubic mean aggregation of violence page scores in the site."

### ImageSafesearchContentOCRAnnotation

- `ocrProminenceScore` (supporting) How visible or prominent the detected text is within the image.
  - Google: "The score produced by Aksara geometry and spoof score. Describes the 'visibility' or 'importance' of the text on the image [0, 1]"
- `pornScore` (supporting) How adult or racy the text found inside the image is.
  - Google: "Image OCR racyness/pornyness, computed by porn query classifier."
- `prominentOffensiveScore` (supporting) Offensiveness of the image's text weighted by how prominent that text is.
  - Google: "Same as offensive_score, but weighted by prominence."
- `prominentVulgarScore` (supporting) Vulgarity of the image's text weighted by how prominent that text is.
  - Google: "Same as vulgar_score, but weighted by prominence."
- `qbstOffensiveScore` (supporting) Offensiveness score for salient terms found in the image's text.
  - Google: "The score produced by offensive salient terms model."

### WWWDocInfo

- `additionalSafesearchStats` (supporting) Extra statistics produced by the adult-content classifier for this document.
  - Google: "Additional stats output by SafeSearch. See classifier/porn/public/porn-attachments.h."
- `isPorn` (supporting) Whether the document was classified as pornographic.
  - Google: "Doc porn classification."
- `isSitePorn` (supporting) Whether the whole site was classified as pornographic.
  - Google: "Consider the page classification is_porn as an alternative for is_site_porn, and talk to safesearch@google.com for additional information if needed."
- `isSoftporn` (supporting) Whether the document was classified as soft pornography.
  - Google: "Doc softporn classification."
- `pornStats` (supporting) Adult-content statistics used in porn demotion and filtering.
  - Google: "'porn_stats' is used in porn demotion and filtering. See classifier/porn/public/porn-attachments.h."

### CompressedQualitySignals

- `exactMatchDomainDemotion` (**core**) A stored demotion for domains that exactly match the query words.
  - Google: "Page quality signals converted from fields in proto QualityBoost in quality/q2/proto/quality-boost.proto. To save indexing space, we convert the float values in [0, 1] to integers in range [0, 1023] (use 10 bits). exact_match_domain_demotion: converted from QualityBoost.emd.boost."
- `navDemotion` (**core**) A stored demotion for pages flagged by the navigational demotion system.
  - Google: "nav_demotion: converted from QualityBoost.nav_demoted.boost."
- `scamness` (**core**) A model score for how scam-like the page looks, used in quality scoring.
  - Google: "Scam model score. Used as one of the web page quality qstar signals. Value range from 0 to 1023."
- `serpDemotion` (**core**) A demotion value applied to the page during Q* scoring.
  - Google: "serp demotion: applied in Qstar."

### SmartphonePerDocData

- `violatesMobileInterstitialPolicy` (**core**) Whether the page breaks the mobile interstitial rules and should be demoted.
  - Google: "Indicates if the page is violating mobile interstitial policy and should be demoted. See go/interstitials-ranking-dd for details."
- `adsDensityInterstitialViolationStrength` (supporting) How badly the page breaks the rules on ad-heavy mobile interstitials.
  - Google: "Indicates if the page is violating mobile ads density interstitial policy and the violation strength. See go/interstitials-for-ads and"
- `isErrorPage` (supporting) Whether the page returns an error to the smartphone crawler.
  - Google: "Indicates if the page serves error to smartphone crawler. go/ramsey-sp404demotion"
- `isN1Redirect` (supporting) Whether the mobile page redirects visitors away from the matching content.
  - Google: "Indicates if the page has mobile N-1 redirection. go/ramsey-n1demotion"

### ImageRegionsImageRegions

- `finalPornScore` (supporting) Final adult-content probability score assigned to the image.
  - Google: "The final_porn_score for the image."
- `finalViolenceScore` (supporting) Final violence probability score assigned to the image.
  - Google: "The final_violence_score for the image."
- `isIuInappropriate` (supporting) Whether the image is flagged as inappropriate for Images Universal.
  - Google: "True if the image is iu-inappropriate."
- `racyScore` (supporting) Score for how sexually suggestive the image is.
  - Google: "The racy_score of the image."

### ImageRepositoryContentBasedVideoMetadata

- `safesearchVideoContentSignals` (supporting) SafeSearch classifier scores for the video's content across sensitive categories.
  - Google: "Contains SafeSearch video classification outputs which are vertical_name/float pairs."
- `videoPornScore` (supporting) Confidence score that the video contains pornographic content.
  - Google: "The video porn confidence score extracted from Whisper featureSet: &quot;video_labels:whisper_v3&quot;, with CR2 label: &quot;/cr2/1&quot;."
- `videoPornScoreV4` (supporting) Newer model confidence score that the video contains pornographic content.
  - Google: "The video porn confidence score extracted from WhisperV4 featureSet: &quot;VideoFeatures.whisper_v4_labels&quot;, with CR2 label: &quot;/tns/porn&quot;."

### ImageSafesearchContentBrainPornAnnotation

- `iuInappropriateScore` (supporting) Probability the image is inappropriate for general image results.
  - Google: "This field contains the probability that an image is inappropriate for Images Universal, according to this policy: go/iupolicy."
- `racyScore` (supporting) Score for how sexually suggestive the image is.
  - Google: "This score is related to an image being sexually suggestive."
- `semanticSexualizationScore` (supporting) Graded score for how sexualized the image content is.
  - Google: "This score is related to racy/sexual images where scores have semantic meaning from 0 to 1."

### QualityNsrNsrData

- `clutterScore` (**core**) A site-level penalty for loading many distracting or annoying extra resources.
  - Google: "Delta site-level signal in Q* penalizing sites with a large number of distracting/annoying resources loaded by the site (see go/clutter-v0)."
- `spambrainLavcScore` (**core**) A site-level spam score produced by the SpamBrain system.
  - Google: "The SpamBrain LAVC score, as of July 2022. See more information at go/cloverfield-lavc-deck."

### AnchorsAnchorSource

- `spamrank` (supporting) Spam rank of the linking page on a 16-bit scale.
  - Google: "uint16 scale"
- `spamscore2` (supporting) A spam score for the linking page on a 0 to 127 scale.
  - Google: "0-127 scale"

### SpamBrainData

- `versionedData` (**core**) The spam classifier scores for a result, one per model version.
  - Google: "Versioned scores of SB classifiers"
- `site` (supporting) The site grouping that a spam classifier result applies to.
  - Google: "Sitechunker site granularity for this result"

### BlogPerDocData

- `clientSpamminess` (supporting) How spammy the posting tool used to create a short post looks.
  - Google: "This score captures how spammy the client is that the micropost was created with. The higher the score the worse."
- `spamScore` (supporting) A spam score for the blog post.
  - Google: "Blog scoring signals."

### ClassifierPornReferrerCounts

- `porn` (supporting) How many referring pages are classified as porn or adult.
  - Google: "Number of referrers which are classified as porn and as adult."
- `total` (supporting) The total number of referring pages counted.
  - Google: "Total number of referrers."

### IndexingDocjoinerAnchorTrustedInfo

- `matchedScore` (supporting) Score for how closely a trusted site's anchor text resembles the spammy anchors.
  - Google: "Difference in KL-divergence from spam and non-spam anchors. Value >0 indicate that anchor text from this trusted source is similar to anchors classified as spam which means that spammy anchors are legitimate."
- `phrasesScore` (supporting) How many of the site's anchors were classified as spam by their text.
  - Google: "Count of anchors classified as spam using anchor text."

### IndexingMobileInterstitialsProtoDesktopInterstitials

- `urlTree` (supporting) Tree of URL patterns on the host that show intrusive interstitials.
  - Google: "URL tree of interstitial patterns belong to the host, to be used as site-level signal in Index Signals. A pattern may contain a payload InterstitialPatternPayload, which will indicate the violated interstitial types of this pattern."
- `violatesDesktopInterstitialPolicy` (supporting) Whether the page breaks the desktop interstitial rules.
  - Google: "Overall policy violation status. If this is true, at least one of the InterstitialSignal below indicates a violation."

### WWWResultInfoSubImageDocInfo

- `pornSignals` (supporting) Packed adult-content annotations for the image.
  - Google: "Encoded Safe Search annotations of the image. See image/safesearch/overall/public/image_porn_attachments.h for decoding functions."
- `safeForUniversal` (supporting) Whether the image is clear of the blocklist used for image results.
  - Google: "Result is not on the Images Universal blacklist. For more comprehensive filtering of IU images, including this bit, see superroot/impls/images/quality/safesearch/iu_inappropriate_filter_lib.h"

### AnchorsAnchor

- `expired` (supporting) Flags that the linking domain is an expired one.
  - Google: "true iff exp domain"

### SpamBrainScore

- `sbScore` (**core**) SpamBrain's spam score for this document under a given model version.
  - Google: "The value corresponding to this version."

### CompositeDocIndexingInfo

- `hostid` (supporting) The page's host id, used mainly to tell whether it sits on a parked domain.
  - Google: "The host id of the document. Used chiefly to determine whether the document is part of a parked domain."

### CompositeDoc

- `porninfo` (supporting) Adult content data about the page used for safe search classification.
  - Google: "Porn related data used for image and web search porn classification as well as for diagnostics purposes."

### QualityShoppingShoppingAttachmentOffer

- `nonDisplayableOrganicScoreMillis` (supporting) A one-to-1000 riskiness rating for a merchant destination in organic results.
  - Google: "Normalized riskiness score for Organic destinations. It's in range [1,1000] with 1 being the worst score and 1000 being the best."

### SafesearchInternalImageSignals

- `starburstPornScore` (supporting) An image adult-content score that feeds the final SafeSearch scores.
  - Google: "Additional SafeSearch signals that are used to compute final scores."

### ClassifierPornSiteDataVersionedScore

- `verticals4Score` (supporting) An internal safe search score from one model version.
  - Google: "Please talk to safesearch@ before relying on any of these internal fields:"

### ImageRepositoryAnimatedImagePerdocData

- `aggregatedPornScores` (supporting) Combined adult-content scores computed across the frames of an animated image.
  - Google: "Aggregated porn scores for animated images. Aggregated using max sampling rate / max duration. Note the plan is to fold these scores into existing summarized scores, for cases where these scores are available. See tracking bug b/63580795."

### ImageSafesearchContentOffensiveSymbolMatch

- `score` (supporting) Confidence that an offensive symbol was matched in the image.
  - Google: "Confidence score of the match. The higher, the more likely to match the symbol."

### ImageSearchImageLicenseInfo

- `safesearchFlags` (supporting) Bit flags recording which SafeSearch filters apply to the image.
  - Google: "A bitwise-OR of SafeSearch filtering flags. If present, the flags will be a bitwise-AND between this value and all the classifier_porn::query::Vertical enums. If the value is -1, it indicates there is some error with SafeSearch classifier. The default value 0 means no filtering flags are set."


## links_authority (90)

### AnchorsAnchor

- `catfishTags` (supporting) Tags attached to a link that are generated on the fly rather than stored.
  - Google: "CATfish tags attached to a link. These are similar to link tags, except the values are created on the fly within Cookbook. See:"
- `context2` (supporting) A hash of the words surrounding the link on the page.
  - Google: "This is a hash of terms near the anchor. (This is a second-generation hash replacing the value stored in the 'context' field.)"
- `fullLeftContext` (supporting) The full text appearing before the link on the page.
  - Google: "The full context. These are not written out in the linklogs."
- `isLocal` (supporting) Roughly whether the linking page and the target page share a domain.
  - Google: "The bit ~roughly~ indicates whether an anchor's source and target pages are on the same domain. Note: this plays no role in determining whether an anchor is onsite, ondomain, or offdomain in mustang (i.e., the bit above)."
- `linkAdditionalInfo` (supporting) Extra data about the link, such as further anchor text or scores.
  - Google: "Additional information related to the anchor, such as additional anchor text or scores."
- `linkTags` (supporting) Tags describing the link type and the page it came from.
  - Google: "Contains info on link type, source page, etc."
- `locality` (supporting) A measure of how local a link is, used in judging link quality.
  - Google: "For ranking purposes, the quality of an anchor is measured by its &quot;locality&quot; and &quot;bucket&quot;. See quality/anchors/definitions.h for more information."
- `origText` (supporting) The link text exactly as written, keeping capitalization and punctuation.
  - Google: "Original text, including capitalization and punctuation. Runs of whitespace are collapsed into a single space."
- `pagerankWeight` (supporting) Weight given to this link when PageRank is computed.
  - Google: "Weight to be stored in linkmaps for pageranker"
- `parallelLinks` (supporting) How many other links on the same page point to the same target domain.
  - Google: "The number of additional links from the same source page to the same target domain. Not populated if is_local is true."
- `setiPagerankWeight` (supporting) A second, temporary link weight for a PageRank variant.
  - Google: "TEMPORARY"
- `sourceType` (supporting) Quality band of the page the link came from: high, medium or low.
  - Google: "is to record the quality of the anchor's source page and is correlated with but not identical to the index tier of the source page. In the docjoins built by the indexing pipeline (Alexandria), - Anchors marked TYPE_HIGH_QUALITY are from base documents. - Anchors marked TYPE_MEDIUM_QUALITY are from..."
- `text` (supporting) The words that make up the link text.
  - Google: "Space-delimited anchor words. Text that needs segmentation (like CJK or Thai) is unsegmented, since we set FLAGS_segment_during_lexing to false in mr-linkextractor.cc ."
- `weight` (supporting) The link's weight on a scale of 0 to 127.
  - Google: "weights are 0-127"

### IndexingDocjoinerAnchorStatistics

- `anchorPhraseCount` (supporting) How many distinct anchor phrases point at the page, capped at 5000.
  - Google: "The number of unique anchor phrases. Capped by the constant kMaxAnchorPhraseCountInStats (=5000) defined in indexing/docjoiner/anchors/anchor-manager.cc."
- `anchorsWithDedupedImprovanchors` (supporting) How many anchors had duplicate phrases removed within the linking organization.
  - Google: "The number of anchors for which some ImprovAnchors phrases have been removed due to duplication within source org."
- `droppedRedundantAnchorCount` (supporting) How many anchors were dropped as redundant.
  - Google: "Sum of anchors_dropped in the repeated group RedundantAnchorInfo, but can go higher if the latter reaches the cap of kMaxRecordsToKeep. (indexing/docjoiner/anchors/anchor-loader.cc), currently 10,000"
- `globalAnchorDelta` (supporting) How much the set of links pointing at the page changed.
  - Google: "Metric of number of changed global anchors computed as, size(union(previous, new) - intersection(previous, new))."
- `minDomainHomePageLocalOutdegree` (supporting) Smallest outbound link count among same-domain home pages linking here.
  - Google: "Minimum local outdegree of all anchor sources that are domain home pages as well as on the same domain as the current target URL."
- `minHostHomePageLocalOutdegree` (supporting) Smallest outbound link count among same-host home pages linking here.
  - Google: "Minimum local outdegree of all anchor sources that are host home pages as well as on the same host as the current target URL."
- `redundantAnchorForPhraseCapCount` (supporting) How many anchors were dropped for exceeding the per-domain phrase cap.
  - Google: "Total anchor dropped due to exceed per domain phrase cap. Equals to sum of anchors_dropped in the repeated group RedundantAnchorInfoForPhraseCap, but can go higher if the latter reaches the cap of kMaxDomainsToKeepForPhraseCap (indexing/docjoiner/anchors/anchor-loader.h), currently 1000."
- `topPrOnsiteAnchorCount` (supporting) How many high-PageRank same-site anchors point at the page.
  - Google: "According to anchor quality bucket, anchor with pagrank > 51000 is the best anchor. anchors with pagerank < 47000 are all same."
- `totalDomainPhrasePairsAboveLimit` (supporting) How many domain and phrase pairs exceeded the cap.
  - Google: "The following should be equal to the size of the following repeated group, except that it can go higher than 10,000."
- `totalDomainPhrasePairsSeenApprox` (supporting) Roughly how many domain and phrase pairs were seen before capping.
  - Google: "Number of domain/phrase pairs in total -- i.e. how many anchors we would have if the domain/phrase cutoff was set to 1 instead of 200. This is &quot;approx&quot; for large anchor clusters because there can be double counting when the LRU cache forgets about rare domain/phrase pairs."
- `totalDomainsAbovePhraseCap` (supporting) How many domains exceeded the per-domain phrase cap.
  - Google: "Number of domains above per domain phrase cap. We see too many phrases in the domains."
- `totalDomainsSeen` (supporting) How many distinct domains link to the page.
  - Google: "Number of domains seen in total."

### RepositoryWebrefSimplifiedAnchor

- `anchorText` (supporting) The visible text of a link pointing at the page.
  - Google: "The anchor text. Note that the normalized text is not populated."
- `count` (supporting) How many times this exact anchor text was seen.
  - Google: "The number of times we see this anchor text."
- `countFromOffdomain` (supporting) Count of these anchors coming from other domains.
  - Google: "Count, score, normalized score, and volume of offdomain anchors."
- `countFromOnsite` (supporting) Count of these anchors coming from the same site.
  - Google: "Count, score, normalized score, and volume of onsite anchors."
- `normalizedScore` (supporting) The anchor score after being scaled against total anchor volume.
  - Google: "The normalized score, which is computed from the score and the total_volume."
- `score` (supporting) Combined score of all anchors sharing this text.
  - Google: "The sum/aggregate of the anchor scores that have the same text."
- `scoreFromFragment` (supporting) Combined score of anchors with this text that point to a page fragment.
  - Google: "The sum/aggregate of the anchor scores that direct to a fragment and have the same text."
- `scoreFromRedirect` (supporting) Combined score of anchors with this text that arrive via a redirect.
  - Google: "The sum/aggregate of the anchor scores that direct to a different wiki title and have the same text. NOTE: url direct to a fragment score is not included in this value."
- `totalVolume` (supporting) Total anchor score volume used as the denominator when normalizing.
  - Google: "The total score volume used for normalization."

### AnchorsAnchorSource

- `homePageInfo` (supporting) Whether the linking page is a homepage and how trusted that homepage is.
  - Google: "Information about if the source page is a home page. It can be one of the enum values defined in PerDocData::HomePageInfo (NOT_HOMEPAGE, NOT_TRUSTED, PARTIALLY_TRUSTED, and FULLY_TRUSTED)."
- `indyrank` (supporting) A stored rank value for the linking page.
  - Google: "uint16 scale"
- `nsr` (supporting) Site quality score of the linking page, scaled to a 0 to 1000 range.
  - Google: "This NSR value has range [0,1000] and is the original value [0.0,1.0] multiplied by 1000 rounded to an integer."
- `outsites` (supporting) Roughly how many different sites the linking page points out to.
  - Google: "approx num of pointed-to sites"
- `pagerank` (supporting) PageRank of the linking page, stored on a 16-bit scale.
  - Google: "uint16 scale"
- `pagerankNs` (supporting) A variant PageRank value for the linking page.
  - Google: "unit16 scale"

### RepositoryWebrefWebrefOutlinkInfo

- `byteLength` (supporting) Length in bytes of the link text for an outgoing link.
  - Google: "The length in bytes of such a link (including internal spaces); e.g. if the link text is &quot;click here&quot; then the length is 10."
- `isNofollow` (supporting) Whether an outgoing link is marked nofollow.
  - Google: "Whether this is a nofollow link ("
- `topicalityWeight` (supporting) How much topical weight each outgoing link to this address carries.
  - Google: "The topicality_weight for each link with this target URL."
- `url` (supporting) The address an outgoing link points to.
  - Google: "The target URL of the link."

### PerDocData

- `homepagePagerankNs` (**core**) The pagerank of the site's homepage, copied onto this document.
  - Google: "The page-rank of the homepage of the site. Copied from the cdoc.doc().pagerank_ns() of the homepage."
- `ScaledIndyRank` (supporting) An independence rank stored as a 16-bit number that is scaled back to its real value.
  - Google: "The independence rank is represented as a 16-bit integer, which is multiplied by (max_indy_rank / 65536) to produce actual independence rank values. max_indy_rank is typically 0.84."
- `toolbarPagerank` (supporting) A stored copy of the page's 0-10 toolbar pagerank value.
  - Google: "A copy of the value stored in /namespace/indexing/wwwglobal//fakepr/* for this document. A value of quality_bakery::FakeprUtils::kUnknownToolbarPagerank indicates that we don't have toolbar pagerank for this document. A value between 0 and 10 (inclusive) means that this is the toolbar pagerank of..."

### CompressedQualitySignals

- `anchorMismatchDemotion` (**core**) A stored demotion value for pages whose anchor text does not match the page.
  - Google: "anchor_mismatch_demotion: converted from QualityBoost.mismatched.boost."
- `authorityPromotion` (**core**) A stored promotion value that raises pages judged authoritative.
  - Google: "authority promotion: converted from QualityBoost.authority.boost"
- `siteAuthority` (**core**) A site-level authority score applied during Q* scoring.
  - Google: "site_authority: converted from quality_nsr.SiteAuthority, applied in Qstar."

### Anchors

- `homepageAnchorsDropped` (supporting) How many links from other homepages on the same site were discarded during anchor processing.
  - Google: "The total # of local homepage anchors dropped in AnchorAccumulator."
- `localAnchorsDropped` (supporting) How many same-site non-homepage links were discarded during anchor processing.
  - Google: "The total # of local non-homepage anchors dropped in AnchorAccumulator."
- `nonlocalAnchorsDropped` (supporting) How many links from other sites were discarded during anchor processing.
  - Google: "The total # of non-local anchors dropped in AnchorAccumulator."

### CompositeDoc

- `anchorStats` (supporting) Aggregated statistics about the links pointing at this page.
  - Google: "Mark as non-personal since it's an aggregation of anchors. For more details of Search personal data, see go/dma52-search-cdoc-fields."
- `anchors` (supporting) The incoming links and their anchor text for this page.
  - Google: "Mark as non-personal since no personal fields will be populated in"
- `scaledIndyRank` (supporting) A scaled independence rank value copied into the per document data.
  - Google: "to copy to per-doc"

### IndexingDocjoinerAnchorStatisticsPerDupStats

- `anchorCount` (supporting) How many anchors were kept for this duplicate URL.
  - Google: "Count of anchors kept from forwarding."
- `offdomainAnchorCount` (supporting) How many anchors came from other domains.
  - Google: "Count of offdomain anchors."
- `redundantAnchorCount` (supporting) How many anchors were considered redundant.
  - Google: "Count of redundant anchors."

### ScienceCitationAnchor

- `count` (supporting) How many times this anchor text appears.
  - Google: "Number of times this anchor text appears, only consider the text itself"
- `text` (supporting) The words used in the anchor text pointing at the document.
  - Google: "Space-delimited anchor words. Text that needs segmentation (like CJK or Thai) is unsegmented. Generated by ScienceParseUtils::AppendTokenSeqToString()"
- `weight` (supporting) A weight from 1 to 128 for the anchor based on where it came from.
  - Google: "weight of the anchor by looking where we get this anchor text. It can be PR, court level, year, or the combination of differerent aspects. weights are 1 - 128 defined as &quot;Weights&quot;"

### QualityNsrNsrData

- `siteLinkIn` (supporting) The average incoming link score of the site's pages.
  - Google: "Average value of the site_link_in for pages in the sitechunk."
- `siteLinkOut` (supporting) The aggregated outgoing link score of the site's pages.
  - Google: "Aggregated value of url link out scores for this sitechunk."

### IndexingDocjoinerAnchorSpamInfo

- `trustedTarget` (supporting) Whether this URL sits on a trusted source.
  - Google: "Following fields record details about trusted anchors True if is this URL is on trusted source."
- `trustedTotal` (supporting) How many trusted sources link to this URL.
  - Google: "Total number of trusted sources for this URL."

### CompositeDocForwardingDup

- `rawPagerank` (**core**) The raw pagerank of the duplicate address.
  - Google: "Raw pagerank of the url."
- `purposes` (supporting) Which data a duplicate passes to the main page, such as anchors or click boost.
  - Google: "The purpose(s) of the forwarding dup indicating if it is used for forwarding signal/anchors generally, or only for forwarding some specific signal (e.g. navboost), or for some other purposes (e.g., not for forwarding any data but for making &quot;info:&quot; complete). See..."

### ImageExactBoostNavQuery

- `referrerDocid` (supporting) Identifiers of the pages that show this image, ordered by their rank.
  - Google: "List of all referrers, sorted by their rank (stored in Moosedog)."
- `referrerRank` (supporting) Where the current page ranks among the pages that show this image.
  - Google: "Rank of the current web doc referrer (stored in docjoins)."

### IndexingDocjoinerAnchorTrustedInfo

- `text` (supporting) The tokenized anchor text from that site.
  - Google: "Tokenized text of all anchors from the site."
- `trustedScore` (supporting) Fraction of the site's pages with newsy anchors, higher for trusted sites.
  - Google: "Fraction of pages with newsy anchors on the site, >0 for trusted sites."

### NlpSaftHyperlink

- `anchorText` (supporting) The plain visible text of a link, with markup stripped out.
  - Google: "Clean anchor text (no HTML markup)."
- `url` (supporting) The full address that a link points to.
  - Google: "(Absolute) URL that the links to."

### QualityNsrPQData

- `numOffdomainAnchors` (supporting) How many links to this page come from other domains.
  - Google: "The total number of offdomain anchors seen by the NSR pipeline for this page."

### RepositoryWebrefDocumentMetadata

- `numIncomingAnchors` (supporting) The weighted count of links pointing at this page from other pages.
  - Google: "The (weighted) number of incoming anchors (links from other documents)."

### KaltixPerDocData

- `KaltixRank` (supporting) A per-document rank value stored in compact form for the top billion documents.
  - Google: "approx. 2 bytes for top 1B"

### QualityTravelGoodSitesData

- `normalizationFactor` (supporting) How much credit from local links is scaled before being added to global links.
  - Google: "Factor that determines how local anchor credit is scaled before being added to global anchors."

### QualityShoppingShoppingAttachmentProduct

- `outlinkDomainRelationship` (supporting) Whether an offer link points to the same domain or off to another one.
  - Google: "Whether an outlink points to the same domain or off-domain. Only added if the relationship is known, and the Offer has ref_type of OUTLINK."

### RepositoryWebrefSimplifiedCompositeDoc

- `anchors` (supporting) The page's anchors, trimmed down and grouped by identical text.
  - Google: "The composite doc anchors trimmed and transformed in a smaller data structure and aggregated (if they have the exact same text)."

### RepositoryWebrefWebrefOutlinkInfos

- `outlinkInfo` (supporting) Details about every address the page links out to.
  - Google: "Information about each target URL referred to in the document's outlinks. If a given URL has multiple links, they are grouped in a single WebrefLinkInfo."

### FatcatCompactDocClassification

- `weight` (supporting) How important this page is within its site, based on PageRank or impressions.
  - Google: "The relative weight of this doc within a site, typically something like pagerank or navboost impressions. May be a large number (like an actual pageviews estimate), not limited to a small range."

### GDocumentBase

- `PagerankNS` (**core**) The production PageRank score for the page, computed by the nearest seeds method.
  - Google: "Pagerank-NearestSeeds is a pagerank score for the doc, calculated using NearestSeeds method. This is the production PageRank value teams should use."

### IndexingSignalAggregatorAgeWeightedCoverageData

- `firstCoveragePagerankNs` (supporting) The URL's PageRank value at the time it was first served.
  - Google: "The pagerank when the url was serving for the first time."

### NlpSaftDocument

- `hyperlink` (supporting) The list of links found in the document, in the order they appear.
  - Google: "The hyperlinks in the document. Multiple hyperlinks are sorted in left-to-right order."

### OceanDocTag

- `pagerank` (supporting) PageRank value stored for a book page.
  - Google: "the page rank value of the book page"

### ResearchScienceSearchSourceUrlDocjoinInfo

- `pagerankNs` (supporting) The document's live PageRank value.
  - Google: "The production pagerank value of the document."

### ScienceCitation

- `Anchors` (supporting) The anchor text around a citation link on the referring page.
  - Google: "All the anchor text (before, after, formal, etc) for this citation in the referring page."

### ScienceIndexSignal

- `NumBackwardLinks` (supporting) How many links point to the document.
  - Google: "Summary statistics."


## media_image_video (87)

### ImageData

- `clipartDetectorScore` (supporting) A classifier score for whether the picture looks like clipart.
  - Google: "Image content based classifier scores."
- `colorScore` (supporting) How much of each of twelve basic colors appears in the image.
  - Google: "Colorness scores for the image. Each score represents the amount of a particular color in the image. At the current time, there are 12 colors, so there should always be 0 or 12 values in this array. The 12 colors are black, blue, brown, gray, green, orange, pink, purple, red, teal, white, yellow...."
- `coloredPixelsFrac` (supporting) The share of pixels with real color, used to tell color from grayscale.
  - Google: "Fraction of the image that contains pixels over a certain saturation threshold: can be used to determine if the image is grayscale or not."
- `deepImageEngagingness` (supporting) A model score for how engaging the picture is likely to be.
  - Google: "Productionized Deep Image Engagingness score."
- `flowOutput` (supporting) Bundled image-content features used to compare how similar pictures are.
  - Google: "The output of various features generated by the Flow framework, most importantly data from Starburst (go/starburst). Do NOT interact with the internals of this proto since they may change over time. Instead, use the existing interfaces that consume FlowProtoProd's directly, e.g.,..."
- `imageContentQueryBoost` (supporting) Per-query score boosts for the image produced by an image content model.
  - Google: "Image Content Scored per query boosts. Currently this is filled by the pamir algorithm and populates the pamir_section."
- `imageExactBoost` (supporting) Queries the image is believed to match, with a confidence score for each.
  - Google: "A set of query fingerprints and confidence scores. There queries are supposed to be relevant to the image with high confidence."
- `imageRegions` (supporting) Boxes around objects found inside the picture, each with a label.
  - Google: "Regions detected within the image (go/images-region-search-edd). Regions contain bounding boxes circumscribing objects of interest in the image, along with object labels. Regions may overlap."
- `isVisible` (supporting) Whether the image is shown on the page or only linked from it.
  - Google: "True if the image is inlined on the page (typicially via ) or false if the image is linked to (via an href)."
- `largestFaceFrac` (supporting) How much of the picture is taken up by the biggest face in it.
  - Google: "Fraction of image covered by the largest face (should match largestFaceFraction, but without scaling). In perdocs, is set only if numberFaces > 0."
- `nimaAva` (supporting) A model score for the aesthetic appeal of the picture.
  - Google: "Productionized Nima AVA score. Both this field and nima_vq were added on the top of nima_ava_score and nima_vq_score because the signals are already integrated with Batch Amarna in image/repository/schema/global_output_tags.h using NimaOutput."
- `nimaVq` (supporting) A model score for the technical visual quality of the picture.
  - Google: "Productionized Nima VQ score."
- `numberFaces` (supporting) How many faces were found in the picture.
  - Google: "Number of faces detected in the image"
- `ocrGoodoc` (supporting) A trimmed record of text read out of the image by character recognition.
  - Google: "Pruned OCR Goodoc see vss_aksara_ocr_util.h for the fields copied."
- `ocrTaser` (supporting) Text read out of the image by a second character recognition system.
  - Google: "Ocr detected by ocr_taser module."
- `ocrTextboxes` (supporting) The individual lines of text found inside the image.
  - Google: "Text lines detected by OCR engine."
- `packedFullFaceInfo` (supporting) Face count and largest-face size squeezed into a compact index value.
  - Google: "Encodes face number and largest face frac into a small package for storage in mustang. This is calculated directly from FaceDetectionResult."
- `rankInNeardupCluster` (supporting) Where this image places among its near duplicates, with one being best.
  - Google: "Rank in near-dup cluster (go/image-rank-in-neardup-cluster). The rank is 1-indexed: rank 1 is the best."
- `smearedTopWebLandingPageDocids` (supporting) Identifiers of top-ranked web pages that this image leads to.
  - Google: "Web docids that correspond to high ranked smeared landing pages for this image. Used for conditional retrieval of actionable landing pages for image search."
- `whiteBackgroundScoreVersion` (supporting) How likely the picture is a single object shot on a white background.
  - Google: "Image is likely an object on a white background (value on [0,1])."

### IndexingSpeechSpeechPropertiesProto

- `audioDuration` (supporting) How many seconds of audio were processed in this media fragment.
  - Google: "Duration of audio in processed fragment (including non-speech), in seconds."
- `audioOnly` (supporting) Whether the media file has only audio and no video track.
  - Google: "If true, the media file is audio-only. If false, also has video track(s)."
- `estimatedAudioDuration` (supporting) The estimated total audio length of the whole media file, in seconds.
  - Google: "Estimated duration of audio in the whole file (including non-speech), in seconds. If this is greater than 0, then it will either be equal to audio_duration (when truncated_file is false), or to the length of the content (audio or video) according to the file header (when truncated_file is true)."
- `languageCode` (supporting) The language spoken in the audio, which may differ from the page's language.
  - Google: "The spoken language, see i18n/identifiers/languagecode.h and go/gl2014. This may or may not match the language of the written page. (Examples: &quot;en&quot;, &quot;sv&quot;, &quot;zh-CN&quot;)."
- `numWords` (supporting) How many words the speech recogniser picked out of the audio.
  - Google: "Total number of recognized words in processed fragment."
- `recognizerAccuracy` (supporting) The estimated accuracy of the speech recognition output, from zero to one.
  - Google: "Measure of the estimated output accuracy from the speech recognition code, from 0 to 1. Based on word-level confidence and possibly other factors."
- `speechDuration` (supporting) How many seconds of actual speech were in the processed audio.
  - Google: "Duration of speech in processed fragment, in seconds."

### WWWResultInfoSubImageDocInfo

- `dimeScore` (**core**) A model score for how engaging an image is.
  - Google: "EQ* v3: Deep Image Engagingness(DImE) go/deep-image-engagingness-slides"
- `eqStar` (**core**) A score for the emotional quality of an image, such as how inspiring it looks.
  - Google: "EQ* is a unified signal to capture the emotional quality (e.g. inspiration, lifestyle, context, etc.) of an image. For more information, please refer to go/image-inspiration-ranking-framework."
- `estRelevance` (**core**) An estimate of how useful the image is for the query, from off-topic to very useful.
  - Google: "Estimated Image Relevance ranging between 0.0 (Off-Topic) to 1.0 (Very Useful)."
- `tqStar` (**core**) A score for the technical quality of an image, such as sharpness and exposure.
  - Google: "TQ* is a signal to capture the technical quality (e.g. exposure, sharpness, composition, etc.) of an image. For more information, please refer to go/tqstar."
- `estSigmaU` (supporting) An uncertainty estimate derived from the image usefulness score.
  - Google: "Estimated Sigma U calculated from U*."
- `humanModelScore` (supporting) A model score about people appearing in the image, from visual shopping tagging.
  - Google: "DeepTags human model score. go/VisualShoppingImageAttributes"
- `salience` (supporting) How important the image is to the page it appears on.
  - Google: "Salient score, indicating how important an image is to the page it's on. Check go/salient-images-design-doc for details."

### ImageContentStarburstVersionGroup

- `descriptorFloat` (supporting) A list of numbers describing what an image looks like.
  - Google: "Raw dense float feature vector."
- `descriptorFloatBeforeProjection` (supporting) The image feature numbers before they are compressed into an embedding.
  - Google: "Raw dense float feature vector prior to embedding. Only for Starburst V6."
- `descriptorShort` (supporting) A compact compressed version of the image's feature numbers.
  - Google: "Short descriptor for image content features, e.g. compressed bytes. This is the compressed version of descriptor_float below. It can be can be decompressed to descriptor_float with a tiny bit of compression error (in most cases it should be totally fine)."
- `starburstTokens` (supporting) Short codes standing for the visual clusters an image belongs to.
  - Google: "Starburst tokens."
- `starburstTokensDistances` (supporting) How far the image sits from each of the visual clusters assigned to it.
  - Google: "Squared distance of the current embedding to each cluster center. Elements are aligned with starburst_tokens."

### ImageRepositoryContentBasedVideoMetadata

- `cloudSpeechSignals` (supporting) Speech transcript generated for the video by the Cloud Speech API.
  - Google: "Transcript generated from Cloud Speech API"
- `featureSetData` (supporting) Stored set of video understanding features describing the video's content.
  - Google: "Video Understanding Golden features. (go/amarna-video-signals#golden-signals) Note: Golden6 features (names matching &quot;video_"
- `s3Asr` (supporting) Speech transcript generated for the video by the internal speech engine.
  - Google: "Trnascript generated through AMARNA_CLOUD_SPEECH asset in Venom. Note that AMARNA_CLOUD_SPEECH uses S3 as the speech engine backend, similar to YT caption's SPEECH_RECOGNIZER asset. However, they may use different S3 models."
- `thumbnailQualityScore` (supporting) Model score for how visually appealing a video thumbnail is.
  - Google: "Thumbnail quality score predict how visual pleasing a thumbnail is, based on the model trained with deep neural networks.(go/thumb_features_dd) Note the signal currently only available for Youtube videos."
- `transcriptAsr` (supporting) Speech transcript of the video generated from the caption speech recognizer.
  - Google: "Speech related metadata The transcript_asr field is generated from the YT caption's SPEECH_RECOGNIZER asset."

### ImageRegionsImageRegion

- `boundingBoxScore` (supporting) How confident the system is in that detected rectangle.
  - Google: "The confidence score associated with the bounding box."
- `knnScore` (supporting) How visually similar this region is to its closest look-alikes.
  - Google: "The score for this region based on how visually similar its neighbors are."
- `labelGroup` (supporting) The set of labels attached to this part of the image.
  - Google: "The label group corresponding to the first LabelParams listed in ImageRegionsConfig."
- `primaryLabel` (supporting) The best label describing what is in this part of the image.
  - Google: "The primary label associated with the region. Specifically, the highest-scored whitelisted label associated with the region. See ImageRegionsConfig for details on the whitelist."

### PerDocData

- `s3AudioLanguage` (supporting) The spoken language of a watch page's main video, detected from the audio.
  - Google: "Primary video's audio language classified by S3 based Automatic Language Identification (only for watch pages)."
- `videoLanguage` (supporting) The spoken language of a watch page's video, detected from the audio.
  - Google: "Audio-based language classified by Automatic Language Identification (only for watch pages)."
- `watchpageLanguageResult` (supporting) The language of a watch page as judged by a dedicated model.
  - Google: "Language classified by the WatchPageLanguage Model (go/watchpage-language). Only present for watch pages."

### ImageUnderstandingIndexingLabel

- `canonicalText` (supporting) Human readable text of the label attached to image content.
  - Google: "Human readable text."
- `metaData` (supporting) Extra label details covering topicality, visibility and attributes.
  - Google: "Meta data for topicality, visible labels, attribute, etc."
- `score` (supporting) Confidence score for an image label.
  - Google: "Confidence score."

### QualityOrbitOrbitImageIntent

- `imageIntent` (supporting) Which intent this image classification entry is about.
  - Google: "Intent of this proto instance."
- `score` (supporting) How strongly the image matches this intent.
  - Google: "Score of the intent."
- `trigger` (supporting) Whether the image intent passed its default threshold.
  - Google: "Whether the intent triggered with the default threshold or not."

### CompositeDoc

- `docImages` (supporting) Data about the images chosen to represent this page.
  - Google: "Info about &quot;selected&quot; images associated with the document for which we (already) have ImageData. For each image URL, some fixed number of documents are selected as web referrers for the image URL, and within those selected documents, we say the image is &quot;selected&quot;. Within the..."
- `docVideos` (supporting) Data about videos embedded in the page.
  - Google: "Info about videos embedded in the document."

### ImageContentQueryBoostQueryBoost

- `boost` (**core**) A multiplier that raises or lowers an image's score for a particular query.
  - Google: "Score multiplier (fully normalized 1 is nop)."
- `query` (supporting) The cleaned-up query text that a per-query image boost applies to.
  - Google: "Canonicalized query string."

### ImageRepositoryAmarnaCloudSpeechSignals

- `results` (supporting) Raw speech-to-text output returned by the Cloud Speech API for the video.
  - Google: "Raw results from Cloud Speech API"
- `transcriptAsr` (supporting) The full stitched speech transcript of the video with word timing offsets.
  - Google: "This field contains full (stitched) transcription, word-level time offset , and word-level byte offset. The value of this field is derived from the SpeechRecognitionResult field above."

### IndexingVideosAsrTranscriptRepairAnnotation

- `numGibberishSegments` (supporting) How many transcript segments were judged to be gibberish.
  - Google: "The number of the above segments that were classified as gibberish."
- `numSegmentsClassified` (supporting) How many transcript segments were sent off for gibberish classification.
  - Google: "The number of ASR segments that were sent for classification."

### MediaIndexRegion

- `entityFields` (supporting) The entities recognized inside a marked region of an image.
  - Google: "Detected Entities found within this region."
- `labels` (supporting) Labels with confidence scores for an image region, stored to make sorting fast.
  - Google: "The labels associated with the region encoded as a SparseFloatVector to facilitate dot product computation during sorting. The columns are the fingerprints of the labels and the values are the corresponding confidence scores. The vector is L2 normalized."

### MediaIndexVideoCentroidDomainScore

- `numDocs` (supporting) How many pages from that domain were used to compute the video domain score.
  - Google: "Number of pages from the domain used to generate this DomainScore."
- `score` (supporting) A score that is lower when a video appears across more varied pages of a domain.
  - Google: "In general, lower scores indicate the video is appearing on more diverse pages."

### PornFlagData

- `numberFaces` (supporting) How many faces were detected in the image.
  - Google: "number of faces"
- `ocrAnnotation` (supporting) Text read out of the image by OCR, along with notes about it.
  - Google: "Information about image OCR text. For details see image/safesearch/content/public/ocr_annotation.proto."

### QualityOrbitAsteroidBeltImageIntentScores

- `intents` (supporting) The list of intents assigned to an image.
  - Google: "The unique identifier for an Asteroid Belt document intent is being reused here"
- `scores` (supporting) The strength of each image intent, on a 0 to 100 scale.
  - Google: "The intent scores, scaled to integers between 0 and 100 for compactness."

### QualityNsrNsrData

- `isVideoFocusedSite` (supporting) Whether most of the site's pages are video watch pages.
  - Google: "Bit to determine whether the site has mostly video content, but is not hosted on any known video-hosting domains. Site is considered to be video-focused, if it has > 50% of the URLs with watch pages (with smoothing prior). ariane/4045246"

### QualityOrbitAsteroidBeltDocumentIntentScores

- `imageIntentScores` (supporting) Intent scores for each image on the page, keyed by image id.
  - Google: "Map of imageid key to ImageIntentScores, for images on cdoc.doc_images"

### ImageRepositoryNimaOutput

- `score` (supporting) A model score rating the quality of the image.
  - Google: "NIMA score."

### ClassifierPornQueryStats

- `queryTextPornScore` (supporting) A click weighted average of how adult the queries that click this image are.
  - Google: "A query text porn score for the queries which have clicks to the image: query_text_porn_score := sum(clicks(query) * text_porn_score(query)) / sum(clicks(query))"

### CorpusSelectionInfo

- `corpusScore` (supporting) A per-corpus score for an image.
  - Google: "Corpus specific score for an image"

### ImageMustangImageLinkSelectionInfo

- `webRelevanceScore` (supporting) How well an image matches the page it was picked from.
  - Google: "score calculated in image selection phase, higher imagelink_selection_score more relevant the link is related to the web page"

### ImageRepositoryDeepImageEngagingnessOutput

- `score` (supporting) Model score predicting how engaging an image is.
  - Google: "DeepImageEngagingness score."

### ImageRepositorySpeechRecognitionAlternative

- `transcript` (supporting) The recognized spoken text from the audio.
  - Google: "Transcript text representing the words that the user spoke."

### ImageUnderstandingIndexingAnnotation

- `labelGroup` (supporting) Label annotations describing what is inside a detected box in an image.
  - Google: "Multiple label annotations for this bounding box."

### PseudoVideoDataTranscript

- `Text` (supporting) The full spoken-word transcript of the video or audio.
  - Google: "The complete transcription text."

### QualityOrbitOrbitImageIntents

- `intents` (supporting) The image intents that scored high enough to keep.
  - Google: "Intents with non-trivial scores."

### QualityVidyaVideoLanguageVideoLanguage

- `language` (supporting) The spoken language detected in the video's audio.
  - Google: "Audio language of video classified by Automatic Language Identification. It corresponds to the first language (the highest confidence) in ALIResults.lang_results."

### QualityWebanswersVideoTranscriptAnnotations

- `asrRepair` (supporting) The outcome of checking how good the video's automatic transcript is.
  - Google: "The results of ASR transcript quality analysis."

### SafesearchVideoContentSignals

- `videoClassifierOutput` (supporting) The combined output of the SafeSearch classifiers run on a video.
  - Google: "Output of all SafeSearch video classifiers in Amarna."


## freshness (67)

### PerDocData

- `datesInfo` (supporting) Encoded information about the page's dates, such as whether its dates look old.
  - Google: "Stores dates-related info (e.g. page is old based on its date annotations). Used in FreshnessTwiddler. Use encode/decode functions from quality/timebased/utils/dates-info-helper-inl.h"
- `domainAge` (supporting) The age of the domain, stored as a 16-bit value.
  - Google: "16-bit"
- `eventsDate` (supporting) The start dates of events listed on the page, one date per event.
  - Google: "Date for Events. A web page might list multiple events with different dates. We only take one date (start date) per event."
- `freshboxArticleScores` (supporting) Packed scores from freshness classifiers, including news article and live blog scores.
  - Google: "Stores scores of freshness-related classifiers: freshbox article score, live blog score and host-level article score. The encoding/decoding API is in quality/freshness/freshbox/goldmine/freshbox_annotation_encoder.h. To use this field, you MUST join g/pq-classifiers-announce and add your use case at"
- `isHotdoc` (supporting) Flag set by the fresh-document pipeline marking this as a currently hot document.
  - Google: "Set by the FreshDocs instant doc joiner. See //indexing/instant/hotdocs/README and"
- `lastSignificantUpdate` (supporting) The timestamp of the last meaningful change to the document.
  - Google: "Last significant update of the document. This is sourced from the quality_timebased.LastSignificantUpdate proto as computed by the LSUSelector from various signals. The value is a UNIX timestamp in seconds."
- `lastSignificantUpdateInfo` (supporting) Extra detail recording where the last-significant-update timestamp came from.
  - Google: "Metadata about last significant update. Currently this only encodes the quality_timebased.LastSignificantUpdate.source field which contains the info on the source of the signal. NOTE: Please do not read the value directly. Use helpers from quality/timebased/lastsignificantupdate/lsu-helper.h..."
- `semanticDate` (supporting) An estimated date for the page's content, derived from the page, its anchors and related pages.
  - Google: "SemanticDate, estimated date of the content of a document based on the contents of the document (via parsing), anchors and related documents. Date is encoded as a 32-bits UNIX date (1970 Jan 1 epoch). Confidence is encoded using a SemanticDate specific format. For details of encoding, please refer..."
- `semanticDateInfo` (supporting) Packed confidence and metadata about the page's estimated date, used by freshness reranking.
  - Google: "Info is encoded using a SemanticDate specific format. Contains confidence scores for day/month/year components as well as various meta data required by the freshness twiddlers."
- `timeSensitivity` (supporting) An encoded measure of how time-sensitive the document is.
  - Google: "Encoded Document Time Sensitivity signal."

### NlpSaftDocument

- `bylineDate` (supporting) The byline date of the page, stored as a timestamp and shown in search snippets.
  - Google: "Document's byline date, if available: this is the date that will be shown in the snippets in web search results. It is stored as the number of seconds since epoch. See segindexer/compositedoc.proto"
- `contentFirstseen` (supporting) The earliest time Google crawled or indexed the page with content, as a timestamp.
  - Google: "Stores minimum of first time google successfully crawled a document, or indexed the document with contents (i.e, not roboted). It is stored as the number of seconds since epoch. See quality/historical/signals/firstseen/firstseen.proto"
- `contentage` (supporting) How old the content of the page is, stored as a timestamp.
  - Google: "Age of the content of the document. For details, see: quality/historical/shingle/signals/contentage.proto The format has been translated to a canonical timestamp (seconds since epoch)."
- `date` (supporting) The document's anchor date written as a full year-month-day timestamp.
  - Google: "Document anchor date in YYYYMMDDhhmmss format."
- `lastSignificantUpdate` (supporting) The time of the last meaningful change to the page content.
  - Google: "Last significant update of the page content, in the same format as the contentage field, and also derived from ContentAge.last_significant_update in quality/historical/shingle/signals/contentage.proto."
- `syntacticDate` (supporting) A date taken from the page URL or title, stored as a timestamp.
  - Google: "Document's syntactic date (e.g. date explicitly mentioned in the URL of the document or in the document title). It is stored as the number of seconds since epoch. See quality/timebased/syntacticdate/proto/syntactic-date.proto"

### QualityTimebasedSyntacticDate

- `bylineDate` (supporting) The byline date, stored when it differs from the page's main date.
  - Google: "The following field is set only when the byline date is different from the &quot;date&quot; field above. Currently this happens when the byline date is within the 24 hours of the crawl time, or close but not exactly the same as blog post date due to time zone. The syntactic date is never later than..."
- `date` (supporting) The page's publication date as seconds since 1970.
  - Google: "The number of seconds since epoch (Jan 1, 1970). This can be negative to indicate a publication date that is before 1970. For example, the ones from NY Times archive: &quot;"
- `info` (supporting) Flag bits saying whether the byline date is considered high confidence.
  - Google: "Used to store extra information about the syntactic date. For now only two bits are set. Please refer to the encoding/decoding functions provided in: quality/timebased/syntacticdate/util.h Bit 1 = High confidence byline. This bit is set if the syntactic date has a byline date and this date is..."
- `precisionMark` (supporting) How precise the extracted date is, for example day, month or year.
  - Google: "The precision mark should be of type PRECISION_MARK."
- `timeZoneOffsetSeconds` (supporting) The time-zone shift in seconds applied when working out the date.
  - Google: "Indicates the time zone offset in seconds applied to derive"

### AnchorsAnchor

- `creationDate` (supporting) When the link was first seen, also used as retweet time in fresh indexing.
  - Google: "used for history - the first and last time we have seen this anchor. creation_date also used for Freshdocs Twitter indexing, a retweet is an anchor of the original tweet. This field records the time when a retweet is created."
- `encodedNewsAnchorData` (supporting) Packed data marking links that come from newsy, high quality sites.
  - Google: "Encoded data containing information about newsiness of anchor. Populated only if anchor is classified as coming from a newsy, high quality site. Encoded data for anchor sources are being stored in googledata/quality/freshness/news_anchors/encoded_news_anchors_data.txt Scores are being computed with..."
- `firstseenDate` (supporting) Day the link was first seen, counted from a fixed 1994 date.
  - Google: "# days past Dec 31, 1994, 23:00:00 UTC (Unix time @788914800) that this link was first seen. Should never occupy more than 15 bits. NOTE: this is NOT the same as creation_date; firstseen_date is filled during link extraction"
- `firstseenNearCreation` (supporting) Whether the first-seen date is close to when the link was actually added.
  - Google: "true if we think 'firstseen_date' is an accurate estimate of when the link was actually added to the source page. false if it may have existed for some time before we saw it."
- `lastUpdateTimestamp` (supporting) When this link record was last refreshed during indexing.
  - Google: "Used for history and freshness tracking - the timestamp this anchor is updated in indexing."

### ImageData

- `contentFirstCrawlTime` (supporting) The earliest crawl time seen for any near duplicate of this image.
  - Google: "Earliest known crawl time among all neardups of this image (go/imagecontentage)."
- `firstCrawlTime` (supporting) The earliest time this image is known to have existed.
  - Google: "Earliest known timestamp about this image. Today, this is the timestamp when the content key was generated for this image. The time is in seconds."
- `firstTimeSeenOnDocSec` (supporting) The first time this image address was seen on the page that shows it.
  - Google: "The first time this image URL was seen on the containing web page. Only set during web indexing."

### QualityTimebasedPetacatDateUnreliability

- `dateExposureScore` (supporting) How prominently dates appear on pages of this kind, smoothed to a score.
  - Google: "This is date_exposure after sigmoid transformation."
- `dateVsContentageDistributionSkew` (supporting) A component score comparing stated dates against page age.
  - Google: "Auxiliary scores. The unreliable_dates_score is a product of these scores excl. date_exposure. The definition for each of the scores you can find at go/unreliable-dates-dd"
- `unreliableDatesScore` (supporting) The final untrustworthy-dates score before the date-prominence part.
  - Google: "This is a final score excl. date exposure component."

### RepositoryWebrefSemanticDateRange

- `confidence` (supporting) How sure the system is that an extracted date range actually applies to the document.
  - Google: "Indicates how confident we are this extracted range is relevant to a document (document to be infered from context)."
- `end` (supporting) The end date pulled from the entity's knowledge graph data.
  - Google: "End date extracted from the entity along end_source_property."
- `start` (supporting) The start date pulled from the entity's knowledge graph data.
  - Google: "Start date extracted from the entity along start_source_property."

### TrawlerFetchReplyDataCrawlDates

- `NotChangedDate` (supporting) Timestamp for when the page was last actually fetched from the web.
  - Google: "fetched from the web. Timestamp indicates when"
- `OriginalCrawlDate` (supporting) Timestamp for when the page was originally crawled.
  - Google: "Timestamp when the page was"
- `ReuseDate` (supporting) Timestamp for when the page was last checked and found unchanged.
  - Google: "the page was last checked but found to be the same as before. If set, timestamp to indicate"

### QualityTimebasedDateUnreliability

- `unreliableDatesScore` (supporting) A score for how untrustworthy the dates on this page look.
  - Google: "If scores are missing, the date is reliable by default. max(petacat.unreliable_dates_score)"
- `unreliableDatesScoreExposureAdjusted` (supporting) The date-unreliability score adjusted by how prominent dates are on the page.
  - Google: "max(petacat.unreliable_dates_score * petacat.date_exposure_score)"

### CompositeDocIndexingInfo

- `urlChangerate` (supporting) How often the page's content changes.
  - Google: "Changerate information for this doc (see crawler/changerate/changerate.proto for details)."
- `urlHistory` (supporting) A record of the page's recent content changes.
  - Google: "Url change history for this doc (see crawler/changerate/changerate.proto for details). Note if a doc has more than 20 changes, we only keep the last 20 changes here to avoid adding to much data in its docjoin."

### WeboftrustLiveResultDocBoostData

- `boostLevel` (**core**) How much a page's score is boosted while its live result is timely, from zero to one.
  - Google: "Identifies the degree to which the existence of this LiveResult should boost a query's score (when the query is performed within the hot_times range). This field is always in the range [0,1]. A missing field, a value of 0, or a value outside the legal range indicates that no boosting is performed...."
- `hotTimes` (supporting) The time window during which the live result counts as timely.
  - Google: "Specifies the time range within which this LiveResult is relevant. Used for deciding whether the rank of the corresponding page should be boosted. For example, this range can be set to encompass a few days before and after a sports game to which the page refers. If this field is missing, no..."

### CompositeDoc

- `registrationinfo` (supporting) When this domain was most recently registered and when it expires.
  - Google: "Information about the most recent creation and expiration of this domain. It's extracted from domainedge signal."
- `urldate` (supporting) A date parsed out of the page's web address.
  - Google: "Date in the url extracted by quality/snippets/urldate/date-in-url.cc This is given as midnight GMT on the date in question."

### QualityTimebasedLastSignificantUpdateAdjustments

- `isUpperboundTimestampPrecise` (supporting) Whether the upper-bound timestamp came from a precise passage date.
  - Google: "The timestamp is precise when it's derived from existing (>March 2022) passage timestamp."
- `upperboundTimestampInSeconds` (supporting) The latest time the page's last-update date is allowed to be.
  - Google: "The upperbound value derived from passage timestamps. If present, the LSU date should never exceed this value. Design doc: go/lsu-max-passage-timestamp"

### QualityCopiaFireflySiteSignal

- `numOfArticlesByPeriods` (supporting) How many news-quality articles a site published in each of the last 30-day windows.
  - Google: "number of articles (lattice article score is 0.8 or more) sliced by 30 days (num_of_articles_by_periods[0] is the newest)."
- `numOfUrlsByPeriods` (supporting) How many pages a site published in each of the last 30-day windows.
  - Google: "number of urls sliced by 30 days (num_of_urls_by_periods[0] is the newest)."

### ImageExifImageEmbeddedMetadata

- `captureTime` (supporting) The time the photograph was taken, from the image file's metadata.
  - Google: "Capturing settings in time_t"
- `modificationTime` (supporting) The time the image file was last modified, from its metadata.
  - Google: "in time_t"

### QualityTimebasedLastSignificantUpdate

- `date` (supporting) The time the page was judged to have last meaningfully changed.
  - Google: "LastSignificantUpdate as UNIX timestamp in seconds. This is the new signal (go/lsu-dd) from LSU Selector V2 (once that is enabled, see b/171879888 for status), falling back to the legacy V1 signal if the HIGH_PRECISION signal does not exist. Please use the 'source' field to determine where the..."

### AnchorsAnchorSource

- `crawlTimestamp` (supporting) When the linking page was crawled.
  - Google: "Source page crawl timestamp."

### RepositoryWebrefDocumentMetadata

- `crawlTime` (supporting) When the page was crawled.
  - Google: "The timestamp of when the document was crawled (if known). Copied from CompositeDoc.Content.CrawlTime."

### RepositoryWebrefWebrefEntities

- `dateRange` (supporting) Date ranges judged most relevant to the page, such as a film's release date.
  - Google: "Dates ranges that are most relevant to the document. E.g. on a document about Dune the 2021 movie, this might hold the release date of that movie."

### QualityTimebasedPageType

- `isPageWithFreshRepeatedDates` (supporting) Whether the page shows a run of recent repeated dates.
  - Google: "Set to true if this page has a fresh repeated date sequence."

### WeboftrustLiveResultsDocAttachments

- `docBoost` (supporting) The bundle of live-result boost information attached to a document.
  - Google: "Information about potential rank boosting for the document by virtue of its Live Result feed."

### GDocumentBaseContent

- `CrawlTime` (supporting) When the page was crawled, in seconds since 1970.
  - Google: "Seconds since Unix epoch."

### ImageExifIPTCMetadata

- `dateCreated` (supporting) The creation date recorded in the image's embedded metadata.
  - Google: "Time (in seconds)"

### IndexingSignalAggregatorAgeWeightedCoverageData

- `firstCoverageTimestamp` (supporting) When this URL first got any coverage data.
  - Google: "Epoch seconds at which this url first gets coverage data."

### IndexingSignalAggregatorUrlScore

- `firstServedTimestamp` (supporting) The first time this document was ever served anywhere.
  - Google: "The timestamp of the first time this document is served anywhere."

### ResearchScienceSearchSourceUrlDocjoinInfo

- `latestPageUpdateDate` (supporting) The date on the page that reflects when its content was published.
  - Google: "The syntactic date of a dataset document that reflects the publication date of the content."

### ScienceIndexSignal

- `PublicationYear` (supporting) The year the article was published.
  - Google: "Publication date."

### ShingleSource

- `timestamp` (supporting) When this source was first seen.
  - Google: "First-seen timestamp of the source."

### SnapshotSnapshotMetadata

- `crawlTimestamp` (supporting) The time the page's main file was fetched, in seconds since epoch.
  - Google: "The time at which the main resource of the Snapshot was fetched, in seconds since epoch. Note that the various page dependencies may have been fetched at much earlier points in time (hours, maybe days) and that this could be off from the actual rendering time."

### WeboftrustTimeRange

- `startUnixTime` (supporting) The start time of a live result's relevant time window.
  - Google: "Start and end times should always appear. Marked as optional to avoid breaking code."


## click_engagement (57)

### IndexingSignalAggregatorAgeWeightedCoverageData

- `averageChanceTime` (supporting) The average time of the time-decayed chances a URL had to be shown.
  - Google: "Weighted averged timestamps of the decayed chances."
- `chances` (supporting) The time-decayed count of chances the URL had to be seen, used as the denominator for click and impression rates.
  - Google: "Numbers below are all total in the decayed manner. To get rate of impression/clicks, divide by chances."
- `dwells` (supporting) Count of time-decayed dwells the page got from Knowledge Panel and Web Answers.
  - Google: "Dwells from KnowledgePanel and WebAnswers."
- `intervalData` (supporting) Tracks the average time between clicks, good clicks, and weighted impressions for the URL.
  - Google: "Interval Data to track the average time between clicks_total, clicks_good, and ctr_weighted_impression."
- `lastDwellDateInDays` (supporting) The most recent day the page received a Knowledge Panel or Web Answer dwell.
  - Google: "Indicates the date when this document received the last KnowledgePanel or WebAnswer dwell. Note: The date is identified in terms of number of days since Epoch."
- `lastGoodClickDateInDays` (supporting) The most recent day the page received a good click.
  - Google: "Indicates the date when this document received the last good click. Note: The date is identified in terms of number of days since Epoch."
- `lastImpressionDateInDays` (supporting) The most recent day the page was shown in results.
  - Google: "Indicates the date when this document received the last impression. Note: The date is identified in terms of number of days since Epoch."
- `lastLuDwellDateInDays` (supporting) The most recent day the page received a Local Universal dwell.
  - Google: "Indicates the date when this document received the last LocalUniversal dwell. Note: The date is identified in terms of number of days since Epoch."
- `lastPseudoImpressionsDateInDays` (supporting) The last day the page was retrieved as a result but withheld because of its age.
  - Google: "Indicates the date when this document received the last pseudo-impression. I.e., when it was retrieved as a result but GWS would not show it because of the document's age in the index. Note: The date is identified in terms of number of days since Epoch."
- `luDwells` (supporting) Count of time-decayed dwells the page got from Local Universal results.
  - Google: "Dwells from LocalUniversal."
- `totalChances` (supporting) The raw, undecayed number of chances this URL had to be shown.
  - Google: "Total number of chances on this urls (not decayed)."

### QualityNavboostCrapsCrapsData

- `features` (supporting) Click statistics broken out for particular slices such as mobile users in one city.
  - Google: "Contains CrapsClickSignals for specific features. (i.e. for mobile, US, metro id - 123&quot;)"
- `impressions` (supporting) How many times the result was shown to users.
  - Google: "These fields may become legacy fields; we may retire them and use the squashed field (below) instead, to allow for some nesting."
- `lastLongestClicks` (supporting) How many clicks were the final and longest click in a related search session.
  - Google: "The number of clicks that were last and longest in related user queries."
- `mobileSignals` (supporting) Click statistics gathered only from mobile searches.
  - Google: "The portion of this CrapsData aggregated on data from tier 1/2 mobile interfaces in QSessions."
- `packedIpAddress` (supporting) The packed IP address used to look up a click-trust prior.
  - Google: "Contains a packed string in network byte order, as expected by CrapsIpPrior. Only populated if we looked up the ip_prior_bad_fraction at retrieval time."
- `patternSccStats` (supporting) Statistics about the individual URLs that contributed to a pattern's click data.
  - Google: "For pattern data, this will contain stats of the SCC's of the individual urls contributing to the pattern."
- `unscaledIpPriorBadFraction` (supporting) The raw share of bad activity expected from this IP address, before scaling.
  - Google: "Used to assign a prior based on IP address. See quality/navboost/craps/craps-ip-prior.h. This value is prior to the linear transformation (scaling / offset / min / max) that's applied in craps-penalty.cc."
- `unsquashed` (supporting) Uncompressed click statistics for this record.
  - Google: "We will start using this one for the retuning rollout."
- `voterTokenCount` (supporting) How many distinct user tokens contributed to this click record.
  - Google: "The number of distinct voter tokens (a lower bound on the number of distinct users that contributed to the entry, used for privacy-related filtering)."

### ResearchScienceSearchNavboostQueryInfo

- `impCount` (supporting) Estimated number of times this page was shown for this query.
  - Google: "imp_count stores an estimate of the number of impressions for this tuple."
- `lccCount` (supporting) Estimated number of long clicks recorded for this query and page.
  - Google: "lcc_count stores an estimate of the number of long clicks for this tuple. NOTE: It is similar to query_doc_count, but calculated in different manner."
- `query` (supporting) The query text that these click counts belong to.
  - Google: "The query string."
- `queryCount` (supporting) How many times this query was seen overall.
  - Google: "The query_count stores the counts on this query."
- `queryDocCount` (supporting) Number of long clicks on this particular query and page pair.
  - Google: "The query_doc_count stores the number of long-clicks on this pair."

### QualityNsrNsrData

- `chromeInTotal` (supporting) How much Chrome viewing traffic the site gets overall.
  - Google: "Site-level Chrome views."
- `impressions` (supporting) How often the site's pages were shown in results.
  - Google: "Site-level impressions."
- `pnav` (supporting) A site-level fraction describing navigational click behavior.
  - Google: "Fractional signals."
- `pnavClicks` (supporting) The click count used as the denominator of the pnav fraction.
  - Google: "denominator for the pnav computation"

### ImageExactBoostNavQuery

- `confidence` (supporting) How confident the system is that this image matches the stored query.
  - Google: "Associated confidence scores for the image for the query."
- `imageClickRank` (supporting) Where the image ranks for this query based on clicks it received.
  - Google: "Click-based rank of the image for this query."
- `navQuery` (supporting) The tidied-up text of a query the image is strongly associated with.
  - Google: "The normalized raw query text."

### VideoContentSearchVideoInfo

- `crapsData` (supporting) Stored click and impression data for the video page.
  - Google: "Craps data from the video cdoc."
- `numViews` (supporting) How many times the video has been viewed.
  - Google: "Number of views."
- `uniqueChromeViews` (supporting) How many unique Chrome visits the page received.
  - Google: "Number of unique visits in Chrome."

### CompressedQualitySignals

- `crapsAbsoluteHostSignals` (supporting) Raw host-level impression counts used by the Craps click and impression system.
  - Google: "Impressions, unsquashed, host level, not to be used with compressed ratios. Not to be used in Pattern Data."
- `crapsNewUrlSignals` (supporting) URL-level click and impression data for the Craps system.
  - Google: "For craps"

### QualityNavboostCrapsCrapsClickSignals

- `absoluteImpressions` (supporting) How many times results from this host were shown, as a raw count.
  - Google: "Thus far this field is only used for host level unsquashed impressions. When compressed (e.g., in perdocdata.proto, CompressedQualitySignals), this value is represented individually and thus is generally incompatible with the other values which are compressed as click-ratios."
- `unicornClicks` (supporting) The share of clicks tied to a particular internal class of user sessions.
  - Google: "The subset of clicks that are associated with an event from a Unicorn user."

### CompositeDocIndexingInfo

- `normalizedClickScore` (supporting) A click score rescaled to match the score of a similarly ranked normal page.
  - Google: "This score is calculated by re-mapping the back onto the partition's score distribution, such that the score represents the score of the equivalently ranked organically-selected document."
- `rawNavboost` (supporting) The page's own click boost count before duplicates are merged in.
  - Google: "The raw navboost count for the canonical url without aggregating the navboost from dup urls. This field is used when building forwarding map."

### ImageData

- `h2i` (supporting) How often people hover over this image compared with seeing or clicking it.
  - Google: "'Hovers to Impressions' and 'Hovers to Clicks' ratios for an image. These are considered Search CPS Personal Data due to concerns that they may be used to reidentify or confirm the presence of specific singleton (unique) queries."
- `imageQualityClickSignals` (supporting) Click behavior used to judge how useful and appealing an image is.
  - Google: "Click signals for measuring image quality (e.g., usefulness, presentation, appealingness, and engagingness). Click signals are considered Search CPS Personal Data."

### RepositoryWebrefDocumentMetadata

- `totalClicks` (supporting) The total number of clicks on this page taken from navboost data.
  - Google: "The total clicks on this document, taken from navboost data."

### ToolBarPerDocData

- `VisitorsPastDay` (supporting) Count of distinct Google Toolbar visitors this page had in the past day.
  - Google: "Indicates how many distinct toolbar visitors this page had in the past day. Will only be present if the number is reasonably large."

### QualityNavboostCrapsFeatureCrapsData

- `signals` (supporting) The click statistics for this particular locale slice.
  - Google: "CRAPS Signals for the locale."

### QualitySitemapTargetGroup

- `topUrl` (supporting) The links with the most browser transition clicks in this group.
  - Google: "A list of top urls with highest two_level_score, i.e., chrome_trans_clicks."

### IndexingSignalAggregatorSccSignal

- `numImageUrls` (supporting) How many of the URL's clicks were image clicks, as a count or a ratio.
  - Google: "This represents the number of urls with image clicks. A url can have both image and non-image clicks, in which case we set num_image_urls to be the ratio of image_clicks vs total clicks. For example, if a url has 10 total clicks and 7 image clicks, num_image_urls will be set to 0.7."

### CountryClickDistribution

- `total` (supporting) The total number of clicks counted for the page or domain.
  - Google: "To store total clicks on this page/domain."

### CountryCountryAttachment

- `metroNavboost` (**core**) Per-metro NavBoost multipliers to apply to the page.
  - Google: "Metro navboost: list of (NavBoost feature V2, navboost float) pairs."

### CountryMetroNBFeature

- `navboost` (**core**) The multiplier to apply to a result for a given locale and query.
  - Google: "This is the multiplier to apply to the result for this locale & query. NOTE: This is for serving purposes only and should not be populated in the index."

### ImageQualityNavboostImageQualityClickSignals

- `gveClicks` (**core**) Counts of clicks judged to be good ones for this image.
  - Google: "Good clicks that are defined using GVE (go/gve-history)."

### ImageRegionsImageRegions

- `hasNavboost` (supporting) Whether the image has Navboost click data attached to it.
  - Google: "True if the image has navboost."

### IndexingSignalAggregatorUrlScore

- `isImportant` (supporting) Marks a URL as having a notable signal, such as good clicks.
  - Google: "Whether this url has important signal. Used for keeping patterns that match too few URLs but some of them have good clicks."

### PornFlagData

- `queryStats` (supporting) Statistics about the queries that led to this image, taken from click logs.
  - Google: "Query statistics from Navboost logs. For more details see classifier/porn/proto/image_porn_classifier_signals.proto."

### RepositoryWebrefRefconQueryStats

- `aggregatedQueryCount` (supporting) Total query count leading to the document, usable to estimate its popularity.
  - Google: "Total query count for the document from all the query terms. Can be used to estimate the popularity of the document."

### ResearchScienceSearchSourceUrlDocjoinInfo

- `navboostQuery` (supporting) The list of queries and click counts recorded for the page.
  - Google: "A sequence of Navboost queries for the dataset source_url."


## personalization_local (45)

### CountryCountryAttachment

- `clickDistribution` (supporting) How a page's clicks spread across countries, used to guess its country.
  - Google: "Store weighted click distribution for page level country-id classification."
- `geoLocations` (supporting) The specific places, such as cities or states, tied to the page.
  - Google: "New MetroID: Now called GeoLocations since the locations could be sublocalities, cities or states. GeoLocations are always more fine grained than country. TODO (jayeshv): Once new MetroID/GeoLocations is launched everywhere, deleted old MetroID related fields."
- `localCountries` (supporting) The countries the page is considered local to.
  - Google: "two-letter(lower-case) countrycode, e.g. us countries that is local to"
- `localCountryCodes` (supporting) The stored numeric country codes for the page.
  - Google: "Fields that actually store the country id in docjoins. The format of this data is defined in //i18n/identifiers/stableinternalregionconverter.cc. Converter defined there can be used to convert it to RegionCode format."
- `metroIdList` (supporting) Metro-area features tied to the page, with the surrounding province.
  - Google: "Metro locations: list of NavBoost feature V2 associated with a doc, along with the enclosing province. Metro locations with new tags."
- `relatedCountries` (supporting) Countries the page relates to without being local to them.
  - Google: "two-letter(lower-case) countrycode, e.g. us countries that is related to, but not local to"
- `salientCountries` (supporting) The countries a document is most relevant to.
  - Google: "[Experimental]: Top salient countries for a doc. If a country can not be found on this field it can be considered that this doc is not relevant to it."
- `superGlobal` (supporting) A flag marking a page as super global, which gets a smaller country demotion.
  - Google: "Super global pages get lesser demotion than global pages. A document can only be either global or super_global but not both."
- `urlPatternBasedLanguage` (supporting) Language and country guessed from the shape of the URL.
  - Google: "Language and country extracted using the URL pattern map."
- `wmxCountry` (supporting) The country a site owner declared in the webmaster console.
  - Google: "Country specified for a web-site through webmaster console."

### RepositoryAnnotationsGeoTopic

- `address` (supporting) The city, region and country containing the place the page is about.
  - Google: "Stores parent/container information containing city, province & country."
- `componentScores` (supporting) The raw scores that were combined into the final place score.
  - Google: "The raw scores used to calculate the normalized_score. Note that not all these scores may be exposed to the users."
- `confidence` (supporting) How confident the system is that the page is about this place.
  - Google: "A score [0, 1] indicating the confidence."
- `denseCity` (supporting) Whether the place is a densely populated city.
  - Google: "Is this a dense city (e.g., population > 100k)?"
- `latE7` (supporting) The latitude and longitude of the place.
  - Google: "Latitude and Longitude of the location."
- `locationName` (supporting) The standardized name of the place.
  - Google: "Name of the Geographic location. This is the normalized name."
- `normalizedScore` (supporting) How likely it is that the page is about this place, from zero to one.
  - Google: "A score [0, 1] indicating the likelihood of the location being the GeoTopicality."
- `sumContainedPoiNormalizedScores` (supporting) The added-up scores of points of interest inside this area.
  - Google: "The sum of the normalized scores of POIs contained within a particular locality."

### PerDocData

- `brainloc` (supporting) Location information attached to the document.
  - Google: "Brainloc contains location information for the document. See ariane/273189 for details."
- `countryInfo` (supporting) The country information recorded for the document.
  - Google: "This field stores the country information for the document in the form of CountryAttachment."
- `geodata` (supporting) A compact blob of geographic data about the page.
  - Google: "geo data; approx 24 bytes for 23M U.S. pages"

### CountryGeoLocation

- `clickRadius50Percent` (supporting) The distance around the page's location that covers half of its clicks.
  - Google: "The radius (in miles) around the assigned location that the document gets 50% of its clicks."
- `confidencePercent` (supporting) How sure the system is about the assigned location, on a 0 to 100 scale.
  - Google: "Confidence mapped to [0, 100]. Converted to integer for efficient storage. Populated during index creation."
- `propagatedFromASubpage` (supporting) Whether the location came from a subpage rather than the page itself.
  - Google: "True if this location is assigned to one of the subpages, and not to the page itself. If the total number of locations assigned to all the subpages of a page is small (usually up to 5), then that page also gets assigned those locations, and this flag is set for those locations."

### LocalWWWInfoCluster

- `annotationConfidence` (supporting) Confidence that a business mention found on the page is really that business.
  - Google: "Confidence score for business mention annotations which is copied from LocalEntityAnnotations::location_confidence."
- `confidence` (supporting) Probability that this page is the business's own main page.
  - Google: "Probability that this is the authority page of the business. Same as LocalListing.authority_page_probability, only set for pages with page_type_flags & AUTHORITY."

### IndexingDupsLocalizedLocalizedCluster

- `boostSourceBlocker` (**core**) Whether the page may be a boost target but must never be boosted itself.
  - Google: "Defined as a source-blocker, a result which can be a boost target but should itself not be boosted (e.g. roboted documents). For more details on source and target blocking, please read through the code for quality/twiddler/impls/PROTECTED/local_result_twiddler_v2.cc"
- `documentLanguage` (supporting) The language detected from the page's own text.
  - Google: "The language of this document (as detected by on-page language detection, not influenced by external anchor signals or other indirect conclusions)."

### CountryGeoLocations

- `isNonLocationSpecific` (supporting) A flag for pages that get many clicks but belong to no particular place.
  - Google: "This will be set to true for documents which receive several clicks but are not assigned any location because the click distribution is flat. Typical examples are global sites like facebook.com, chains like walmart.com, informational sites like wikipedia.org etc. This flag is not propagated to..."
- `propagationDepthFromParent` (supporting) How many URL levels away the parent page that supplied the location is.
  - Google: "Depth of the URL from it's nearest parent in GeoLocation data. Webpages inherhit locations from their parent pages. For example, if foo.com/a is assigned location L1, and foo.com/a/b is not assigned any location, then"

### CountryMetroNBFeature

- `enclosingProvinceGeotoken` (supporting) A fingerprint of the state around a metro area, used to tell metros apart.
  - Google: "The enclosing_province_geotoken is a 32 bit fingerprint of the state encosing the (metro) id. MetroId's can span multiple states. Enclosing geotoken is filled in with the state name for disambiguation. ProvinceGeotoken field is different as it indicates an &quot;interest&quot;. Format: 32 bit..."
- `id` (supporting) A packed identifier combining country, language and metro area.
  - Google: "A 32 bit navboost v2 feature id encoding (country, language, metro). NavBoosterUtils class (google3/quality/navboost/nav_booster_utils.h) provides functions to decode this feature."

### QualitySalientCountriesSalientCountry

- `country` (supporting) The two-letter code of a country this document is about.
  - Google: "2-letter country format."
- `salience` (supporting) How strongly the document relates to that country, from zero to one.
  - Google: "How salient this country is for the document. [0,1] range."

### QualityNsrNsrData

- `localityScore` (supporting) How local the site is, as the locality part of a local authority signal.
  - Google: "Locality score of the site, i.e. the locality component of the LocalAuthority signal (see go/pq-localauthority)."

### AnchorsAnchorSource

- `localCountryCodes` (supporting) Countries the linking page is considered most relevant to.
  - Google: "Countries to which the source page is local/most relevant; stored as III identifiers for country/region codes (see"

### LocalWWWInfo

- `geotopicality` (supporting) Annotations about the geographic places a page is about, not specific businesses.
  - Google: "Information about geo locations, rather than individual businesses."

### RepositoryAnnotationsGeoTopicality

- `geotopics` (supporting) The list of places the page is about, strongest first.
  - Google: "The geotopics are ordered by normalized_score in descending order."

### CountryClickDistribution

- `confidence` (supporting) How trustworthy the recorded spread of clicks by country is.
  - Google: "To store confidence in the distribution in cases when total is not set."

### DocProperties

- `languages` (supporting) The languages the document is written in.
  - Google: "A Language enum value. See: go/language-enum"

### QualityGeoBrainlocBrainlocAttachment

- `topCitiesVocabIds` (supporting) The top locations linked to the document, with their scores, stored compactly.
  - Google: "Compressed top locations and their scores."

### QualitySalientCountriesSalientCountrySet

- `packedCountry` (supporting) Country codes and their salience values packed together for storage.
  - Google: "Packed Country and salience optimized for index storage"

### QualityShoppingShoppingAttachmentLocale

- `languageId` (supporting) A numeric language and region code kept for fast scoring.
  - Google: "Use integers for fast scoring. Note: 26 is UNKNOWN_LANGUAGE_ID, 0 is UNKNOWN region, see i18n::languages::Language and StableInternalRegionconverter Use -1 as default for both."

### ResearchScienceSearchSourceUrlDocjoinInfo

- `languageCode` (supporting) The detected language of the document.
  - Google: "The language of the document in the string representation of LanguageCode. Converts from Language Enum to LanguageCode through i18n/identifiers/langenclanguagecodeconverter.h Please use i18n/identifiers/languagecodeconverter.h for converting between LanguageCode and string representation."

### WWWDocInfo

- `languageTag` (supporting) The single most likely language of the document.
  - Google: "This returns the most probable language for the document. The complete set of languages is in the GenericSearchResponse. (If some future use requires all languages from the doc request, note that fetching that will require decoding the entire per-doc data attachment, which is a performance hit) Use..."


## site_structure (23)

### IndexingSignalAggregatorAggregatedScore

- `deviation` (supporting) How spread out the individual URL scores are within the group.
  - Google: "A number reflecting the deviation of Url scores."
- `maxScoreUrl` (supporting) The individual URL that had the highest score in this group.
  - Google: "Input UrlScore with max score."
- `meanScore` (supporting) The averaged score across all URLs in this group.
  - Google: "Overall stats that are only available in final aggregation results. The aggregated score."
- `minScoreUrl` (supporting) The individual URL that had the lowest score in this group.
  - Google: "Input UrlScore with min score."
- `numUrlsMatched` (supporting) How many URLs matched this pattern or class.
  - Google: "Final Stats that are also available in intermediate output. Number of Urls matching the class."
- `numUrlsWithSignal` (supporting) How many of the matching URLs actually had a signal value.
  - Google: "Not every matching url has a signal."
- `patternsUsedInMediation` (supporting) The list of URL patterns that actually contributed to the combined signal.
  - Google: "Optionally populated in mediators. A list of patterns that actually contributed to the final mediated signal."
- `percentile` (supporting) Score cut-offs that split the matching URLs into equal-sized buckets.
  - Google: "Score percentile of matching urls. If present, it has N entries for buckets of roughly equal number of urls. N is specified the aggregation. The value is the min score in that bucket."
- `scores` (supporting) The collected list of scores used to work out percentiles.
  - Google: "for calculating percentile"
- `singleUrlScore` (supporting) Holds the score when this record covers just one URL.
  - Google: "If this field presents, it is for a single url. No other field should appear."
- `totalScore` (supporting) A running sum of scores used to compute the mean.
  - Google: "summation varaible used to get mean"
- `totalWeight` (supporting) A running sum of weights used for weighted averages.
  - Google: "for calculating weighted mean/dev"

### QualityAuthorityTopicEmbeddingsVersionedItem

- `siteEmbedding` (supporting) A compact numeric summary of what a whole site or page is about.
  - Google: "Compressed site/page embeddings."
- `siteFocusScore` (supporting) A number for how tightly a site sticks to a single topic.
  - Google: "Number denoting how much a site is focused on one topic."
- `siteRadius` (supporting) How far a site's individual pages stray from the site's main topic.
  - Google: "The measure of how far page_embeddings deviate from the site_embedding."

### PerDocData

- `onsiteProminence` (supporting) A measure of how important the page is within its own site, from simulated traffic.
  - Google: "Onsite prominence measures the importance of the document within its site. It is computed by propagating simulated traffic from the homepage and high craps click pages. It is a 13-bit int."

### LocalWWWInfo

- `siteSiblings` (supporting) Per document counts of sibling pages on the same site, independent of any address.
  - Google: "These are per-document signals independent of any particular address."

### CompositeDocIndexingInfo

- `urlPatternSignals` (supporting) Signals drawn from the address pattern that feed the document's score.
  - Google: "UrlPatternSignals for this doc, used to compute document score in LTG (see indexing/signal_aggregator/proto/signal-aggregator.proto for details)."

### ImageData

- `codomainStrength` (supporting) Confidence that the image is hosted on a domain related to the page showing it.
  - Google: "Like is_visible, this is a property of the (web-doc, img_url) pair not just the image. A high codomain_strength indicates high confidence based on collected stats that the image is hosted on a companion domain. If not enough stats are available for codomain strength, this field may be absent in..."

### IndexingSignalAggregatorSccData

- `pattern` (supporting) The closest matching URL-pattern record for this data.
  - Google: "The most immediate pattern data."

### IndexingSignalAggregatorUrlScore

- `weight` (supporting) How much this URL counts when scores are combined.
  - Google: "weight for this url."

### QualitySitemapBreadcrumbTargetDoc

- `count` (supporting) How many web pages list this address in their breadcrumb trails.
  - Google: "The number of web pages that contains the url in their breadcrumbs."

### WWWDocInfo

- `nsrSitechunk` (supporting) The site grouping key used by the site-level quality system, sometimes at channel level.
  - Google: "Sitechunk used by NSR. For most pages this is equivalent HOST_LEVEL_V3 sitechunk. Main difference is that, for sites like youtube.com and vimeo.com, nsr_sitechunks are channel level (based on schema.org markup, not url alone). See go/nsr-chunks for more details."


## crawl_index (18)

### ImageData

- `corpusSelectionInfo` (supporting) Scoring information about which image collections this image was selected into.
  - Google: "Corpus scoring info for images indexed through Amarna."
- `lastCrawlTime` (supporting) The most recent time this image address was fetched.
  - Google: "Most recent timestamp in seconds when this URL was crawled."

### HtmlrenderWebkitHeadlessProtoDocument

- `contentLanguage` (supporting) The language the rendered page is written in.
  - Google: "Document's language."
- `title` (supporting) The title of the rendered page.
  - Google: "Document's title."

### PerDocData

- `scaledSelectionTierRank` (supporting) A 0-32767 value giving the document's position within its index serving tier.
  - Google: "Selection tier rank is a language normalized score ranging from 0-32767 over the serving tier (Base, Zeppelins, Landfills) for this document. This is converted back to fractional position within the index tier by scaled_selection_tier_rank/32767."

### Anchors

- `indexTier` (supporting) Which index tier the anchors were pulled from.
  - Google: "The index tier from which the anchors were extracted. Note that this is only valid in the anchor record written by linkextractor. The value can be one of the enum values defined in segindexer/types.h."

### RepositoryWebrefDocumentMetadata

- `forwardingUrls` (supporting) Other addresses that redirect to this page.
  - Google: "Urls that forward to this url. Needed for url -> topical entity entries."

### SmartphonePerDocData

- `isWebErrorMobileContent` (supporting) Whether the URL errors for the desktop crawler but works for the smartphone crawler.
  - Google: "Indicates if the current URL serves error page to desktop crawler and non error page to smartphone crawler."

### CompositeDocIndexingInfo

- `selectionTierRank` (supporting) A zero to one score placing the document within its serving index tier.
  - Google: "Selection tier rank is a language normalized score ranging from 0-1 over the serving tier (Base, Zeppelins, Landfills) for this document."

### CompositeDoc

- `embeddedContentInfo` (supporting) Information about content and links pulled in from embedded resources.
  - Google: "Data produced by the embedded-content system. This is a thin message, containing only embedded_links_info data for the embedder and JavaScript/CSS embedded links (the embedded-content bigtable also contains snapshots, compressed document trees and all embedded link types). Provided using the index..."

### GDocumentBase

- `NoIndexReason` (supporting) Flags recording why a page must not be indexed, snippeted, or cached.
  - Google: "When these reasons are set to a non zero value, the document should not be indexed, or show a snippet, or show a cache, etc. These reasons are bit maps of indexing.converter.RobotsInfo.RobotedReasons enum values reflecting the places where the restriction was found:..."

### HtmlrenderWebkitHeadlessProtoRenderResponse

- `title` (supporting) The page title produced by the renderer.
  - Google: "Contains the page title produced by webkit, in the UTF-8 encoding."

### HtmlrenderWebkitHeadlessProtoRenderTreeNode

- `renderedText` (supporting) The actual visible text that was rendered for a text node.
  - Google: "The actual text that was rendered. This is applicable only for text nodes."

### IndexingSignalAggregatorAgeWeightedCoverageData

- `firstBaseCoverageTimestamp` (supporting) When this URL first appeared in the BASE index coverage.
  - Google: "Epoch seconds at which this url first gets coverage in BASE."

### RepositoryWebrefForwardingUrls

- `forwardingUrl` (supporting) Addresses that redirect to this page.
  - Google: "Urls that forward to this url. Used for url -> topical entity entries."

### ResearchScienceSearchSourceUrlDocjoinInfo

- `indexTier` (supporting) Which index tiers the document is stored in.
  - Google: "Index tiers (BASE, UNIFIED_ZEPPELIN, etc) that the document belongs to. NOTE: Each document may belong to multiple tiers. NOTE: The original data type is an enum CompositeDoc::SubIndexType. However we don't want to depend on segindexer/compositedoc.proto because the proto is too large. Instead, we..."

### ScienceIndexSignal

- `IndexSelectionScore` (supporting) A score for whether the page belongs in the main index or the supplemental one.
  - Google: "Index selection score for websearch, bigger is better: (0.5,1.0] - prefer selection into the base index, (0.0,0.5] - prefer selection into the supplemental index."

### SentenceBoundaryAnnotationsInstance

- `toIndex` (supporting) Marks which annotations were picked to be indexed.
  - Google: "Used to mark the annotations selected to be indexed."


## other (18)

### PerDocData

- `biasingdata2` (supporting) A more space-efficient container of per-document biasing data.
  - Google: "A replacement for BiasingPerDocData that is more space efficient. Once this is live everywhere, biasingdata will be deprecated."
- `languages` (supporting) The likely languages of the page, listed most likely first.
  - Google: "Plausible languages in order of decreasing plausibility. Language values are small, IE < 127 so this should compress to one byte each."
- `rosettaLanguages` (supporting) The page's top two language codes from the Rosetta language annotator.
  - Google: "Top two document language BCP-47 codes as generated by the RosettaLanguageAnnotator in the decreasing order of probability."
- `saftLanguageInt` (supporting) The page's top language from a second language identifier, stored when it differs.
  - Google: "Top document language as generated by SAFT LangID. For now we store bare minimum: just the top 1 language value, converted to the language enum, and only when different from the first value in 'languages'."

### BiasingPerDocData2BiasingField

- `value` (supporting) The document's biasing value, stored as a decimal number.
  - Google: "The value, under various representations to get maximum compression. Exactly one of them is guaranteed to be filled. value as a double."
- `valueFloat` (supporting) The document's biasing value stored as an integer scaled by one thousand.
  - Google: "a floating value, represented as an integer by converting using floating_value * 1000. Useable for all floating values that need 3 digits of precision, and are small enough."
- `valueInt` (supporting) The document's biasing value when it fits in a plain integer.
  - Google: "value as an int32. When the value is encode-able as an integer."

### IndexingMlVerticalVerticalItem

- `name` (supporting) The name of the predicted vertical.
  - Google: "The description name."
- `probability` (supporting) How confident the model is that the page belongs to this vertical.
  - Google: "The probability of the vertical, whose value is in [0.0, 1.0]."

### RegistrationInfo

- `createdDate` (supporting) The day the domain was last registered, counted from January 1995.
  - Google: "This is the number of days since January 1st 1995 that this domain was last created. This should always fit in 15 bits."
- `expiredDate` (supporting) The day the domain last expired, counted from January 1995.
  - Google: "This is the number of days since January 1st 1995 that this domain last expired. This should always fit in 15 bits. Jan 1st 1995 was chosen by the history project as a special epoch date. Both the registrationinfo dates and the linkage dates are measured in days since this epoch."

### AnchorsAnchorSource

- `language` (supporting) Language of the linking page.
  - Google: "default -> English"

### BiasingPerDocDataBiasingField

- `Value` (supporting) The document's biasing value converted to a decimal so values compare uniformly.
  - Google: "Biasing value translated into a double for uniform comparison"

### GDocumentBaseContent

- `Language` (supporting) The language the page content is written in.
  - Google: "A Language enum value. See: go/language-enum Default is english"

### IndexingSignalAggregatorUrlScore

- `score` (supporting) The signal score for this URL, absent when the URL has no signal.
  - Google: "score might be missing if the url does not have signal."

### QualityNsrVersionedFloatSignal

- `value` (supporting) The decimal value of a signal for one version.
  - Google: "The corresponding float value."

### QualityNsrVersionedIntSignal

- `value` (supporting) The whole-number value of a signal for one version.
  - Google: "The corresponding int value."

### ScienceCitationUnionCatalog

- `NumLibraries` (supporting) How many libraries hold this work, noted as useful for ranking.
  - Google: "Information about the number of libraries the citation appears. It should be useful for ranking."


## query_intent (17)

### QualityFringeFringeQueryPriorPerDocData

- `encodedEntityPriorScore` (supporting) The highest chance a query is fringe based on the main entities on the page.
  - Google: "Highest entity prior seen for document's Headline and SingleTopic entities (see go/topicality-score for definitions of entity topicalities). Represents probability that a query is fringe, given that the entity is in the result set with topicality >= Headline. Scores scaled to integers between 0 and..."
- `encodedFringePriorScore` (supporting) The chance that a query is fringe when this page appears in results.
  - Google: "Probability that a query is fringe, given this document is in the result set. Scores scaled to integers between 0 and 1000 for compactness. Scores must be interpreted through FringeQueryPriorEncoding::Decode API."
- `encodedFringeSitePriorScore` (supporting) The chance a query is fringe when this page's site appears in results.
  - Google: "Probability that a query is fringe, given this document's site is in the result set. Scores scaled to integers between 0 and 1000 for compactness. Scores must be interpreted through FringeQueryPriorEncoding::Decode API."
- `encodedFringeSitePriorScoreForQfsTraining` (supporting) A training-only version of the site fringe prior that leaves out some inputs.
  - Google: "Probability that a query is fringe, given this document's site is in the result set. Does not use signals with a dependency on the QueryFringeScore of a document. Scores scaled to integers between 0 and 1000 for compactness. Scores must be interpreted through FringeQueryPriorEncoding::Decode API...."

### PerDocData

- `asteroidBeltIntents` (supporting) Stored intent scores for the document from the Asteroid Belt project.
  - Google: "For indexing Asteroid Belt intent scores. See go/asteroid-belt for details."
- `fringeQueryPrior` (supporting) Encoded prior about fringe queries for this document, owned by the fringe ranking team.
  - Google: "Contains encoded FringeQueryPrior information. Unlikely to be meaningful for anyone other than fringe-ranking team. Contact fringe-ranking team if any questions, but do NOT use directly without consulting them."
- `topPetacatTaxId` (supporting) The site's main topic category, used to check how well a result matches a query.
  - Google: "Top petacat of the site. Used in SiteboostTwiddler to determine result/query matching."

### QualityOrbitAsteroidBeltDocumentIntentScores

- `belowThresholdIntents` (supporting) Topic intents found on the page that scored below the triggering threshold.
  - Google: "Same as above, but for intents below triggering threshold. It can be assumed that any intent in this list has trigger=false. Most intents do not have below-threshold annotations."
- `intents` (supporting) The list of intents the document was classified into.
  - Google: "The 'intents' and 'scores' fields are stored as parallel lists for compactness. The 'scores' field should not be accessed directly, but instead through the functions in document_intent_scores_utils."
- `scores` (supporting) The strength of each detected document intent, on a 0 to 100 scale.
  - Google: "The intent scores, scaled to integers between 0 and 100 for compactness."

### QualityViewsExtractionClusterInfo

- `clusterSetScore` (supporting) How confident the system is in the entity group interpretation.
  - Google: "Cluster set qref confidence score."
- `score` (supporting) How strong this entity is within its group.
  - Google: "The score represents the score of the entity within the cluster."

### RepositoryWebrefUniversalNgramData

- `idf` (supporting) How rare a word or phrase is across documents.
  - Google: "IDF of the n-gram."
- `pluralProb` (supporting) Chance that a phrase is the plural form of a word.
  - Google: "Probability that the n-gram is a plural form of a word. This information is extracted from SAFT annotations of queries. See HasPluralProperty()."

### ImageData

- `orbitIntents` (supporting) Predicted user intents associated with the image.
  - Google: "Orbit intents. More details on go/orbit-in-image-indexing."

### NlpSaftDocument

- `language` (supporting) The language the document is written in.
  - Google: "Document language (default is English). This field's value maps cleanly to the i18n.languages.Language proto enum (i18n::languages::Language in C++)."

### VideoContentSearchVideoInfo

- `navqueries` (supporting) Queries treated as navigational lookups for this video.
  - Google: "Navqueries for the video."
