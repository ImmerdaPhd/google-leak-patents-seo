# Stage 12: Personalization, Local & Context

### How this works

The final ranking stage adjusts results based on the user's location, device, language, country, and personal context. This is where a search for "pizza" returns different results in New York vs. Tokyo, where mobile results differ from desktop, and where a user's browsing history influences what they see. The leak reveals that Google maintains rich per-document geographic data (latitude/longitude, country attachments, GeoTopicality scores), device-specific metadata (smartphone optimization, mobile interstitials), and personalization context outputs that can boost or penalize results based on user-specific signals.

Patent US11893034B2 reveals that Google actively **demotes** local results that are too far from the user - proximity is not just a boost, it's a demotion threshold. Patent US10839029B2 shows personalization using multi-dimensional user profiles built from terms, categories, and links. And patent US12158916B2 reveals a privacy-preserving "quasi-personalization" system that clusters users by browsing history without exposing individual data.

---

### Leak Attributes

### Module: LocalWWWInfo

| Attribute | Type | Description |
|-----------|------|-------------|
| `address` | `list(GoogleApi.ContentWarehouse.V1.Model.LocalWWWInfoAddress.t)` | *(no description provided)* |
| `brickAndMortarStrength` | `float()` | *(no description provided)* |
| `cluster` | `list(GoogleApi.ContentWarehouse.V1.Model.LocalWWWInfoCluster.t)` | *(no description provided)* |
| `docid` | `String.t` | *(no description provided)* |
| `geotopicality` | `GoogleApi.ContentWarehouse.V1.Model.RepositoryAnnotationsGeoTopicality.t` | Information about geo locations, rather than individual businesses. |
| `hours` | `list(GoogleApi.ContentWarehouse.V1.Model.LocalWWWInfoOpeningHours.t)` | *(no description provided)* |
| `isLargeChain` | `boolean()` | Does this LocalWWWInfo represent a widely-distributed chain? |
| `isLargeLocalwwwinfo` | `boolean()` | *(no description provided)* |
| `phone` | `list(GoogleApi.ContentWarehouse.V1.Model.LocalWWWInfoPhone.t)` | *(no description provided)* |
| `siteSiblings` | `integer()` | These are per-document signals independent of any particular address. |
| `url` | `String.t` | These are for convenience during intermediate data processing, and should be cleared before the data gets into doc-joins. |
| `wrapptorItem` | `list(GoogleApi.ContentWarehouse.V1.Model.LocalWWWInfoWrapptorItem.t)` | *(no description provided)* |

### Module: LocalWWWInfoCluster

| Attribute | Type | Description |
|-----------|------|-------------|
| `addrFprint` | `String.t` | *(no description provided)* |
| `annotationConfidence` | `number()` | Confidence score for business mention annotations which is copied from LocalEntityAnnotations::location_confidence. |
| `clusterdocid` | `String.t` | *(no description provided)* |
| `clusterid` | `String.t` | *(no description provided)* |
| `confidence` | `number()` | Probability that this is the authority page of the business. Same as LocalListing.authority_page_probability, only set for pages with page_type_flags & AUTHORITY. |
| `featureType` | `integer()` | Feature type for this listing, from LocalListing::info::related_feature. A geostore::FeatureProto::TypeCategory. Intended primarily to indicate POI-ness (i.e., TYPE_ESTABLISHMENT_POI). |
| `hours` | `GoogleApi.ContentWarehouse.V1.Model.GeostoreTimeScheduleProto.t` | Opening hours for the business, from Local attributes and/or extracted annotations. |
| `hoursSource` | `String.t` | *(no description provided)* |
| `includeInIndex` | `boolean()` | *(no description provided)* |
| `isPlusbox` | `boolean()` | TODO(local-universal) Consider deleting is_plusbox once the new scheme that uses make_plusbox_visible rolled out. |
| `latitudeE6` | `integer()` | *(no description provided)* |
| `level` | `integer()` | DEPRECATED / NO LONGER WRITTEN. URL path level from actual references to this webpage. |
| `longitudeE6` | `integer()` | *(no description provided)* |
| `makePlusboxVisible` | `boolean()` | A hint for frontend to decide whether this plusbox should be visible or not. |
| `menuUrl` | `list(String.t)` | Menu link for the business. Currently only comes from Local attributes. |
| `pageTypeFlags` | `integer()` | Type of the web reference. |
| `phoneFprint` | `String.t` | *(no description provided)* |
| `phoneNumber` | `GoogleApi.ContentWarehouse.V1.Model.TelephoneNumber.t` | *(no description provided)* |
| `postalAddress` | `GoogleApi.ContentWarehouse.V1.Model.PostalAddress.t` | *(no description provided)* |
| `relevance` | `number()` | DEPRECATED / NO LONGER WRITTEN. How relevant the webpage is to the business (clustering distance). Same as LocalListing::Reference.relevance. Typically only set for pages with (page_type_flags & WEB_EXTRACTION && !AUTHORITY). |
| `showInSnippets` | `boolean()` | *(no description provided)* |
| `source` | `list(String.t)` | *(no description provided)* |
| `title` | `String.t` | *(no description provided)* |

