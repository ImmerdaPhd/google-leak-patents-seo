# Stage 5: User Engagement & NavBoost (Click Signals)

**Leak modules (9):** `QualityNavboostCrapsCrapsClickSignals`, `QualityNavboostCrapsCrapsData`, `QualityNavboostCrapsFeatureCrapsData`, `QualityNavboostCrapsCrapsDevice`, `ImageQualityNavboostImageQualityClickSignals`, `ResearchScienceSearchNavboostQueryInfo`, `VideoContentSearchNavboostAnchorFeatures`, `PerDocData` (engagement subset), `CompressedQualitySignals` (craps subset)

**Relevant patents (8):** US8661029B1, US10152520B1, US11188544B1, US10229166B1, US9811566B1, US9235627B1, US8694511B1, US8359309B1

### What Happens Here

After a page is crawled, indexed, quality-scored, and link-analyzed, Google watches what users actually do when they see it in search results. Every click, every dwell time, every return-to-SERP is logged, sliced by device/country/language, and fed back as a ranking signal. This is NavBoost - the system that turns user behavior into ranking adjustments. The internal name "CRAPS" (Content Ranking And Personalization Signals) is the data pipeline that aggregates click signals at multiple granularities and feeds them into the scoring bundle at query time.

NavBoost is one of Google's most powerful and secretive ranking systems. Unlike PageRank (which is computed from the link graph) or NSR (which is computed from content quality signals), NavBoost is computed directly from user behavior data collected through browser toolbars, Chrome, and search result interaction logs. The system classifies each click as "good" (long dwell), "bad" (short dwell / bounce), or "last longest" (session-ending click), aggregates these across multiple population slices, applies position-bias correction ("squashing"), and produces per-document, per-query, per-locale quality-of-result statistics that modify the information retrieval score at query time.

The patent family behind NavBoost is extensive - eight patents cover click classification by dwell time, population-level aggregation with narrower-population preference, position-bias correction through squashing, cross-corpus click-through rate comparison, user-type weighting (Unicorn users vs. ordinary users), IP-based fraud detection, and link-click probability modeling. Together, they reveal that Google's click signals are far more sophisticated than simple CTR metrics.

Critically, NavBoost signals are computed continuously and stored per-document, per-query, per-locale, and per-device. They are not computed at query time - they are pre-aggregated and stored in the per-doc data bundle, then joined at query time. This means a document's click reputation is a persistent, accumulated score that reflects months or years of user behavior, not just the last search session. The `CompressedQualitySignals` module carries compressed versions of these signals (crapsNewUrlSignals, crapsNewHostSignals, crapsNewPatternSignals) into the serving shards, where they modify the information retrieval score. The `PerDocData.onsiteProminence` field shows that click signals even propagate within a site - pages that receive good clicks boost the prominence of other pages on the same site through simulated traffic propagation from "high craps click pages."

### How this works

