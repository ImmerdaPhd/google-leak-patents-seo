# Stage 9: Query Understanding & Intent Classification

**Leak modules (68):** `QualityOrbitAsteroidBeltDocumentIntentScores`, `QualityOrbitAsteroidBeltImageIntentScores`, `QualityOrbitOrbitImageIntent`, `QualityOrbitOrbitImageIntents`, `NlpSemanticParsingQRefAnnotation`, `NlpSemanticParsingQRefAnnotationCollectionMembership`, `NlpSemanticParsingQRefAnnotationEntityRelationship`, `NlpSemanticParsingRelatedEntity`, `NlpSaftDocument`, `PerDocData`, `QualityNsrNsrData`, `SearchPolicyRankableSensitivityQueryUnderstanding`, `SearchPolicyRankableSensitivityFollowOn`, `QualityPreviewSnippetQueryFeatures`, `QualityPreviewSnippetQueryTermCoverageFeatures`, `QualityFringeFringeQueryPriorPerDocData`, `NlpSemanticParsingAnnotationEvalData`, `ClassifierPornQueryClassifierOutput`, `ClassifierPornQueryStats`, `OfficialPagesQuerySet`, `ResearchScienceSearchNavboostQueryInfo`, `VideoContentSearchQbstTermsOverlapFeatures`, `ImageContentQueryBoost`, `ImageContentQueryBoostQueryBoost`, `ImageExactBoostNavQuery`, `RepositoryWebrefQueryIndices`, `RepositoryWebrefRefconQueryStats`, `ExtraSnippetInfoResponseQuerySubitem`, `KnowledgeAnswersIntentQueryQrefAnnotationSignals`, `KnowledgeAnswersIntentQueryParsingSignals`, `KnowledgeAnswersIntentQueryAnnotationLayerSignals`, `KnowledgeAnswersIntentQuerySaftSignals`, `KnowledgeAnswersIntentQueryGroundingSignals`, `KnowledgeAnswersIntentQueryArgument`, `KnowledgeAnswersIntentQueryArgumentProvenance`, `KnowledgeAnswersIntentQueryArgumentProvenanceCurrentQuery`, `KnowledgeAnswersIntentQueryArgumentProvenancePreviousQuery`, `KnowledgeAnswersIntentQueryImpliedEntity`, `KnowledgeAnswersIntentQueryToken`, `KnowledgeAnswersIntentQueryFunctionCall`, `KnowledgeAnswersIntentQueryCollectionMembership`, `KnowledgeAnswersIntentQueryRelatednessSignals`, `KnowledgeAnswersIntentQuerySemanticAnnotationSignals`, `KnowledgeAnswersIntentQuerySignalComputationFallbackIntent`, `KnowledgeAnswersIntentQueryNimbleAnnotationSignals`, `KnowledgeAnswersIntentQueryLocalSignals`, `KnowledgeAnswersIntentQueryMediaEntitySignals`, `KnowledgeAnswersIntentQuerySupportTransferSignals`, `KnowledgeAnswersIntentQueryShoppingIds`, `KnowledgeAnswersIntentQueryPersonalEntity`, `KnowledgeAnswersIntentQueryMuninSignals`, `QualityQrewritePersonalContactData`, `QualityQrewriteAccountProvenanceThirdPartyAccount`, `QualityDialogManagerLocalIntentOptions`, `QualityDialogManagerLocalResult`, `NlpSemanticParsingSaftMentionAnnotation`, `NlpSemanticParsingSaftCoreference`, `NlpSemanticParsingSaftSpan`, `NlpSemanticParsingSaftMeasure`, `LogsSemanticInterpretationIntentQueryLinkKindFlags`, `LogsSemanticInterpretationIntentQueryLinkKindInfo`, `LogsSemanticInterpretationIntentQuerySupportTransferRule`, `LogsSemanticInterpretationIntentQueryWebrefEntityRelationship`, `AttentionalEntitiesMentionProperties`, `AttentionalEntitiesSemanticRoleId`, `AssistantLogsQueryAnnotationLog`, `VideoContentSearchVideoGeneratedQueryFeatures`, `NlpSciencelitRetrievalQueryEncodingDebugInfo`

**Relevant patents (8):** US7487145B1, US9037464B1, US10452978B2, US9953076B2, US8631003B2, US8171021B2, US9916366B1, US9128945B1

### What Happens Here

When a user types a query, Google does not simply match keywords against an inverted index. Instead, the query is run through a multi-layered understanding pipeline that parses its syntax, identifies entities and their relationships, classifies the user's intent across dozens of categories, rewrites and augments the query with synthetic and historical variants, and scores each document against this expanded understanding. This stage determines what the query *means* before any documents are ranked, and the leak reveals the exact internal data structures that carry these signals from the query understanding systems into the per-document scoring pipeline.

### How this works

**1. The QRef annotation system is the backbone of entity-level query understanding.** The `NlpSemanticParsingQRefAnnotation` module is the primary data structure for entity annotations applied during query parsing. It carries 29 attributes that represent Google's comprehensive understanding of every entity mentioned in a query. The `annotatedSpan` field holds "a copy of the span of canonical (raw) parser input text corresponding to this annotation" - this is the literal substring of the query that was identified as referring to an entity. The `confidenceScore` field stores "the confidence (in [0, 1]) of the entity being correctly annotated," while `freebaseMid` holds "the mid of the entity in freebase associated with this span." These annotations are not limited to explicit mentions: the `resolutionScore` captures "the confidence (in [0, 1]) that the annotation was created on an implicit mention (eg my hotel) as opposed to an explicit mention (eg: the westin copley square)" - meaning Google can resolve indirect references to specific entities. The `entityRelationship` field carries "the relationship information from QRef" including whether one entity `implies` another or is `impliedBy` another, with `linkPropertyName` listing "names of the relationship links." Patent **US8171021B2** (Query identification and association) directly connects to this system: it describes "associating the selected web document with the candidate query if the intent measure exceeds an intent threshold" and generating "a first intent measure related to the first set of web documents, the first intent measure being based on a vector of terms identified in the first set of web documents." The QRef annotation's confidence scores and entity relationships are the live implementation of those intent measures - the patent describes the thresholding logic, and the leak shows the actual scores being computed and stored.

**2. Asteroid Belt intent scoring classifies documents against query intents with explicit triggering thresholds.** The `QualityOrbitAsteroidBeltDocumentIntentScores` module is where document-level intent classification lives. It stores `intents` as "parallel lists for compactness" alongside `scores` that are "the intent scores, scaled to integers between 0 and 100 for compactness." The `belowThresholdIntents` field explicitly lists "intents below triggering threshold" where "any intent in this list has trigger=false" - this is the direct implementation of the intent thresholding described in the query identification patents. The `PerDocData.asteroidBeltIntents` field confirms these scores are indexed per document, described as "for indexing Asteroid Belt intent scores. See go/asteroid-belt for details." Patent **US8631003B2** describes the exact filtering mechanism: "filtering the web documents in the query-page candidate tuple based on the first intent measure and the second intent measure." The Asteroid Belt system also extends to images: `QualityOrbitAsteroidBeltImageIntentScores` provides a per-image `imageIntentScores` map described as "Map of imageid key to ImageIntentScores, for images on cdoc.doc_images," and `QualityOrbitOrbitImageIntent` carries a `trigger` boolean for "whether the intent triggered with the default threshold or not" and a `score` for the "score of the intent." This means Google classifies not just pages but individual images against query intents, and only intents that cross the triggering threshold participate in ranking. The `version` field in `QualityOrbitOrbitImageIntents` tracks classifier versions "filled in Amarna (main version controller)," confirming that intent classification models are versioned and updated independently of the index.

**3. SAFT document analysis provides the syntactic and semantic layer that feeds entity extraction.** The `NlpSaftDocument` module (SAFT = Standoff Annotation Format for Text) is the structured representation of document text after NLP processing. Its `entity` field holds "entities in the document," `semanticNode` carries "the semantic nodes for the document" that "represent arbitrary types of higher-level abstractions beyond entity mention coreference and binary relations between entities. These may include: n-ary relations, semantic frames or events" stored as "nodes in a directed acyclic graph, with an adjacency list representation." The `focusEntity` field identifies "for lexicon articles, like Wikipedia pages, a document is often about a certain entity. This is the local entity id of the focus entity for the document" - this is how Google knows a page is *about* something rather than merely *mentioning* it. The `hyperlink` field stores "the hyperlinks in the document. Multiple hyperlinks are sorted in left-to-right order," providing the link context that feeds into anchor-based query augmentation. The SAFT system also carries temporal signals: `bylineDate` is "the date that will be shown in the snippets in web search results," `lastSignificantUpdate` tracks "last significant update of the page content," and `syntacticDate` captures "the document's syntactic date (e.g. date explicitly mentioned in the URL of the document or in the document title)." Patent **US10452978B2** (the Transformer architecture patent) underpins the neural models that power this analysis: it enables "self-attention mechanisms allow the model to weigh the importance of different words in context" and "bidirectional understanding of text (context flows both directions)." The SAFT document structure is the output format that these transformer models write to - the semantic nodes, entity annotations, and relationship graphs are produced by neural networks that read text bidirectionally and understand context, not by rule-based parsers.

**4. Query rewriting and augmentation expand the original query with synthetic and historical variants.** Patent **US9916366B1** (Query augmentation) describes a system where "a first query stored in a query log is identified and a quality signal related to the performance of the first query is compared to a performance threshold" - only queries that perform well become augmentation queries. The patent further describes "identifying, by a data processing apparatus and based on the received query, a ranking of augmentation queries, the ranking of augmentation queries including one or more user-generated augmentation queries and one or more machine-generated synthetic augmentation queries." The `SearchPolicyRankableSensitivityQueryUnderstanding` module reveals the live implementation: its `rewrittenQuery` field holds "the rewritten query this sensitivity is for. Note different query rewrites could produce different sensitivities," confirming that multiple query rewrites are generated and evaluated independently. Patent **US9128945B1** adds that "structured document data (business listings, entity names) with resource locators is mined to generate synthetic queries using anchor text from the structured data" and that "synthetic query generation requires that anchor text appears in a number of documents exceeding a threshold - only widely-used anchor text generates augmentation queries." The `OfficialPagesQuerySet` module supports this: its `queryCountryLanguageFingerprints` field stores "the fingerprint of the OfficialKey queries" using "the QueryCountryLanguageFingerprint function," which is how Google identifies which queries a document is the official result for across different countries and languages. The `ResearchScienceSearchNavboostQueryInfo` module shows how query-document pairs from navigation data feed back into understanding: `query` stores "the query string," `queryDocCount` holds "the number of long-clicks on this pair," and `queryCount` stores "the counts on this query" - these are the quality signals that determine whether a query becomes an augmentation query. The patent explicitly states that "a long click can be interpreted as a signal that the query identified information that the user deemed to be interesting," and these long-click counts are the threshold metric.

**5. The KnowledgeAnswers IntentQuery system is Google's full semantic parsing pipeline for understanding queries as structured intents.** The `KnowledgeAnswersIntentQueryFunctionCall` module is the output of this parsing: it carries a `marker` that "specifies the purpose of this meaning struct / function call: Is it asking a question, and if yes, for which slot(s)? Is it a command, statement, etc?" and `ignoredTokens` listing "token lists that were ignored during parsing because they are known context phrases for this interpretation" (e.g., "tell me," "of," "really"). The `KnowledgeAnswersIntentQueryParsingSignals` module carries `calibratedParsingScore` described as "a parsing score that is independently calibrated by each parser/IG, used by pre-fulfillment ranker" and `effectiveArgSpanLength` measuring "the total effective length of the spans for the arguments used to construct the parse." The `KnowledgeAnswersIntentQueryArgumentProvenance` module tracks exactly where each argument value comes from: `currentQuery` for values from the current query, `previousQuery` for values carried over from a prior query, `anaphor` for "the current query contains an anaphor that refers to the value" (e.g., "there" referring to Paris from a previous turn), and `attentionalEntity` for values from the system. Patent **US9037464B1** (word2vec) is the foundation that makes this parsing possible: it establishes that "words are represented as vectors in a continuous high-dimensional space" where "semantically similar words have vectors that are close together" and "these representations enable matching queries to documents even without exact keyword overlap." The KnowledgeAnswers system uses these vector representations to match query tokens to intent schemas - the `KnowledgeAnswersIntentQueryGroundingSignals` module's `groundabilityScore` provides a "score indicating how grounded the intent is, populated by the Grounding Box, used by the pre-fulfillment ranker," and `numGroundableArgs` counts "number of groundable arguments in the parsed intent." This is the system that determines whether a query like "best pizza near me" maps to a local search intent with location and cuisine arguments, or whether it maps to a general informational intent.

**6. Autocomplete and predictive query completion shape the query before it is even submitted.** Patent **US7487145B1** (Autocomplete using ranked results) reveals that "autocomplete suggestions are ranked based on popularity of search queries" and "the ranking system considers historical query frequency and recency" with "suggestions generated and ranked in real-time as the user types." The patent explicitly states that "the suggestion box is itself a ranking system with its own quality signals" and "popular queries surface first, creating a feedback loop where demand drives visibility." Patent **US9953076B2** (Predictive query completion) goes further: it describes how "quality measure for each query suggestion is determined by a valid prediction rate: the ratio of times a search result referencing a resource was selected when provided for the suggestion to the number of times it was provided" and that "resource quality is further determined by the resource's ranking in an authority graph (e.g., PageRank)." The patent states that "if a query suggestion's quality measure meets a threshold, search results for that suggestion are proactively provided before user completes typing" - meaning Google fetches results for predicted queries before the user finishes typing. The `ImageContentQueryBoostQueryBoost` module shows this in the image search context: its `query` field holds a "canonicalized query string" and `boost` is a "score multiplier (fully normalized 1 is nop)" - these are the per-query boost factors applied during retrieval. The `ImageExactBoostNavQuery` module carries `navQuery` as "the normalized raw query text" with `navFp` as "query fingerprint" and `imageClickRank` as "click-based rank of the image for this query" - these are the click signals that feed back into the autocomplete ranking. The `KnowledgeAnswersIntentQueryRelatednessSignals` module's `queryPopularity` field is the direct signal behind the popularity-based ranking described in the autocomplete patent.