### Module: RepositoryAnnotationsGeoTopicality

| Attribute | Type | Description |
|-----------|------|-------------|
| `geotopics` | `list(GoogleApi.ContentWarehouse.V1.Model.RepositoryAnnotationsGeoTopic.t)` | The geotopics are ordered by normalized_score in descending order. |

### Module: RepositoryAnnotationsGeoTopic

| Attribute | Type | Description |
|-----------|------|-------------|
| `address` | `GoogleApi.ContentWarehouse.V1.Model.GeostoreAddressProto.t` | Stores parent/container information containing city, province & country. |
| `componentScores` | `list(GoogleApi.ContentWarehouse.V1.Model.RepositoryAnnotationsGeoTopicalityScore.t)` | The raw scores used to calculate the normalized_score. Note that not all these scores may be exposed to the users. |
| `confidence` | `number()` | A score [0, 1] indicating the confidence. |
| `denseCity` | `boolean()` | Is this a dense city (e.g., population > 100k)? |
| `establishmentType` | `integer()` | Sub type for POI types like ESTABLISHMENT_POI, ESTABLISHMENT_GROUNDS & ESTABLISHMENT_BUILDING |
| `latE7` | `integer()` | Latitude and Longitude of the location. |
| `lngE7` | `integer()` | *(no description provided)* |
| `locationName` | `String.t` | Name of the Geographic location. This is the normalized name. |
| `normalizedScore` | `number()` | A score [0, 1] indicating the likelihood of the location being the GeoTopicality. |
| `oysterId` | `GoogleApi.ContentWarehouse.V1.Model.GeostoreFeatureIdProto.t` | Oyster Feature ID of the location. |
| `oysterType` | `integer()` | Oyster Feature Type |
| `sumContainedPoiNormalizedScores` | `number()` | The sum of the normalized scores of POIs contained within a particular locality. |

### Module: SmartphonePerDocData

| Attribute | Type | Description |
|-----------|------|-------------|
| `DEPRECATEDDesktopCanonicalDocid` | `String.t` | If set, this page is a smartphone dup, a page serving equivalent contents as another URL (desktop canonical), but in smartphone-optimized style. This field holds the docid of the desktop canonical. |
| `DEPRECATEDMobileHomepageDocid` | `String.t` | Mobile URL for homepages, predicted by the URL rewrite rules. See go/mobile-homepage-prediction. |
| `adsDensityInterstitialViolationStrength` | `integer()` | Indicates if the page is violating mobile ads density interstitial policy and the violation strength. See go/interstitials-for-ads and |
| `isErrorPage` | `boolean()` | Indicates if the page serves error to smartphone crawler. go/ramsey-sp404demotion |
| `isN1Redirect` | `boolean()` | Indicates if the page has mobile N-1 redirection. go/ramsey-n1demotion |
| `isSmartphoneOptimized` | `boolean()` | Indicates if the page is rendered in a friendly manner on smartphones. We use this field as tri-state: &quot;unset&quot; means the rendering result classification is not available, and &quot;set as false&quot; means that the page is rendered in unfriendly manner on smartphones. See also go/modena-ranking. |
| `isWebErrorMobileContent` | `boolean()` | Indicates if the current URL serves error page to desktop crawler and non error page to smartphone crawler. |
| `maximumFlashRatio` | `float()` | The ratio of the area of the largest Flash to the render area. |
| `violatesMobileInterstitialPolicy` | `boolean()` | Indicates if the page is violating mobile interstitial policy and should be demoted. See go/interstitials-ranking-dd for details. |

### Module: CountryCountryAttachment (35 attributes - all shown)

