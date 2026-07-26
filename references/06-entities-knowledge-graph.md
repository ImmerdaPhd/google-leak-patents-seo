# Stage 6: Entity & Knowledge Graph Integration

**Leak modules (27):** `RepositoryWebrefEntityJoin`, `RepositoryWebrefDocumentMetadata`, `RepositoryWebrefWebrefEntities`, `RepositoryWebrefEntityNameScore`, `RepositoryWebrefEntityScores`, `RepositoryWebrefSimplifiedAnchor`, `RepositoryWebrefMention`, `RepositoryWebrefNameInfo`, `RepositoryWebrefDisplayName`, `RepositoryWebrefDetailedEntityScores`, `RepositoryWebrefEntityAnnotations`, `RepositoryWebrefCategoryInfo`, `RepositoryWebrefEntityLinkSource`, `RepositoryWebrefLatentEntity`, `RepositoryWebrefLatentEntities`, `RepositoryWebrefWebrefEntity`, `RepositoryWebrefWebrefMustangAttachment`, `RepositoryWebrefEntityLinkMetadata`, `RepositoryWebrefGlobalLinkInfo`, `RepositoryWebrefAnnotatedCategoryInfo`, `RepositoryWebrefCategoryAnnotation`, `KnowledgeGraphTriple`, `KnowledgeGraphTripleObj`, `KnowledgeGraphTripleProvenance`, `KnowledgeGraphQualifier`, `KnowledgeGraphDateTimeProto`, `PerDocData` (entity subset)

**Relevant patents (6):** US9268820B2, US7565358B2, US10019495B2, US9311363B1, US9870423B1, US10339190B2

### What Happens Here

Google does not just index words - it indexes entities. Every document is analyzed by the WebRef (Web Reference) annotator, which identifies mentions of known entities (people, places, organizations, concepts) and links them to Knowledge Graph entries via Machine-Identifiers (MIDs). The system extracts entity names, scores their confidence, builds entity-to-entity relationship graphs, infers RDF-style triples from page content, and determines which entities are topical, which are authors, which are publishers, and which pages are reference pages for entities. This entity layer powers Knowledge Panels, question answering, entity-based re-ranking, and author identity (E-E-A-T).

### How this works

**1. The WebRef annotator identifies entity mentions and scores their confidence per mention.** The `RepositoryWebrefMention` module is the atomic unit of entity annotation. Each mention has a `begin` offset ("The [begin, end) byte offset, compatible with the Goldmine DocState representation"), a `confidenceScore` ("A probabilistic score describing how certain the annotator is that this exact range in the document or query refers to the entity"), and a `priorProbability` ("The prior probability of the entity for this mention"). The confidence score mapping is documented: "0.3 -> 75% 0.5 -> 87% 0.7 -> 89% 0.9 -> 94% 1.0 -> 98%." The `trustedNameConfidence` field ("Confidence that this name is a trusted name of the entity. This is set only in case the confidence is higher than an internal threshold") and `isImplicit` ("True if the entity is mentioned implicitly") show that entities can be annotated even without explicit text mentions - through URL, anchor, or contextual signals. Patent **US9268820B2** (Providing knowledge panels with search results) confirms: "Queries are analyzed to identify referenced factual entities" and "Entity identification triggers the panel display - entities must be in the Knowledge Graph." The `RepositoryWebrefEntityAnnotations` module aggregates these per-entity: `confidenceScore` ("The overall confidence that the entity is annotated somewhere in the document or query. For WebRef it is computed as a function of the mention confidences weighted by the importance of each mention, where for documents a mention is of greater importance if it occurs in the title, h1 or anchors"), `topicalityScore` ("The WebRef topicality score of the entity for this document"), and `topicalityRank` ("Rank of the entity when sorted by topicality score"). This means a mention in the title or H1 carries more weight than a mention in body text.

**2. Entity names are scored using volume-based signals (clicks, anchors) and bootstrapped ML models.** The `RepositoryWebrefEntityNameScore` module is the scoring engine for entity-name associations. The `score` field is "The absolute score of that entity. score = artificial_score + volume_based_score" and `volumeBasedScore` is "Absolute score that comes from quantitative sources such as navboost clicks, anchors, etc." This directly connects Stage 5 (NavBoost) to Stage 6 - the click data that NavBoost collects feeds into entity name scoring. The `scoreRatio` field ("Ratio between this entity score and the total score over all entities. This is including the 'open world' information if it was estimated") normalizes the score against all competing entity interpretations. The `confidence` field ("Confidence that this name is a trusted name of the entity. A reasonable threshold for name trust is 0.6") provides a trust threshold, and `bootstrappingPreviousIteration` ("If the EntityNameScore is part of a bootstrapped model, then this field contains the score_ratio from the previous model ('Model 0')") reveals that entity scoring uses iterative bootstrapping - each model iteration improves on the previous. Patent **US9870423B1** (Associating an entity with a search query) confirms: "The query score is further based on query popularity and similarity measure between the query and entity properties (including trusted names)" - the `confidence` threshold for trusted names and the `volumeBasedScore` from NavBoost clicks are the inputs to this query-entity association scoring.

**3. The EntityJoin aggregates all known names, links, reference pages, and metadata for each entity.** The `RepositoryWebrefEntityJoin` module is the master record for an entity. The `annotatedEntityId` field ("The id of this entity") holds the MID. The `nameInfo` field ("Contains all names (with scores) that Webref knows for this entity. The data in this field is very important for the quality of the model") lists all known names with their `EntityNameScore` values. The `linkInfo` field ("Contains all links (with scores) that Webref knows for this entity. Links are relationships between entities. The data in this field is very important for the quality of the model") stores entity-to-entity relationships. The `cdoc` field ("This field contains reference pages for this entity. A reference page is a page that is highly topical for this entity, which can be used to mine additional information about this entity") identifies the canonical pages for each entity. The `representation` field ("An entity can have metadata from various data sources. Generally speaking all sources will be / should be reconciled into a single KG Topic entry") shows multi-source reconciliation - a local business could have a KG entry, Wikipedia entry, and MapFacts entry all reconciled. The `contextNameInfo` field ("The context names (with scores) of this entity. The difference to regular names is that context names are not used for finding mentions in a document as they consist of names somehow related to the entity") captures indirectly related names. Patent **US10339190B2** (Question answering using entity references) confirms: "Entity references are retrieved only from search results above a first ranking threshold (top-ranked subset)" and "Ranking signal for each entity reference is a weighted sum of frequencies of occurrence" - the EntityJoin's reference pages and name scores are what determine which entities surface for question answering.