**7. Sensitive query detection and fringe content classification protect against harmful query interpretations.** The `SearchPolicyRankableSensitivityQueryUnderstanding` module carries `intentOnlyNoPii` described as "QU detects a sensitive intent with no sensitive content (eg., [Send email]). This flag is only used to trigger a sensitive feature because as a precaution all sensitive features should check current sensitivity mode before triggering; but will NOT block any backends, which means all other features can compete fairly." The `SearchPolicyRankableSensitivityFollowOn` module adds `ignoreQueryUnderstanding` where "if true this follow-on sensitivity will rank above the ones determined by query understanding (QU)" - meaning certain follow-on queries can override the base understanding. The `QualityFringeFringeQueryPriorPerDocData` module is the fringe content classification system: `encodedFringePriorScore` holds "probability that a query is fringe, given this document is in the result set" scaled to integers 0-1000, `encodedEntityPriorScore` stores "highest entity prior seen for document's Headline and SingleTopic entities" representing "probability that a query is fringe, given that the entity is in the result set with topicality >= Headline," and `encodedFringeSitePriorScore` carries "probability that a query is fringe, given this document's site is in the result set." The `encodedDocumentFringeVulnerability` field is "an estimate of the vulnerability of this doc to show fringe content, based on the context around the document" and `encodedProximityScore` is "a score in [0, 1] representing the similarity of this doc to known fringe-vulnerable 'seeds'." The `ClassifierPornQueryClassifierOutput` module provides query-level safety classification with `isPositive` as "the bit that shows if this classifier outputs positive classification for the input query" set by "thresholding with a recommended threshold" and `score` as "the score that the classifier assigned to the input query." These classifiers run at query time to prevent sensitive, harmful, or low-quality intents from surfacing inappropriate content, and the `KnowledgeAnswersIntentQueryFunctionCall` module's `sensitivity` field carries "intent level query sensitivity (go/sensitive-intents)" from the Intent Catalog, while its `contextualSensitivity` field tracks "contextual sensitivity metadata indicating that a policy- or privacy-sensitive conversation context (previous queries, rewritten user queries, and previous system responses, like attentional entities) is used to generate this FunctionCall."

**8. Snippet-level query features connect query understanding to result presentation.** The `QualityPreviewSnippetQueryFeatures` module carries signals that bridge query understanding and snippet generation: `queryScore` is a general query relevance score, `passageembedScore` connects to passage-level embedding matching, `queryHasPassageembedEmbeddings` indicates whether the query has passage embeddings available, and `experimentalQueryTitleScore` measures query-title alignment. The `QualityPreviewSnippetQueryTermCoverageFeatures` module tracks how well query terms are covered by titles and snippets: `snippetQueryTermCoverage`, `titleSnippetQueryTermCoverage`, and `titleQueryTermCoverage` are the three coverage metrics. The `ExtraSnippetInfoResponseQuerySubitem` module breaks the query into subitems with `text` as "text associated with this query item," `weight` as "the weight of this query item, as calculated by SubitemWeight()," `isOriginal` indicating "true iff this subitem was an original query term or phrase," and `isHighlighted` providing "additional information from the SnippetQuery." Patent **US8171021B2** confirms the snippet connection: "The search results can include, for example, lists of web document titles, snippets of text extracted from those web documents and hypertext links to those web documents." The `VideoContentSearchQbstTermsOverlapFeatures` module extends this to video: `qbstAnchorOverlap` measures "fraction of salient terms of original query covered by anchor text" and `qbstNavboostOverlap` measures "fraction of salient terms of original query covered by top navboost query of the video" - these are how video results are matched to queries through term coverage. Patent **US9916366B1** describes IR scores computed "from, for example, dot products of feature vectors corresponding to a query and a document, page rank scores, and/or combinations of IR scores and page rank scores" - the snippet query features are the live signals that feed into these IR score computations.

### Leak attributes relevant to Stage 9

**QualityOrbitAsteroidBeltDocumentIntentScores** - 5 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `QualityOrbitAsteroidBeltDocumentIntentScores` | `belowThresholdIntents` | list(String.t) | Same as above, but for intents below triggering threshold. It can be assumed that any intent in this list has trigger=false. Most intents do not have below-threshold annotations. |
| `QualityOrbitAsteroidBeltDocumentIntentScores` | `imageIntentScores` | %{optional(String.t) =&gt; GoogleApi.ContentWarehouse.V1.Model.QualityOrbitAsteroidBeltImageIntentScores.t} | Map of imageid key to ImageIntentScores, for images on cdoc.doc_images |
| `QualityOrbitAsteroidBeltDocumentIntentScores` | `intents` | list(String.t) | The 'intents' and 'scores' fields are stored as parallel lists for compactness. The 'scores' field should not be accessed directly, but instead through the functions in document_intent_scores_utils. |
| `QualityOrbitAsteroidBeltDocumentIntentScores` | `scores` | list(integer()) | The intent scores, scaled to integers between 0 and 100 for compactness. |
| `QualityOrbitAsteroidBeltDocumentIntentScores` | `version` | integer() | DEPRECATED. DO NOT USE IT FOR ANY REASON! contact orbit@ if necessary. |

**QualityOrbitAsteroidBeltImageIntentScores** - 2 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `QualityOrbitAsteroidBeltImageIntentScores` | `intents` | list(String.t) | The unique identifier for an Asteroid Belt document intent is being reused here |
| `QualityOrbitAsteroidBeltImageIntentScores` | `scores` | list(integer()) | The intent scores, scaled to integers between 0 and 100 for compactness. |

**QualityOrbitOrbitImageIntent** - 4 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `QualityOrbitOrbitImageIntent` | `imageIntent` | String.t | Intent of this proto instance. |
| `QualityOrbitOrbitImageIntent` | `remove` | boolean() | Whether this intent should be removed when backfilling new classifications to the index. When backfilling a new version of a classifier to production we have cases where we actually want to |
| `QualityOrbitOrbitImageIntent` | `score` | number() | Score of the intent. |
| `QualityOrbitOrbitImageIntent` | `trigger` | boolean() | Whether the intent triggered with the default threshold or not. |

**QualityOrbitOrbitImageIntents** - 2 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `QualityOrbitOrbitImageIntents` | `intents` | list(GoogleApi.ContentWarehouse.V1.Model.QualityOrbitOrbitImageIntent.t) | Intents with non-trivial scores. |
| `QualityOrbitOrbitImageIntents` | `version` | String.t | Represents the version. Filled in Amarna (main version controller). |

**NlpSemanticParsingQRefAnnotation** - 29 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `NlpSemanticParsingQRefAnnotation` | `sourceTypeList` | GoogleApi.ContentWarehouse.V1.Model.CopleySourceTypeList.t | If the annotation was created by using personal data, we record the provenance for that data here. |
| `NlpSemanticParsingQRefAnnotation` | `displayName` | String.t | Copy the display info. This can be used by annotators to give grammars a canonical name for an entity. For instance, the media grammar could use it to output the same canonical name for &quot;rock music&quot; and &quot;rock&quot;. |
| `NlpSemanticParsingQRefAnnotation` | `entityNumber` | integer() | The index of the entity from which this annotation is obtained, within the WebrefEntities message in the interpretation defined by interpretation_number, above. |
| `NlpSemanticParsingQRefAnnotation` | `annotatedSpan` | String.t | A copy of the span of canonical (raw) parser input text corresponding to this annotation. |
| `NlpSemanticParsingQRefAnnotation` | `globalProductClusterId` | list(String.t) | The shopping global product cluster id(s) of the annotated entity (in KG, the key(s) of type /business/variant_cluster). |
| `NlpSemanticParsingQRefAnnotation` | `gaiaId` | String.t | The Gaia ID for this entity. This is populated generally for people and businesses. |
| `NlpSemanticParsingQRefAnnotation` | `confidenceScore` | float() | The confidence (in [0, 1]) of the entity being correctly annotated. |
| `NlpSemanticParsingQRefAnnotation` | `referenceScore` | number() | The confidence (in [0, 1]) that the annotation is reference that implies another entity. (eg &quot;my hotel&quot; in &quot;navigate to my hotel&quot; is reference to explicit hotel from user hotel reservation). |
| `NlpSemanticParsingQRefAnnotation` | `entitySourceData` | GoogleApi.ContentWarehouse.V1.Model.NlpSemanticParsingEntitySourceData.t | Holds information about the backends which contributed to this entity. |
| `NlpSemanticParsingQRefAnnotation` | `deprecatedEquivalentMids` | list(String.t) | DEPRECATED: Equivalent ids (e.g. de-duped mids) for this entity. |
| `NlpSemanticParsingQRefAnnotation` | `clusterId` | String.t | The ID of the cluster (set entity) this entity belongs to. |
| `NlpSemanticParsingQRefAnnotation` | `deprecatedMdvcSupportingMid` | list(String.t) | DEPRECATED: Higher level id's that support the given id. This field has been deprecated in favor of related_entity. b/27363861 |
| `NlpSemanticParsingQRefAnnotation` | `productLineId` | list(String.t) | The shopping product line id(s) of the annotated /business/shopping_product_line entity. |
| `NlpSemanticParsingQRefAnnotation` | `locationType` | integer() | The location type of the entity, as an int32 representing a TypeCategory enum value. For example, this could be TYPE_LOCALITY (37) or TYPE_COUNTRY (33). We store this type as an int because including FeatureProto would cause java/com/google/ads/adh/pipeline/bigquery:ProtoCatalog to become too large, resulting in OOM errors. |
| `NlpSemanticParsingQRefAnnotation` | `mergedImpliedEntity` | list(GoogleApi.ContentWarehouse.V1.Model.NlpSemanticParsingQRefAnnotation.t) | A list of any implied entities merged into this annotation during parsing. Order is derivation-dependent. |
| `NlpSemanticParsingQRefAnnotation` | `isMdvcDimension` | boolean() | True if this entity is an mdvc dimension of some other annotated entity. Only included if the QRefAnnotator is initialised with include_annotated_relationships. |
| `NlpSemanticParsingQRefAnnotation` | `relatedEntity` | list(GoogleApi.ContentWarehouse.V1.Model.NlpSemanticParsingRelatedEntity.t) | Mids related to the given entity |
| `NlpSemanticParsingQRefAnnotation` | `lowConfidence` | boolean() | Whether this entity is low confidence. Not used. Currently whitelisted entities below min_confidence threshold are marked as low confidence and maybe not trusted by downstreams. |
| `NlpSemanticParsingQRefAnnotation` | `addedByCloseAnswers` | boolean() | Whether this qref annotation was created by CloseAnswers on Postref. Annotations of this type don't correspond to a particular mention of the entity on the query but rather to an interpretation of the full query. |
| `NlpSemanticParsingQRefAnnotation` | `otherMetadata` | GoogleApi.ContentWarehouse.V1.Model.Proto2BridgeMessageSet.t | Metadata to be passed through from the AnnotationContext API. |
| `NlpSemanticParsingQRefAnnotation` | `resolutionScore` | number() | The confidence (in [0, 1]) that the annotation was created on an implicit mention (eg my hotel) as opposed to an explicit mention (eg: the westin copley square) |
| `NlpSemanticParsingQRefAnnotation` | `isNimbleAnnotation` | boolean() | Whether this annotation originates from nimble. (go/nimble-annotator) |
| `NlpSemanticParsingQRefAnnotation` | `personalSummaryNodeChild` | list(GoogleApi.ContentWarehouse.V1.Model.NlpSemanticParsingQRefAnnotation.t) | Personal summary nodes are compound entities made up of entities and their attributes, where the entities can be compound too. E.g., &quot;my father's mother&quot; can have a summary node annotation of &quot;Mother(Father(Myself))&quot;. |
| `NlpSemanticParsingQRefAnnotation` | `mdvcChild` | list(GoogleApi.ContentWarehouse.V1.Model.NlpSemanticParsingQRefAnnotation.t) | Nested annotations that represent subparts of the given mdvc full annotation. An MDVC full annotation is outputted as the summary node as the root node, and all the children of it as leaves (mdvc_child). QRef outputs a graph of relationships between the mdvc enties, and for mdvc full the aquatator nests the relevant children inside the summary node's proto. |
| `NlpSemanticParsingQRefAnnotation` | `entityRelationship` | list(GoogleApi.ContentWarehouse.V1.Model.NlpSemanticParsingQRefAnnotationEntityRelationship.t) | The relationship information from QRef. Only included if the QRefAnnotator is initialised with include_annotated_relationships. |
| `NlpSemanticParsingQRefAnnotation` | `interpretationNumber` | integer() | The index of the QueryJoin interpretation from which this annotation was obtained. This field is not used for entities coming from low-confidence annotations, since such entities are not included in any interpretation. |
| `NlpSemanticParsingQRefAnnotation` | `freebaseMid` | String.t | The mid of the entity in freebase associated with this span. |
| `NlpSemanticParsingQRefAnnotation` | `attributeId` | String.t | Attribute ID of a personal_summary_node_child. |
| `NlpSemanticParsingQRefAnnotation` | `oysterId` | GoogleApi.ContentWarehouse.V1.Model.GeostoreFeatureIdProto.t | The geo oyster_id of the entity, relevant only for locations. Only included if the QRefAnnotator is initialised with include_oyster_id. |

**NlpSemanticParsingQRefAnnotationCollectionMembership** - 1 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `NlpSemanticParsingQRefAnnotationCollectionMembership` | `collectionScore` | float() | A value in [0, 1] indicating the relevance of the collection given this entity. NOTE: This field is deprecated and will stop being populated soon. In the meantime, it will always be populated with 1.0. |

**NlpSemanticParsingQRefAnnotationEntityRelationship** - 4 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `NlpSemanticParsingQRefAnnotationEntityRelationship` | `entityIndex` | integer() | The index of the other entity in the relationship. |
| `NlpSemanticParsingQRefAnnotationEntityRelationship` | `impliedBy` | boolean() | True if this entity is implied by the other (includes geo contains). |
| `NlpSemanticParsingQRefAnnotationEntityRelationship` | `implies` | boolean() | True if this entity implies the other (includes geo contained by). |
| `NlpSemanticParsingQRefAnnotationEntityRelationship` | `linkPropertyName` | list(String.t) | Names of the relationship links. |