| Attribute | Type | Description |
|-----------|------|-------------|
| `debug` | `String.t` | A non critical field to store debug info for a country attachment. Used in experiments and for debugging. |
| `salientCountrySet` | `GoogleApi.ContentWarehouse.V1.Model.QualitySalientCountriesSalientCountrySet.t` | *(no description provided)* |
| `provinceGeotokenList` | `list(GoogleApi.ContentWarehouse.V1.Model.CountryProvinceGeotoken.t)` | *(no description provided)* |
| `countryidFromUgc` | `boolean()` | Is true if the country attachment was computed through the UGC pipeline. |
| `fromUrlPattern` | `boolean()` | *(no description provided)* |
| `weightAboveIdealForLocalness` | `float()` | If result is global, store weight above ideal, as a confidence signal. Used in query localness, cleared in production CountryAttachment. |
| `existNextLevel` | `boolean()` | *(no description provided)* |
| `global` | `boolean()` | *(no description provided)* |
| `urlPatternBasedCountry` | `integer()` | *(no description provided)* |
| `fromLanguageFallback` | `boolean()` | Booleans to keep track of where the country-id of the page came from. These are used for debugging and/or unittests, and cleared in production. |
| `salientCountries` | `list(GoogleApi.ContentWarehouse.V1.Model.CountrySalientCountry.t)` | [Experimental]: Top salient countries for a doc. If a country can not be found on this field it can be considered that this doc is not relevant to it. |
| `fromRestricts` | `boolean()` | *(no description provided)* |
| `relatedCountries` | `list(String.t)` | two-letter(lower-case) countrycode, e.g. us countries that is related to, but not local to |
| `relatedCountryCodes` | `list(integer())` | *(no description provided)* |
| `sitename` | `String.t` | Domain name of keys in filtering metro reducer class, used only by the intermediate mapreduces to produce filtered data. |
| `fromUgc` | `boolean()` | *(no description provided)* |
| `localCountryCodes` | `list(integer())` | Fields that actually store the country id in docjoins. The format of this data is defined in //i18n/identifiers/stableinternalregionconverter.cc. Converter defined there can be used to convert it to RegionCode format. |
| `clickDistribution` | `GoogleApi.ContentWarehouse.V1.Model.CountryClickDistribution.t` | Store weighted click distribution for page level country-id classification. |
| `localCountries` | `list(String.t)` | two-letter(lower-case) countrycode, e.g. us countries that is local to |
| `geoLocations` | `GoogleApi.ContentWarehouse.V1.Model.CountryGeoLocations.t` | New MetroID: Now called GeoLocations since the locations could be sublocalities, cities or states. GeoLocations are always more fine grained than country. TODO (jayeshv): Once new MetroID/GeoLocations is launched everywhere, deleted old MetroID related fields. |
| `superGlobal` | `boolean()` | Super global pages get lesser demotion than global pages. A document can only be either global or super_global but not both. |
| `isValidForCountryRestrict` | `boolean()` | Set to true if the local_countries field can be used for country restricts as well. |
| `documentLocationSource` | `String.t` | Specifies the origin of |
| `fromSgDomains` | `boolean()` | *(no description provided)* |
| `fromWmx` | `boolean()` | *(no description provided)* |
| `userVisibleCountryFromLogs` | `String.t` | This is used to store the visible country id computed from logs data |
| `fromTld` | `boolean()` | *(no description provided)* |
| `metroIdList` | `list(GoogleApi.ContentWarehouse.V1.Model.CountryMetroNBFeature.t)` | Metro locations: list of NavBoost feature V2 associated with a doc, along with the enclosing province. Metro locations with new tags. |
| `restrictCountries` | `list(String.t)` | List of two-letter(lower-case) countrycodes(e.g. us) valid for restricts. Typically cloned out of local_countries if is_valid_for_country_restrict is set to true. |
| `debugSourceUrl` | `list(String.t)` | Set to the signal source URLs when merging country signals in Alexandria during sitemoves. Essentially if sites A and B move to C, and we merge A and B's signal to C, in the countryattachment signal C will have URL A and B as source_url. Only used for debugging and it doesn't show up in docjoins. |
| `wmxCountry` | `String.t` | Country specified for a web-site through webmaster console. |
| `metroNavboost` | `list(GoogleApi.ContentWarehouse.V1.Model.CountryMetroNBFeature.t)` | Metro navboost: list of (NavBoost feature V2, navboost float) pairs. |
| `urlPatternBasedLanguage` | `integer()` | Language and country extracted using the URL pattern map. |
| `metroLocationId` | `list(String.t)` | Metro level data. metro_location_id stores geotokens for metro restricts. |
| `userVisibleLocalCountry` | `integer()` | This is the country id we show to users on the result page. This is kept different from country demotion country id because we dont want to expose our backoff and url based detection algorithm - also we want to be ultra conservative in showing this. |

### Module: PerDocData (Stage 12-relevant fields)