**4. Detailed entity scores measure topicality, connectedness, authorship, and reference-page status.** The `RepositoryWebrefDetailedEntityScores` module provides granular per-entity-per-document signals. The `docScore` field ("How well the document scores for the entity. The score is unnormalized, and serves as a relative ranking signal between different documents for an entity") ranks documents against each other for the same entity. The `relevanceScore` ("Relevance score generated by a Machine Learning entity classifier. This signal is similar to topicality, but machine learning based") is a separate ML-based signal. The `connectedness` field ("Represents how much the entity is connected/related to the other entities in the document. This signal partially influences the topicality score, but it is not totally aligned with it: an entity can be very related to the rest of the document, but not central for understanding it") distinguishes between entities that are merely mentioned and entities that are central to the document's topic. The `normalizedTopicality` ("Representation of the topicality score that is normalized in [0, 1] and which sum over all entities in the document is 1. It represents the 'proportion' of the document that talks about the entity") gives each entity a share-of-voice. The `isAuthor` field ("True if the entity is the author of the document. This was mainly developed and tuned for news articles") and `isPublisher` ("True if the entity is the publisher of the page") are the E-E-A-T signals - they directly identify who wrote and published the content. The `isReferencePage` ("Set to true iff the entity matches the full URL of the document, meaning that it is a reference page or related page of the entity") flags official entity pages. The `profileUrl` field ("Contains the link to the author's profile url on the platform") stores author profile URLs. Patent **US7565358B2** (Agent Rank) confirms: "Agents digitally sign content items to create verifiable associations between authors and content" and "An agent's score is based on the content items associated with them by digital signatures" and "Agent reputation can be topic-specific." The leak's `isAuthor`, `profileUrl`, and `PerDocData.authorObfuscatedGaiaStr` (which stores Google Account IDs for authors) are the implementation of Agent Rank.

**5. Entity-to-entity links are scored and form a relationship graph within each document.** The `RepositoryWebrefGlobalLinkInfo` module stores entity relationships: `targetMid` ("The mid of the linked entity"), `isBoostedPrimaryWeightLink` ("Whether this is a BoostedPrimaryWeight link. For these links in some cases a higher weight is used for primary scoring"), and `variantInfo` ("The information about this link for each locale"). The `RepositoryWebrefEntityLinkSource` module scores co-occurrence: `score` ("Score in [0, infinity) that represents how relatively likely it is to see that entity cooccurring with the main entity (in the entity join). A value of 1.0 means that the two entities are basically independent. The higher the more likely (relatively to the individual entity probabilities) they are to cooccur") and `kgProperty` ("KG-property if the SourceType is associated with a KG-property"). The `RepositoryWebrefEntityLinkMetadata` module adds `aggregateFlags` ("The aggregate kind flags for the link") and `kindInfo` ("Information about all the link kinds associated with the link"). Patent **US9311363B1** (Personalized entity rankings) confirms that entity relationships drive personalized scoring: "A quality profile for each user specifies characteristic weights - the importance of each characteristic to that user" and "Ranking is personalized per user: entities are ranked differently for different users based on their quality profiles." The entity co-occurrence scores and link kinds are what enable Google to understand entity relationships and personalize entity rankings.

**6. Knowledge Graph triples are inferred from document content and stored with provenance.** The `RepositoryWebrefWebrefEntities.tripleAnnotations` field is "Triples inferred from the document. When the annotator recognizes phrases, lists or tables associated with a property or relationship for an entity it generates triples that encode that information." The `KnowledgeGraphTriple` module has `sub` ("sub is an arbitrary node id representing the source entity of a graph relationship") - the subject of an RDF triple. The `KnowledgeGraphTripleObj` module holds the object: `idValue` ("An id representing an entity (mid or hrid)"), `stringValue` ("A UTF-8 string value to be used for the following expected schema types: /type/rawstring, /type/text, /type/key"), and `locale` ("The language code for the object value. It must be a BCP 47-compliant language tag"). The `KnowledgeGraphTripleProvenance` module tracks where the triple came from: `creator` ("Historically, this field was used to encode the Freebase User ID, Google username, or Google MDB group that was responsible for the pipeline"), `accessRequired` ("Specifies the contract or legal visibility required to see the Triple"), and `spiiCertification` ("A fact about potentially sensitive personal info"). The `KnowledgeGraphQualifier` has `pred` ("The qualifier pred must be a qualifier property defined in KG schema as applying to the predicate of the triple this qualifier is attached to"). Patent **US10019495B2** (Knowledge panel) confirms: "Knowledge panels are assembled from multiple knowledge modules, each presenting content items of a specific category" and "Module selection is based on rank scores of content items classified to each module's content category" - the triples inferred from documents are what populate Knowledge Panel modules, and the `topicalityScore` and `docScore` from the entity annotations determine which content items rank highest.

**7. The Mustang attachment carries entity annotations into the serving index.** The `RepositoryWebrefWebrefMustangAttachment` module is the serving-time entity data. It has `entityMetadata` ("Per-entity metadata. Not packed (not every entity has metadata)"), `isAuthorIndex` ("The indices of all the reference entities in encoded_mid that are authors of the page"), `isPublisherIndex` ("The indices of all the reference entities in encoded_mid that are publishers of the page"), and `referencePageIndex` ("Only populated when the document is a reference page for an entity. Contains the indices of all reference entities"). The `categoryEncodedMid` field ("See go/category-annotations-api about the story behind various types of category annotations that are provided using the catmid token and category_encoded_mid fields") carries category annotations. The `unboundIntentMid` and `unboundIntentScoreE2` fields ("The uint64-encoded MID of the unbound intents generated by Pianno" and "The confidence of the unbound intent. represented as a fixed-point integer with two decimal precision") show that entity annotations also feed into intent detection (Pianno). Patent **US9268820B2** confirms: "Entity identification triggers the panel display - entities must be in the Knowledge Graph" - the Mustang attachment is what makes entities available at query time for panel triggering and re-ranking. The `PerDocData.webrefEntities` field ("WebRef entities associated to the document. See go/webref for details") is the per-document entry point.

### SEO actions