**NlpSemanticParsingRelatedEntity** - 3 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `NlpSemanticParsingRelatedEntity` | `clusterSupportTransferRelation` | String.t | Denotes whether or not the related entity is derived from cluster support transfer. |
| `NlpSemanticParsingRelatedEntity` | `composedFromRelation` | String.t | Denotes whether or not the related entity composes a compound entity together with other related entities. |
| `NlpSemanticParsingRelatedEntity` | `targetIsStbrSource` | boolean() | Set if the related entity is the source of an STBR rule and the target is not this one. |

**NlpSaftDocument** - 16 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `NlpSaftDocument` | `contentage` | String.t | Age of the content of the document. For details, see: quality/historical/shingle/signals/contentage.proto The format has been translated to a canonical timestamp (seconds since epoch). |
| `NlpSaftDocument` | `bylineDate` | String.t | Document's byline date, if available: this is the date that will be shown in the snippets in web search results. It is stored as the number of seconds since epoch. See segindexer/compositedoc.proto |
| `NlpSaftDocument` | `date` | String.t | Document anchor date in YYYYMMDDhhmmss format. |
| `NlpSaftDocument` | `lastSignificantUpdate` | String.t | Last significant update of the page content, in the same format as the contentage field, and also derived from ContentAge.last_significant_update in quality/historical/shingle/signals/contentage.proto. |
| `NlpSaftDocument` | `annotations` | GoogleApi.ContentWarehouse.V1.Model.Proto2BridgeMessageSet.t | Generic annotations. |
| `NlpSaftDocument` | `entity` | list(GoogleApi.ContentWarehouse.V1.Model.NlpSaftEntity.t) | Entities in the document. |
| `NlpSaftDocument` | `semanticNode` | list(GoogleApi.ContentWarehouse.V1.Model.NlpSaftSemanticNode.t) | The semantic nodes for the document represent arbitrary types of higher-level abstractions beyond entity mention coreference and binary relations between entities. These may include: n-ary relations, semantic frames or events. The semantic nodes for a document are the nodes in a directed acyclic graph, with an adjacency list representation. |
| `NlpSaftDocument` | `hyperlink` | list(GoogleApi.ContentWarehouse.V1.Model.NlpSaftHyperlink.t) | The hyperlinks in the document. Multiple hyperlinks are sorted in left-to-right order. |
| `NlpSaftDocument` | `contentFirstseen` | String.t | Stores minimum of first time google successfully crawled a document, or indexed the document with contents (i.e, not roboted). It is stored as the number of seconds since epoch. See quality/historical/signals/firstseen/firstseen.proto |
| `NlpSaftDocument` | `contentType` | integer() | Optional document content_type (from webutil/http/content-type.proto). Used for setting the content_type when converting the SAFT Document to a CompositeDoc. Will be inferred if not given here. |
| `NlpSaftDocument` | `entityLabel` | list(String.t) | Entity labels used in this document. This field is used to define labels for the Entity::entity_type_probability field, which contains corresponding probabilities. WARNING: This field is deprecated. go/saft-replace-deprecated-entity-type |
| `NlpSaftDocument` | `text` | String.t | Raw text contents of document. (In docjoin attachments from the SAFT goldmine annotator this field will be empty.) |
| `NlpSaftDocument` | `golden` | boolean() | Flag for indicating that the document is a gold-standard document. This can be used for putting additional weight on human-labeled documents in contrast to automatically labeled annotations. |
| `NlpSaftDocument` | `focusEntity` | integer() | Focus entity. For lexicon articles, like Wikipedia pages, a document is often about a certain entity. This is the local entity id of the focus entity for the document. |
| `NlpSaftDocument` | `author` | list(String.t) | Document author(s). |
| `NlpSaftDocument` | `syntacticDate` | String.t | Document's syntactic date (e.g. date explicitly mentioned in the URL of the document or in the document title). It is stored as the number of seconds since epoch. See quality/timebased/syntacticdate/proto/syntactic-date.proto |

**SearchPolicyRankableSensitivityQueryUnderstanding** - 2 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `SearchPolicyRankableSensitivityQueryUnderstanding` | `intentOnlyNoPii` | boolean() | QU dectects a sensitive intent with no sensitive content (eg., [Send email]). This flag is only used to trigger a sensitive feature because as a precaution all sensitive features should check current sensitivity mode before triggering; but will NOT block any backends, which means all other features can compete fairly. |
| `SearchPolicyRankableSensitivityQueryUnderstanding` | `rewrittenQuery` | String.t | The rewritten query this sensitivity is for. Note different query rewrites could produce different sensitivities. |

**SearchPolicyRankableSensitivityFollowOn** - 1 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `SearchPolicyRankableSensitivityFollowOn` | `ignoreQueryUnderstanding` | boolean() | Iff true this follow-on sensitivity will rank above the ones determined by query understanding (QU). |

**QualityPreviewSnippetQueryFeatures** - 4 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `QualityPreviewSnippetQueryFeatures` | `passageembedScore` | number() |  |
| `QualityPreviewSnippetQueryFeatures` | `queryHasPassageembedEmbeddings` | boolean() |  |
| `QualityPreviewSnippetQueryFeatures` | `experimentalQueryTitleScore` | number() |  |
| `QualityPreviewSnippetQueryFeatures` | `queryScore` | number() |  |

**QualityPreviewSnippetQueryTermCoverageFeatures** - 3 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `QualityPreviewSnippetQueryTermCoverageFeatures` | `snippetQueryTermCoverage` | number() |  |
| `QualityPreviewSnippetQueryTermCoverageFeatures` | `titleSnippetQueryTermCoverage` | number() |  |
| `QualityPreviewSnippetQueryTermCoverageFeatures` | `titleQueryTermCoverage` | number() |  |

**QualityFringeFringeQueryPriorPerDocData** - 11 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `QualityFringeFringeQueryPriorPerDocData` | `encodedChardXlqHoaxPrediction` | integer() | An encoding of the Chard XLQ-hoax prediction in [0,1]. |
| `QualityFringeFringeQueryPriorPerDocData` | `encodedChardXlqTranslatedPrediction` | integer() | An encoding of the Chard XLQ prediction on translated content in [0,1]. |
| `QualityFringeFringeQueryPriorPerDocData` | `encodedChardXlqYmylPrediction` | integer() | An encoding of the Chard XLQ-YMYL prediction in [0,1]. |
| `QualityFringeFringeQueryPriorPerDocData` | `encodedDocumentFringeVulnerability` | integer() | An estimate of the vulnerability of this doc to show fringe content, based on the context around the document. Can be interpreted as a 'safe' QScore threshold to use (see go/doc-fringe-vulnerability for more info). Encoded for compactness and to restrict visibility. Please contact fringe-ranking@ to get access to quality_fringe::DocumentFringeVulnerabilityEncoding to decode this field. |
| `QualityFringeFringeQueryPriorPerDocData` | `sensitiveEntitiesIndices` | list(integer()) | Indices on the repository_webref::WebrefEntities::entity field of entities that represent a person or a group of people (aka sensitive entities). Will be deprecated once sensitive_entities_mids is fully launched (see b/290268614). |
| `QualityFringeFringeQueryPriorPerDocData` | `encodedEntityPriorScore` | integer() | Highest entity prior seen for document's Headline and SingleTopic entities (see go/topicality-score for definitions of entity topicalities). Represents probability that a query is fringe, given that the entity is in the result set with topicality >= Headline. Scores scaled to integers between 0 and 1000 for compactness. Scores must be interpreted through FringeQueryPriorEncoding::Decode API. |
| `QualityFringeFringeQueryPriorPerDocData` | `encodedFringePriorScore` | integer() | Probability that a query is fringe, given this document is in the result set. Scores scaled to integers between 0 and 1000 for compactness. Scores must be interpreted through FringeQueryPriorEncoding::Decode API. |
| `QualityFringeFringeQueryPriorPerDocData` | `encodedFringeSitePriorScore` | integer() | Probability that a query is fringe, given this document's site is in the result set. Scores scaled to integers between 0 and 1000 for compactness. Scores must be interpreted through FringeQueryPriorEncoding::Decode API. |
| `QualityFringeFringeQueryPriorPerDocData` | `encodedFringeSitePriorScoreForQfsTraining` | integer() | Probability that a query is fringe, given this document's site is in the result set. Does not use signals with a dependency on the QueryFringeScore of a document. Scores scaled to integers between 0 and 1000 for compactness. Scores must be interpreted through FringeQueryPriorEncoding::Decode API. Will NOT be present if the fringe_site_prior_score_for_qfs_training is not significantly different from the site_prior_score. |
| `QualityFringeFringeQueryPriorPerDocData` | `encodedProximityScore` | integer() | A score in [0, 1] representing the similarity of this doc to known fringe-vulnerable 'seeds'. See go/fringe-proximity for more information. Encoded for compactness and to restrict visibility. |
| `QualityFringeFringeQueryPriorPerDocData` | `encodedPseudoraterPxlqScore` | integer() | An encoding of the XLQ pseudorater severity score translated into pXLQ score space in [0,1]. The encoding includes the pseudorater version and confidence. |

**NlpSemanticParsingAnnotationEvalData** - 1 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `NlpSemanticParsingAnnotationEvalData` | `startByte` | integer() | Byte position within the utterance. Safe to use across different components of the NLU stack as long as said components have access to the same query. |

**ClassifierPornQueryClassifierOutput** - 2 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `ClassifierPornQueryClassifierOutput` | `isPositive` | boolean() | The bit that shows if this classifier outputs positive classification for the input query. Set by thresholding with a recommended threshold. |
| `ClassifierPornQueryClassifierOutput` | `score` | number() | The score that the classifier assigned to the input query. This is filled by all verticals. |

**ClassifierPornQueryStats** - 2 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `ClassifierPornQueryStats` | `queryTextPornScore` | number() | A query text porn score for the queries which have clicks to the image: query_text_porn_score := sum(clicks(query) * text_porn_score(query)) / sum(clicks(query)) |
| `ClassifierPornQueryStats` | `totalClicks` | number() |  |

**OfficialPagesQuerySet** - 1 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `OfficialPagesQuerySet` | `queryCountryLanguageFingerprints` | list(String.t) | This is the fingerprint of the OfficialKey queries in the queries field. The index of a fingerprint in this field corresponds to the index of the fingerprinted query in the queries field. The fingerprint is produced with the QueryCountryLanguageFingerprint function in external-utils.h |

**ResearchScienceSearchNavboostQueryInfo** - 4 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `ResearchScienceSearchNavboostQueryInfo` | `lccCount` | number() | lcc_count stores an estimate of the number of long clicks for this tuple. NOTE: It is similar to query_doc_count, but calculated in different manner. |
| `ResearchScienceSearchNavboostQueryInfo` | `queryDocCount` | number() | The query_doc_count stores the number of long-clicks on this pair. |
| `ResearchScienceSearchNavboostQueryInfo` | `query` | String.t | The query string. |
| `ResearchScienceSearchNavboostQueryInfo` | `queryCount` | number() | The query_count stores the counts on this query. |

**VideoContentSearchQbstTermsOverlapFeatures** - 2 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `VideoContentSearchQbstTermsOverlapFeatures` | `qbstAnchorOverlap` | number() | Fraction of salient terms of original query covered by anchor text. |
| `VideoContentSearchQbstTermsOverlapFeatures` | `qbstNavboostOverlap` | number() | Fraction of salient terms of original query covered by top navboost query of the video. |

**ImageContentQueryBoost** - 1 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `ImageContentQueryBoost` | `queryboost` | list(GoogleApi.ContentWarehouse.V1.Model.ImageContentQueryBoostQueryBoost.t) |  |

**ImageContentQueryBoostQueryBoost** - 2 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `ImageContentQueryBoostQueryBoost` | `boost` | number() | Score multiplier (fully normalized 1 is nop). |
| `ImageContentQueryBoostQueryBoost` | `query` | String.t | Canonicalized query string. |

**ImageExactBoostNavQuery** - 6 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `ImageExactBoostNavQuery` | `imageClickRank` | integer() | Click-based rank of the image for this query. |
| `ImageExactBoostNavQuery` | `referrerDocid` | list(String.t) | List of all referrers, sorted by their rank (stored in Moosedog). |
| `ImageExactBoostNavQuery` | `referrerRank` | integer() | Rank of the current web doc referrer (stored in docjoins). |
| `ImageExactBoostNavQuery` | `confidence` | integer() | Associated confidence scores for the image for the query. |
| `ImageExactBoostNavQuery` | `navFp` | String.t | Query fingerprint. |
| `ImageExactBoostNavQuery` | `navQuery` | String.t | The normalized raw query text. |

**RepositoryWebrefQueryIndices** - 2 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `RepositoryWebrefQueryIndices` | `featuresIndex` | list(integer()) | The set of indices in the NavBoostQuery::features() array that belong to the collapsed features. |
| `RepositoryWebrefQueryIndices` | `queriesIndex` | integer() | The index of the query in NavBoostDocument::queries() array. |

**RepositoryWebrefRefconQueryStats** - 1 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `RepositoryWebrefRefconQueryStats` | `aggregatedQueryCount` | float() | Total query count for the document from all the query terms. Can be used to estimate the popularity of the document. |

**ExtraSnippetInfoResponseQuerySubitem** - 5 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `ExtraSnippetInfoResponseQuerySubitem` | `isHighlighted` | boolean() | Additional information from the SnippetQuery. |
| `ExtraSnippetInfoResponseQuerySubitem` | `isOriginal` | boolean() | true iff this subitem was an original query term or phrase. Can only be false if want_all_query_subitems == true in the request. |
| `ExtraSnippetInfoResponseQuerySubitem` | `items` | integer() | a bitvector of the query items corresponding to this subitem. Typically only one bit is set, but see comment above. |
| `ExtraSnippetInfoResponseQuerySubitem` | `text` | String.t | text associated with this query item |
| `ExtraSnippetInfoResponseQuerySubitem` | `weight` | integer() | the weight of this query item, as calculated by SubitemWeight(): |