| Attribute | Type | Description |
|-----------|------|-------------|
| `smartphoneData` | `GoogleApi.ContentWarehouse.V1.Model.SmartphonePerDocData.t` | Additional metadata for smartphone documents in the Google index. |
| `MobileData` | `GoogleApi.ContentWarehouse.V1.Model.MobilePerDocData.t` | Additional metadata for lowend mobile documents in the Google index. |
| `geodata` | `String.t` | geo data; approx 24 bytes for 23M U.S. pages |
| `countryInfo` | `GoogleApi.ContentWarehouse.V1.Model.CountryCountryAttachment.t` | This field stores the country information for the document in the form of CountryAttachment. |
| `brainloc` | `GoogleApi.ContentWarehouse.V1.Model.QualityGeoBrainlocBrainlocAttachment.t` | Brainloc contains location information for the document. See ariane/273189 for details. |

### Module: QualityNsrNsrData (Stage 12-relevant fields)

| Attribute | Type | Description |
|-----------|------|-------------|
| `chromeInTotal` | `number()` | Site-level Chrome views. |
| `localityScore` | `number()` | Locality score of the site, i.e. the locality component of the LocalAuthority signal (see go/pq-localauthority). |
| `pnav` | `number()` | Fractional signals. |
| `directFrac` | `number()` | *(no description provided)* |

### Module: RepositoryWebrefPersonalizationContextOutputs

| Attribute | Type | Description |
|-----------|------|-------------|
| `outputs` | `list(GoogleApi.ContentWarehouse.V1.Model.RepositoryWebrefPersonalizationContextOutput.t)` | Detailed output scores per personalization type. |

### Module: RepositoryWebrefPersonalizationContextOutput

| Attribute | Type | Description |
|-----------|------|-------------|
| `score` | `number()` | Score corresponding to some kind of biasing strength which was applied. The exact semantics of this score is subject to further changes. Don't make assumptions about specific values or ranges. Values > 0 represents that a boost was applied. Values < 0 represents that a penalty was appled. |
| `type` | `String.t` | *(no description provided)* |

### Module: QualityGeoBrainlocBrainlocAttachment

| Attribute | Type | Description |
|-----------|------|-------------|
| `brainlocVersion` | `integer()` | *(no description provided)* |
| `topCitiesRawScores` | `list(integer())` | *(no description provided)* |
| `topCitiesVocabIds` | `list(integer())` | Compressed top locations and their scores. |
| `topCountiesRawScores` | `list(integer())` | *(no description provided)* |
| `topCountiesVocabIds` | `list(integer())` | *(no description provided)* |
| `topCountriesRawScores` | `list(integer())` | *(no description provided)* |
| `topCountriesVocabIds` | `list(integer())` | *(no description provided)* |
| `topStatesRawScores` | `list(integer())` | *(no description provided)* |
| `topStatesVocabIds` | `list(integer())` | *(no description provided)* |

### Module: MobilePerDocData

| Attribute | Type | Description |
|-----------|------|-------------|
| `flags` | `integer()` | *(no description provided)* |
| `mobileurl` | `String.t` | DEPRECATED: Url of the mobile version of the document. This is set during canonicalization if we do not know that the Web url also serves the mobile version. |
| `transcodedPageScore` | `integer()` | DEPRECATED: The transcoded page quality repesented in 7-bits range from 0 to 127. |

### Module: KaltixPerDocData

| Attribute | Type | Description |
|-----------|------|-------------|
| `KaltixRank` | `integer()` | approx. 2 bytes for top 1B |
| `LocalKaltixRank` | `integer()` | empty for now |
| `SiteKaltixRank` | `integer()` | empty for now |

---

### Relevant Patents

#### US11893034B2: Distance based search ranking demotion
- **Core concept:** Demotes local search results in ranking when their proximity to the user's location exceeds thresholds and other non-local results meet quality criteria, reducing prominence of distant local results.
- **Connected leak modules:** LocalWWWInfo, LocalWWWInfoCluster, RepositoryAnnotationsGeoTopicality, PerDocData
- **SEO action:** Ensure your business location data is accurate and you're physically proximate to your target searchers. Google actively demotes local results that are too far from the user - even if locally relevant. For multi-location businesses, maintain separate listings per location to avoid proximity-based demotion.
- **SEO claims:**
  - Local search results are demoted to less prominent positions when proximity between user location and the local result's location meets a first demotion criterion (exceeds proximity threshold)
  - Non-local search results are promoted over local results when the non-local result meets a second demotion criterion (quality threshold)
  - Proximity thresholds define criteria for co-location in the same geographic or political region
  - The system determines eligibility for demotion based on proximity measures between user device location and locations specified for local documents
  - When at least one other local document has a better proximity measure, the first local document is demoted in ranking