- **Implement consistent entity markup with schema.org.** US9268820B2: entities must be in the Knowledge Graph to trigger panels. The leak's `webrefEntities` field in PerDocData confirms entity extraction. Use Organization, Person, LocalBusiness, Article, and sameAs schema to help Google identify your entities.
- **Establish author identity across the web.** US7565358B2 (Agent Rank): "Agent rank directly influences search ratings of associated content." The leak's `isAuthor`, `profileUrl`, and `authorObfuscatedGaiaStr` fields confirm Google tracks author identity. Use consistent author names, link to profile pages, and use rel=author/schema.org Person markup.
- **Ensure your entity has a clear, unambiguous canonical name.** US9870423B1: entity ambiguity (ratio of documents about the entity vs. not) determines the canonical entity search query. The leak's `EntityNameScore.confidence` (threshold 0.6) and `volumeBasedScore` (from NavBoost clicks) determine name trust. Build entity authority by ensuring top results for your entity name are high-quality.
- **Optimize for topicality, not just keyword matching.** The `DetailedEntityScores.normalizedTopicality` measures what proportion of your document talks about each entity. US10339190B2: "Ranking signal includes a topicality score based on the relationship between the entity reference and the document containing it." Cover your topic entities comprehensively.
- **Build reference pages for your entities.** The `EntityJoin.cdoc` field identifies reference pages ("a page that is highly topical for this entity"). `DetailedEntityScores.isReferencePage` flags when a document IS the reference page. Ensure your entity's official page is the most topical, comprehensive page about that entity on the web.
- **Maintain consistent entity names and properties across all sources.** The `EntityJoin.representation` field shows Google reconciles KG entries, Wikipedia, and MapFacts. The `DisplayName.canonicalName` ("An encyclopedia style topic name, e.g. 'Dog', not 'Dogs'") and `subjectName` provide canonical naming. Consistency across Wikipedia, Wikidata, your website, and structured data improves entity confidence scores.
- **Use structured data to help Google infer triples.** The `tripleAnnotations` field shows Google infers RDF triples from document content. Schema.org structured data with proper property-value relationships (e.g., founder, dateFounded, numberOfEmployees) gives Google clean triples with high provenance confidence.

### Leak Attributes


**RepositoryWebrefEntityJoin** - 9 attributes

| Attribute | Type | Description |
|---|---|---|
| `annotatedEntityId` | GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefWebrefEntityId.t | The id of this entity, prefer accessing through webref-entities-util.h functions. |
| `linkInfo` | list(GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefGlobalLinkInfo.t) | Contains all links (with scores) that Webref knows for this entity. Links are relationships between entities. The data in this field is very important for the quality of the model. |
| `nameInfo` | list(GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefGlobalNameInfo.t) | Contains all names (with scores) that Webref knows for this entity. The data in this field is very important for the quality of the model. |
| `cdoc` | list(GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefSimplifiedCompositeDoc.t) | This field contains reference pages for this entity. A reference page is a page that is highly topical for this entity, which can be used to mine additional information about this entity. Example reference pages for Apple Inc. would be the composite docs for &quot; |
| `contextNameInfo` | list(GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefGlobalNameInfo.t) | The context names (with scores) of this entity. The difference to regular names (aka name_info) is that context names are not used for finding mentions in a document as they consist of names somehow related to the entity (e.g. name &quot;fisherman s wharf&quot; for the entity &quot;Gary Danko&quot;). Used for reconciling freebase and oyster. |
| `debugInfo` | list(GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefEntityDebugInfo.t) | Debug information about the entity. |
| `enricherAnnotatorProfile` | GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefAnnotatorProfile.t | Optional profiling data from the enricher that enriched this entity (and produced this EntityJoin as debug output). |
| `extraData` | GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefExtraMetadata.t | Additional metadata about the entity, that can be derived from the &quot;raw data&quot; (composite doc, domain specific data...), or come from other sources. Despite its name, this field often contains quite important information. |
| `representation` | list(GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefDomainSpecificRepresentation.t) | An entity can have metadata from various data sources. Generally speaking all sources will be / should be reconciled into a single KG Topic entry. However, in some cases we pull in additional chunks of metadata from these sources; these are stored in this field. For example a local business could have a KG entry (topic proto), wikipedia entry (WikiJoin) and a MapFacts entry (Feature proto). |

**RepositoryWebrefDocumentMetadata** - 8 attributes

| Attribute | Type | Description |
|---|---|---|
| `numIncomingAnchors` | number() | The (weighted) number of incoming anchors (links from other documents). |
| `salientTerms` | GoogleApi.ContentWarehouse.V1.Model.QualitySalientTermsSalientTermSet.t | The salient terms for this document. Only set if --webref_doc_metadata_copy_salient_terms is true. Same motivation as the title field above. |
| `title` | String.t | The title of the document. Only set if --webref_doc_metadata_set_title is true. The idea is that we can use this to more easily learn things like: title contains &quot;restaurants&quot; -> more likely to be a list page. |
| `totalClicks` | number() | The total clicks on this document, taken from navboost data. |
| `crawlTime` | String.t | The timestamp of when the document was crawled (if known). Copied from CompositeDoc.Content.CrawlTime. |
| `docFp` | String.t | Fingerprint of the document. We compute and set this fingerprint when creating the pagesets that we use for evals. Otherwise, this field is not normally set. We use the field to make sure that the human ratings that we have are generated for the same version of the document, otherwise they might be invalid. We do not compute the fingerprint on the fly (e.g. as a fingerprint of the proto buffer serialization of the cdoc) because protocol buffer serialization is not stable. |
| `forwardingUrls` | GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefForwardingUrls.t | Urls that forward to this url. Needed for url -> topical entity entries. |
| `language` | String.t | The document language, as read from doc().content().language(). This is go/language-enum value. |

**RepositoryWebrefWebrefEntities** - 6 attributes

| Attribute | Type | Description |
|---|---|---|
| `annotationStats` | GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefWebrefAnnotationStats.t | Detailed annotation statistics that can, e.g., be used to tune the WebRef scoring logic based on existing (Model-0) annotations. |
| `entity` | list(GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefWebrefEntity.t) | The annotated entities, with associated confidence scores and metadata. This is the primary output of WebRef/QRef. In case of Webref output, entities are sorted by decreasing topicality score. |
| `category` | list(GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefCategoryAnnotation.t) | Categories of the document or query. This replaces the category_score found under EntityAnnotations. |
| `documentInfo` | GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefWebrefDocumentInfo.t | Information that applies globally to the document. The exclude_field option is for Goldmine AnnotationsFinder to exclude document_info from retrieving annotation entities |
| `rangeAnnotations` | list(GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefRangeAnnotations.t) | These messages contain non-entity annotations of ranges in the document. This might be used to hold part-of-speech annotations, stopword annotations, and other range based information. The exclude_field option is for Goldmine AnnotationsFinder to exclude ranged_annotations from retrieving annotation entities |
| `tripleAnnotations` | GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefTripleAnnotations.t | Triples inferred from the document When the annotator recognizes phrases, lists or tables associated with a property or relationship for an entity it generates triples that encode that information. This generated data is only substantiated by the document vs KG data which has been verified from multiple sources and/or human curators. |