**KnowledgeAnswersIntentQueryQrefAnnotationSignals** - 2 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `KnowledgeAnswersIntentQueryQrefAnnotationSignals` | `score` | float() | Numeric value associated with each annotation within the Qref servlet output. |
| `KnowledgeAnswersIntentQueryQrefAnnotationSignals` | `trustedNameConfidence` | float() | Trusted name confidence signal |

**KnowledgeAnswersIntentQueryParsingSignals** - 4 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `KnowledgeAnswersIntentQueryParsingSignals` | `calibratedParsingScore` | float() | A parsing score that is independently calibrated by each parser/IG, used by pre-fulfillment ranker, see |
| `KnowledgeAnswersIntentQueryParsingSignals` | `effectiveArgSpanLength` | number() | The total effective length of the spans for the arguments used to construct the parse. May include vertical specific adjustments. Eg: For the query [delete my 7 p.m. alarm called chicken] and intent Delete_alarm(alarm_object=RD(category=AlarmObject( label=&quot;chicken&quot;, trigger_time_datetime=<< 7 PM >>))), the effective argument span is &quot;7 p.m.&quot; + &quot;chicken&quot; (total length of 13). |
| `KnowledgeAnswersIntentQueryParsingSignals` | `inQueryMaxEffectiveArgSpanLength` | number() | This is a cross-intent feature which is calculated by iterating all intent candidates. This feature should be populated in post-IG stage (before GB). |
| `KnowledgeAnswersIntentQueryParsingSignals` | `qrewriteCallPathInfoFingerprint` | String.t | This proto holds the fingerprint of the call path info of QRewrite client (e.g. the QUS's phase like &quot;RBT&quot;,&quot;QBT&quot;; the QUS's candidate type like &quot;Identity&quot;; and the ACE's candidate type like &quot;FuzzyMatcher&quot;). |

**KnowledgeAnswersIntentQueryAnnotationLayerSignals** - 5 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `KnowledgeAnswersIntentQueryAnnotationLayerSignals` | `freetextAnnotationSignals` | GoogleApi.ContentWarehouse.V1.Model.KnowledgeAnswersIntentQueryFreetextAnnotationSignals.t |  |
| `KnowledgeAnswersIntentQueryAnnotationLayerSignals` | `nimbleAnnotationSignals` | GoogleApi.ContentWarehouse.V1.Model.KnowledgeAnswersIntentQueryNimbleAnnotationSignals.t |  |
| `KnowledgeAnswersIntentQueryAnnotationLayerSignals` | `ntprAnnotationSignals` | GoogleApi.ContentWarehouse.V1.Model.KnowledgeAnswersIntentQueryNTPRAnnotationSignals.t |  |
| `KnowledgeAnswersIntentQueryAnnotationLayerSignals` | `qrefAnnotationSignals` | GoogleApi.ContentWarehouse.V1.Model.KnowledgeAnswersIntentQueryQrefAnnotationSignals.t |  |
| `KnowledgeAnswersIntentQueryAnnotationLayerSignals` | `semanticAnnotationSignals` | GoogleApi.ContentWarehouse.V1.Model.KnowledgeAnswersIntentQuerySemanticAnnotationSignals.t |  |

**KnowledgeAnswersIntentQuerySaftSignals** - 3 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `KnowledgeAnswersIntentQuerySaftSignals` | `entityType` | String.t |  |
| `KnowledgeAnswersIntentQuerySaftSignals` | `isHeadOfIntent` | boolean() |  |
| `KnowledgeAnswersIntentQuerySaftSignals` | `isVerb` | boolean() | Saft often marks verbs as head of intent and we may want to ignore those. |

**KnowledgeAnswersIntentQueryGroundingSignals** - 4 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `KnowledgeAnswersIntentQueryGroundingSignals` | `groundabilityScore` | float() | Score indicating how grounded the intent is, populated by the Grounding Box, used by the pre-fulfillment ranker, see |
| `KnowledgeAnswersIntentQueryGroundingSignals` | `usesGroundingBox` | boolean() | If true, then GroundingBox and PGRP are used in AnswersRewriter to process the intent. Other post-processing steps, including IGDP, are adjusted accordingly. Note this will be removed once GroundingBox is fully launched and all prod traffic goes through it. Before that happens, each IG that needs to go through GB and PGRP (post GB ranking pruning) will need to explicitly set this field to true. See |
| `KnowledgeAnswersIntentQueryGroundingSignals` | `numGroundableArgs` | float() | Number of groundable arguments in the parsed intent. |
| `KnowledgeAnswersIntentQueryGroundingSignals` | `pgrpOutputFormat` | String.t | PGRP outputs PROD_INTENT_FACTORY intent format by default. See go/intent-conversion-locations-in-sage. Experimental flags can change or make PGRP output additional intents formatted for PORTMON_FULFILLMENT (e.g. with RDs). This is used by the PortMon/ARM dark launch (go/arm-dark-launch-infra). Longer term, this will be replaced by DGS system-internal transformations (go/if-dgs). |

**KnowledgeAnswersIntentQueryArgument** - 3 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `KnowledgeAnswersIntentQueryArgument` | `heuristicEvalData` | GoogleApi.ContentWarehouse.V1.Model.NlpSemanticParsingAnnotationEvalData.t | Eval_data was not derived at parsing time (i.e. is not expected to be produced by the IG), but heuristically determined by matching the ArgumentValue to an annotation/query fragment. |
| `KnowledgeAnswersIntentQueryArgument` | `key` | GoogleApi.ContentWarehouse.V1.Model.KnowledgeAnswersMeaningSchemaSlotKey.t | Slot schema key for this Argument. Note: This is still under development and not available for general use. Contact meaning-platform-eng@ for questions. Note: Currently MeaningSchemaSlotKey proto has both mid and unique_id. In future, only mid will be present in it. We are in the process of moving &quot;unique_id&quot; out of it. See (b/168907943). Note: The logged version of intent_query will only have &quot;mid&quot; populated in it to save space and avoid data duplication. |
| `KnowledgeAnswersIntentQueryArgument` | `modifiers` | GoogleApi.ContentWarehouse.V1.Model.KnowledgeAnswersIntentModifiers.t | A flattened representation of all intent modifiers that apply to this argument. |

**KnowledgeAnswersIntentQueryArgumentProvenance** - 5 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `KnowledgeAnswersIntentQueryArgumentProvenance` | `anaphor` | GoogleApi.ContentWarehouse.V1.Model.KnowledgeAnswersIntentQueryArgumentProvenanceQueryAnaphor.t | If populated, the current query contains an anaphor that refers to the value. For example: U: Weather in Paris. [Weather(location=paris)] G: 65 degrees and sunny. U: How many people live there? [Population(city=paris)] The &quot;there&quot; in the current query would have the &quot;anaphor&quot; field set. NOTE: after a string rewrite this field will not be populated anymore if the rewrite replaced the anaphor with the corresponding value. For example, if we rewrite [How many people there] to [H |
| `KnowledgeAnswersIntentQueryArgumentProvenance` | `attentionalEntity` | GoogleApi.ContentWarehouse.V1.Model.KnowledgeAnswersIntentQueryArgumentProvenanceAttentionalEntity.t |  |
| `KnowledgeAnswersIntentQueryArgumentProvenance` | `currentQuery` | GoogleApi.ContentWarehouse.V1.Model.KnowledgeAnswersIntentQueryArgumentProvenanceCurrentQuery.t | NOTE: PreviousQuery is used for values that originate directly from QRef entities annotated in the user query. AttentionalEntity is used for values that come from the system (entities published by a dialog). These values could also originate from an entity annotated by QRef in the query, but this is not necessarily the case. SearchAnswerValue is used for values that come from the system as part of the answer of the user query. For example: U: Wife of Barack Obama G: Barack Obama's wife is Michel |
| `KnowledgeAnswersIntentQueryArgumentProvenance` | `injectedContextualSchema` | GoogleApi.ContentWarehouse.V1.Model.KnowledgeAnswersIntentQueryArgumentProvenanceInjectedContextualSchema.t |  |
| `KnowledgeAnswersIntentQueryArgumentProvenance` | `previousQuery` | GoogleApi.ContentWarehouse.V1.Model.KnowledgeAnswersIntentQueryArgumentProvenancePreviousQuery.t |  |

**KnowledgeAnswersIntentQueryArgumentProvenanceCurrentQuery** - 2 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `KnowledgeAnswersIntentQueryArgumentProvenanceCurrentQuery` | `evalData` | list(GoogleApi.ContentWarehouse.V1.Model.NlpSemanticParsingAnnotationEvalData.t) | The span(s) in the query where the value comes from. Note that if the argument is split across the current and previous query, this message should |
| `KnowledgeAnswersIntentQueryArgumentProvenanceCurrentQuery` | `neuralLocationAnnotator` | GoogleApi.ContentWarehouse.V1.Model.KnowledgeAnswersIntentQueryArgumentProvenanceNeuralLocationAnnotator.t |  |

**KnowledgeAnswersIntentQueryArgumentProvenancePreviousQuery** - 4 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `KnowledgeAnswersIntentQueryArgumentProvenancePreviousQuery` | `currentQueryEvalData` | list(GoogleApi.ContentWarehouse.V1.Model.NlpSemanticParsingAnnotationEvalData.t) | The span(s) in the current query where the value comes from. This is used when the argument spans both the current and previous query. Eg jfk death -> [death, when] spans both queries. |
| `KnowledgeAnswersIntentQueryArgumentProvenancePreviousQuery` | `evalData` | list(GoogleApi.ContentWarehouse.V1.Model.NlpSemanticParsingAnnotationEvalData.t) | The span(s) in the query where the value comes from. |
| `KnowledgeAnswersIntentQueryArgumentProvenancePreviousQuery` | `eventId` | GoogleApi.ContentWarehouse.V1.Model.EventIdMessage.t | The event ID of the query where this value was pulled from. |
| `KnowledgeAnswersIntentQueryArgumentProvenancePreviousQuery` | `neuralLocationAnnotator` | GoogleApi.ContentWarehouse.V1.Model.KnowledgeAnswersIntentQueryArgumentProvenanceNeuralLocationAnnotator.t |  |

**KnowledgeAnswersIntentQueryImpliedEntity** - 5 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `KnowledgeAnswersIntentQueryImpliedEntity` | `annotatedSpan` | String.t | A copy of the span of canonical (raw) parser input text corresponding to this annotation. Copied from QRefAnnotation.annotated_span. |
| `KnowledgeAnswersIntentQueryImpliedEntity` | `isUngroundedValue` | boolean() | TODO (b/143536264): Create a new ImpliedTokens message and remove this. Whether the implied entity is ungrounded value, set to true when the entity doesn't have a KG mid. |
| `KnowledgeAnswersIntentQueryImpliedEntity` | `mid` | String.t | The KG mid of the implied entity. |
| `KnowledgeAnswersIntentQueryImpliedEntity` | `qrefConfidenceScore` | number() | The QRef confidence (in [0, 1]) of the entity being correctly annotated. |
| `KnowledgeAnswersIntentQueryImpliedEntity` | `shoppingIds` | GoogleApi.ContentWarehouse.V1.Model.KnowledgeAnswersIntentQueryShoppingIds.t | All ShoppingIds for this implied entity that need to be copied to IntentQuery (FunctionCall) if this implied entity is used in intent generation. See go/iql-shopping-ids for details. |

**KnowledgeAnswersIntentQueryToken** - 1 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `KnowledgeAnswersIntentQueryToken` | `ngram` | String.t | \|ngram\| should be populated with a string from the raw query, not the normalized tokens. E.g. The ngram in the ignored token for the Height intent on the query [Height of barack obama], will be &quot;Height&quot;. The ngram in the ignored token for the Videos intent on the query [vidéos] will be &quot;vidéos&quot;. |

**KnowledgeAnswersIntentQueryFunctionCall** - 6 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `KnowledgeAnswersIntentQueryFunctionCall` | `catalogVersion` | String.t | The corresponding meaning catalog version that was used to generate this FunctionCall. |
| `KnowledgeAnswersIntentQueryFunctionCall` | `contextualSensitivity` | list(GoogleApi.ContentWarehouse.V1.Model.KnowledgeAnswersSensitivitySensitivity.t) | Contextual Sensitivity (go/contextual-sensitivity) metadata indicating that a policy- or privacy- sensitive conversation context (previous queries, rewritten user queries, and previous system responses, like attentional entities) is used to generate this FunctionCall. This needs propagation (1) from Interp to DialogIntentState (DIS) (see b/148479837) and (2) from QRewrite/QUS down to Assistant Server's memory finalizer. One can use knowledge/answers/sensitivity/sensitivity_reader.h to parse this |
| `KnowledgeAnswersIntentQueryFunctionCall` | `ignoredTokens` | list(GoogleApi.ContentWarehouse.V1.Model.KnowledgeAnswersIntentQueryTokens.t) | A list of token lists that were ignored during parsing because they are known context phrases for this interpretation. For example, for query [tell me how tall height of Obama really], assuming &quot;tell me&quot;, &quot;tall&quot;, &quot;of&quot;, &quot;really&quot; are explained and thus ignored, with corresponding prior 0.9, 0.8, 0.7, 0.6, following ignored tokens will be populated: { ignored_tokens { token { ngram: &quot;tell me&quot;, prior: 0.9} score: 0.9 } ignored_tokens { token { ngram: |
| `KnowledgeAnswersIntentQueryFunctionCall` | `marker` | GoogleApi.ContentWarehouse.V1.Model.KnowledgeAnswersMarker.t | The marker specifies the purpose of this meaning struct / function call: Is it asking a question, and if yes, for which slot(s)? Is it a command, statement, etc? This corresponds to a (very coarse) notion of dialog acts. In the absence of this field, it will be inferred using the following algorithm (subject to marker applicability rules specified in marker.proto, see also go/requested-slots): 1) Use the underlying Meaning Schema's default marker, if applicable. 2) Assume that the Meaning Struct |
| `KnowledgeAnswersIntentQueryFunctionCall` | `modifiers` | GoogleApi.ContentWarehouse.V1.Model.KnowledgeAnswersIntentModifiers.t | A flattened representation of all intent modifiers that apply to this function call. |
| `KnowledgeAnswersIntentQueryFunctionCall` | `sensitivity` | GoogleApi.ContentWarehouse.V1.Model.KnowledgeAnswersSensitivitySensitivity.t | Intent level query sensitivity (go/sensitive-intents). This metadata comes directly from Intent Catalog, indicating a single-shot query sensitivity without putting context into considerations. Therefore, this requires a one-to-one match with each intent registered in Intent Catalog. |

**KnowledgeAnswersIntentQueryCollectionMembership** - 1 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `KnowledgeAnswersIntentQueryCollectionMembership` | `collectionScore` | number() | The collection score for a entity. |

**KnowledgeAnswersIntentQueryRelatednessSignals** - 1 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `KnowledgeAnswersIntentQueryRelatednessSignals` | `queryPopularity` | number() |  |

**KnowledgeAnswersIntentQuerySemanticAnnotationSignals** - 2 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `KnowledgeAnswersIntentQuerySemanticAnnotationSignals` | `score` | float() | Numeric value associated with each subgrammar annotation. Used for in-domain ranking inside the Aqua Analyzer. This field is not guaranteed to be in any range. Furthermore, this field should never be compared for annotations with differing 'domain' value. The field is included here for making the Aqua Analyzer work with subgrammar annotations that have been generated in a different Aqua Analyzer (typically by TUIG SemanticAnnotationServlet). TL;DR: Consumers of this message are STRONGLY DISCOURA |
| `KnowledgeAnswersIntentQuerySemanticAnnotationSignals` | `category` | String.t | Name of the subgrammar category this annotation is associated with. |

**KnowledgeAnswersIntentQuerySignalComputationFallbackIntent** - 1 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `KnowledgeAnswersIntentQuerySignalComputationFallbackIntent` | `intent` | String.t | The intent name of the fallback intent. |

**KnowledgeAnswersIntentQueryNimbleAnnotationSignals** - 3 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `KnowledgeAnswersIntentQueryNimbleAnnotationSignals` | `annotationSource` | String.t | Where the annotation has been read from. |
| `KnowledgeAnswersIntentQueryNimbleAnnotationSignals` | `type` | String.t | A client-controlled identifier that the client can use to distinguish between different sets of annotations. |
| `KnowledgeAnswersIntentQueryNimbleAnnotationSignals` | `version` | list(String.t) | Version identifier used to isolate different clients from each other. A client should intersect this list of versions with the ones the client is interested in, and use the annotation if the intersection is non-empty. |

**KnowledgeAnswersIntentQueryLocalSignals** - 2 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `KnowledgeAnswersIntentQueryLocalSignals` | `localResultSignals` | list(GoogleApi.ContentWarehouse.V1.Model.KnowledgeAnswersIntentQueryLocalResultSignals.t) | Signals relating to each Local result. |
| `KnowledgeAnswersIntentQueryLocalSignals` | `minSalientTermSimilarity` | number() | Minimum salient term similarity between Local results. |

**KnowledgeAnswersIntentQueryMediaEntitySignals** - 1 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `KnowledgeAnswersIntentQueryMediaEntitySignals` | `name` | String.t | Name of the media entity, i.e. &quot;Lady Gaga&quot;. |

**KnowledgeAnswersIntentQuerySupportTransferSignals** - 2 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `KnowledgeAnswersIntentQuerySupportTransferSignals` | `supportTransferSource` | list(String.t) | Entities that transferred support to this entity (mids). |
| `KnowledgeAnswersIntentQuerySupportTransferSignals` | `supportTransferTarget` | list(String.t) | Entities that received support from this entity (mids). |

**KnowledgeAnswersIntentQueryShoppingIds** - 6 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `KnowledgeAnswersIntentQueryShoppingIds` | `aspectClusterIds` | list(String.t) | A shopping aspect cluster id. These are attributes mined from mentions in web articles. |
| `KnowledgeAnswersIntentQueryShoppingIds` | `brandEntityId` | String.t | Brand entity id. Brands are fully reconciled with KG entities so there should never be ambiguity as to which brand applies (those would be separate MIDs). |
| `KnowledgeAnswersIntentQueryShoppingIds` | `bxCategoryIds` | list(integer()) | A category in the shopping browseonomy, a taxonomy of product types that can be found at go/bx. This field is expected to contain the deepest node in the browseonomy that the intent or argument pertains to, which may be an internal node. It does not contain the entire path of categories. |
| `KnowledgeAnswersIntentQueryShoppingIds` | `merchantIds` | list(String.t) | List of merchant customer account IDs associated with a merchant entity in KG. NOTE: Soon to be deprecated, see go/merchant_mids_in_indexer design |
| `KnowledgeAnswersIntentQueryShoppingIds` | `merchantSourceIds` | list(String.t) | A shopping merchant source id, i.e. the key used to identify Shopping Merchants as they are imported into KG. For reference, these IDs are populated in: |
| `KnowledgeAnswersIntentQueryShoppingIds` | `tagIds` | list(String.t) | Moka attributes of a product. This includes color tags but currently not brand. We allow the possibility for multiple tag ids, as multiple Moka tag ids may map to the same mid, and we may not be able to find a single matching Moka tag. Also, cross-category Moka colors intentionally map a single color mentioned in the query to an expansion of many tags representing points in LAB color space (although this representation is expected to change). |

**KnowledgeAnswersIntentQueryPersonalEntity** - 4 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `KnowledgeAnswersIntentQueryPersonalEntity` | `attributeId` | String.t | Attribute ID of a personal_summary_node_child. |
| `KnowledgeAnswersIntentQueryPersonalEntity` | `entityRelationship` | list(GoogleApi.ContentWarehouse.V1.Model.KnowledgeAnswersIntentQueryPersonalEntityEntityRelationship.t) |  |
| `KnowledgeAnswersIntentQueryPersonalEntity` | `freebaseMid` | String.t | The mid of the entity in freebase associated with this span. |
| `KnowledgeAnswersIntentQueryPersonalEntity` | `personalEntityChild` | list(GoogleApi.ContentWarehouse.V1.Model.KnowledgeAnswersIntentQueryPersonalEntity.t) | Every PersonalEntity might itself rescursively contain related Personal Entities, e.g. for, &quot;my father's mother&quot; a parent Personal Entity for 'Mother()' contains a child Personal Entity of the form 'Mother(Myself)'. |

**KnowledgeAnswersIntentQueryMuninSignals** - 2 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `KnowledgeAnswersIntentQueryMuninSignals` | `softModifierCollection` | list(String.t) | Signals for $ListQueryRuleWithSoftModifier. Collections allowed by the soft modifier. |
| `KnowledgeAnswersIntentQueryMuninSignals` | `textIsGenerated` | boolean() | If true, the text for this argument did not come from the query, but was generated somehow else. |

**QualityQrewritePersonalContactData** - 7 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `QualityQrewritePersonalContactData` | `conceptId` | String.t | Concept id for relationships in query language, e.g. &quot;Mother&quot; in English, &quot;Mère&quot; in French. It's only populated for source = RELATIONSHIP. |
| `QualityQrewritePersonalContactData` | `conceptIdEn` | String.t | Concept id for relationships in English, e.g. &quot;Mother&quot; for all non-English locales. It's only populated for source = RELATIONSHIP. It is used as the key to store relationship in memory (see |
| `QualityQrewritePersonalContactData` | `isTransliteratedMatch` | boolean() | Indicate the contact matches the transliterated query. |
| `QualityQrewritePersonalContactData` | `personalContactDataLog` | GoogleApi.ContentWarehouse.V1.Model.AssistantLogsCommunicationPersonalContactDataLog.t | Log version of PersonalContactData. Holds e.g. FUZZY match results. It is populated in NamedContactFrame when fuzzy match is performed: |
| `QualityQrewritePersonalContactData` | `recognitionAlternateSource` | String.t | If not none, then it indicates the personal contact data is alternate and how the alternate is fulfilled. |
| `QualityQrewritePersonalContactData` | `relationshipLexicalInfo` | GoogleApi.ContentWarehouse.V1.Model.CopleyLexicalMetadata.t | Lexical information for relationships in query language, e.g. &quot;Mother&quot; in English, &quot;Mère&quot; in French. It's only populated for source = RELATIONSHIP. |
| `QualityQrewritePersonalContactData` | `relationshipMemory` | list(GoogleApi.ContentWarehouse.V1.Model.QualityQrewriteRelationshipMemoryData.t) | Resolved relationship names and contact pointers from Assistant Memory. This field is populated into both relationship annotation (source = RELATIONSHIP) and Focus/device contacts retrieved by that contact name. The data from Assistant Memory comes from two different columns: ASSISTANT_SETTINGS and PWS_CONTACT_ANNOTATION. We support multiple people with same relationship (e.g. multiple brothers) by using a repeated relationship_memory field. Examples are at go/person-subgrammar-relationship. |

**QualityQrewriteAccountProvenanceThirdPartyAccount** - 1 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `QualityQrewriteAccountProvenanceThirdPartyAccount` | `email` | String.t | Email address of the linked account (eg foo@outlook.com). |

**QualityDialogManagerLocalIntentOptions** - 1 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `QualityDialogManagerLocalIntentOptions` | `intent` | list(String.t) | LINT.ThenChange( //depot/google3/googledata/nlp/generation/messages/assistant/\ dialog_LOCAL_LocalAssistantSchema/\ dialog.LOCAL.LocalAssistantSchema_zxx.genx.textpb, //depot/google3/quality/dialog_manager/verticals/local/assistant/\ suggestion_chip_util.cc) |

**QualityDialogManagerLocalResult** - 9 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `QualityDialogManagerLocalResult` | `availableIntents` | GoogleApi.ContentWarehouse.V1.Model.QualityDialogManagerLocalIntentOptions.t | The set of available intents changes with result. An intersection of available_intents and allowed_intents (See: local_config.proto), is shown to the user. |
| `QualityDialogManagerLocalResult` | `distanceMeters` | String.t | For a directions result, this field will be the distance from the origin to this result using the best measure we have available - the distance along a route, if we have one, or just the crow's flight distance. For a local result, this field will be the crow's flight distance from the user to the result. |
| `QualityDialogManagerLocalResult` | `distanceUnits` | String.t | The standard units of the location where the user is based (not their current location). For example, miles for a user from the US, kilometers for the UK. A US user currently in the UK should have units read in miles. |
| `QualityDialogManagerLocalResult` | `inUserAdminArea1` | boolean() | If true, this LocalResult is located in the same state as the user's location. |
| `QualityDialogManagerLocalResult` | `inUserCountry` | boolean() | If true, this LocalResult is located in the same country as the user's location. |
| `QualityDialogManagerLocalResult` | `inUserLocality` | boolean() | Whether this result is in the same city or town that the user is in. |
| `QualityDialogManagerLocalResult` | `isBusinessChain` | boolean() | If the original query had a chain intent, and this result is for a business chain. |
| `QualityDialogManagerLocalResult` | `locality` | String.t | City/Town. |
| `QualityDialogManagerLocalResult` | `ttsAddress` | String.t | The address of this result formatted for TTS output. This formatting removes acronyms like 2-letter state codes as they cannot be spoken well. |

**NlpSemanticParsingSaftMentionAnnotation** - 4 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `NlpSemanticParsingSaftMentionAnnotation` | `coreference` | GoogleApi.ContentWarehouse.V1.Model.NlpSemanticParsingSaftCoreference.t | Annotations for spans that are resolved coreference mentions. |
| `NlpSemanticParsingSaftMentionAnnotation` | `entity` | GoogleApi.ContentWarehouse.V1.Model.NlpSemanticParsingSaftSpan.t | Annotations for spans like &quot;san francisco giants&quot;. |
| `NlpSemanticParsingSaftMentionAnnotation` | `measure` | GoogleApi.ContentWarehouse.V1.Model.NlpSemanticParsingSaftMeasure.t | Annotations for spans &quot;53 pounds&quot;. |
| `NlpSemanticParsingSaftMentionAnnotation` | `title` | GoogleApi.ContentWarehouse.V1.Model.NlpSemanticParsingSaftSpan.t | Annotations for spans like &quot;the president of the United States&quot;. |

**NlpSemanticParsingSaftCoreference** - 2 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `NlpSemanticParsingSaftCoreference` | `rawText` | String.t | The substring of the raw query spanned by this annotation. |
| `NlpSemanticParsingSaftCoreference` | `referentText` | String.t | The name of the entity this mentions refers to. |

**NlpSemanticParsingSaftSpan** - 1 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `NlpSemanticParsingSaftSpan` | `rawText` | String.t | The substring of the raw query spanned by this annotation. |

**NlpSemanticParsingSaftMeasure** - 1 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `NlpSemanticParsingSaftMeasure` | `rawText` | String.t | The substring of the raw query spanned by this annotation. |

**LogsSemanticInterpretationIntentQueryLinkKindFlags** - 1 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `LogsSemanticInterpretationIntentQueryLinkKindFlags` | `latentEntity` | String.t |  |

**LogsSemanticInterpretationIntentQueryLinkKindInfo** - 1 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `LogsSemanticInterpretationIntentQueryLinkKindInfo` | `kcLinkName` | String.t | Not set for a while. |

**LogsSemanticInterpretationIntentQuerySupportTransferRule** - 2 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `LogsSemanticInterpretationIntentQuerySupportTransferRule` | `allowWildcardIntents` | boolean() |  |
| `LogsSemanticInterpretationIntentQuerySupportTransferRule` | `isReverseLink` | boolean() |  |

**LogsSemanticInterpretationIntentQueryWebrefEntityRelationship** - 3 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `LogsSemanticInterpretationIntentQueryWebrefEntityRelationship` | `entityIndex` | integer() |  |
| `LogsSemanticInterpretationIntentQueryWebrefEntityRelationship` | `linkMetadata` | GoogleApi.ContentWarehouse.V1.Model.LogsSemanticInterpretationIntentQueryEntityLinkMetadata.t |  |
| `LogsSemanticInterpretationIntentQueryWebrefEntityRelationship` | `linkWeight` | number() |  |

**AttentionalEntitiesMentionProperties** - 4 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `AttentionalEntitiesMentionProperties` | `eventId` | GoogleApi.ContentWarehouse.V1.Model.EventIdMessage.t | ID of the event that resulted in this entity mention. For user and system turn AEs, this is taken from the ConversationSnapshotId of the snapshot containing this mention. For client AEs, this is empty. This can be used to join back this particular mention to the specific &quot;turn&quot; in which this mention took place. |
| `AttentionalEntitiesMentionProperties` | `listEntryInfo` | GoogleApi.ContentWarehouse.V1.Model.AttentionalEntitiesMentionPropertiesListEntryInfo.t | If present, this entity was mentioned as part of a larger list. |
| `AttentionalEntitiesMentionProperties` | `role` | GoogleApi.ContentWarehouse.V1.Model.AttentionalEntitiesSemanticRoleId.t | The semantic role that the entity was used in. |
| `AttentionalEntitiesMentionProperties` | `spatialProperties` | GoogleApi.ContentWarehouse.V1.Model.AttentionalEntitiesSpatialProperties.t | If present, properties of visual mentions (e.g., how they are displayed to the user, visibility, etc.). |

**AttentionalEntitiesSemanticRoleId** - 2 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `AttentionalEntitiesSemanticRoleId` | `intentId` | String.t | Semantic roles will be defined locally, within the context of a single task/feature. The \|intent_id\| is a unique identifier for such a local cluster. In most cases, this should be exactly the same as the name of the intent used for TaskState (see go/assistant-intent-catalog). In cases where the intent isn't well-defined, this can be an arbitrary, feature-defined identifier. |
| `AttentionalEntitiesSemanticRoleId` | `roleId` | String.t | Identifier for a semantic role, unique within the namespace of \|intent_id\|. When this role corresponds to a slot in the intent, the \|role_id\| should be equal to the name of that argument. For example, consider an entry in the intent catalog: core_intent { id { id: &quot;BookARide&quot; } slot { name: &quot;provider&quot; type { string_type { } } } slot { name: &quot;num_riders&quot; type { number_type { } } } } Then, the \|role_id\| would be &quot;provider&quot; or &quot;num_riders&quot; when refe |

**AssistantLogsQueryAnnotationLog** - 6 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `AssistantLogsQueryAnnotationLog` | `deviceAnnotation` | GoogleApi.ContentWarehouse.V1.Model.AssistantLogsDeviceAnnotationLog.t | Deprecated, please use room_annotations. |
| `AssistantLogsQueryAnnotationLog` | `deviceAnnotations` | list(GoogleApi.ContentWarehouse.V1.Model.AssistantLogsDeviceAnnotationLog.t) | Log the device annotations mentioned in the query. |
| `AssistantLogsQueryAnnotationLog` | `providerAnnotation` | GoogleApi.ContentWarehouse.V1.Model.AssistantLogsProviderAnnotationLog.t | Log the provider annotations annotated from the query. |
| `AssistantLogsQueryAnnotationLog` | `roomAnnotation` | GoogleApi.ContentWarehouse.V1.Model.AssistantLogsRoomAnnotationLog.t | TODO(b/171250187) Deprecates the optional RoomAnnotationLog and DeviceAnnotationLog. Deprecated, please use device_annotations. |
| `AssistantLogsQueryAnnotationLog` | `roomAnnotations` | list(GoogleApi.ContentWarehouse.V1.Model.AssistantLogsRoomAnnotationLog.t) | Log the room annotations mentioned in the query. |
| `AssistantLogsQueryAnnotationLog` | `structureAnnotations` | list(GoogleApi.ContentWarehouse.V1.Model.AssistantLogsStructureAnnotationLog.t) | Log the structure annotations mentioned in the query. |

**VideoContentSearchVideoGeneratedQueryFeatures** - 4 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `VideoContentSearchVideoGeneratedQueryFeatures` | `prefilteredPassageCount` | integer() | The total number of passages that were input to generating queries for this video. This count might be bigger than the total number of anchors in the video as some of the anchors might have been filtered by the pipeline. |
| `VideoContentSearchVideoGeneratedQueryFeatures` | `filterReason` | list(String.t) | A description of why the video was removed. This is intended for debugging generated queries that are filtered at the video level. |
| `VideoContentSearchVideoGeneratedQueryFeatures` | `titleEntityAnnotations` | GoogleApi.ContentWarehouse.V1.Model.VideoContentSearchEntityAnnotations.t | Entity annotations for one of the mids representing the video title. This entity is either one of the blocklisted entities if at least of the mentioned entities in the title belongs to the blocklisted categories, or is the highest confidence entity for the title. |
| `VideoContentSearchVideoGeneratedQueryFeatures` | `totalRestrictedQueries` | integer() | The total number of queries that belong to the blocklisted categories for this video. |

**NlpSciencelitRetrievalQueryEncodingDebugInfo** - 1 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `NlpSciencelitRetrievalQueryEncodingDebugInfo` | `scamQueryEncoding` | GoogleApi.ContentWarehouse.V1.Model.ResearchScamGenericFeatureVector.t | The query encoding sent to scam for retrieval. |

**PerDocData (filtered)** - 23 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `PerDocData (filtered)` | `webrefEntities` | GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefWebrefMustangAttachment.t | WebRef entities associated to the document. See go/webref for details. |
| `PerDocData (filtered)` | `spamMuppetSignals` | GoogleApi.ContentWarehouse.V1.Model.SpamMuppetjoinsMuppetSignals.t | Contains hacked site signals which will be used in query time joins. As of Oct'19, the field is stored in a separate corpus. It'll only be populated for in-flight requests between retrieve and full-score in perdocdata. So no extra storage is needed on muppet side. |
| `PerDocData (filtered)` | `datesInfo` | String.t | Stores dates-related info (e.g. page is old based on its date annotations). Used in FreshnessTwiddler. Use encode/decode functions from quality/timebased/utils/dates-info-helper-inl.h |
| `PerDocData (filtered)` | `fringeQueryPrior` | GoogleApi.ContentWarehouse.V1.Model.QualityFringeFringeQueryPriorPerDocData.t | Contains encoded FringeQueryPrior information. Unlikely to be meaningful for anyone other than fringe-ranking team. Contact fringe-ranking team if any questions, but do NOT use directly without consulting them. |
| `PerDocData (filtered)` | `ymylHealthScore` | integer() | Stores scores of ymyl health classifier as defined at go/ymyl-classifier-dd. To use this field, you MUST join g/pq-classifiers-announce and add your use case at |
| `PerDocData (filtered)` | `topPetacatTaxId` | integer() | Top petacat of the site. Used in SiteboostTwiddler to determine result/query matching. |
| `PerDocData (filtered)` | `scaledSelectionTierRank` | integer() | Selection tier rank is a language normalized score ranging from 0-32767 over the serving tier (Base, Zeppelins, Landfills) for this document. This is converted back to fractional position within the index tier by scaled_selection_tier_rank/32767. |
| `PerDocData (filtered)` | `semanticDate` | integer() | SemanticDate, estimated date of the content of a document based on the contents of the document (via parsing), anchors and related documents. Date is encoded as a 32-bits UNIX date (1970 Jan 1 epoch). Confidence is encoded using a SemanticDate specific format. For details of encoding, please refer to quality/freshness/docclassifier/semanticdate/public/semantic_date.proto |
| `PerDocData (filtered)` | `ymylNewsScore` | integer() | Stores scores of ymyl news classifier as defined at go/ymyl-classifier-dd. To use this field, you MUST join g/pq-classifiers-announce and add your use case at |
| `PerDocData (filtered)` | `noimageframeoverlayreason` | integer() | If not 0, we should not show the image in overlay mode in image snippets |
| `PerDocData (filtered)` | `freshboxArticleScores` | integer() | Stores scores of freshness-related classifiers: freshbox article score, live blog score and host-level article score. The encoding/decoding API is in quality/freshness/freshbox/goldmine/freshbox_annotation_encoder.h. To use this field, you MUST join g/pq-classifiers-announce and add your use case at |
| `PerDocData (filtered)` | `IsAnchorBayesSpam` | boolean() | Is this document considered spam by the anchor bayes classifier? |
| `PerDocData (filtered)` | `commercialScore` | number() | A measure of commerciality of the document Score > 0 indicates document is commercial (i.e. sells something) Computed by repository/pageclassifiers/parsehandler-commercial.cc |
| `PerDocData (filtered)` | `semanticDateInfo` | integer() | Info is encoded using a SemanticDate specific format. Contains confidence scores for day/month/year components as well as various meta data required by the freshness twiddlers. |
| `PerDocData (filtered)` | `videoLanguage` | GoogleApi.ContentWarehouse.V1.Model.QualityVidyaVideoLanguageVideoLanguage.t | Audio-based language classified by Automatic Language Identification (only for watch pages). |
| `PerDocData (filtered)` | `knexAnnotation` | GoogleApi.ContentWarehouse.V1.Model.SocialPersonalizationKnexAnnotation.t | For indexing k'nex annotations for FreshDocs. |
| `PerDocData (filtered)` | `mediaOrPeopleEntities` | GoogleApi.ContentWarehouse.V1.Model.ImageQualitySensitiveMediaOrPeopleEntities.t | Contains the mids of the 5 most topical entities annotated with selected KG collections. This information is currently used on Image Search to detect cases where results converged to mostly a single person or media entity. More details: go/result-set-convergence. |
| `PerDocData (filtered)` | `freshnessEncodedSignals` | String.t | Stores freshness and aging related data, such as time-related quality metrics predicted from url-pattern level signals. Use the encoding decoding API in quality/freshness/docclassifier/aging/encoded-pattern-signals.h This field is deprecated. |
| `PerDocData (filtered)` | `queriesForWhichOfficial` | GoogleApi.ContentWarehouse.V1.Model.OfficialPagesQuerySet.t | The set of (query, country, language) triples for which this document is considered to be the official page. For example, www.britneyspears.com would be official for (&quot;britney spears&quot;, &quot;us&quot;, 0) and others (0 is English). |
| `PerDocData (filtered)` | `v2KnexAnnotation` | GoogleApi.ContentWarehouse.V1.Model.QualitySherlockKnexAnnotation.t | For indexing v2 k'nex, see/go/knex-v2-doc-annotation for details. |
| `PerDocData (filtered)` | `s3AudioLanguage` | GoogleApi.ContentWarehouse.V1.Model.S3AudioLanguageS3AudioLanguage.t | Primary video's audio language classified by S3 based Automatic Language Identification (only for watch pages). |
| `PerDocData (filtered)` | `watchpageLanguageResult` | GoogleApi.ContentWarehouse.V1.Model.WatchpageLanguageWatchPageLanguageResult.t | Language classified by the WatchPageLanguage Model (go/watchpage-language). Only present for watch pages. |
| `PerDocData (filtered)` | `asteroidBeltIntents` | GoogleApi.ContentWarehouse.V1.Model.QualityOrbitAsteroidBeltDocumentIntentScores.t | For indexing Asteroid Belt intent scores. See go/asteroid-belt for details. |

**QualityNsrNsrData (filtered)** - 28 attributes

| Module | Attribute | Type | Description |
|---|---|---|---|
| `QualityNsrNsrData (filtered)` | `titlematchScore` | number() | Titlematch score of the site, a signal that tells how well titles are matching user queries. |
| `QualityNsrNsrData (filtered)` | `siteChunkSource` | String.t | These are only annotated in the Goldmine NSR annotator. |
| `QualityNsrNsrData (filtered)` | `siteAutopilotScore` | number() | Aggregated value of url autopilot scores for this sitechunk. |
| `QualityNsrNsrData (filtered)` | `chromeInTotal` | number() | Site-level Chrome views. |
| `QualityNsrNsrData (filtered)` | `chardScoreVariance` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrVersionedFloatSignal.t) | Site-level Chard Variance for all pages of a site. |
| `QualityNsrNsrData (filtered)` | `chardScoreEncoded` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrVersionedIntSignal.t) | Site-level Chard (encoded as an int). |
| `QualityNsrNsrData (filtered)` | `nsrdataFromFallbackPatternKey` | boolean() | If true indicates that we do not have NSR data computed for the chunk, and instead the data is coming from an average of other host chunks. |
| `QualityNsrNsrData (filtered)` | `siteChunk` | String.t | Primary NSR sitechunk. In most of the cases it's same as HOST_LEVEL_V3 sitechunked canonical url of the document. In rare, but important cases it's based on page markup (see quality/nsr/util/sitechunker.h for details). |
| `QualityNsrNsrData (filtered)` | `chardEncoded` | integer() | Site-level chard score: site quality predictor based on content. |
| `QualityNsrNsrData (filtered)` | `tofu` | number() | Site-level tofu score: site quality predictor based on content. |
| `QualityNsrNsrData (filtered)` | `siteLinkOut` | number() | Aggregated value of url link out scores for this sitechunk. |
| `QualityNsrNsrData (filtered)` | `siteQualityStddev` | number() | Estimate of site's PQ rating stddev--spread of the page-level PQ ratings of a site. Note this is different from nsr_variance which predicts error of NSR itself from the aggregated site-level rating. |
| `QualityNsrNsrData (filtered)` | `secondarySiteChunk` | String.t | Secondary NSR sitechunk. When present, it provides more granular chunking than primary sitechunks (see quality/nsr/util/sitechunker.h for details). |
| `QualityNsrNsrData (filtered)` | `siteLinkIn` | number() | Average value of the site_link_in for pages in the sitechunk. |
| `QualityNsrNsrData (filtered)` | `ymylNewsV2Score` | number() |  |
| `QualityNsrNsrData (filtered)` | `isElectionAuthority` | boolean() | Bit to determine whether the site has the election authority signal, as computed by go/election-authority |
| `QualityNsrNsrData (filtered)` | `priorAdjustedNsr` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrVersionedFloatSignal.t) | NSR - prior. Estimate of whether the site is above/below average NSR in its slice. |
| `QualityNsrNsrData (filtered)` | `vlqNsr` | number() | NSR from a headroom model targeting low-quality video sites. |
| `QualityNsrNsrData (filtered)` | `site2vecEmbeddingEncoded` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrNsrDataEncodedEmbedding.t) | Encoded site2vec embedding (to be used in superroot) since the full embeddings take too much space. |
| `QualityNsrNsrData (filtered)` | `smallPersonalSite` | number() | Score of small personal site promotion go/promoting-personal-blogs-v1 |
| `QualityNsrNsrData (filtered)` | `isVideoFocusedSite` | boolean() | Bit to determine whether the site has mostly video content, but is not hosted on any known video-hosting domains. Site is considered to be video-focused, if it has > 50% of the URLs with watch pages (with smoothing prior). ariane/4045246 |
| `QualityNsrNsrData (filtered)` | `siteQualityStddevs` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrVersionedFloatSignal.t) |  |
| `QualityNsrNsrData (filtered)` | `videoScore` | number() |  |
| `QualityNsrNsrData (filtered)` | `shoppingScore` | number() |  |
| `QualityNsrNsrData (filtered)` | `localityScore` | number() | Locality score of the site, i.e. the locality component of the LocalAuthority signal (see go/pq-localauthority). |
| `QualityNsrNsrData (filtered)` | `isCovidLocalAuthority` | boolean() | Bit to determine whether the site has the local authority covid signal, as computed by go/covid-local-authority |
| `QualityNsrNsrData (filtered)` | `vlq` | number() | Score of the Video LQ model. |
| `QualityNsrNsrData (filtered)` | `site2vecEmbedding` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNsrNsrDataEmbedding.t) | Site2vec embeddings. |