**1. Clicks are classified as good, bad, or last-longest - not just counted.** The `QualityNavboostCrapsCrapsClickSignals` module is the atomic unit of NavBoost. It separates clicks into `goodClicks` (float, no description in the leak - but per patent US8661029B1, these are "longer views" where the user stayed), `badClicks` (float - "short clicks" where the user bounced back quickly), `clicks` (float - total clicks), and `lastLongestClicks` (float - clicks where the user's session ended on that document, indicating satisfaction). Patent **US8661029B1** states: "Document relevance is determined by the ratio of longer views to total views" and "Views are classified into viewing time categories (short, medium, long) with different weights." The leak's `goodClicks` and `badClicks` are the direct implementation of this classification - a "good click" is a long view, a "bad click" is a short view. The `lastLongestClicks` field implements the patent's "last click" category: patent US10229166B1 claim states "the viewing time categories further comprise a category for a medium click and a category for a last click." The ratio of goodClicks to total clicks is the "weighted-click fraction" that US10229166B1 describes: "each weighted-click fraction is based on a sum of a weighted number of documents selected by the user, and each weight is based on how much time the user spent on the document." The `absoluteImpressions` field ("Thus far this field is only used for host level unsquashed impressions") provides the denominator - total times the document was shown in search results. The `unsquashedClicks` and `unsquashedImpressions` fields retain the raw, position-unadjusted counts for separate analysis.

**2. Click signals are sliced by device, country, language, and IP - not aggregated globally.** The `QualityNavboostCrapsCrapsData` module is the container that holds multiple `CrapsClickSignals` instances, each for a different slice. The `country` field is "The two-letter uppercase country slice of the CrapsData. Examples: 'US', 'FR'" and `language` is "The language slice of the CrapsData. Examples: 'en', 'fr', 'pt-BR'." The `device` field holds a `QualityNavboostCrapsCrapsDevice` with `uxInterface` ("An enum taken from GWSLogEntryProto that indicates what type of device a request came from"). The `mobileSignals` field holds "The portion of this CrapsData aggregated on data from tier 1/2 mobile interfaces in QSessions" - a separate click-signal instance just for mobile. The `sliceTag` field "can be used by the craps pipeline to slice up signals by various attributes such as device, locale, metro id." Patent **US8694511B1** (Modifying search result ranking based on populations) describes exactly this multi-population aggregation: "First click data aggregates weighted selections for the same country and language; second click data aggregates weighted selections for the same language across countries" and "The second (broader, language-level) click data is deemphasized relative to the first (narrower, country+language-level) click data." The leak's per-country, per-language, per-device slicing is the implementation - Google does not blend all clicks into one number; it computes separate quality-of-result statistics per population and weights narrower populations higher.

**3. Click signals are "squashed" to normalize for position bias, and unsquashed values are also retained.** The `CrapsClickSignals` module has both `clicks` (squashed) and `unsquashedClicks` ("This is not being populated for the current format - instead two instances of CrapsClickSignals (squashed/unsquashed) are used"), plus `unsquashedImpressions` and `unsquashedLastLongestClicks`. The `absoluteImpressions` field is "only used for host level unsquashed impressions. When compressed (e.g., in perdocdata.proto, CompressedQualitySignals), this value is represented individually and thus is generally incompatible with the other values which are compressed as click-ratios." Squashing is the process of normalizing click data to account for position bias - a result in position 1 gets more clicks than position 5 regardless of quality, so Google "squashes" the raw counts into position-adjusted ratios. The `CompressedQualitySignals.crapsAbsoluteHostSignals` field ("Impressions, unsquashed, host level, not to be used with compressed ratios") and `crapsNewUrlSignals` / `crapsNewHostSignals` / `crapsNewPatternSignals` ("For craps") are the compressed, space-efficient encodings of these signals that travel in the per-doc scoring bundle. Patent **US8359309B1** confirms that "Click-through rate for each corpus is computed as the count of selections divided by the count of presentations" - the squashed ratio is essentially a click-through rate, and the patent says these ratios drive corpus-level boosting.

**4. IP-based priors and Unicorn users add fraud-resistance and quality-weighting to click data.** The `QualityNavboostCrapsCrapsData.unscaledIpPriorBadFraction` is "Used to assign a prior based on IP address. See quality/navboost/craps/craps-ip-prior.h" and `packedIpAddress` "Contains a packed string in network byte order, as expected by CrapsIpPrior. Only populated if we load the IpPrior." This means Google computes, per IP address, the fraction of clicks that are "bad" (short bounces) and uses that as a prior - clicks from IPs with historically high bad-click rates are downweighted. The `CompressedQualitySignals.crapsUnscaledIpPriorBadFraction` is the compressed version of this IP-based fraud signal, stored in the per-doc scoring bundle. The `unicornClicks` field in `CrapsClickSignals` is "The subset of clicks that are associated with an event from a Unicorn user." Unicorn is Google's internal system for identifying high-quality, trusted users (logged-in users with established search histories and verified account behavior). Clicks from Unicorn users carry more weight than clicks from anonymous or suspicious users. Patent **US8661029B1** confirms: "User type also affects weighting - different users' clicks carry different weight" and patent US10229166B1 states: "assigning lower weights to click fractions based on users who almost always select the highest ranked result lower weights than click fractions based on users who more often select results lower in the ranking." This means users who always click position 1 (position-biased users) have their clicks downweighted, while users who explore lower positions have their clicks upweighted. The Unicorn user filter and IP prior are the implementation of user-type weighting - not all clicks are equal, and Google actively filters out click fraud and position bias at the user level.

**5. Click signals feed back into site-level quality scoring and per-document prominence.** The `PerDocData.onsiteProminence` field is "Onsite prominence measures the importance of the document within its site. It is computed by propagating simulated traffic from the homepage and high craps click pages. It is a 13-bit int." This means NavBoost click data directly feeds the document's prominence score - pages that receive clicks (especially "good" clicks) propagate that authority to other pages on the same site. The `RepositoryWebrefDocumentMetadata.totalClicks` field ("The total clicks on this document, taken from navboost data") shows NavBoost click counts even flow into the entity/Knowledge Graph pipeline (Stage 6). The `CompressedQualitySignals.navDemotion` ("nav_demotion: converted from QualityBoost.nav_demoted.boost") is a demotion signal for pages with poor navigation/engagement. Patent **US10152520B1** (Ranking documents based on user behavior) ties this together: "A model is generated measuring the probability that links with particular features will be selected (clicked)" and "Link weight is determined by the model's probability measure for that link's feature set" - the click data from NavBoost trains a model that predicts which links users will click, and that model then weights links for ranking.

**6. Specialized NavBoost variants exist for images, science search, and video content.** The `ImageQualityNavboostImageQualityClickSignals` module tracks `clicks` (number) and `gveClicks` ("Good clicks that are defined using GVE (go/gve-history)") - a separate click-quality system for image search where "good clicks" are defined by Google Visual Entities history rather than dwell time. The `ResearchScienceSearchNavboostQueryInfo` module stores `query` ("The query string"), `queryCount` ("The query_count stores the counts on this query"), `queryDocCount` ("The number of long-clicks on this pair"), and `lccCount` ("lcc_count stores an estimate of the number of long clicks for this tuple") - showing that for scientific/academic search, Google tracks per-query-per-document long-click counts with special estimation methods. The `VideoContentSearchNavboostAnchorFeatures` module has `anchorText` ("The anchor text used in the generated query"), `navboostText` ("The navboost query used in the generated query"), and `source` ("How the navboost-anchor query was constructed") - revealing that for video search, NavBoost queries and anchor text are combined to generate synthetic search queries for ranking. This means video ranking is partly driven by queries that users actually searched (navboostText) combined with anchor text from linking pages. Patent **US8359309B1** confirms cross-corpus click tracking: "A measure of relative relevance between a base corpus (e.g., web pages) and a second corpus (e.g., videos) is calculated from the ratio of their respective click-through rates" and "The ranking engine increases the score of a search result referring to a document in the second corpus based on the measure of relative relevance, effectively boosting underrepresented corpus types when users click them disproportionately."

**7. The continuation patent family reveals the full scope of click-signal processing.** Patents US10229166B1, US11188544B1, US9811566B1, and US9235627B1 are all continuations of the original US8661029B1, each adding new dimensions. US10229166B1 adds "weighted-click fractions for each of multiple query-document pairs, weighted-click fractions for each of multiple query-document-language pairs, and weighted-click fractions for each of multiple query-document-language-country pairs" - showing three levels of aggregation (query-doc, query-doc-language, query-doc-language-country), which maps directly to the `QualityNavboostCrapsCrapsData` fields `query`, `country`, and `language`. US9235627B1 adds the ratio computation: "determining a first number representing a count of longer views... determining a second number representing a count of shorter views... determining a measure of relevance for the document with respect to the search query based on a ratio between the first number and the second number" and "dividing the first number by a count of total views of the document" - this is the exact formula behind `goodClicks / clicks`. US11188544B1 adds snippet-quality awareness: "users tend to click results with good snippets, or that are higher in the ranking, regardless of the real relevance of the document" - acknowledging position and snippet bias, which is why the squashing/unsquashing dual representation exists. US9811566B1 adds client-side re-ranking: "re-rank the search results returned by the search engine based on the respective measures of relevance" - showing that click signals can be applied both server-side (in the scoring bundle) and client-side (in the browser). The `QualityNavboostCrapsFeatureCrapsData` module's `voterTokenBitmap` field ("The set of voter tokens of the sessions that contributed to this feature's stats") reveals that Google tracks which specific user sessions contributed clicks to each feature slice - this is the session-level granularity that enables the per-user weighting the patents describe.

**8. Click signals interact with freshness, personalization, and intent classification.** The connected leak modules for the continuation patents include `QualityTimebasedLastSignificantUpdate`, `QualityTimebasedSyntacticDate`, `QualityOrbitAsteroidBeltDocumentIntentScores`, `QualityPreviewSnippetRadishFeatures`, `QualityRankembedMustangMustangRankEmbedInfo`, and `SmartphonePerDocData`. This reveals that NavBoost click signals are not applied in isolation - they are combined with freshness signals (how recently the content was updated), intent scores (what the user was trying to accomplish), snippet features (what the user saw before clicking), rank embeddings (neural relevance), and mobile-specific data. Patent US10229166B1's claim about "informational-quick and informational-slow" query categories shows that the expected dwell time varies by query intent - a "George Washington's Birthday" query deserves a short dwell (informational-quick), while a "Hilbert transform tutorial" query deserves a long dwell (informational-slow). The `AsteroidBeltDocumentIntentScores` module (connected to all four continuation patents) is what classifies the query intent, and the click-weighting is adjusted accordingly. This means the same dwell time can be "good" for one query type and "bad" for another - Google does not apply a universal dwell-time threshold.

**9. Co-click data and Firefly site signals extend NavBoost into site-level click aggregation.** The `QualityCitemapCoClickTargetDoc` module tracks `coClickByLocale` - co-clicks (clicks that co-occur with clicks to other pages) sliced by locale. The `QualitySitemapCoClickTargetDocCoClickByLocale` module breaks this down with `coClicks`, `coClicksCapped`, `coClicksParent`, and `locale` fields - showing Google tracks which pages users click together in the same session, grouped by locale. This co-click data reveals user journey patterns: if users who click page A also tend to click page B, those pages are semantically related in the user's mind. The `QualityCopiaFireflySiteSignal` module provides site-level click aggregation: `dailyClicks`, `dailyGoodClicks`, `impressionsInBoostedPeriod`, `firstBoostedTimeSec`, `latestBylineDateSec`, `numOfArticles8`, `numOfArticlesByPeriods` ("number of articles (lattice article score is 0.8 or more) sliced by 30 days"), `numOfUrls`, `numOfUrlsByPeriods` ("number of urls sliced by 30 days"), `recentImpForQuotaSystem`, `totalImpressions`, and `numOfGamblingPages`. This Firefly module is a site-level click and content velocity tracker - it counts daily clicks, daily good clicks, total impressions, and the number of articles published per 30-day period. The `CountryClickDistribution` module adds `total` ("To store total clicks on this page/domain") for country-level click distribution. Patent **US9031929B1** (Site quality score, referenced in Stage 3) confirms the connection: "First count: unique queries that include a reference to the particular site (brand queries); Second count: unique queries where the user clicked through to the site" - the Firefly module's `dailyClicks` and `totalImpressions` are the raw inputs to this site quality scoring.

### SEO actions

- **Win the click AND the stay.** US8661029B1: relevance = ratio of long views to total views. The leak's `goodClicks`, `badClicks`, and `lastLongestClicks` are the direct implementation. Titles that match content, fast-loading pages, and answering the query in the first screen convert clicks from "bad" to "good."
- **Optimize for locale-specific click performance.** US8694511B1: country+language-specific click data is weighted more than global data. The leak's `country`, `language`, and `device` fields in `QualityNavboostCrapsCrapsData` confirm per-locale slicing. If your content targets France, your click performance in France matters more than global CTR.
- **Ensure mobile click quality.** The `mobileSignals` field holds a separate `CrapsClickSignals` instance for mobile. US10229166B1: mobile device and location "can result in much better search results." Mobile UX directly affects NavBoost mobile signals.
- **Avoid pogo-sticking at all costs.** `badClicks` (short bounces back to SERP) directly reduce the goodClicks ratio. US9235627B1: "determining a measure of relevance for the document with respect to the search query based on a ratio between the first number [long views] and the second number [short views]." If users click and immediately return, your ratio degrades.
- **Monitor per-corpus click performance.** US8359309B1: Google tracks per-corpus CTR and boosts underrepresented corpora. The `ImageQualityNavboostImageQualityClickSignals` and `VideoContentSearchNavboostAnchorFeatures` modules show image and video clicks are tracked separately. Diversify into video and images to capture corpus-specific boosts.
- **Build content that earns "last longest clicks."** The `lastLongestClicks` field tracks clicks where the user's session ended on that document - the strongest satisfaction signal. US10229166B1: "the viewing time categories further comprise a category for a medium click and a category for a last click." Comprehensive, definitive content that fully answers the query earns these.
- **Match dwell time to query intent.** US10229166B1 distinguishes "informational-quick" from "informational-slow" queries. A quick-answer page for a factoid query is fine with short dwell; a tutorial page needs long dwell. The `AsteroidBeltDocumentIntentScores` module classifies intent, and click weighting adjusts accordingly. Do not pad content to increase dwell time if the query intent is quick-answer.
- **Maintain content freshness to preserve click-signal validity.** The continuation patents connect to `QualityTimebasedLastSignificantUpdate`. Stale content with declining click-through rates will see its NavBoost signals decay. Update important pages regularly so the `lastSignificantUpdate` timestamp stays current and click signals remain strong.
- **Monitor snippet quality - it affects click bias.** US11188544B1: "users tend to click results with good snippets, or that are higher in the ranking, regardless of the real relevance." The `QualityPreviewSnippetRadishFeatures` module (connected to the patent) tracks snippet quality. A misleading or poor snippet can inflate badClicks when users click but bounce because the content does not match the snippet promise.
- **Track co-click patterns to understand user journeys.** The `QualitySitemapCoClickTargetDoc` module tracks co-clicks by locale. Pages that co-occur in user sessions are semantically related. Internal linking that matches natural user journeys can strengthen co-click signals.
- **Monitor Firefly site-level click metrics.** The `QualityCopiaFireflySiteSignal` module tracks `dailyClicks`, `dailyGoodClicks`, `totalImpressions`, and article publication velocity (`numOfArticlesByPeriods`). Sites with declining daily good clicks or irregular publishing cadence may see NavBoost signal decay.

### Leak Attributes


**QualityNavboostCrapsCrapsClickSignals** - 9 attributes

| Attribute | Type | Description |
|---|---|---|
| `absoluteImpressions` | float() | Thus far this field is only used for host level unsquashed impressions. When compressed (e.g., in perdocdata.proto, CompressedQualitySignals), this value is represented individually and thus is generally incompatible with the other values which are compressed as click-ratios. |
| `badClicks` | float() | *(no description provided in leak)* |
| `clicks` | float() | *(no description provided in leak)* |
| `goodClicks` | float() | *(no description provided in leak)* |
| `lastLongestClicks` | float() | *(no description provided in leak)* |
| `unicornClicks` | float() | The subset of clicks that are associated with an event from a Unicorn user. |
| `unsquashedClicks` | float() | This is not being populated for the current format - instead two instances of CrapsClickSignals (squashed/unsquashed) are used. We are migrating to the new format where this field will be populated. |
| `unsquashedImpressions` | float() | This is not being populated for the current format - instead two instances of CrapsClickSignals (squashed/unsquashed) are used. We are migrating to the new format where this field will be populated. |
| `unsquashedLastLongestClicks` | float() | *(no description provided in leak)* |

**QualityNavboostCrapsCrapsData** - 16 attributes

| Attribute | Type | Description |
|---|---|---|
| `badClicks` | float() | *(no description provided in leak)* |
| `clicks` | float() | *(no description provided in leak)* |
| `country` | String.t | The two-letter uppercase country slice of the CrapsData. Examples: &quot;US&quot;, &quot;FR&quot;, &quot;BR&quot; |
| `device` | GoogleApi.ContentWarehouse.V1.Model.QualityNavboostCrapsCrapsDevice.t | The device interface and os slice of the CrapsData. |
| `features` | list(GoogleApi.ContentWarehouse.V1.Model.QualityNavboostCrapsFeatureCrapsData.t) | Contains CrapsClickSignals for specific features. (i.e. for mobile, US, metro id - 123&quot;) |
| `goodClicks` | float() | *(no description provided in leak)* |
| `language` | String.t | The language slice of the CrapsData. Examples: &quot;en&quot;, &quot;fr&quot;, &quot;pt-BR&quot;, |
| `lastLongestClicks` | float() | The number of clicks that were last and longest in related user queries. |
| `mobileSignals` | GoogleApi.ContentWarehouse.V1.Model.QualityNavboostCrapsCrapsClickSignals.t | The portion of this CrapsData aggregated on data from tier 1/2 mobile interfaces in QSessions. |
| `packedIpAddress` | String.t | Contains a packed string in network byte order, as expected by CrapsIpPrior. Only populated if we looked up the ip_prior_bad_fraction at retrieval time. |
| `sliceTag` | String.t | This field can be used by the craps pipeline to slice up signals by various attributes such as device type, country, locale etc. The slice_tag can be an arbitrary string, and the CrapsData values for each slice_tag are aggregated separately, together with the default empty slice_tag. |
| `squashed` | GoogleApi.ContentWarehouse.V1.Model.QualityNavboostCrapsCrapsClickSignals.t | Not used yet - we will probably move the impressions / clicks / good_clicks bad clicks / last longest clicks into here from top level, and rename those fields to legacy. |
| `unscaledIpPriorBadFraction` | float() | Used to assign a prior based on IP address. See quality/navboost/craps/craps-ip-prior.h. This value is prior to the linear transformation (scaling / offset / min / max) that's applied in craps-penalty.cc. |
| `mobileData` | GoogleApi.ContentWarehouse.V1.Model.QualityNavboostCrapsCrapsData.t | DO NOT USE: Use the above mobile_signals fields instead. DO NOT REMOVE: Field is present in legacy protos in golden tests. |
| `query` | String.t | *(no description provided in leak)* |
| `unsquashedMobileSignals` | GoogleApi.ContentWarehouse.V1.Model.QualityNavboostCrapsCrapsClickSignals.t | *(no description provided in leak)* |

**QualityNavboostCrapsFeatureCrapsData** - 3 attributes

| Attribute | Type | Description |
|---|---|---|
| `signals` | GoogleApi.ContentWarehouse.V1.Model.QualityNavboostCrapsCrapsClickSignals.t | CRAPS Signals for the locale. |
| `device` | String.t | Device, like &quot;m&quot;. If not present, it's an aggregation for all devices. &quot;m&quot; - mobile devices. &quot;d&quot; - destop devices. |
| `voterTokenBitmap` | GoogleApi.ContentWarehouse.V1.Model.QualityNavboostGlueVoterTokenBitmapMessage.t | The set of voter tokens of the sessions that contributed to this feature's stats. Voter tokens are not unique per user, so it is a lower bound on the number of distinct users. Used for privacy-related filtering. |

**QualityNavboostCrapsCrapsDevice** - 1 attributes

| Attribute | Type | Description |
|---|---|---|
| `uxInterface` | integer() | An enum taken from GWSLogEntryProto that indicates what type of device a request came from. This includes an entry for DESKTOP(1), MOBILE(2), and TABLET(3) devices. Reference: - gwslog(608): GWSLogEntryProto.ux_interface |

**ImageQualityNavboostImageQualityClickSignals** - 2 attributes

| Attribute | Type | Description |
|---|---|---|
| `clicks` | number() | *(no description provided in leak)* |
| `gveClicks` | number() | Good clicks that are defined using GVE (go/gve-history). |

**ResearchScienceSearchNavboostQueryInfo** - 4 attributes

| Attribute | Type | Description |
|---|---|---|
| `lccCount` | number() | lcc_count stores an estimate of the number of long clicks for this tuple. NOTE: It is similar to query_doc_count, but calculated in different manner. |
| `queryDocCount` | number() | The query_doc_count stores the number of long-clicks on this pair. |
| `query` | String.t | The query string. |
| `queryCount` | number() | The query_count stores the counts on this query. |

**VideoContentSearchNavboostAnchorFeatures** - 3 attributes

| Attribute | Type | Description |
|---|---|---|
| `anchorText` | String.t | The anchor text used in the generated query. |
| `navboostText` | String.t | The navboost query used in the generated query. |
| `source` | String.t | How the navboost-anchor query was constructed. |

**QualityCopiaFireflySiteSignal** - 5 attributes

| Attribute | Type | Description |
|---|---|---|
| `dailyClicks` | String.t | *(no description provided in leak)* |
| `dailyGoodClicks` | String.t | *(no description provided in leak)* |
| `impressionsInBoostedPeriod` | String.t | *(no description provided in leak)* |
| `firstBoostedTimeSec` | String.t | *(no description provided in leak)* |
| `latestBylineDateSec` | String.t | *(no description provided in leak)* |

**QualitySitemapCoClickTargetDoc** - 1 attributes

| Attribute | Type | Description |
|---|---|---|
| `coClickByLocale` | list(GoogleApi.ContentWarehouse.V1.Model.QualitySitemapCoClickTargetDocCoClickByLocale.t) | *(no description provided in leak)* |

**QualitySitemapCoClickTargetDocCoClickByLocale** - 4 attributes

| Attribute | Type | Description |
|---|---|---|
| `coClicks` | integer() | *(no description provided in leak)* |
| `coClicksCapped` | integer() | *(no description provided in leak)* |
| `coClicksParent` | integer() | *(no description provided in leak)* |
| `locale` | String.t | *(no description provided in leak)* |

**CountryClickDistribution** - 1 attributes

| Attribute | Type | Description |
|---|---|---|
| `total` | integer() | To store total clicks on this page/domain. |

**PerDocData** (click/navboost/engagement-related subset) - 3 attributes

| Attribute | Type | Description |
|---|---|---|
| `onsiteProminence` | integer() | Onsite prominence measures the importance of the document within its site. It is computed by propagating simulated traffic from the homepage and high craps click pages. It is a 13-bit int. |
| `isHotdoc` | boolean() | Set by the FreshDocs instant doc joiner. See //indexing/instant/hotdocs/README and |
| `queriesForWhichOfficial` | GoogleApi.ContentWarehouse.V1.Model.OfficialPagesQuerySet.t | The set of (query, country, language) triples for which this document is considered to be the official page. For example, www.britneyspears.com would be official for (&quot;britney spears&quot;, &quot;us&quot;, 0) and others (0 is English). |

**CompressedQualitySignals** (click/navboost/engagement-related subset) - 6 attributes

| Attribute | Type | Description |
|---|---|---|
| `navDemotion` | integer() | nav_demotion: converted from QualityBoost.nav_demoted.boost. |
| `crapsNewUrlSignals` | String.t | For craps |
| `crapsAbsoluteHostSignals` | integer() | Impressions, unsquashed, host level, not to be used with compressed ratios. Not to be used in Pattern Data. |
| `crapsNewHostSignals` | String.t | *(no description provided in leak)* |
| `crapsUnscaledIpPriorBadFraction` | integer() | *(no description provided in leak)* |
| `crapsNewPatternSignals` | String.t | *(no description provided in leak)* |

### Patent Analysis

The NavBoost click-signal system is backed by one of Google's largest patent families - the "implicit user feedback" series. Eight patents cover the core mechanisms: click classification by dwell time, population-level aggregation, position-bias correction, cross-corpus click-through rate comparison, and link-click probability modeling. Together, they reveal that Google's click signals are far more sophisticated than simple CTR - they involve multi-dimensional slicing, user-type weighting, temporal decay, and ML-trained click probability models.

The patent family can be divided into three groups: (1) the original implicit feedback patent US8661029B1 and its continuations (US10229166B1, US11188544B1, US9811566B1, US9235627B1) which cover click classification, dwell-time weighting, and multi-level aggregation; (2) the population-based patent US8694511B1 which covers country/language slicing with narrower-population preference; and (3) the corpus-statistics patent US8359309B1 which covers cross-corpus CTR comparison. A separate patent, US10152520B1, covers the link-click probability model that uses NavBoost data to weight links. All eight patents connect directly to the `QualityNavboostCrapsCrapsClickSignals` and `QualityNavboostCrapsCrapsData` leak modules.

##### US8661029B1 - Modifying search result ranking based on implicit user feedback

- **Core concept:** Clicks and dwell time are used as implicit user feedback to re-rank search results. Views are weighted by viewing length, classified into time categories, and combined into a relevance measure.
- **Connected leak modules:** QualityNavboostCrapsCrapsClickSignals, QualityNavboostCrapsCrapsData, CompressedQualitySignals
- **Key SEO claims:**
  - [general] Document relevance is determined by the ratio of longer views to total views
  - [general] Individual selections (clicks) are tracked within the context of the search query
  - [general] Document views are weighted based on viewing length information to produce weighted views
  - [general] Views are classified into viewing time categories (short, medium, long) with different weights
  - [general] Weighting can use continuous or discontinuous functions applied to view durations
  - [general] A viewing length differentiator adjusts weighting based on query category  -  different queries have different expected dwell times
  - [general] User type also affects weighting  -  different users' clicks carry different weight
  - [general] The rank modifier engine uses this implicit feedback to cause re-ranking of search results
- **SEO action:** Win the click and the stay: titles that match the page, pages that answer in the first screen. The leak's goodClicks, badClicks, lastLongestClicks, and unsquashedClicks fields are the direct implementation of this patent.

##### US10152520B1 - Ranking documents based on user behavior and/or feature data

- **Core concept:** Generates a ranking model from link feature data (anchor text, context, source/target document features) and user behavior data (link selection rates), then weights links based on the probability that links with particular features will be clicked.
- **Connected leak modules:** demotion, link_analysis, navboost, ranking, anchor_text, click_model
- **Key SEO claims:**
  - [general] A model is generated measuring the probability that links with particular features will be selected (clicked)
  - [general] Link features include: context words before/after the link, anchor text words, and quantity of anchor text words
  - [general] Link features also include features of source documents containing links and target documents referenced by links
  - [general] Link weight is determined by the model's probability measure for that link's feature set
  - [general] Document rank is computed from the weighted sum of all incoming links' weights
  - [general] Links with features that have high selection probability get more weight; links with low selection probability get less weight
  - [general] The model is built from aggregate user behavior data across many documents and links
- **SEO action:** Not all links are weighted equally - Google models the click probability of links based on their features (anchor text, surrounding context, source page quality). Links in prominent positions with descriptive anchor text and relevant surrounding context get more weight. Build links from pages where users are likely to click them. Avoid links in footers, sidebars, or low-visibility positions.

##### US11188544B1 - Modifying search result ranking based on implicit user feedback

- **Core concept:** The present disclosure includes systems and techniques relating to ranking search results of a search query. In general, the subject matter described in this specification can be embodied in a computer-implemented method that includes determining a measure of relevance for a document result within a context of a search query for which the document result is returned, the determining being based on (continuation patent)
- **Connected leak modules:** CompressedQualitySignals, LocalWWWInfo, LocalWWWInfoCluster, NlpSaftDocument, NlpSemanticParsingQRefAnnotation, PerDocData, QualityNavboostCrapsCrapsClickSignals, QualityNavboostCrapsCrapsData, QualityNsrNsrData, QualityOrbitAsteroidBeltDocumentIntentScores, QualityPreviewSnippetRadishFeatures, QualityRankembedMustangMustangRankEmbedInfo, QualityTimebasedLastSignificantUpdate, QualityTimebasedSyntacticDate, QualityWebanswersVideoTranscriptAnnotations, RepositoryAnnotationsGeoTopicality, SmartphonePerDocData, SnippetExtraInfo, SnippetExtraInfoSnippetCandidateInfo, VideoPerDocData
- **Key SEO claims:**
  - [relevance_scoring] receiving search results responsive to the search query, the search results including either an initial ranking of the search results from the search engine or actual information retrieval scores for the search results from the search engine;
  - [promotion_boost] For example, such inputs may increase the relevance that a system will assign to a particular result in a particular situation, thus boosting the score or other indicator of relevance for the result (and perhaps the relevance of the result in the context of a particular query).
  - [click_engagement] For example, user reactions to particular search results or search result lists may be gauged, so that results on which users often click will receive a higher ranking.
  - [freshness_temporal] Such an approach to determining relevance, generally associated with the GOOGLE® PageRank technology, is premised on the assumption that, if authors of web pages felt that another web site was relevant enough to be linked to, then web searchers would also find the site to be particularly relevant.
  - [query_understanding] Moreover, the measure of relevance can be used to modify and improve the ranking of search results generated for a given query, and the modified ranking can be presented to a user (e.g., on a display device in a web browser user interface).
  - [passage_snippet_answer] Note that users tend to click results with good snippets, or that are higher in the ranking, regardless of the real relevance of the document to the query as compared with the other results.
  - [personalization] Data can be collected on a per-query basis, and for a given query, user preferences for document results can be determined.
  - [local_geographic] For example, knowledge that a user is making a request from a mobile device, and knowledge of the location of the device, can result in much better search results for such a user.
  - [mobile_device] and a tracking component that is operable to store in the result selection logs information about search result selections made by users of the client device and selection data that comprises, for each user selection made by any user of the client device and not by other users of a search engine on a search result presented in response to a search query, data representing where in an order of presentation the respective search result was presented;
  - [video_media] Thus, rather than simply distinguishing long clicks from short clicks, a wider range of click through viewing times can be included in the assessment of result quality, where longer viewing times in the range are given more weight than shorter viewing times.
  - [voice_speech] A computer-implemented method comprising: receiving, by a client device comprising a speech input device, a search query in the form of speech input;
  - [ml_neural] Note that such categories may also be broken down into sub-categories as well, such as informational-quick and informational-slow: a person may only need a small amount of time on a page to gather the information they seek when the query is “George Washington&#39;s Birthday”, but that same user may need a good deal more time to assess a result when the query is “Hilbert transform tutorial”.
  - [mobile_device] A system comprising: a client device comprising (i) one or more computers embedded in the client device, and (ii) memory;
  - [mobile_device] wherein the client device comprises: a speech input device for receiving speech input from a user using the client device;
  - [mobile_device] an audio output device for providing auditory output from the client device;
- **SEO action:** Write titles that match content. goodClicks and lastLongestClicks are key NavBoost signals. Update content meaningfully. lastSignificantUpdate tracks magnitude of changes. Ensure NAP consistency and local relevance. Distance affects ranking.

##### US10229166B1 - Modifying search result ranking based on implicit user feedback

- **Core concept:** The present disclosure includes systems and techniques relating to ranking search results of a search query. In general, the subject matter described in this specification can be embodied in a computer-implemented method that includes determining a measure of relevance for a document result within a context of a search query for which the document result is returned, the determining being based on (continuation patent)
- **Connected leak modules:** CompressedQualitySignals, LocalWWWInfo, LocalWWWInfoCluster, NlpSemanticParsingQRefAnnotation, PerDocData, QualityNavboostCrapsCrapsClickSignals, QualityNavboostCrapsCrapsData, QualityNsrNsrData, QualityOrbitAsteroidBeltDocumentIntentScores, QualityPreviewSnippetRadishFeatures, QualityRankembedMustangMustangRankEmbedInfo, QualityTimebasedLastSignificantUpdate, QualityTimebasedSyntacticDate, QualityWebanswersVideoTranscriptAnnotations, RepositoryAnnotationsGeoTopicality, SmartphonePerDocData, SnippetExtraInfo, SnippetExtraInfoSnippetCandidateInfo, VideoPerDocData
- **Key SEO claims:**
  - [relevance_scoring] and modifying an information retrieval score in the Internet search engine for a specific document by applying one of the weighted-click fractions or a transform of the one of the weighted-click fractions to the information retrieval score for the specific document.
  - [promotion_boost] For example, such inputs may increase the relevance that a system will assign to a particular result in a particular situation, thus boosting the score or other indicator of relevance for the result (and perhaps the relevance of the result in the context of a particular query).
  - [click_engagement] determining from the log entries in the result selection log (i) weighted-click fractions for each of multiple query-document pairs, (ii) weighted-click fractions for each of multiple query-document-language pairs, and (iii) weighted-click fractions for each of multiple query-document-language-country pairs, wherein each weighted-click fraction is based on a sum of a weighted number of documents selected by the user, and each weight is based on how much time the user spent on the document;
  - [freshness_temporal] determining from the log entries in the result selection log (i) weighted-click fractions for each of multiple query-document pairs, (ii) weighted-click fractions for each of multiple query-document-language pairs, and (iii) weighted-click fractions for each of multiple query-document-language-country pairs, wherein each weighted-click fraction is based on a sum of a weighted number of documents selected by the user, and each weight is based on how much time the user spent on the document;
  - [query_understanding] Moreover, the measure of relevance can be used to modify and improve the ranking of search results generated for a given query, and the modified ranking can be presented to a user (e.g., on a display device in a web browser user interface).
  - [passage_snippet_answer] The system of claim 1 , wherein the log data also includes for each of multiple presentations of search results by the search engine: whether a document result was presented to the respective user but was not selected, respective positions of one or more selections in a search results presentation user interface, information retrieval scores of selected documents, information retrieval scores of all documents shown before a selected document, and titles and snippets shown to a user before the us
  - [personalization] Data can be collected on a per-query basis, and for a given query, user preferences for document results can be determined.
  - [local_geographic] For example, knowledge that a user is making a request from a mobile device, and knowledge of the location of the device, can result in much better search results for such a user.
  - [mobile_device] For example, knowledge that a user is making a request from a mobile device, and knowledge of the location of the device, can result in much better search results for such a user.
  - [video_media] The system of claim 1 , wherein the operations further comprise: classifying individual selections of document results into two or more viewing time categories, and assigning weights to the individual selections based on the classifying, the viewing time categories including a category for a short click and a category for a long click.
  - [ml_neural] Note that such categories may also be broken down into sub-categories as well, such as informational-quick and informational-slow: a person may only need a small amount of time on a page to gather the information they seek when the query is “George Washington&#39;s Birthday”, but that same user may need a good deal more time to assess a result when the query is “Hilbert transform tutorial”.
  - [freshness_temporal] A system comprising: one or more computers and one or more storage devices on which are stored instructions that are operable, when executed by the one or more computers, to cause the one or more computers to perform operations comprising: maintaining, in a result selection log, data regarding users&#39;
  - [click_engagement] The system of claim 1 , wherein the time the user spent on the document is measured as how much time passed between an initial click through to the document result until the user comes back to the search results presented by the search engine and selects another document result.
  - [click_engagement] The system of claim 1 , wherein the operations further comprise: assigning lower weights to click fractions based on users who almost always select the highest ranked result lower weights than click fractions based on users who more often select results lower in the ranking first in the weighted-click fractions.
  - [click_engagement] The system of claim 5 , wherein the viewing time categories further comprise a category for a medium click and a category for a last click.
- **SEO action:** Write titles that match content. goodClicks and lastLongestClicks are key NavBoost signals. Update content meaningfully. lastSignificantUpdate tracks magnitude of changes. Ensure NAP consistency and local relevance. Distance affects ranking.

##### US9811566B1 - Modifying search result ranking based on implicit user feedback

- **Core concept:** The present disclosure includes systems and techniques relating to ranking search results of a search query. In general, the subject matter described in this specification can be embodied in a computer-implemented method that includes determining a measure of relevance for a document result within a context of a search query for which the document result is returned, the determining being based on (continuation patent)
- **Connected leak modules:** CompressedQualitySignals, LocalWWWInfo, LocalWWWInfoCluster, NlpSemanticParsingQRefAnnotation, PerDocData, QualityNavboostCrapsCrapsClickSignals, QualityNavboostCrapsCrapsData, QualityNsrNsrData, QualityOrbitAsteroidBeltDocumentIntentScores, QualityPreviewSnippetRadishFeatures, QualityRankembedMustangMustangRankEmbedInfo, QualityTimebasedLastSignificantUpdate, QualityTimebasedSyntacticDate, QualityWebanswersVideoTranscriptAnnotations, RepositoryAnnotationsGeoTopicality, SmartphonePerDocData, SnippetExtraInfo, SnippetExtraInfoSnippetCandidateInfo, VideoPerDocData
- **Key SEO claims:**
  - [relevance_scoring] receive search results responsive to the search query, the search results including either an initial ranking of the search results from the search engine or actual information retrieval scores for the search results from the search engine;
  - [promotion_boost] For example, such inputs may increase the relevance that a system will assign to a particular result in a particular situation, thus boosting the score or other indicator of relevance for the result (and perhaps the relevance of the result in the context of a particular query).
  - [click_engagement] For example, user reactions to particular search results or search result lists may be gauged, so that results on which users often click will receive a higher ranking.
  - [freshness_temporal] Such an approach to determining relevance, generally associated with the GOOGLE® PageRank technology, is premised on the assumption that, if authors of web pages felt that another web site was relevant enough to be linked to, then web searchers would also find the site to be particularly relevant.
  - [query_understanding] Moreover, the measure of relevance can be used to modify and improve the ranking of search results generated for a given query, and the modified ranking can be presented to a user (e.g., on a display device in a web browser user interface).
  - [passage_snippet_answer] Note that users tend to click results with good snippets, or that are higher in the ranking, regardless of the real relevance of the document to the query as compared with the other results.
  - [personalization] Data can be collected on a per-query basis, and for a given query, user preferences for document results can be determined.
  - [local_geographic] The system of claim 2 , wherein the computers of the enterprise include personal computers that have a web browser plug-in that incorporates instructions to re-rank locally the search results returned by the search engine.
  - [mobile_device] receive search results responsive to the search query, the search results including either an initial ranking of the search results from the search engine or actual information retrieval scores for the search results from the search engine;
  - [video_media] Thus, rather than simply distinguishing long clicks from short clicks, a wider range of click through viewing times can be included in the assessment of result quality, where longer viewing times in the range are given more weight than shorter viewing times.
  - [ml_neural] Note that such categories may also be broken down into sub-categories as well, such as informational-quick and informational-slow: a person may only need a small amount of time on a page to gather the information they seek when the query is “George Washington&#39;s Birthday”, but that same user may need a good deal more time to assess a result when the query is “Hilbert transform tutorial”.
  - [mobile_device] wherein the client system comprises: result selection logs stored on memory devices of the client system;
  - [query_understanding] wherein the client system is programmed with instructions that are operable, when executed on the client system, to cause the client system to perform operations to: submit a search query to a search engine that receives search queries from the client system and from other sources of queries;
  - [relevance_scoring] compute, for each of the search results, a respective measure of relevance based on the information stored by the tracking component of the client system about search result selections made by multiple users of the client system and not by other users of the search engine;
  - [relevance_scoring] and re-rank the search results returned by the search engine based on the respective measures of relevance and provide the re-ranked search results in a response to the search query.
- **SEO action:** Write titles that match content. goodClicks and lastLongestClicks are key NavBoost signals. Update content meaningfully. lastSignificantUpdate tracks magnitude of changes. Ensure NAP consistency and local relevance. Distance affects ranking.

##### US9235627B1 - Modifying search result ranking based on implicit user feedback

- **Core concept:** The present disclosure includes systems and techniques relating to ranking search results of a search query. In general, the subject matter described in this specification can be embodied in a computer-implemented method that includes determining a measure of relevance for a document result within a context of a search query for which the document result is returned, the determining being based on (continuation patent)
- **Connected leak modules:** CompressedQualitySignals, LocalWWWInfo, LocalWWWInfoCluster, NlpSemanticParsingQRefAnnotation, PerDocData, QualityNavboostCrapsCrapsClickSignals, QualityNavboostCrapsCrapsData, QualityNsrNsrData, QualityOrbitAsteroidBeltDocumentIntentScores, QualityPreviewSnippetRadishFeatures, QualityRankembedMustangMustangRankEmbedInfo, QualityTimebasedLastSignificantUpdate, QualityTimebasedSyntacticDate, QualityWebanswersVideoTranscriptAnnotations, RepositoryAnnotationsGeoTopicality, SmartphonePerDocData, SnippetExtraInfo, SnippetExtraInfoSnippetCandidateInfo, VideoPerDocData
- **Key SEO claims:**
  - [relevance_scoring] and outputting the measure of relevance to a ranking engine for ranking of search results, including new search results referencing the document, for a new search responsive to a new submission of the search query.
  - [promotion_boost] For example, such inputs may increase the relevance that a system will assign to a particular result in a particular situation, thus boosting the score or other indicator of relevance for the result (and perhaps the relevance of the result in the context of a particular query).
  - [click_engagement] weighting document views resulting from the selections based on viewing length information to produce weighted views of the document result;
  - [freshness_temporal] Such an approach to determining relevance, generally associated with the G OOGLE ® PageRank technology, is premised on the assumption that, if authors of web pages felt that another web site was relevant enough to be linked to, then web searchers would also find the site to be particularly relevant.
  - [query_understanding] Moreover, the measure of relevance can be used to modify and improve the ranking of search results generated for a given query, and the modified ranking can be presented to a user (e.g., on a display device in a web browser user interface).
  - [passage_snippet_answer] Note that users tend to click results with good snippets, or that are higher in the ranking, regardless of the real relevance of the document to the query as compared with the other results.
  - [personalization] Data can be collected on a per-query basis, and for a given query, user preferences for document results can be determined.
  - [local_geographic] For example, knowledge that a user is making a request from a mobile device, and knowledge of the location of the device, can result in much better search results for such a user.
  - [mobile_device] and outputting the measure of relevance to a ranking engine for ranking of search results, including new search results referencing the document, for a new search responsive to a new submission of the search query.
  - [video_media] Thus, rather than simply distinguishing long clicks from short clicks, a wider range of click through viewing times can be included in the assessment of result quality, where longer viewing times in the range are given more weight than shorter viewing times.
  - [ml_neural] Note that such categories may also be broken down into sub-categories as well, such as informational-quick and informational-slow: a person may only need a small amount of time on a page to gather the information they seek when the query is “George Washington&#39;s Birthday”, but that same user may need a good deal more time to assess a result when the query is “Hilbert transform tutorial”.
  - [query_understanding] A computer-implemented method comprising: determining a first number representing a count of longer views of a document following selections of search results, where the search results reference the document in response to submissions of a search query to a search engine;
  - [query_understanding] determining a second number representing a count of shorter views of the document following the selections of the search results, where the search results reference the document in response to submissions of the search query;
  - [relevance_scoring] determining a measure of relevance for the document with respect to the search query based on a ratio between the first number and the second number;
  - [relevance_scoring] The method of claim 1 , wherein determining the measure of relevance comprises dividing the first number by a count of total views of the document.
- **SEO action:** Write titles that match content. goodClicks and lastLongestClicks are key NavBoost signals. Update content meaningfully. lastSignificantUpdate tracks magnitude of changes. Ensure NAP consistency and local relevance. Distance affects ranking.

##### US8694511B1 - Modifying search result ranking based on populations

- **Core concept:** Click data for a document is aggregated at multiple population levels (country-specific, language-specific, generic), with broader populations deemphasized relative to narrower ones, producing a quality-of-result statistic used as a ranking input.
- **Connected leak modules:** QualityNavboostCrapsCrapsClickSignals, QualityNavboostCrapsCrapsData, QualityNavboostCrapsStatsWithWeightsProto, QualityNavboostCrapsFeatureCrapsData, CompressedQualitySignals, PerDocData, IndexingDupsLocalizedLocalizedCluster
- **Key SEO claims:**
  - [general] Click data for a document represents selections weighted by viewing time (dwell time), with each selection associated with a specific country and language.
  - [general] First click data aggregates weighted selections for the same country and language; second click data aggregates weighted selections for the same language across countries.
  - [general] The second (broader, language-level) click data is deemphasized relative to the first (narrower, country+language-level) click data when the query language matches the user interface language.
  - [general] Deemphasis is applied via a smoothing factor based on the amount of first click data available - more country-specific data means more deemphasis of language-level data.
  - [general] The quality of result statistic is calculated by combining first click data with deemphasized second click data, and provided as an input to the document's ranking.
  - [general] Deemphasis also considers whether the document's language matches the user interface language.
  - [general] Click fractions are computed at both levels, and the broader-level data is deemphasized when the first click fraction is less than the second click fraction.
  - [general] A prior model estimates what the implicit feedback should be for results too infrequent or too recent to have sufficient historical click data.
- **SEO action:** Google weights country+language-specific click data more than language-wide or global click data. If your content targets a specific country, ensure your click performance is strong in that specific locale - global CTR matters less than locale-specific CTR. Dwell time weights each click, so longer visits in your target country amplify your ranking signal. The leak's NavboostCraps modules with per-country/per-language aggregation and the LocalizedCluster module confirm this population-based click weighting is live. The prior model means even new pages can get estimated quality scores.

This patent is the population-slicing foundation. The `QualityNavboostCrapsCrapsData` module's `country`, `language`, and `device` fields are the direct implementation of the patent's multi-population aggregation. The patent's "prior model" that "estimates what the implicit feedback should be for results too infrequent or too recent to have sufficient historical click data" is critical for new pages - it means even brand-new URLs get an estimated quality-of-result score based on patterns from similar URLs, which connects to the `CompressedQualitySignals.crapsNewUrlSignals` and `crapsNewPatternSignals` fields.

##### US8359309B1 - Modifying search result ranking based on corpus search statistics

- **Core concept:** Determining relative relevance of different corpora (e.g., web pages vs. videos/images) for a query by computing corpus-specific click-through rates from search log data, then using the ratio as a ranking signal to boost or demote results from particular corpus types. (continuation patent)
- **Connected leak modules:** QualityNavboostCrapsCrapsClickSignals, QualityNavboostCrapsCrapsData, QualityNavboostCrapsStatsWithWeightsProto, CompressedQualitySignals, PerDocData, VideoPerDocData, ImagePerDocData
- **Key SEO claims:**
  - [general] A measure of relative relevance between a base corpus (e.g., web pages) and a second corpus (e.g., videos) is calculated from the ratio of their respective click-through rates for a query, and this ratio is provided to the ranking engine to adjust scores for future searches of that query.
  - [general] Click-through rate for each corpus is computed as the count of selections divided by the count of presentations of search results from that corpus, aggregated across searches by users in multiple countries who employ a specific language.
  - [general] The ranking engine increases the score of a search result referring to a document in the second corpus based on the measure of relative relevance, effectively boosting underrepresented corpus types when users click them disproportionately.
  - [general] Corpus relevance statistics are derived from language-specific data and country-specific data, and the system selects which data source to use based on a determination of which will provide a reliable statistic.
  - [general] A weighted combination of language-specific and country-specific data is used to compute corpus click-through rates, with language-specific data weighted more heavily than country-specific data.
  - [general] Search fractions are computed as the number of searches for the query in a given corpus relative to the total searches in that corpus, and a weighted average of search fractions across different time periods is used as a temporal relevance signal.
  - [general] The system can avoid unnecessarily searching a corpus for new queries if statistics suggest that corpus does not provide relevant results, reducing wasted computation.
- **SEO action:** Diversify your content into multiple corpus types (video, images) because Google tracks per-corpus click-through rates and boosts results from corpora that users select disproportionately for a given query. Language and country alignment of your content matters: the system weights language-specific CTR data more than country-specific data, so ensure your content language matches the target audience's query language.

### Patent Family Summary

The eight NavBoost patents form a coherent system that maps directly onto the leaked CRAPS modules. US8661029B1 establishes the foundational click-classification framework (good/bad/last clicks based on dwell time). US10229166B1, US11188544B1, US9811566B1, and US9235627B1 are continuations that extend the framework with three-level aggregation (query-doc, query-doc-language, query-doc-language-country), snippet-bias awareness, client-side re-ranking, speech-input support, and the formal ratio formula (long views / total views). US8694511B1 adds population-level slicing with narrower-population preference and a prior model for new pages. US8359309B1 adds cross-corpus CTR comparison. US10152520B1 extends click data to link-level weighting.

The leak modules confirm every dimension these patents describe: `QualityNavboostCrapsCrapsClickSignals` implements the click classification (goodClicks, badClicks, clicks, lastLongestClicks); `QualityNavboostCrapsCrapsData` implements the population slicing (country, language, device, mobileSignals); `QualityNavboostCrapsFeatureCrapsData` implements per-feature slicing with voter token tracking; `QualityNavboostCrapsCrapsDevice` implements device classification; and `CompressedQualitySignals` carries the compressed craps signals (crapsNewUrlSignals, crapsNewHostSignals, crapsNewPatternSignals, crapsAbsoluteHostSignals, crapsUnscaledIpPriorBadFraction, navDemotion) into the serving scoring bundle. The `PerDocData.onsiteProminence` field shows click data propagating into document-level authority, and `QualityCopiaFireflySiteSignal` shows click data aggregating at the site level (dailyClicks, dailyGoodClicks, totalImpressions).

The specialized NavBoost modules extend the system beyond standard web search: `ImageQualityNavboostImageQualityClickSignals` tracks image-specific clicks with GVE-defined good clicks; `ResearchScienceSearchNavboostQueryInfo` tracks per-query-per-document long-click counts for academic search; `VideoContentSearchNavboostAnchorFeatures` combines navboost queries with anchor text for video search ranking. The `QualitySitemapCoClickTargetDoc` module tracks co-clicks (pages clicked together in the same session) sliced by locale, revealing user journey patterns. The `CountryClickDistribution` module provides country-level total click counts. Together, these modules show that NavBoost is not a single signal but a family of click-based signals tailored to each search vertical and corpus type.

---