**RepositoryWebrefEntityNameScore** - 12 attributes

| Attribute | Type | Description |
|---|---|---|
| `confidence` | number() | Confidence that this name is a trusted name of the entity. A reasonable threshold for name trust is 0.6. A name can be trusted and still have very low score_ratio, esp. if it is ambiguous (e.g. 'mercury') and/or not the dominant interpretation (e.g. &quot;siberian husky&quot; -> /m/06krnsr (a book)). |
| `isDropped` | boolean() | Documented at: google3/repository/webref/enricher/core/data/scored_entity_name.h |
| `isPruned` | boolean() | Documented at: google3/repository/webref/enricher/core/data/scored_entity_name.h |
| `volumeBasedScore` | number() | Absolute score that comes from quantitative sources such as navboost clicks, anchors, etc. artificial_score = score - volume_based_score |
| `bootstrappingPreviousIteration` | GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefBootstrappingScore.t | If the EntityNameScore is part of a bootstrapped model, then this field contains the score_ratio from the previous model (&quot;Model 0&quot;). If Model 0 does not have a corresponding entry, because it did not know about this name for this entity, then bootstrapping_previous_iteration is left empty. |
| `debugInfo` | list(GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefEntityDebugInfo.t) | Debug information about the entity. |
| `extendedScoreRatio` | list(GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefExtendedEntityNameScore.t) | Stores region specific score ratios for the entity when it is significantly different from the language version above. |
| `isMatchlessResultContext` | boolean() | Only for context names: Whether this EntityNameScore represents an entity that was dominant in the search results but was not annotated by QRef during learning. Matchless result contexts are useful for bootstrapping, where different model iterations may have different names and thus context scores from Model 0 that are inconsistent with the names from Model 1. |
| `mid` | String.t | The id of the entity. |
| `rangeMetadata` | list(GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefRangeMetadata.t) | Metadata of segment range, which is annotated by this entity. |
| `score` | number() | The absolute score of that entity. score = artificial_score + volume_based_score |
| `scoreRatio` | number() | Ratio between this entity score and the total score over all entities. This is including the &quot;open world&quot; information if it was estimated. |

**RepositoryWebrefEntityScores** - 4 attributes

| Attribute | Type | Description |
|---|---|---|
| `alphaEntityIdf` | number() | This field is only for debugging and link weight experiments. It stores the entity's idf from the alpha model. Alpha idfs are used for link weight computations and available during model omega building via enricher_current_entity_idf_for_link_direction. |
| `commonNgramProb` | number() | Probability that the entity is a common ngram (e.g. from dictionary). |
| `entityIdf` | number() | The final (model omega) idf of an entity. Equals log2(1 / probability of the entity to appear in a document). This probability is currently estimated from its names (i.e. it is a sum of the name frequency weighted by P(entity \| name)). |
| `nameCapitalizationProb` | number() | The following field is deprecated and should eventually be removed. It uses data and rules that have not been refreshed for ~10y and KG has changed a lot in the meantime. |

**RepositoryWebrefSimplifiedAnchor** - 8 attributes

| Attribute | Type | Description |
|---|---|---|
| `anchorIndices` | GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefAnchorIndices.t | The set of (equivalent from WebRef point of view) anchors used to produce this segment. |
| `anchorText` | GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefLocalizedString.t | The anchor text. Note that the normalized text is not populated. |
| `count` | String.t | The number of times we see this anchor text. |
| `countFromOffdomain` | String.t | Count, score, normalized score, and volume of offdomain anchors. |
| `countFromOnsite` | String.t | Count, score, normalized score, and volume of onsite anchors. |
| `score` | number() | The sum/aggregate of the anchor scores that have the same text. |
| `scoreFromFragment` | number() | The sum/aggregate of the anchor scores that direct to a fragment and have the same text. |
| `scoreFromRedirect` | number() | The sum/aggregate of the anchor scores that direct to a different wiki title and have the same text. NOTE: url direct to a fragment score is not included in this value. |

**RepositoryWebrefMention** - 15 attributes

| Attribute | Type | Description |
|---|---|---|
| `begin` | integer() | The [begin, end) byte offset, compatible with the Goldmine DocState representation. - For CONTENT, TITLE, META_CONTENT_TAG and IMG_ALT_TAG segments, the offsets are relative to the beginning of the document content. - For ANCHOR, QUERY, URL, IMAGE_QUERY, CONTEXT_ENTITY, CONTEXT_QUERY, SPORE_GRAPH, INSTANT_QUERY and VIDEO_TRANSCRIPT segments, the offsets are relative to the beginning of the corresponding (sub-)segment or text from doc attachment. The (indexing.annotations.goldmine) options are ma |
| `compoundMention` | list(GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefMentionCompoundMention.t) | For a compound mention, the references to the entity and mention of the components. Each compound_mention claims one or more 'mrf' fields from the WebrefEntity owning this mention. Use QueryJoinToMeaningStructConverter to expand compound mentions into complete MRF. |
| `addedByCloseAnswers` | boolean() | Whether this mention was created by CloseAnswers on Postref. This bit is populated into corresponding intent_query through Aqua. |
| `beginTokenIndex` | integer() | The [begin end) token offsets in the Goldmine DocState. They follow similar rules as &quot;begin&quot; and &quot;end&quot; above, but for tokens rather than byte offsets. These fields are currently only populated by the query annotator. |
| `confidenceScore` | number() | A probabilistic score describing how certain the annotator is that this exact range in the document or query refers to the entity. Probability that a mention is correct corresponds to confidence score roughly as follows: 0.3 -> 75% 0.5 -> 87% 0.7 -> 89% 0.9 -> 94% 1.0 -> 98% However if you consider all mentions with a score above 0.3, then most of these will have scores close to 1, so the overall precision of these mentions is around 95%. |
| `endTokenIndex` | integer() | *(no description provided in leak)* |
| `evalInfo` | GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefMentionEvalInfo.t | Information used by the evaluation tools to mark mentions annotations as correct/incorrect. This will never be annotated in production (would be nice if was, though :-)). |
| `isImplicit` | boolean() | True if the entity is mentioned implicitly. Note that a mention can be implicit |
| `lexicalAnnotation` | GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefLexicalAnnotation.t | Provides a Wordgraph lexical signals for the mentioned range so it can be use in LooseParsing. Please don't use this field before consulting wordgraph-team. |
| `personalizationContextOutputs` | GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefPersonalizationContextOutputs.t | Additional personalization output scores about this mention. |
| `priorProbability` | number() | The prior probability of the entity for this mention. |
| `referenceScore` | number() | Whether the mention is a reference (e.g. it could be resolved to an entity coming from personal data) or not, currently only used for personal resolutions. Scores from 0 (not a reference) to 1 (reference). Use at your own risk as they are subject to change, advised to talk to refx-personal first. |
| `resolutionScore` | number() | Whether the mention is a resolution or not, currently only used for personal resolutions. Scores from 0 (not a resolution) to 1 (resolution). Use at your own risk as they are subject to change, advised to talk to refx-personal first. |
| `subsegmentIndex` | GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefSubSegmentIndex.t | Identifies the sub-segment where the annotation occurs. See SubSegmentIndex for details. Not present in QRef, also deprecated for URL segment types. |
| `trustedNameConfidence` | number() | Confidence that this name is a trusted name of the entity. This is set only in case the confidence is higher than an internal threshold (see ConceptProbability). |