### Patents relevant to Stage 9

**US7487145B1 - Method and system for autocompletion using ranked results**

- **Core concept:** Autocomplete suggestions are ranked by popularity and relevance, creating a ranking system within the search suggestion box itself.
- **Connected leak modules:** `QualityNsrNsrData`, `QualityNavboostCrapsCrapsClickSignals`
- **Key SEO claims:**
  - Autocomplete suggestions are ranked based on popularity of search queries
  - The ranking system considers historical query frequency and recency
  - Suggestions are generated and ranked in real-time as the user types
  - The suggestion box is itself a ranking system with its own quality signals
  - Popular queries surface first, creating a feedback loop where demand drives visibility
- **Leak module connections:** The `KnowledgeAnswersIntentQueryRelatednessSignals.queryPopularity` field is the direct signal behind popularity-based autocomplete ranking. The `ImageExactBoostNavQuery` module's `imageClickRank` ("click-based rank of the image for this query") and `navQuery` ("the normalized raw query text") are the click signals feeding the autocomplete quality system. The `ResearchScienceSearchNavboostQueryInfo` module's `queryCount` ("the counts on this query") provides the frequency data that drives suggestion ranking. The `QualityNsrNsrData.titlematchScore` ("a signal that tells how well titles are matching user queries") connects document titles to autocomplete relevance. The `KnowledgeAnswersIntentQueryFunctionCall.ignoredTokens` field shows how context phrases are stripped during parsing - the same tokenization that powers autocomplete matching.