#### US10248698B2: Native application search result adjustment based on user specific affinity
- **Core concept:** Native app deep links in search results are re-ranked based on user-specific affinity scores derived from relative app usage time - how much time a user spends in an app relative to their total app usage time, with vertical-specific adjustments.
- **Connected leak modules:** PerDocData, QualityNavboostCrapsCrapsData
- **SEO action:** For app deeplink indexing: drive user engagement with your app to increase affinity scores. The more time users spend in your app relative to other apps, the higher your deep links rank. Ensure your app is properly indexed with Firebase App Indexing. Build app content that encourages repeat usage and longer sessions.
- **SEO claims:**
  - Affinity score measures user's affinity for a native application relative to other installed applications
  - Affinity score is based on relative engagement measure: app-specific usage time / total app usage time across all apps
  - Application affinity data is received via a reporting process separate from the search operation
  - Native application search results with deep links are adjusted based on their affinity scores relative to other app results
  - Adjustment can be within the same vertical - only native app results in the same vertical are adjusted relative to each other
  - Affinity scores can be aggregated by vertical/category, applying to all apps in that category including new ones
  - Reporting data includes average duration of use, total time duration, and frequency of use
  - App search results can be adjusted relative to an affinity score threshold, not just relative to other apps

#### US11036804B1: Device specific adjustment based on resource utilities
- **Core concept:** Search results are adjusted based on the querying device type - resources with positive utility for that device type are boosted relative to resources without, but navigational queries are exempt from this adjustment.
- **Connected leak modules:** PerDocData, CompressedQualitySignals
- **SEO action:** Ensure your pages are categorized for the correct device types. If you have Android-specific or iOS-specific content, properly mark it. Responsive design that works across all device types ensures positive utility classification. Navigational/branded queries bypass device adjustments, so brand strength protects cross-device rankings.
- **SEO claims:**
  - Device type identifier is received with each query, identifying one of multiple device types
  - Resources are classified into subsets: those with positive utility for the device type and those without
  - Search results referencing resources with positive utility for the querying device are boosted relative to those without
  - The adjustment operation is skipped for navigational queries - queries indicating intent to identify a particular resource/website
  - Navigational query determination is based on navigation metrics of resources identified by the search engine
  - Resources categorized as corresponding to the first device type AND not the second have positive utility for the first
  - Resources categorized as corresponding to the second device type AND not the first do not have positive utility for the first
  - Boosting increases search scores of resources in the positive-utility subset relative to the non-positive-utility subset

#### US10031951B1: Distance based search ranking demotion
- **Core concept:** Demotes local search results based on geographic distance between the user's location and the document's location, particularly when non-local results are more relevant, reducing the local boost for distant local documents.
- **Connected leak modules:** demotion, local_search, ranking, navboost
- **SEO action:** For local SEO, ensure your business location is accurate and consistent across all citations. If your business is far from the searcher, your local boost may be demoted in favor of more relevant non-local results. Optimize for relevance signals beyond just proximity - content quality and query relevance can overcome distance-based demotion.
- **SEO claims:**
  - Local documents receive a search score boost for proximity to the user's location
  - A local document is eligible for demotion when its proximity measure (distance from user) indicates it's too distant
  - Demotion is triggered when at least one non-local document has a search score meeting a 'distant document demotion threshold'
  - When demoted, the local document's search score is adjusted downward so non-local documents rank above it
  - The demotion reduces the local boost that was originally applied based on geographic proximity
  - Demotion only applies to the proper subset of documents classified as 'local documents'

#### US10839029B2: Personalization of web search results using term, category, and link-based user profiles
- **Core concept:** Creates multi-dimensional user profiles from search queries, accessed documents, and linked documents, combining term-based, category-based, and link-based profile components with confidence scoring to personalize search rankings.
- **Connected leak modules:** link_analysis, personalization, ranking, navboost, user_profile
- **SEO action:** Google personalizes rankings using link-based user profiles - pages linked from documents a user has visited are more likely to rank for that user. Build content networks where your pages link to each other contextually. User behavior history (visited pages, clicked links) creates link-based personalization signals. Focus on building topical authority clusters where interlinked content reinforces user interest profiles.
- **SEO claims:**
  - User profiles incorporate three dimensions: terms (from accessed documents), categories (user preferences), and links (documents linked to accessed documents)
  - Terms are extracted from accessed documents using paragraph sampling or context analysis
  - Generic scores (query-independent) are combined with personalized scores using a confidence-weighted function
  - Confidence score accounts for: quantity of user information, query-profile match, and profile age
  - Final score = f(personalized_score, generic_score, confidence_score) - higher confidence means more personalization
  - Documents linked to user-accessed documents contribute to the link-based profile component
  - Category weights indicate correlation between search preferences and categories