**RepositoryWebrefNameInfo** - 1 attributes

| Attribute | Type | Description |
|---|---|---|
| `scores` | GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefNameScores.t | The name-specific scores. These scores only depend on the name and are independent of the entity. |

**RepositoryWebrefDisplayName** - 2 attributes

| Attribute | Type | Description |
|---|---|---|
| `canonicalName` | String.t | An encylopedia style topic name (e.g. &quot;Dog&quot;, not &quot;Dogs&quot;). Corresponds to Freebase /type/object/name and similar sources. |
| `subjectName` | String.t | A name as it would be used for a news topic, an interest, the subject of a story. E.g. in list of things (&quot;Related topics: Smartphones, computers, accidents&quot;. &quot;Interests: Dogs&quot;). |

**RepositoryWebrefDetailedEntityScores** - 8 attributes

| Attribute | Type | Description |
|---|---|---|
| `docScore` | number() | How well the document scores for the entity. The score is unnormalized, and serves as a relative ranking signal between different documents for an entity. |
| `relevanceScore` | number() | Relevance score generated by a Machine Learning entity classifier. This signal is similar to topicality, but machine learning based and supported by EntitySignals, not Webref. See |
| `connectedness` | number() | Represents how much the entity is connected/related to the other entities in the document. This signal partially influences the topicality score, but it is not totally aligned with it: an entity can be very related to the rest of the document, but not central for understanding it. Likewise, an entity can be central to understand a document, but not very related to the rest of the document. The value is in [0, 1]. |
| `isAuthor` | boolean() | True if the entity is the author of the document. This was mainly developed and tuned for news articles (e.g. /m/02x27qn on &quot;www.vogue.com/article/flint-town-netflix&quot;) but is also popluated for other content (e.g. scientific articles). Important: the semantics of this field may change in the future or it might be removed and replaced with a different API. If you want to use this field, please reach out to ke-authors@ first. |
| `isPublisher` | boolean() | True if the entity is the publisher of the page (e.g. CNN on &quot; |
| `isReferencePage` | boolean() | Set to true iff the entity matches the full URL of the document, meaning that it is a reference page or related page of the entity. |
| `normalizedTopicality` | number() | Representation of the topicality score that is normalized in [0, 1] and which sum over all entities in the document is 1. It represents the &quot;proportion&quot; of the document that talks about the entity. This score is less human interpretable as the bucketized topicality score (EntityAnnotations.topicality_score), but is more suited for some usages like aggregations. |
| `profileUrl` | String.t | Contains the link to the author's profile url on the platform. |

**RepositoryWebrefEntityAnnotations** - 9 attributes

| Attribute | Type | Description |
|---|---|---|
| `confidenceScore` | number() | The overall confidence that the entity is annotated somewhere in the document or query. For WebRef it is computed as a function of the mention confidences weighted by the importance of each mention, where for documents a mention is of greater importance if it occurs in the title, h1 or anchors. For QRef it is just the maximum of the confidence over all mentions. NOTE: You probably want to use the mention-level segment_mentions.mention.confidence_score field instead of this one. |
| `imageMention` | list(GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefImageMention.t) | This is an experimental output for go/multiref. Don't use it without consulting the Webref team |
| `isImplicit` | boolean() | An entity is marked as implicit if there is no explicit mention of the entity in the content of the page. For instance, all mentions of the entity are in query, url and/or anchors; or the entity has only implicit content mentions. |
| `segmentMentions` | list(GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefSegmentMentions.t) | All mentions of a given concept grouped by segments. For Webref, there are many different kinds of segment, such as content, title and anchors; while for QRef, there is only one segment called CONTENT. For QRef this field contains the primary output of the annotator, and for WebRef it together with topicality_score does. |
| `topicalityRank` | integer() | Rank of the entity when sorted by topicality score. |
| `topicalityScore` | number() | The WebRef topicality score of the entity for this document. This score indicates how related is the entity to the overall topic of the document. See |
| `detailedEntityScores` | GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefDetailedEntityScores.t | Additional information about how the entity relates to the page, for example whether it is a business entity which published the page. |
| `explainedRangeInfo` | GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefExplainedRangeInfo.t | All ranges explained by the entity or any other entity it implies. Used in the context of partial query interpretation (go/partial-understanding). |
| `isResolution` | boolean() | True if the entity is an MDVC summary entity, i.e. it might not be mentioned directly on the query, but it is the product of resolving a set of explicit annotations. E.g. &quot;2014 FIFA World Cup&quot; can be the summary for the query: [soccer world cup in brazil] even though none of the names of the entity is mentioned on the query. Summary nodes can also be synthetic, i.e. have a /t/ mid, as they represent the intersection between a set of regular annotations. For more information, see |

**RepositoryWebrefCategoryInfo** - 2 attributes

| Attribute | Type | Description |
|---|---|---|
| `allTypes` | list(GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefFreebaseType.t) | Contains all types relevant for this entity, along with their provenances and confidences. This field basically replicates information above in a unified way, so that Refcon scroing can make better use of it. If present, Refcon scoring will use all_types, and ignore other fields like freebase_type. Note: there is some basic conflict resolution applied when all_types are computed (implemented in type-extractor.cc, IsLikelyConflictingFreebase). |
| `salientCategory` | list(GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefFatcatCategory.t) | verticals4 categories that cooccur with this entity, aggregated over D2E. See where we read from CompactDocClassification in |

**RepositoryWebrefEntityLinkSource** - 2 attributes

| Attribute | Type | Description |
|---|---|---|
| `kgProperty` | String.t | KG-property if the SourceType is associated with a KG-property (TOPIC_PROPERTY, NEW_TOPIC_PROPERTY). |
| `score` | number() | Score in [0, \infty) that represents how relatively likely it is to see that entity cooccurring with the main entity (in the entity join). A value of 1.0 means that the two entities are basically independent. The higher the more likely (relatively to the individual entity probabilities) they are to cooccur. |

**RepositoryWebrefLatentEntity** - 1 attributes

| Attribute | Type | Description |
|---|---|---|
| `mid` | String.t | The mid of the latent entity. |

**RepositoryWebrefLatentEntities** - 1 attributes

| Attribute | Type | Description |
|---|---|---|
| `latentEntity` | list(GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefLatentEntity.t) | Latent entities with associated metadata including source of the relationship. This is pruned (&quot;compacted&quot;) from the concept table and will never reach the annotator. |

**RepositoryWebrefWebrefEntity** - 6 attributes

| Attribute | Type | Description |
|---|---|---|
| `id` | GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefWebrefEntityId.t | An identifier (usually a MID) for the entity. Consider using GetWebrefEntityMid() in the adjacent webref-entities-util.h to read this. |
| `annotatedRelationship` | list(GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefWebrefEntityRelationship.t) | Information about links (e.g. implications) between the annotated entities. |
| `annotations` | GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefEntityAnnotations.t | All annotations of this entity on the given document. |
| `collections` | GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefWebrefEntityCollections.t | Information about the collections of this entity. |
| `entityJoin` | GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefEntityJoin.t | Metadata and raw signals used by the annotator. Intended for internal use. Steer clear of adding new dependencies on fields in this proto, especially external dependencies. If you are a Refx client and would like to consume entity metadata, consider querying TopicServer instead. |
| `mrf` | list(GoogleApi.ContentWarehouse.V1.Model.KnowledgeAnswersIntentQueryArgument.t) | MRF equivalent representations of this entity as a compound, one for each unique MRF representation. Populated for compounds. Each MRF expression contains a minimum FunctionCall structure wrapped in a nameless Argument without signals and range data. This is not meant to be directly usable as MRF, use QueryJoinToMeaningStructConverter to expand it into a usable form. References to entities are made as component_reference ArgumentValue. Each compound Mention of this entity (not all of its mention |

**RepositoryWebrefWebrefMustangAttachment** - 8 attributes

| Attribute | Type | Description |
|---|---|---|
| `iqlAttachment` | GoogleApi.ContentWarehouse.V1.Model.KnowledgeAnswersIntentQueryIndexingIQLAttachment.t | A sub-proto to encode IQL expressions. To be used by Pianno page-level intents and Webref Compounds. |
| `categoryEncodedMid` | list(String.t) | See go/category-annotations-api about the story behind various types of category annotations that are provided using the catmid token and category_encoded_mid fields below. Some of these annotation types are experimental, so please contact related-entities@ if you consider using this data. For production uses, please: 1. Add your use-case to go/hits-clients. 2. Subscribe to hits-users@ to receive general updates and info about deprecations. To convert it to the string form use metaweb::MidToStri |
| `entityMetadata` | list(GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefWebrefAttachmentMetadata.t) | Per-entity metadata. Not packed (not every entity has metadata). If you'd like to add per-document metadata, see document_metadata instead. |
| `isAuthorIndex` | list(integer()) | The indices of all the reference entities in encoded_mid that are authors of the page. Not packed as in most cases when populated, it contains 1 element. |
| `isPublisherIndex` | list(integer()) | The indices of all the reference entities in encoded_mid that are publishers of the page (e.g. /m/cnn on &quot; |
| `referencePageIndex` | list(integer()) | Only populated when the document is a reference page for an entity. Contains the indices of all reference entities in the encoded_mid and topicality_e2 arrays. Not packed as in most cases when populated, it contains 1 element. |
| `unboundIntentMid` | list(String.t) | The uint64-encoded MID of the unbound intents generated by Pianno. An unbound intent is the annotation of an intent without slots arguments (e.g. Age) declared in Intent Catalog. See go/pianno-asteroid-belt-migration for details. We only keep the top unbound intents with the highest orbit scores. Should have the same number of elements as unbound_intent_score_e2. |
| `unboundIntentScoreE2` | list(integer()) | The confidence of the unbound intent. represented as a fixed-point integer with two decimal precision. In the range [0, 100]. Should have the same number of elements as unbound_intent_mid. |

**RepositoryWebrefEntityLinkMetadata** - 2 attributes

| Attribute | Type | Description |
|---|---|---|
| `aggregateFlags` | GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefLinkKindFlags.t | The aggregate kind flags for the link. |
| `kindInfo` | list(GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefLinkKindInfo.t) | Information about all the link kinds associated with the link. |

**RepositoryWebrefGlobalLinkInfo** - 4 attributes

| Attribute | Type | Description |
|---|---|---|
| `isBoostedPrimaryWeightLink` | boolean() | Whether this is a BoostedPrimaryWeight link. For these links in some cases a higher weight is used for primary scoring. |
| `debugTitle` | String.t | A short human-readable name/title of the entity, similar to what is displayed at the top of a Hume page. Do not use for any production purpose as it does not provide guarantees for stability or policy checks (access requirements). |
| `targetMid` | String.t | The mid of the linked entity. |
| `variantInfo` | list(GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefLinkInfo.t) | The information about this link for each locale. |

**RepositoryWebrefAnnotatedCategoryInfo** - 1 attributes

| Attribute | Type | Description |
|---|---|---|
| `mid` | String.t | The mid of the entity representing the category. |

**RepositoryWebrefCategoryAnnotation** - 2 attributes

| Attribute | Type | Description |
|---|---|---|
| `mid` | String.t | Mid representation of the category. Eg &quot;/m/05qt0&quot;. WARNING: In UDR this field is not populated, use document_entity.entity.mid instead of document_entity.category.mid. |
| `shopping` | GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefCategoryAnnotationShoppingSignals.t | Qprime asserting this category. |

**KnowledgeGraphTriple** - 1 attributes

| Attribute | Type | Description |
|---|---|---|
| `sub` | String.t | sub is an arbitrary node id representing the source entity of a graph relationship. |

**KnowledgeGraphTripleObj** - 3 attributes

| Attribute | Type | Description |
|---|---|---|
| `idValue` | String.t | An id representing an entity (mid or hrid) |
| `locale` | String.t | The language code for the object value. It must be a BCP 47-compliant language tag (b/10005172). See also go/kg-data-l10n. |
| `stringValue` | String.t | A UTF-8 string value to be used for the following expected schema types: - /type/rawstring - /type/text - /type/key |

**KnowledgeGraphTripleProvenance** - 4 attributes

| Attribute | Type | Description |
|---|---|---|
| `accessRequired` | integer() | Specifies the contract or legal visibility required to see the Triple. See go/kg-triple-level-access-controls for details and background. Note that we use an int32 here so that we won't lose values when decoding on a stale binary. The int32 references to the enum storage_graph_bfg.Triple.Provenance.AccessRequirement. |
| `creator` | String.t | Historically, this field was used to encode the Freebase User ID, Google username, or Google MDB group that was responsible for the pipeline that is producing this data. However, there is currently no horizontal validation in place, and as of Q3 2018, this field is used essentially as a free-form string by multiple data providers. NOTE: Do not use this field in new pipelines without first consulting with the OWNERS of this proto. |
| `lgMetadata` | GoogleApi.ContentWarehouse.V1.Model.StorageGraphBfgLivegraphProvenanceMetadata.t | Internal metadata used by Livegraph and possibly other horizontal KG infra systems. This is not part of the logical triple or its provenance, and contents may not be visible downstream of LG. |
| `spiiCertification` | GoogleApi.ContentWarehouse.V1.Model.StorageGraphBfgSpiiCertification.t | A fact about potentially sensitive personal info ( |

**KnowledgeGraphQualifier** - 1 attributes

| Attribute | Type | Description |
|---|---|---|
| `pred` | String.t | The qualifier pred must be a qualifier property defined in KG schema as applying to the predicate of the triple this qualifier is attached to. |

**KnowledgeGraphDateTimeProto** - 1 attributes

| Attribute | Type | Description |
|---|---|---|
| `tzOffset` | String.t | Timezone offset in seconds (can be positive/negative). If present, hours have to be present as well If absent, we expect the time above to be in local time (a.k.a. civil time, go/httat#civil_time). |

**PerDocData** (entity/KG-related subset) - 7 attributes

| Attribute | Type | Description |
|---|---|---|
| `DEPRECATEDAuthorObfuscatedGaia` | list(String.t) | The obfuscated google profile gaia id(s) of the author(s) of the document. This field is deprecated, use the string version. |
| `webrefEntities` | GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefWebrefMustangAttachment.t | WebRef entities associated to the document. See go/webref for details. |
| `authorObfuscatedGaiaStr` | list(String.t) | *(no description provided in leak)* |
| `nsrIsCovidLocalAuthority` | boolean() | This field is propagated to shards. In addition, it is populated at serving time by go/web-signal-joins. This field is deprecated - used the equivalent field inside nsr_data_proto instead. |
| `nsrIsElectionAuthority` | boolean() | This field is propagated to shards. It will also be populated at serving time by go/web-signal-joins (see b/168114815). This field is deprecated - used the equivalent field inside nsr_data_proto instead. |
| `contentAttributions` | GoogleApi.ContentWarehouse.V1.Model.ContentAttributions.t | *(no description provided in leak)* |
| `mediaOrPeopleEntities` | GoogleApi.ContentWarehouse.V1.Model.ImageQualitySensitiveMediaOrPeopleEntities.t | Contains the mids of the 5 most topical entities annotated with selected KG collections. This information is currently used on Image Search to detect cases where results converged to mostly a single person or media entity. More details: go/result-set-convergence. |

### Patent Analysis

##### US9268820B2 - Providing knowledge panels with search results

- **Core concept:** When a query references a known factual entity, a knowledge panel is generated with curated content from multiple sources and displayed alongside search results.
- **Connected leak modules:** PerDocData, RepositoryWebref, QualityNsrNsrData
- **Key SEO claims:**
  - [general] Queries are analyzed to identify referenced factual entities
  - [general] Knowledge panels aggregate content from multiple sources about the entity
  - [general] Content items in the panel are obtained from different resources and merged
  - [general] Entity identification triggers the panel display  -  entities must be in the Knowledge Graph
  - [general] Panels include factual information, images, and related content about the entity
  - [general] The panel competes for attention with organic results  -  ten blue links are no longer the whole page
- **SEO action:** Feed your entity: consistent name and details everywhere, sameAs schema, and the citations that earn a panel. The leak's webrefEntities field in PerDocData confirms Knowledge Graph entity extraction and association.

##### US7565358B2 - Agent rank

- **Core concept:** Reputation scores are computed for named agents (authors) based on digital signatures associating them with content items, and these agent ranks influence the ranking of their associated content.
- **Connected leak modules:** PerDocData, QualityNsrNsrData, RepositoryWebref
- **Key SEO claims:**
  - [general] Agents digitally sign content items to create verifiable associations between authors and content
  - [general] An agent's score is based on the content items associated with them by digital signatures
  - [general] Agent reputation can be topic-specific  -  an agent may be authoritative in one domain but not another
  - [general] The system can use explicit links among signed content to propagate reputation
  - [general] Agent rank directly influences search ratings of associated content
  - [general] Identity of agents can be reliably associated with content through signatures
- **SEO action:** Publish under a real, consistent author identity everywhere. Same name, same profiles, linked with schema. The leak's authorObfuscatedGaiaStr field in PerDocData confirms Google associates content with Google Account IDs for E-E-A-T author identity matching.

##### US10019495B2 - Knowledge panel

- **Core concept:** Selects and orders knowledge modules (different content categories) for a knowledge panel based on rank scores of content items relevant to an entity referenced by the search query.
- **Connected leak modules:** knowledge_graph, structured_data, entity, ranking, snippet
- **Key SEO claims:**
  - [general] Knowledge panels are assembled from multiple knowledge modules, each presenting content items of a specific category
  - [general] Module selection is based on rank scores of content items classified to each module's content category
  - [general] The order of knowledge modules within the panel is determined by combining rank scores of content items in each module
  - [general] Rank scores are based on relevance of content items to the entity and the number of search queries referencing the content
  - [general] Different entities get different module types and orderings based on which content categories are most relevant
  - [general] Presentation constraints determine which module types can coexist and how content is formatted
  - [general] Knowledge panels appear separate from the main search results listing
- **SEO action:** Optimize your entity's presence in Google's Knowledge Graph by ensuring consistent structured data (Organization, LocalBusiness schema), Wikipedia/Wikidata entries, and authoritative references. The knowledge panel content is ranked - higher-quality, more-referenced content about your entity will appear. Monitor and claim your knowledge panel.

##### US9311363B1 - Personalized entity rankings

- **Core concept:** Quality scores for entities (products, services, providers) are personalized by identifying characteristics mentioned in feedback text, determining how much each characteristic influences the overall score, and adjusting based on a user's personal quality profile (what characteristics matter to them).
- **Connected leak modules:** QualityShoppingShoppingAttachmentProduct, ShoppingWebentityShoppingAnnotationProductRating, QualityLabelsGoogleLabelData, QualitySherlockKnexAnnotation, RepositoryWebrefEntityJoin, RepositoryWebrefWebrefEntities, QualityNsrPQData, PerDocData
- **Key SEO claims:**
  - [general] Characteristics of an entity are identified from feedback text (reviews/comments) submitted with quality scores, and the influence of each characteristic on the quality scores is determined by comparing aggregate scores with and without text referencing that characteristic.
  - [general] A quality profile for each user specifies characteristic weights - the importance of each characteristic to that user - derived from their previous review behavior.
  - [general] A personalized estimated quality value is computed by adjusting the overall quality score based on the influence of the characteristic and the user's characteristic weight.
  - [general] If a characteristic is important to the user and has a positive influence on quality scores, the baseline quality score is increased proportionally to the magnitude of the positive influence.
  - [general] The user's quality profile is generated by analyzing their previous feedback: identifying characteristics referenced, comparing scores with and without those characteristics, and computing the difference as the characteristic weight.
  - [general] Users can also explicitly specify the importance of characteristics to them, providing a user-specified quality profile.
  - [general] The influence of a characteristic is determined by the difference between aggregate quality scores submitted with feedback text identifying the characteristic versus scores submitted without such text.
  - [general] Ranking is personalized per user: entities are ranked differently for different users based on their quality profiles.
- **SEO action:** Google personalizes entity rankings based on review text analysis - characteristics mentioned in reviews influence quality scores, and these are re-weighted per user based on their personal preferences. Ensure your product/service reviews mention specific positive characteristics (e.g., 'durable,' 'fast,' 'reliable'), as these characteristics directly influence the quality score. The leak's ShoppingAnnotationProductRating and GoogleLabelData modules confirm review text analysis feeds into ranking. Structured review markup helps Google extract these characteristics.

##### US9870423B1 - Associating an entity with a search query

- **Core concept:** Assigns a canonical 'entity search query' to each entity by scoring candidate queries based on entity ambiguity (ratio of documents about the entity vs. not), query popularity, search result document quality, and similarity to entity properties. (continuation patent)
- **Connected leak modules:** RepositoryWebrefEntityAnnotations, RepositoryWebrefEntityLinkMetadata, RepositoryWebrefDetailedEntityScores, RepositoryWebrefEntityNameRatings, RepositoryWebrefAggregatedEntityNameScores, NlpSaftEntity, NlpSaftEntityProfile, UniversalsearchNewPackerKnowledgeResultSupport
- **Key SEO claims:**
  - [general] A query score for each candidate entity-associated query is based on entity ambiguity - calculated as the ratio of search result documents describing the particular entity to documents NOT describing the entity for that query
  - [general] The query score is further based on search result document quality (document-centric signals) for documents associated with the entity
  - [general] The query score is further based on query popularity and similarity measure between the query and entity properties (including trusted names)
  - [general] The highest-scoring query is assigned as the canonical 'entity search query' for the entity, used when the entity is triggered by user input
  - [general] When the entity is associated with user input (partial query or submitted query), an entity summary is displayed including the entity name and additional properties
  - [general] Selecting the entity summary submits the assigned entity search query to the search engine, navigating to entity-specific results
  - [general] Entity summaries are presented distinctly from other search results (e.g., in a knowledge panel)
  - [general] The entity search query provides 'desired search results for the entity' - meaning it retrieves the most relevant, high-quality results about that entity
- **SEO action:** Ensure your entity has a clear, unambiguous canonical name and consistent properties across the web. The entity search query is determined by which query retrieves the most entity-specific, high-quality results - so optimize your primary keyword to be unambiguous (low ratio of non-entity documents). Build entity authority by ensuring top-ranked results for your entity's name are high-quality and about your entity. Use schema.org Entity, Organization, and Person markup with trusted names. Entity ambiguity directly affects which query Google assigns to your entity.

##### US10339190B2 - Question answering using entity references in unstructured data

- **Core concept:** Question answering system identifies entity references in unstructured search result content, ranks entities by weighted frequency and topicality scores, and generates natural language answers combining query terms and selected entity terms, replacing standard search results.
- **Connected leak modules:** RepositoryWebrefEntityJoin, RepositoryWebrefDocumentMetadata, RepositoryWebrefWebrefEntities, PerDocData, QualityTimebasedLastSignificantUpdate
- **Key SEO claims:**
  - [general] Entity references of a particular type (person, location, date) are identified in content of search results based on query terms matching entity types
  - [general] Entity references are retrieved only from search results above a first ranking threshold (top-ranked subset)
  - [general] Ranking signal for each entity reference is a weighted sum of frequencies of occurrence
  - [general] Ranking signal includes a topicality score based on the relationship between the entity reference and the document containing it
  - [general] When entity ranking results in a tie, entities are re-ranked based on additional criteria
  - [general] Natural language answer is generated combining at least one query term and at least one entity term from the selected entity result
  - [general] The answer is provided in place of search results (not alongside them)
  - [general] Quality score, freshness score, and relevance score are used for ranking and selecting entity results
- **SEO action:** Implement structured entity markup (schema.org Person, Place, Event, etc.) on your pages so Google can identify entity references in your content. Ensure entities appear frequently and with clear topical relevance to the document, since weighted frequency and topicality scores determine entity ranking. Keep content fresh, as freshness scores factor into entity selection. Since answers replace search results, being the source entity for answers means zero-click visibility dominance.