**US9037464B1 - Computing numeric representations of words in a high-dimensional space (word2vec)**

- **Core concept:** word2vec maps words to vectors in a high-dimensional space where semantic similarity corresponds to spatial proximity, enabling neural matching of related concepts.
- **Connected leak modules:** `PerDocData`, `QualityNsrNsrData`, `QualityNsrPQData`
- **Key SEO claims:**
  - Words are represented as vectors in a continuous high-dimensional space
  - Semantically similar words have vectors that are close together in the space
  - The vector representations are learned from large corpora of text
  - Vector arithmetic captures semantic relationships (e.g., king - man + woman is approximately queen)
  - These representations enable matching queries to documents even without exact keyword overlap
  - The ancestor of every neural matching system in search - BERT and transformer models build on this foundation
- **Leak module connections:** The `NlpSaftDocument.entity` field ("entities in the document") and `semanticNode` field ("semantic nodes for the document" representing "higher-level abstractions beyond entity mention coreference") are populated by models built on word2vec foundations. The `KnowledgeAnswersIntentQueryGroundingSignals.groundabilityScore` ("score indicating how grounded the intent is") and `numGroundableArgs` ("number of groundable arguments in the parsed intent") rely on vector similarity to match query tokens to knowledge graph entities. The `QualityPreviewSnippetQueryFeatures.passageembedScore` and `queryHasPassageembedEmbeddings` fields confirm passage-level embedding matching in snippet generation. The `QualityNsrNsrData.site2vecEmbedding` ("Site2vec embeddings") and `site2vecEmbeddingEncoded` fields extend vector representations to entire sites, enabling site-level semantic matching against queries. The `NlpSemanticParsingQRefAnnotation.confidenceScore` ("the confidence (in [0, 1]) of the entity being correctly annotated") is computed using vector similarity between query spans and entity representations.