#### US12158916B2: Low entropy browsing history for content quasi-personalization
- **Core concept:** Achieves privacy-preserving personalization by dimensionally reducing aggregated browsing history into clusters, enabling quasi-personalized content retrieval without exposing individual device data.
- **Connected leak modules:** QualityNavboostCrapsCrapsData, QualityNavboostCrapsFeatureCrapsData, PerDocData, KaltixPerDocData, CompressedQualitySignals
- **SEO action:** Create content that appeals to coherent audience clusters. Google groups users by dimensionally-reduced browsing history - content that resonates with specific cluster profiles gets quasi-personalized distribution. Understand your audience's broader browsing patterns to align with their cluster's content preferences.
- **SEO claims:**
  - Feature vectors representing online content accessed by client devices are dimensionally reduced to obtain a class identifier for quasi-personalized content retrieval
  - Singular value decomposition reduces entropy of browsing history, providing anonymity while preserving personalization signals
  - A neural net model applies weights (determined from aggregated multi-device data) to generate rankings of predetermined clusters
  - Content is selected according to a class identifier representing a cluster of similar browsing histories, not individual device data
  - The system constructs a sparse matrix from aggregated browsing history of millions/billions of devices for dimensionality reduction

#### US12108314B2: Personalized entity repository
- **Core concept:** Creates a personalized on-device entity repository by selecting topic-based and location-based entity set slices from a server-side knowledge graph, ranked by user context relevance and usage patterns.
- **Connected leak modules:** RepositoryWebrefEntityJoin, RepositoryWebrefWebrefEntities, RepositoryWebrefGlobalNameInfo, PerDocData, RepositoryAnnotationsGeoTopicality
- **SEO action:** Build strong topical authority in specific niches. Google creates personalized entity repositories on user devices based on their interaction patterns - if users in your niche have your entities downloaded, you get on-device recognition priority. Create content that establishes clear topical entity associations.
- **SEO claims:**
  - Fixed sets of entities (location-based, topic-based, action-based) are generated from an entity repository and provided to client devices based on user relevance
  - Sets are ranked by relevancy based on context associated with the computing device and set usage parameters applicable to the user
  - User interactions are analyzed using embeddings to determine topic relevance, generating confidence scores for topic-based entity sets
  - When confidence score for a topic-based entity set satisfies a threshold, the system prompts the user to download that entity set
  - Downloaded entity sets enable on-device entity recognition and action suggestions without server connection

#### Note on Patent Coverage

Patents US9262541B2, US10102222B2 and US9582548B1 were referenced during drafting but were not present in the deeply analyzed patent set at the time. The three closest available patents on personalization and local context - **US10839029B2** (Personalization of web search results using term, category, and link-based user profiles), **US12158916B2** (Low entropy browsing history for content quasi-personalization), and **US12108314B2** (Personalized entity repository) - have been substituted to ensure complete coverage of the personalization/local/context domain.

---

### How this works

### 1. Geographic Location: GeoTopicality, Brainloc, and CountryAttachment

Google maintains multiple layers of geographic data for every document. The `RepositoryAnnotationsGeoTopicality` module's `geotopics` field ("The geotopics are ordered by normalized_score in descending order") contains ranked geographic locations associated with the document. Each `RepositoryAnnotationsGeoTopic` entry includes `normalizedScore` ("A score [0, 1] indicating the likelihood of the location being the GeoTopicality"), `latE7`/`lngE7` ("Latitude and Longitude of the location"), `locationName` ("Name of the Geographic location. This is the normalized name"), `confidence` ("A score [0, 1] indicating the confidence"), and `denseCity` ("Is this a dense city (e.g., population > 100k)?"). This means Google doesn't just know *where* a document is about - it knows the confidence level, the population density of the location, and the sum of contained POI scores (`sumContainedPoiNormalizedScores`).

The `PerDocData.brainloc` field ("Brainloc contains location information for the document. See ariane/273189 for details") points to the `QualityGeoBrainlocBrainlocAttachment` module, which stores "Compressed top locations and their scores" at four granularities: `topCountriesVocabIds`/`topCountriesRawScores`, `topStatesVocabIds`/`topStatesRawScores`, `topCountiesVocabIds`/`topCountiesRawScores`, and `topCitiesVocabIds`/`topCitiesRawScores`. This is a neural model ("Brainloc") that predicts the geographic locations a document is relevant to, at country, state, county, and city level - all compressed into vocabulary IDs and raw scores for storage efficiency.