**US10452978B2 - Attention-based sequence transduction neural networks (Transformer)**

- **Core concept:** The Transformer architecture uses self-attention mechanisms for sequence-to-sequence transduction, enabling models like BERT that understand query and document context bidirectionally.
- **Connected leak modules:** `PerDocData`, `QualityNsrNsrData`, `QualityNsrPQData`
- **Key SEO claims:**
  - Self-attention mechanisms allow the model to weigh the importance of different words in context
  - The architecture enables bidirectional understanding of text (context flows both directions)
  - Transformers can rewrite and expand queries to understand intent beyond literal keywords
  - Passage-level understanding becomes feasible - the model reads and comprehends text passages
  - Not a ranking patent by classification, but the architecture behind BERT and modern query/document understanding
  - Context, hedging, and fluff are understood - the models can distinguish substantive from padding content
- **Leak module connections:** The `NlpSaftDocument` module is the primary output format for transformer-processed documents: its `semanticNode` field carries "arbitrary types of higher-level abstractions beyond entity mention coreference and binary relations" as "nodes in a directed acyclic graph" - these semantic graphs are produced by transformer models that understand context bidirectionally. The `NlpSemanticParsingQRefAnnotation` module's 29 attributes represent the entity-level understanding produced by these models, including `mergedImpliedEntity` ("a list of any implied entities merged into this annotation during parsing") which requires contextual understanding to identify implied entities. The `KnowledgeAnswersIntentQueryParsingSignals.calibratedParsingScore` ("a parsing score that is independently calibrated by each parser/IG, used by pre-fulfillment ranker") is the confidence metric from transformer-based query parsing. The `KnowledgeAnswersIntentQueryFunctionCall.ignoredTokens` field lists "token lists that were ignored during parsing because they are known context phrases" - distinguishing substantive content from padding is exactly what the transformer patent claims. The `PerDocData.webrefEntities` field ("WebRef entities associated to the document") carries the entity annotations produced by transformer-powered understanding, and `PerDocData.asteroidBeltIntents` ("for indexing Asteroid Belt intent scores") stores the intent classifications that transformer models generate.

**US9953076B2 - Predictive query completion and predictive search results**

- **Core concept:** A search system predicts which query suggestion a user is likely to select based on prediction criteria independent of user selection, and proactively fetches and displays search results for high-quality query suggestions before the user finishes typing.
- **Connected leak modules:** `QualityNavboostCrapsCrapsClickSignals`, `QualityNavboostCrapsCrapsData`, `QualityNsrNsrData`, `PerDocData`
- **Key SEO claims:**
  - Quality measure for each query suggestion is determined by a valid prediction rate: the ratio of times a search result referencing a resource was selected when provided for the suggestion to the number of times it was provided
  - Resource quality is further determined by the resource's ranking in an authority graph (e.g., PageRank)
  - Resource quality is further determined by a search score measuring responsiveness of the resource to the query suggestion
  - If a query suggestion's quality measure meets a threshold, search results for that suggestion are proactively provided before user completes typing
  - If no suggestion meets the quality threshold, search results for only the partial query are provided instead
  - Prediction criterion can be a probability threshold, a timeout, or detection of a language boundary (syllable, word, bi-gram)
  - Search results are displayed using fade-in/fade-out techniques for smooth transitions, reducing 'search result blindness'
  - Query suggestions are re-ordered from organic order into stemmed groups that closely match typing inputs
- **Leak module connections:** The `ImageExactBoostNavQuery` module directly implements the click-based quality signals described in the patent: `imageClickRank` ("click-based rank of the image for this query"), `confidence` ("associated confidence scores for the image for the query"), and `navFp` ("query fingerprint") are the per-query quality metrics. The `ResearchScienceSearchNavboostQueryInfo` module's `queryDocCount` ("the number of long-clicks on this pair") and `queryCount` ("the counts on this query") provide the selection/impression data that computes the valid prediction rate. The `KnowledgeAnswersIntentQueryRelatednessSignals.queryPopularity` field is the popularity signal behind suggestion ranking. The `OfficialPagesQuerySet.queryCountryLanguageFingerprints` field ("the fingerprint of the OfficialKey queries") identifies which queries a document is the official result for, which feeds into the proactive result fetching. The `QualityNsrNsrData.titlematchScore` ("a signal that tells how well titles are matching user queries") determines responsiveness of resources to query suggestions, and the NSR site quality scores determine authority graph ranking used in the patent's quality measure.

**US8631003B2 - Query identification and association**

- **Core concept:** Apparatus, systems and methods for predictive query identification. Candidate queries are identified from queries stored in a query log, with intent measures used to filter and associate web documents.
- **Connected leak modules:** `CompressedQualitySignals`, `NlpSemanticParsingQRefAnnotation`, `PerDocData`, `QualityNavboostCrapsCrapsClickSignals`, `QualityNavboostCrapsCrapsData`, `QualityNsrNsrData`, `QualityNsrPQData`, `QualityOrbitAsteroidBeltDocumentIntentScores`, `QualityPreviewSnippetRadishFeatures`, `QualityRankembedMustangMustangRankEmbedInfo`, `QualityTimebasedLastSignificantUpdate`, `QualityTimebasedSyntacticDate`, `SmartphonePerDocData`, `SnippetExtraInfo`, `SnippetExtraInfoSnippetCandidateInfo`
- **Key SEO claims:**
  - Search results can be identified and ranked by various relevancy scores, e.g., information retrieval (IR) scores based on text of cached and indexed web documents, feature vectors of identified documents, and other search processing techniques
  - The system implements a filter that receives candidate queries and associated landing pages and, for each candidate query and associated landing pages, filters associations of landing pages to the query based on a relevancy criterion
  - Queries related to tax filings and that are relevant to a governmental agency's tax-related web documents can be identified and these web documents can be boosted in the search results page for those queries
  - In some implementations, a suggestion vector and/or a query intent vector can be used to determine whether the candidate tuple is relevant to the commercial offering
  - Generating a first intent measure related to the first set of web documents, the first intent measure being based on a vector of terms identified in the first set of web documents
  - Filtering the web documents in the query-page candidate tuple based on the first intent measure and the second intent measure
  - Selecting web documents having an associated relevancy score that exceeds a relevancy threshold
  - A computer-implemented method comprises defining query extraction criteria configured to identify queries related to a subject relevance
- **Leak module connections:** The `QualityOrbitAsteroidBeltDocumentIntentScores` module is the direct implementation of the patent's intent measure system: its `scores` field ("the intent scores, scaled to integers between 0 and 100") and `belowThresholdIntents` field ("intents below triggering threshold" where "any intent in this list has trigger=false") implement the filtering based on intent thresholds described in the patent. The `NlpSemanticParsingQRefAnnotation` module provides the entity annotations that feed into intent vectors: `confidenceScore` ("the confidence (in [0, 1]) of the entity being correctly annotated"), `resolutionScore` ("confidence that the annotation was created on an implicit mention"), and `entityRelationship` ("the relationship information from QRef") are the components of the "query intent vector" the patent describes. The `QualityNsrNsrData.titlematchScore` ("a signal that tells how well titles are matching user queries") implements the relevancy scoring. The `PerDocData.queriesForWhichOfficial` field ("the set of (query, country, language) triples for which this document is considered to be the official page") is the direct implementation of query-document association. The `QualityTimebasedLastSignificantUpdate` and `QualityTimebasedSyntacticDate` modules provide the temporal signals used in freshness-based query association.

**US8171021B2 - Query identification and association**

- **Core concept:** Apparatus, systems and methods for predictive query identification for advertisements. Candidate queries are identified from queries stored in a query log, with intent measures and relevancy scores used to associate web documents with candidate queries.
- **Connected leak modules:** `CompressedQualitySignals`, `NlpSemanticParsingQRefAnnotation`, `PerDocData`, `QualityNavboostCrapsCrapsClickSignals`, `QualityNavboostCrapsCrapsData`, `QualityNsrNsrData`, `QualityNsrPQData`, `QualityOrbitAsteroidBeltDocumentIntentScores`, `QualityPreviewSnippetRadishFeatures`, `QualityRankembedMustangMustangRankEmbedInfo`, `QualityTimebasedLastSignificantUpdate`, `QualityTimebasedSyntacticDate`, `SmartphonePerDocData`, `SnippetExtraInfo`, `SnippetExtraInfoSnippetCandidateInfo`
- **Key SEO claims:**
  - Search results can be identified and ranked by various relevancy scores, e.g., IR scores based on text of cached and indexed web documents, feature vectors of identified documents
  - The system implements a filter that receives the candidate queries and associated landing pages and filters associations based on a relevancy criterion
  - Queries related to tax filings and that are relevant to a governmental agency's tax-related web documents can be identified and these web documents can be boosted
  - The rank of an advertisement can be determined by multiplying the maximum cost-per-click by a quality score, which can be determined by the advertisement's relevance to the keywords of the query
  - Associating the selected web document with the candidate query if the intent measure exceeds an intent threshold
  - Determining whether the query was submitted at least a minimum number of times during a time period
  - Determining whether the query was submitted less than a maximum number of times during the time period
  - Identifying the query as the candidate query if the query was submitted at least the minimum number of times and less than the maximum number of times during the time period
  - Generating relevancy scores for a plurality of web documents, each relevancy score associated with a corresponding web document and being a measure of the relevance of the candidate query to the web document
  - IR scores can be computed from dot products of feature vectors corresponding to a query and a document, page rank scores, and/or combinations of IR scores and page rank scores