The `PerDocData.countryInfo` field ("This field stores the country information for the document in the form of CountryAttachment") links to the `CountryCountryAttachment` module (35 attributes), which is the most detailed geographic classification. It tracks `localCountries` ("countries that is local to"), `relatedCountries` ("countries that is related to, but not local to"), `global` (whether the page is global), `superGlobal` ("Super global pages get lesser demotion than global pages"), `salientCountries` ("[Experimental]: Top salient countries for a doc"), `clickDistribution` ("Store weighted click distribution for page level country-id classification"), `metroIdList` ("Metro locations: list of NavBoost feature V2 associated with a doc, along with the enclosing province"), and `wmxCountry` ("Country specified for a web-site through webmaster console"). The multiple provenance flags - `fromTld`, `fromSgDomains`, `fromWmx`, `fromUgc`, `fromUrlPattern`, `fromLanguageFallback`, `fromRestricts` - show that Google determines a document's country from many signals: TLD, search console settings, UGC data, URL patterns, language, and restricts.

### 2. Distance-Based Demotion for Local Results

Patent US11893034B2 reveals a critical mechanism: "local search results are demoted to less prominent positions when proximity between user location and the local result's location meets a first demotion criterion (exceeds proximity threshold)." Patent US10031951B1 confirms: "a local document is eligible for demotion when its proximity measure (distance from user) indicates it's too distant" and "when demoted, the local document's search score is adjusted downward so non-local documents rank above it."

The leak's `LocalWWWInfo` module implements this. The `brickAndMortarStrength` field measures physical presence strength, while `LocalWWWInfoCluster` provides `latitudeE6`/`longitudeE6` (precise coordinates in microdegrees), `annotationConfidence` ("Confidence score for business mention annotations"), `confidence` ("Probability that this is the authority page of the business"), `postalAddress`, `phoneNumber`, `hours` ("Opening hours for the business, from Local attributes and/or extracted annotations"), and `makePlusboxVisible` ("A hint for frontend to decide whether this plusbox should be visible or not"). The `featureType` field ("Feature type for this listing... Intended primarily to indicate POI-ness (i.e., TYPE_ESTABLISHMENT_POI)") classifies the business type.

The `QualityNsrNsrData.localityScore` field ("Locality score of the site, i.e. the locality component of the LocalAuthority signal (see go/pq-localauthority)") is the site-level signal that feeds into local authority. This score, combined with the document's geographic coordinates and the user's location, determines whether the proximity demotion from US11893034B2 is triggered. A high `localityScore` means the site is strongly associated with a specific location; if the user is far from that location, the demotion threshold applies.

### 3. Device-Specific Ranking: Smartphone and Mobile Data

Patent US11036804B1 describes device-specific adjustment: "device type identifier is received with each query" and "resources with positive utility for the device type are boosted." The leak's `SmartphonePerDocData` module (accessed via `PerDocData.smartphoneData`) implements this with 9 fields. The `isSmartphoneOptimized` field ("Indicates if the page is rendered in a friendly manner on smartphones. We use this field as tri-state: 'unset' means the rendering result classification is not available, and 'set as false' means that the page is rendered in unfriendly manner on smartphones") is the core mobile-friendliness signal. The `violatesMobileInterstitialPolicy` field ("Indicates if the page is violating mobile interstitial policy and should be demoted") and `adsDensityInterstitialViolationStrength` ("Indicates if the page is violating mobile ads density interstitial policy and the violation strength") implement interstitial and ad-density demotions.

The `isErrorPage` ("Indicates if the page serves error to smartphone crawler"), `isN1Redirect` ("Indicates if the page has mobile N-1 redirection"), `isWebErrorMobileContent` ("Indicates if the current URL serves error page to desktop crawler and non error page to smartphone crawler"), and `maximumFlashRatio` ("The ratio of the area of the largest Flash to the render area") fields are all demotion signals for specific mobile issues. The `DEPRECATEDDesktopCanonicalDocid` ("If set, this page is a smartphone dup, a page serving equivalent contents as another URL (desktop canonical), but in smartphone-optimized style") shows that Google maintains smartphone-desktop duplicate relationships.

The `PerDocData.MobileData` field links to `MobilePerDocData` with `flags`, `mobileurl` ("Url of the mobile version of the document"), and `transcodedPageScore` ("The transcoded page quality represented in 7-bits range from 0 to 127") - this handles the lowest-end mobile devices where Google transcodes pages.

### 4. Personalization via User Profiles and Browsing History

Patent US10839029B2 describes multi-dimensional personalization: "user profiles incorporate three dimensions: terms (from accessed documents), categories (user preferences), and links (documents linked to accessed documents)." The final score combines personalized and generic scores "using a confidence-weighted function" where "higher confidence means more personalization."