- **Leak module connections:** The `QualityOrbitAsteroidBeltDocumentIntentScores` module implements the patent's intent threshold: `intents` and `scores` are parallel lists where scores are "scaled to integers between 0 and 100," and `belowThresholdIntents` explicitly lists intents that did not cross the triggering threshold. The `NlpSemanticParsingQRefAnnotation` module's `confidenceScore`, `resolutionScore`, and `entityRelationship` fields provide the entity-level signals that compose the intent measure. The `PerDocData.queriesForWhichOfficial` field ("the set of (query, country, language) triples for which this document is considered to be the official page") is the query-document association data structure. The `ResearchScienceSearchNavboostQueryInfo.queryCount` ("the counts on this query") and `queryDocCount` ("the number of long-clicks on this pair") implement the minimum/maximum submission count thresholds. The `QualityNsrNsrData` module's site quality scores (including `priorAdjustedNsr` described as "NSR - prior. Estimate of whether the site is above/below average NSR in its slice") provide the page rank scores combined with IR scores. The `QualityPreviewSnippetRadishFeatures` and `SnippetExtraInfoSnippetCandidateInfo` modules carry the snippet-level signals used in relevancy scoring.

**US9916366B1 - Query augmentation**

- **Core concept:** Methods, systems, and apparatus for generating or using augmentation queries. A first query stored in a query log is identified and a quality signal related to the performance of the first query is compared to a performance threshold, with both user-generated and machine-generated synthetic augmentation queries ranked and used to augment user searches.
- **Connected leak modules:** `AnchorsAnchor`, `AnchorsAnchorSource`, `CompressedQualitySignals`, `IndexingDocjoinerAnchorStatistics`, `LocalWWWInfo`, `LocalWWWInfoCluster`, `NlpSemanticParsingQRefAnnotation`, `PerDocData`, `QualityNavboostCrapsCrapsClickSignals`, `QualityNavboostCrapsCrapsData`, `QualityNsrNsrData`, `QualityNsrPQData`, `QualityOrbitAsteroidBeltDocumentIntentScores`, `QualityPreviewSnippetRadishFeatures`, `QualityRankembedMustangMustangRankEmbedInfo`, `QualityTimebasedLastSignificantUpdate`, `QualityTimebasedSyntacticDate`, `RepositoryAnnotationsGeoTopicality`, `RepositoryAnnotationsRdfaRdfaRichSnippetsApplication`, `RichsnippetsPageMap`, `SmartphonePerDocData`, `SnippetExtraInfo`, `SnippetExtraInfoSnippetCandidateInfo`
- **Key SEO claims:**
  - A first query stored in a query log is identified and a quality signal related to the performance of the first query is compared to a performance threshold
  - Augmentation queries include both user-generated augmentation queries and machine-generated synthetic augmentation queries
  - Search results can promote results identified by both the augmentation query and the search query
  - A long click can be interpreted as a signal that the query identified information that the user deemed to be interesting, as the user either spent a certain amount of time on the landing page or found additional items of interest on the landing page
  - IR scores can be computed from dot products of feature vectors corresponding to a query and a document, page rank scores, and/or combinations of IR scores and page rank scores
  - The ranking adjusts: increasing rank of synthetic augmentation queries relative to user-generated queries for specific entity/location queries, and reducing rank for general content queries
  - Business information listings, document titles and/or anchor text found within the documents, and/or other descriptive structured data can be used to generate queries which will perform well
  - Averaging anchor text (AT) scores (such as a relevance score that measures the relevance of the query to the text in a hyperlink) and determining if the averaged AT scores exceeds a threshold value
  - The edit distance cost can be discounted or ignored if a synonym score (e.g., a measure representing the similarity of meaning of the terms that are deemed synonyms) is high
- **Leak module connections:** The `SearchPolicyRankableSensitivityQueryUnderstanding.rewrittenQuery` field ("the rewritten query this sensitivity is for. Note different query rewrites could produce different sensitivities") confirms that multiple query rewrites are generated and evaluated - this is the augmentation query system in production. The `ResearchScienceSearchNavboostQueryInfo` module's `queryDocCount` ("the number of long-clicks on this pair") and `lccCount` ("estimate of the number of long clicks for this tuple") directly implement the long-click quality signal the patent describes. The `QualityOrbitAsteroidBeltDocumentIntentScores` module's intent scores determine whether a query is classified as a "specific entity/location query" (boosted synthetic queries) or a "general content query" (reduced synthetic queries). The `NlpSemanticParsingQRefAnnotation` module's `globalProductClusterId` ("the shopping global product cluster id(s) of the annotated entity"), `productLineId` ("the shopping product line id(s)"), and `freebaseMid` ("the mid of the entity in freebase") provide the entity identification that makes synthetic query generation possible. The `OfficialPagesQuerySet.queryCountryLanguageFingerprints` field stores the query fingerprints for official page associations. The `KnowledgeAnswersIntentQueryShoppingIds` module's `brandEntityId`, `merchantIds`, `bxCategoryIds`, and `tagIds` fields carry the structured shopping data that generates synthetic queries from business listings.

**US9128945B1 - Query augmentation**

- **Core concept:** Augmentation queries (both real high-performing queries and synthetic queries generated from structured document data like business listings) are stored with cached search results and used to augment user searches, with synthetic queries generated from anchor text and entity names meeting document frequency thresholds.
- **Connected leak modules:** `AnchorsAnchor`, `AnchorsAnchorSource`, `IndexingDocjoinerAnchorStatistics`, `PerDocData`, `QualityNavboostCrapsCrapsClickSignals`
- **Key SEO claims:**
  - Structured document data (business listings, entity names) with resource locators is mined to generate synthetic queries using anchor text from the structured data
  - Synthetic query generation requires that anchor text appears in a number of documents exceeding a threshold - only widely-used anchor text generates augmentation queries
  - Synthetic queries are classified differently from non-synthetic queries, with performance rankings adjusted: reduced for general content queries, increased for specific entity/location queries
  - Search results for synthetic queries include the entity's resource and are cached for fast augmented search operations
  - Entity home pages are associated with synthetic queries in the augmentation data store
  - Entity resources are associated with synthetic queries independent of relevance measure - the entity's page is always included as a result
  - Augmentation queries are identified from query logs where quality signals (performance) exceed a threshold - queries that perform well in locating desirable documents
  - When a user query matches an augmentation query, cached results are provided alongside organic results
  - Domain names matching query terms trigger identification of the resource at that domain as a search result for the synthetic query
- **Leak module connections:** The `NlpSaftDocument` module's `hyperlink` field ("the hyperlinks in the document. Multiple hyperlinks are sorted in left-to-right order") provides the anchor text data that generates synthetic queries. The `NlpSemanticParsingQRefAnnotation` module's `freebaseMid` ("the mid of the entity in freebase associated with this span"), `displayName` ("copy the display info. This can be used by annotators to give grammars a canonical name for an entity"), and `annotatedSpan` ("a copy of the span of canonical (raw) parser input text") provide the entity identification for synthetic query generation. The `ResearchScienceSearchNavboostQueryInfo` module's `queryDocCount` ("the number of long-clicks on this pair") is the quality signal threshold metric. The `OfficialPagesQuerySet` module ("the set of (query, country, language) triples for which this document is considered to be the official page") implements the entity home page association with synthetic queries. The `KnowledgeAnswersIntentQueryShoppingIds` module carries the structured shopping data (`brandEntityId`, `merchantIds`, `bxCategoryIds`) that the patent describes as "business information listings" used to generate synthetic queries. The `PerDocData.commercialScore` field ("a measure of commerciality of the document. Score > 0 indicates document is commercial (i.e. sells something)") helps classify whether queries are general content or specific entity/location queries, which determines the synthetic query ranking adjustment.

### SEO actions

- **Optimize for entity annotations, not just keywords.** The `NlpSemanticParsingQRefAnnotation` module's 29 attributes show that Google parses every query for entities with confidence scores, freebase MIDs, and relationship mappings. Ensure your content uses entity-rich language that matches Knowledge Graph entries. The `confidenceScore` field ("the confidence (in [0, 1]) of the entity being correctly annotated") means Google measures how confidently it can identify entities in your content - ambiguous or poorly-structured entity references get low confidence and may not trigger intent matching. Use schema.org markup, consistent entity naming, and canonical references to the same entities the Knowledge Graph contains.

- **Structure content to trigger Asteroid Belt intent classifications above threshold.** The `QualityOrbitAsteroidBeltDocumentIntentScores` module stores intent scores "scaled to integers between 0 and 100" with explicit `belowThresholdIntents` that have `trigger=false`. Content that does not clearly signal its intent will score below the triggering threshold and be excluded from intent-based ranking. Use clear topical signals, consistent categorization, and explicit intent markers (e.g., transactional language for commercial pages, informational structure for guides) to push intent scores above the triggering threshold. The `PerDocData.asteroidBeltIntents` field confirms these scores are indexed per document.

- **Build anchor text patterns that exceed the synthetic query generation threshold.** Patent US9128945B1 states that "synthetic query generation requires that anchor text appears in a number of documents exceeding a threshold - only widely-used anchor text generates augmentation queries." This means your entity names and key phrases need consistent anchor text across many linking documents (both internal and external) to trigger synthetic query generation. Use consistent entity names as anchor text in internal links, and encourage external sites to use the same anchor text patterns. The `NlpSaftDocument.hyperlink` field ("the hyperlinks in the document") shows Google indexes hyperlink text in left-to-right order, so anchor text position and consistency matter.

- **Mine autocomplete suggestions and optimize for predictive query completion.** Patent US9953076B2 reveals that Google "proactively fetches and displays search results for high-quality query suggestions before the user finishes typing" and that "valid prediction rate" (selection/impression ratio) determines which suggestions get pre-fetched results. Monitor autocomplete suggestions around your brand and topics, build pages that match those suggestions, and ensure high click-through rates when your results appear for query suggestions. The `KnowledgeAnswersIntentQueryRelatednessSignals.queryPopularity` field is the popularity signal behind suggestion ranking. Optimize for partial query matches and common query stems, as the patent states suggestions are "re-ordered into stemmed groups that closely match typing inputs."

- **Write in the natural vocabulary of your topic, not for exact keyword matches.** Patent US9037464B1 (word2vec) establishes that "semantically similar words have vectors that are close together" and "these representations enable matching queries to documents even without exact keyword overlap." Patent US10452978B2 (Transformer) adds that models "can distinguish substantive from padding content." The `QualityPreviewSnippetQueryFeatures.passageembedScore` and `queryHasPassageembedEmbeddings` fields confirm passage-level embedding matching. Write comprehensive content using the natural terminology of your topic area; the vector representations already connect related concepts. Padding content with keyword variants is actively detected and discounted by transformer models that understand context and hedging.

- **Ensure your official page associations are correctly registered.** The `PerDocData.queriesForWhichOfficial` field stores "the set of (query, country, language) triples for which this document is considered to be the official page" and the `OfficialPagesQuerySet.queryCountryLanguageFingerprints` field fingerprints these queries. Patent US8171021B2 describes associating web documents with candidate queries when "the intent measure exceeds an intent threshold." Ensure your site is correctly identified as the official result for your brand name, entity name, and core topic queries across all relevant countries and languages. Use consistent branding, structured data, and verified entity connections (Google Business Profile, Knowledge Graph entries) to maintain official page status.

- **Optimize for query term coverage in titles and snippets.** The `QualityPreviewSnippetQueryTermCoverageFeatures` module tracks three coverage metrics: `snippetQueryTermCoverage`, `titleSnippetQueryTermCoverage`, and `titleQueryTermCoverage`. The `QualityPreviewSnippetQueryFeatures` module carries `queryScore`, `experimentalQueryTitleScore`, and `passageembedScore`. Patent US8171021B2 describes IR scores computed from "dot products of feature vectors corresponding to a query and a document." Ensure your titles and meta descriptions cover the key query terms users actually search for, as these coverage metrics directly feed into snippet generation and ranking. The `ExtraSnippetInfoResponseQuerySubitem` module shows queries are broken into subitems with weights - prioritize covering the highest-weighted query terms in your titles.

- **Monitor and improve long-click performance on query-document pairs.** Patent US9916366B1 states that "a long click can be interpreted as a signal that the query identified information that the user deemed to be interesting." The `ResearchScienceSearchNavboostQueryInfo` module's `queryDocCount` ("the number of long-clicks on this pair") and `lccCount` ("estimate of the number of long clicks for this tuple") are the quality signals that determine whether a query becomes an augmentation query. Content that generates long clicks (users spending time on the page, finding additional items of interest) feeds back into query augmentation, creating a positive feedback loop. Improve page quality, loading speed, and content depth to increase long-click rates, which directly feed into the augmentation query system described in patents US9916366B1 and US9128945B1.

- **Manage sensitive and fringe content signals carefully.** The `SearchPolicyRankableSensitivityQueryUnderstanding` module's `intentOnlyNoPii` flag and `rewrittenQuery` field show that Google evaluates query sensitivity at the intent level. The `QualityFringeFringeQueryPriorPerDocData` module's `encodedFringePriorScore` ("probability that a query is fringe, given this document is in the result set"), `encodedEntityPriorScore` ("probability that a query is fringe, given that the entity is in the result set"), and `encodedDocumentFringeVulnerability` ("an estimate of the vulnerability of this doc to show fringe content") mean Google actively classifies content for fringe vulnerability. The `ClassifierPornQueryClassifierOutput` module's `isPositive` and `score` fields show query-level safety classification. Avoid content patterns that trigger fringe or sensitive classifications, particularly on YMYL topics. The `PerDocData.ymylHealthScore` and `PerDocData.ymylNewsScore` fields show YMYL classification is indexed per document.