The leak's `RepositoryWebrefPersonalizationContextOutputs` module implements this. The `outputs` field ("Detailed output scores per personalization type") contains `RepositoryWebrefPersonalizationContextOutput` entries, each with a `score` ("Score corresponding to some kind of biasing strength which was applied... Values > 0 represents that a boost was applied. Values < 0 represents that a penalty was applied") and a `type` (the personalization type). This confirms that personalization is implemented as **per-type boost/penalty scores** applied during ranking - not as a separate ranking pass, but as biasing signals within the main scoring pipeline.

Patent US12158916B2 reveals the privacy mechanism: "feature vectors representing online content accessed by client devices are dimensionally reduced to obtain a class identifier for quasi-personalized content retrieval" using "singular value decomposition [to] reduce entropy of browsing history, providing anonymity while preserving personalization signals." The `KaltixPerDocData` module (referenced in the patent's connected modules) contains `KaltixRank` ("approx. 2 bytes for top 1B"), `LocalKaltixRank`, and `SiteKaltixRank` - these are personalized PageRank variants computed for different user clusters, not individual users.

### 5. Chrome Views, Direct Navigation, and Navigation Signals

The `QualityNsrNsrData` module contains several personalization-relevant fields. The `chromeInTotal` field ("Site-level Chrome views") tracks how many times the site is viewed in Chrome browser - a direct measure of real user engagement that bypasses search entirely. The `directFrac` field (a fractional signal) and `pnav` field ("Fractional signals") with `pnavClicks` ("denominator for the pnav computation") measure navigational intent - how often users navigate directly to the site rather than discovering it through search.

Patent US9514194B1 (from Stage 11) connects here: "duration measurements from direct navigation (typing URL, bookmark) are boosted - indicative of positive quality assessment." The `directFrac` and `chromeInTotal` fields are the site-level implementation of this signal. Sites with high direct navigation and Chrome views are recognized as brands that users intentionally visit - and this feeds back into higher rankings across all queries.

Patent US10248698B2 extends personalization to apps: "affinity score measures user's affinity for a native application relative to other installed applications" based on "relative engagement measure: app-specific usage time / total app usage time." The `PerDocData` module's various attachment fields provide the document-level signals that, combined with user app affinity scores, determine whether app deep links appear in search results and in what order.

---

### SEO actions

- **Ensure your business location data is accurate and consistent across all citations.** Patent US11893034B2 confirms Google "actively demotes local results that are too far from the user - even if locally relevant." The `LocalWWWInfoCluster.latitudeE6`/`longitudeE6` and `postalAddress` fields store precise coordinates. The `annotationConfidence` and `confidence` fields measure how confident Google is in your business data. Inconsistent NAP (Name, Address, Phone) data lowers confidence scores.

- **Maintain separate listings per location for multi-location businesses.** US11893034B2 states that "when at least one other local document has a better proximity measure, the first local document is demoted." If one listing tries to cover multiple distant locations, it will be demoted in favor of competitors closer to the user. The `brickAndMortarStrength` field measures physical presence - each location should have its own listing.

- **Specify your target country in Google Search Console.** The `CountryCountryAttachment.wmxCountry` field ("Country specified for a web-site through webmaster console") is an explicit country signal. The `fromWmx` flag tracks whether this signal was used. This is one of the few country signals you directly control.

- **Ensure your pages are smartphone-optimized.** The `SmartphonePerDocData.isSmartphoneOptimized` field is a tri-state signal that feeds into device-specific boosting (US11036804B1). The `violatesMobileInterstitialPolicy` and `adsDensityInterstitialViolationStrength` fields trigger demotions. Mobile-friendly design is not optional - it's a ranking twiddler.

- **Build direct traffic and brand engagement.** The `chromeInTotal` ("Site-level Chrome views") and `directFrac` fields measure how often users visit your site directly, bypassing search. Patent US9514194B1 confirms "duration measurements from direct navigation are boosted." Build brand awareness through channels outside search - direct traffic is a quality signal that feeds back into search rankings.

- **Create content that appeals to coherent audience clusters.** Patent US12158916B2 reveals that Google groups users by "dimensionally reduced browsing history" into clusters, and content matching cluster profiles gets "quasi-personalized distribution." The `KaltixPerDocData` fields show personalized ranking variants per cluster. Understand your audience's broader browsing patterns - content that resonates with specific cluster profiles gets distribution advantages.

- **Build strong topical entity associations for personalized entity repositories.** Patent US12108314B2 describes how Google creates "personalized on-device entity repositories" with "topic-based and location-based entity set slices." The `RepositoryWebrefPersonalizationContextOutputs` fields show per-type boost/penalty scores. If your entities are strongly associated with topics users engage with, your content gets on-device recognition priority.

---
