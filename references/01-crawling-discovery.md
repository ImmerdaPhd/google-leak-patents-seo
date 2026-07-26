# Stage 1: Crawling & Discovery

**Leak modules (13):** `TrawlerFetchReplyData`, `TrawlerFetchReplyDataFetchStats`, `TrawlerFetchReplyDataRedirects`, `TrawlerHostBucketData`, `TrawlerPolicyData`, `TrawlerSSLCertificateInfo`, `TrawlerTCPIPInfo`, `TrawlerThrottleClientData`, `CrawlerChangerateUrlChangerate`, `CrawlerChangerateUrlHistory`, `CrawlerChangerateUrlChange`, `CrawlerChangerateUrlVersion`, `IndexingCrawlerIdServingDocumentIdentifier`

**Relevant patents (7):** US7627613B1, US8037055B2, US8386459B1, US8782032B2, US9355177B2, US8458163B2, US8862569B2

### How this works

**1. The fetch itself is a rich, instrumented event - not a simple HTTP GET.** Google's crawler ("Trawler") records a `TrawlerFetchReplyData` reply for every URL it fetches, and that reply carries far more than the HTML body. The `Status` field holds "the final status at the end of the redirect chain," while `RobotsInfo` stores "extra information in robots.txt for this page (ORed together bits from trawler::RobotsInfo). e.g. nosnippet vs. noarchive vs nofollow vs noindex vs disallow." This is the literal implementation of crawl-time robots directives - the crawler reads `noindex`/`nofollow`/`noarchive` and encodes them as bitflags before the page ever reaches the indexer. The `Endpoints` field (a `TrawlerTCPIPInfo`) captures "the IP from which we fetched, as well as source IP and ports," and `TrawlerSSLCertificateInfo.ErrorMessages` "contains errors from HTTPS validation ... If ErrorMessages is empty, HTTPS validation succeeded. Otherwise, it failed." So at the very first stage, Google knows the destination IP, the SSL/TLS cipher suite (`SSLCipherSuiteName`), whether the cert validated, and whether HSTS forced an HTTP→HTTPS rewrite (`HSTSInfo`: "HSTS_STATUS_REWRITTEN if the HSTS policy was followed and url was rewritten"). Patent **US8037055B2** (sitemap-generating client) confirms that discovery is fed by "file system, access logs, pre-made URL lists, and CMS data" - i.e. sitemaps are a first-class discovery input, and the crawl reply's `PolicyData` (with labels `"spam"` or `"roboted:googlebot"`) shows the crawler can tag a fetch with policy labels at crawl time.

**2. Crawl rate is actively throttled and host-load-balanced, not a fixed schedule.** The `TrawlerHostBucketData` module is the throttle ledger. `MaxActiveConnections` is "the current hostload value (# of connections)," `MediumTermLoad` is "the actual hostload that we apply is MaxActiveConnections / MediumTermLoad - a hostload of 1.00 is normal, while over 1.0 is higher than normal load," and `IsFull` asks "Is this bucket currently full?" The `TrawlerThrottleClientData` adds `IsBandwidthThrottle` and `MaxAllowedRate` ("Max doc_requestor urls/second allowed from this client to this fetcher"). Patent **US8458163B2** (crawl-rate management) describes exactly this: "Each website has a stored current crawl rate limit that caps how fast Googlebot can crawl it ... the system compares the maximum crawl rate achieved over a defined period against the limit to determine if the limit is the bottleneck." The leak's `TotalUsedQps` ("Currently used qps") and `TotalCapacityQps` ("Total qps for this hostid") are the live numbers behind that patent comparison. When a bucket is full (`IsFull = true`), the crawler backs off - this is why slow servers get crawled less.

**3. Recrawl scheduling is driven by a statistical change-rate model, not a fixed interval.** This is the heart of Stage 1. The `CrawlerChangerateUrlChangerate` module estimates how often each URL changes. `globalBasedChangePeriod` is "our estimate (in seconds) for the average time between changes ... computed using the new prior method based on global_based_prior_period and the global_based_prior_strength." `patternBasedChangePeriod` is the same estimate "calculated based on the pattern_based_prior_period and pattern_based_prior_strength ... looked up based on the URL pattern" - meaning Google groups URLs by pattern and uses the pattern's historical change rate as a prior for unseen URLs. `averageChangeSignificance` is "the 'significance' of the average change we saw of this document (from 0 to 1). Influenced by content changes. This can be used for prioritizing the crawl (higher significance first)." Patent **US8386459B1** (scheduling a recrawl) maps directly onto these fields: "Recrawl schedule is determined by estimating a change period for each item using history of crawl information (frequency of content change)" and "Crawl period is set relative to the change period (e.g., half the change period) to ensure freshness." The leak's `changeperiod`, `confidence`, and `numIntervals` ("the number of intervals we've seen for this document") are the raw inputs to that estimation. The `CrawlerChangerateUrlChange` module records each observed change with `simhashV2` ("The simhash-v2 value"), `interval` ("The length in seconds of the change"), and `onDomainLinksCountChange` ("Whether the number of on-domain links changed") - so the "change" that triggers a recrawl is a fingerprint delta, not a byte diff.

**4. Staleness is minimized by tiering crawl intervals and weighting by user demand.** Patent **US8782032B2** (minimizing stale content) introduces crawl-scheduling tiers with "distinct associated range of web crawl intervals" and says the interval "is determined using a desired likelihood that a user will not see stale content, a user view rate (impression rate x click rate), and a document update rate." The leak supports this with `CrawlerChangerateUrlVersion.isImsNotModified` ("Whether this is an IMS response (a 304, not modified)") - when the page hasn't changed, the crawler reuses the old copy and "the crawl interval may be lengthened" (per the patent). Patent **US8862569B2** (deletion-probability scheduling) adds that "crawl history data is used to determine page status (active vs. deleted) and calculate deletion probabilities per category" and the schedule "minimizes a combined cost: cost of crawling unnecessarily + cost of showing deleted pages." The `type` field in `CrawlerChangerateUrlChangerate` ("The type of the document determined by crawl histories") is the categorical signal that feeds deletion-probability computation.

**5. Document identity and canonical selection happen at crawl time.** `IndexingCrawlerIdServingDocumentIdentifier.key` is "the primary identifier of a production document ... the same as the row-key in Alexandria, and represents a URL and its crawling context ... multiple document keys can cover the same URL (e.g. crawled with different device types)." This means a single URL can produce multiple documents (desktop vs. smartphone crawl context), and the key disambiguates them. Patent **US7627613B1** (duplicate detection at crawl time) confirms: "Newly crawled documents are fingerprinted and compared against existing documents ... Documents sharing the same content are identified as duplicates ... One document is selected as the canonical representative of the cluster." The `TrawlerFetchReplyData` redirect chain (`TrawlerFetchReplyDataRedirects` with `TargetUrl`, `RawTargetUrl`, `Type`, `HTTPResponseCode`) feeds this canonicalization - the crawler follows redirects per-hop (`HopRobotsInfo`, `HopPageNoIndexInfo`) and records the final canonical destination.

### SEO actions
- **Keep sitemaps complete, current, and junk-free.** US8037055B2 + US9355177B2 confirm sitemaps (with `lastmod`, `changefreq`, `priority`) are scheduler inputs. The `lastmod` field is read; stale sitemaps waste crawl budget.
- **Maintain a consistent update cadence on important pages.** The `patternBasedChangePeriod` is learned from your URL pattern's history - erratic updates produce a poor prior and slower recrawls. US8386459B1: crawl period ≈ half the estimated change period.
- **Return proper 410/404 for deleted content.** US8862569B2 shows deletion probabilities are computed per category; clean status codes let Google detect deletion patterns and stop wasting crawls.
- **Monitor server speed and crawl stats.** `TrawlerHostBucketData` throttles by active connections and QPS; slow responses (`ServerResponseTimeMs`, `TransferTimeMs`) lengthen intervals. US8458163B2: if the crawl-rate limit isn't the bottleneck, raising it won't help - fix server capacity.
- **Fix SSL/HSTS issues.** `TrawlerSSLCertificateInfo.ErrorMessages` non-empty = HTTPS validation failed; `HSTSInfo = HSTS_STATUS_REWRITTEN` means HTTP was upgraded to HTTPS. Broken certs are recorded in the fetch reply and surface in `CompositeDoc.badSslCertificate` downstream.

### Leak attributes relevant to Stage 1

**TrawlerFetchReplyData** - 59 attributes

| Attribute | Type | Description |
|---|---|---|
| `CrawlTimes` | GoogleApi.ContentWarehouse.V1.Model.TrawlerCrawlTimes.t | *(no description provided in leak)* |
| `ThrottleClient` | GoogleApi.ContentWarehouse.V1.Model.TrawlerThrottleClientData.t | If present, Client API will enforce the contained constraints |
| `DNSHost` | String.t | Sometimes the hostid and destination IP in the FetchReplyData are not for the hostname in the url. If that's the case DNSHost will be the host that we have used when resolving hostid and DNS. Right now there are two cases: (1) malware team provides a proxy IP:Port to us, so DNSHost will be the proxy IP; and (2) PSS team provides a reference DNS host; so DNSHost will be the reference DNS host. |
| `HostBucketData` | GoogleApi.ContentWarehouse.V1.Model.TrawlerHostBucketData.t | Data about the host bucket this request is in (if desired) Please talk with Trawler team before considering using this, since what we fill in here is subject to change. |
| `DownloadTime` | integer() | The download time for this fetch (ms). This is the RTT time between fetcher and HOPE, note it does not include time from redirects, just initial hop. If you want the sum of the DownloadTime values for all fetches in the redirect chain, then use the DownLoadTime value in the FetchStats. |
| `partialresponse` | GoogleApi.ContentWarehouse.V1.Model.TrawlerFetchReplyDataPartialResponse.t | *(no description provided in leak)* |
| `ID` | String.t | Same as the ID of the matching request (used for matching internal fetchclient data in request/reply) |
| `originalProtocolUrl` | String.t | If the input url in FetchRequest is Amazon S3 protocol or Apple Itunes protocol, we will translate it into https url and log it as https url. In the meantime we will store the original s3/itunes url in this field. Before sending back to client, the Url will be translated back to s3 and this field will be cleard. |
| `FlooEgressRegion` | String.t | If present, fetch was conducted using floonet and this is the location of floonet egress point we used. |
| `UseHtmlCompressDictionary` | boolean() | Use the special compression dictionary for uncompressing this. (trawler::kHtmlCompressionDict. Use trawler::FetchReplyUncompressor to uncompress; crawler/trawler/public/fetchreply-util.h) |
| `Events` | list(GoogleApi.ContentWarehouse.V1.Model.TrawlerEvent.t) | *(no description provided in leak)* |
| `HTTPTrailers` | list(GoogleApi.ContentWarehouse.V1.Model.TrawlerFetchReplyDataHTTPHeader.t) | The received HTTP trailers if available. |
| `webioInfo` | GoogleApi.ContentWarehouse.V1.Model.TrawlerFetchReplyDataWebIOInfo.t | *(no description provided in leak)* |
| `Endpoints` | GoogleApi.ContentWarehouse.V1.Model.TrawlerTCPIPInfo.t | ------- If fetched, the IP from which we fetched, as well as source IP and ports. It is recommended to use trawler::DestinationIP()/HasDestinationIP() accessors, which return a proper IPAddress. |
| `GeoCrawlEgressRegion` | String.t | If present, the last hop of the fetch was conducted using floonet and this is the location of floonet egress point. It is different from EgressRegion and FlooEgressREgion because it is a Trawler transparent routing configured in the geo crawl rules(go/da-geo-crawl). |
| `HSTSInfo` | String.t | Set to: o HSTS_STATUS_NONE if there was no HSTS policy match for the URL's host. o HSTS_STATUS_AVAILABLE if there was an HSTS policy, but the URL was not rewritten from HTTP to HTTPS because enable_hsts was not set in client capability config. o HSTS_STATUS_REWRITTEN if the HSTS policy was followed and url was rewritten from HTTP to HTTPS. This field only pertains to the current URL fetch and does not explain a redirect's HSTS status. However, FetchReplyData.Redirects have their own HSTSInfo. |
| `FetchPatternFp` | String.t | With the introduction of fetch pattern based hostload exceptions, one hostid may have multiple hostload buckets, each with its own hostload. In this case, FetchPatternFp will be set to identify the hostload bucket within the hostid. Note this field is only meaningful for the HostBucketData which is recorded only when the client requests to have as part of reply. However, this field is useful for certain stats gathering, so we choose to always record it if its value is available during the fetch. |
| `UrlEncoding` | integer() | Encoding info for the original url itself. Bitfield encoding; see UrlEncoding::{Set,Get}Value in webutil/urlencoding. |
| `PostData` | String.t | If the fetch uses HTTP POST, PUT, or PATCH protocol, and WantPostData is true, the POST data will be copied here. This is only for initial hop. If there are redirects, HTTP POST will be changed to GET on subsequent hops, and the PostData will be cleared. There is only one exception, if the HTTP response code to the POST request is 307 (a new code introduced in RFC7321, sec. 6.4.7), we will preserve the request method and the PostData for the next hop. |
| `TransparentRewrites` | list(String.t) | If the url got rewriten by transparent rewrites, here it is the series of rewrites it got through. The fetched one is the last |
| `HopCacheKeyForUpdate` | String.t | *(no description provided in leak)* |
| `GeoCrawlFallback` | boolean() | Whether we fallback from geo crawl to local crawl during fetch. The fallback could happen in any hops and there can be at most one fallback because once fallback happens, we will not try geo-crawl anymore. |
| `ReuseInfo` | String.t | -------- Returns trawler::ReuseInfo with status of IMS/IMF/cache query. Consider using HopReuseInfo instead, which has per-redirect hop detail. If there's URL redirection, this field stores the reuse info of the last hop. For example, if the and URL redirect chain is [URL A] --> [URL B] --> [URL C], this field stores the reuse info of [URL C]. |
| `TimestampInMS` | String.t | When this reply came back from fetcher NOTE: TimestampInMS is used for internal debugging. To see when a document was crawled, check CrawlDates. |
| `CompressedBody` | boolean() | Is the associated body compressed ? |
| `HttpResponseHeaders` | String.t | HTTP headers from the response (initial hop). Trawler does not fill this in; this is intended as a placeholder for crawls like webmirror that fill in and want to track this across redirect hops. |
| `RedirectSourceFetchId` | String.t | If this fetch was a result of a redirect, we populate the parent ID here. |
| `RobotsStatus` | GoogleApi.ContentWarehouse.V1.Model.TrawlerFetchStatus.t | Status of the robots.txt fetch. Currently, this is present if: - Certain robots error cases, such as URL_TIMEOUT-TIMEOUT_ROBOTS or URL_UNREACHABLE-UNREACHABLE_ROBOTS_ERROR. - If WantRobotsBody is set in the FetchParams. |
| `trafficType` | String.t | Traffic type of this fetch. |
| `HostId` | String.t | If known, the trawler::HostId that identifies the host (initial hop). |
| `HopRobotsInfo` | integer() | Extra information in robots.txt for this page (integer: or'ed together of type trawler::RobotsInfo) on a per-hop basis (initial hop) |
| `TotalFetchedSize` | String.t | How many raw bytes we read from the connection to the server when we fetched the page. Includes everything: HTTP headers, overhead for HTTP chunked encoding, whatever compressed/uncompressed form (i.e. gzip/deflate accept-encoding) the content was sent in, etc. This is NOT the same as the size of the uncompressed FetchReply::Body - if the webserver used gzip encoding, this value might be much smaller, since it only counts the compressed wire size. To illustrate, think of 3 sizes: 1) TotalFetched |
| `GeoCrawlLocationAttempted` | String.t | Set only when GeoCrawlFallback is true. Logs the geo crawl location we attempted but failed for this request. |
| `HttpVersion` | String.t | Stores the HTTP version we used in the final hop. |
| `HopCacheKeyForLookup` | String.t | Returns the cache key used when doing cache lookup/update, on a per-hop basis (initial hop) Note this field will not be set if cache lookup/update is disabled/skipped. |
| `EgressRegion` | String.t | If present, the edge region that we have used. |
| `RobotsInfo` | integer() | Extra information in robots.txt for this page (ORed together bits from trawler::RobotsInfo). e.g. nosnippet vs. noarchive vs nofollow vs noindex vs disallow Consider using HopRobotsInfo instead, which has per-redirect hop detail. |
| `HopReuseInfo` | String.t | Returns trawler::ReuseInfo with status of IMS/IMF/cache query, on a per-hop basis (initial hop) For example, if the URL redirect chain is [URL A] --> [URL B] --> [URL C], this field stores the reuse info of [URL A]. |
| `RequestorIPAddressPacked` | String.t | Machine that sent Trawler this request, for logging. An IPAddress object, packed as a string. |
| `redirects` | list(GoogleApi.ContentWarehouse.V1.Model.TrawlerFetchReplyDataRedirects.t) | *(no description provided in leak)* |
| `ProtocolVersionFallback` | boolean() | Whether we fallback from HTTP/2 to HTTP/1.1 during fetch. The fallback could happen in any hops and there can be at most one fallback because once fallback happens, we will not try HTTP/2 anymore. |
| `BadSSLCertificate` | String.t | This field, if non-empty, contains the SSL certificate chain from the server. The filed should be serialized SSLCertificateInfo protobuf, although it used to be text format. Hence, one should ideally use trawler::CertificateUtil to check this field and understand in more detail. This field is populated in two cases: (1) something is wrong with the server certificate and we cannot verify the server's identity. In this case the URL most likely won't display in a browser; (2) if you turned on WantS |
| `ClientServiceInfo` | GoogleApi.ContentWarehouse.V1.Model.TrawlerClientServiceInfo.t | Some client specific data that's set by client in the FetchRequest, and we just copy it here verbatim. This is similar to ClientInfo that we copy from FetchRequest to FetchReply, but this is copied to FetchReplyData, thus stored in trawler logs so can be useful for debugging cases. |
| `deliveryReport` | GoogleApi.ContentWarehouse.V1.Model.TrawlerFetchReplyDataDeliveryReport.t | Transfer operation detailed report. |
| `Url` | String.t | The original url in the request we are answering. Even though &quot;optional,&quot; url must be filled in on all well-formed replies. Trawler guarantees that it is filled in, and basically every client expects it (CHECKs in some cases). -> Not filling this field in is a bug, if you share this data with other crawls/pipelines. You should expect everybody else to require a url. |
| `ThrownAwayBytes` | String.t | Sometimes we throw away content because we cannot store it in the internal buffers. These is how many bytes we have thrown away for this factor. |
| `HttpRequestHeaders` | String.t | The HTTP headers we sent to fetch this URL (initial hop). Not normally filled in, unless FetchParams.WantSentHeaders is set. |
| `LastUrlStatus` | GoogleApi.ContentWarehouse.V1.Model.TrawlerFetchStatus.t | Crawl status of the last url on chain |
| `protocolresponse` | GoogleApi.ContentWarehouse.V1.Model.TrawlerFetchReplyDataProtocolResponse.t | *(no description provided in leak)* |
| `EligibleGeoCrawlEgressRegion` | String.t | If present, it means this host might be eligible for geo crawl. However, this does not mean we enable geo-crawl for this request. Check &quot;GeoCrawlEgressRegion&quot; instead to see if this fetch is conducted via geo crawl. |
| `Status` | GoogleApi.ContentWarehouse.V1.Model.TrawlerFetchStatus.t | Status of the fetch - refers to the final status at the end of the redirect chain. |
| `RequestorID` | String.t | RequestorId is the same on as in the request that triggers this reply -- mainly for diagnostics purpose |
| `TrawlerPrivate` | GoogleApi.ContentWarehouse.V1.Model.TrawlerTrawlerPrivateFetchReplyData.t | For logging only; not present in the actual fetcher response |
| `crawldates` | GoogleApi.ContentWarehouse.V1.Model.TrawlerFetchReplyDataCrawlDates.t | *(no description provided in leak)* |
| `PolicyData` | list(GoogleApi.ContentWarehouse.V1.Model.TrawlerPolicyData.t) | Trawler can optionally add a policy label to a FetchReply. Some uses: - &quot;spam&quot; label via trawler_site_info - &quot;roboted:googlebot&quot; label as a signal to crawls supporting multiple useragents that it's not safe to share the fetch replies with googlebot crawls. |
| `HttpProtocol` | String.t | The http protocol we send to fetch this URL. This will only be set if the request is using http |
| `PredictedDownloadTimeMs` | integer() | This is available only if a fetch results in TIMEOUT_WEB, and we were able to predict, based on content length and bandwidth we were using, how much time (in ms) would be needed to download the entire content. |
| `fetchstats` | GoogleApi.ContentWarehouse.V1.Model.TrawlerFetchReplyDataFetchStats.t | *(no description provided in leak)* |
| `RobotsTxt` | String.t | The robots.txt we used for this URL (initial hop). Not normally filled in unless WantRobotsBody is set. This is mostly for debugging purposes and should not be used for large volumes of traffic. |

**TrawlerFetchReplyDataFetchStats** - 9 attributes

| Attribute | Type | Description |
|---|---|---|
| `BotOverheadMS` | integer() | Overhead spent RPCing with the Bot/proxy. |
| `ClientControlflowStats` | GoogleApi.ContentWarehouse.V1.Model.TrawlerFetchReplyDataFetchStatsClientStateStats.t | *(no description provided in leak)* |
| `ConnectTimeMs` | integer() | Report only with first request on connection, so that we keep track of the connect time with a host. Sometimes a connection is initiated by a prior request that times out before the connection is established. Another request can get scheduled on a connection that is already in the process of being established but has no request scheduled onto it. We want to keep track of the entire connect time even if a request didn't need to wait for the entire connection establishment time. Sometimes a connec |
| `ControlflowStats` | GoogleApi.ContentWarehouse.V1.Model.TrawlerFetchReplyDataFetchStatsStateStats.t | *(no description provided in leak)* |
| `DownLoadTime` | integer() | DownLoadTime = Share of connect time + ServerResponseTimeMs + TransferTimeMs (see below) in ms |
| `EdgeEgressOverheadMs` | integer() | Overhead spent routing the request from HOPE to edge egress nodes, which open connection to webservers. This is only set for edge fetches (e.g., through Floonet egress nodes). |
| `SSLConnectTimeMs` | integer() | ConnectTimeMs includes TCP connect time + SSL time, whereas SSLConnectTimeMs includes only the latter. |
| `ServerResponseTimeMs` | integer() | Time between the request send and the receipt of the first fragment of the response. For HTTP responses the first fragment is the first fragment of the response payload (the headers are ignored). |
| `TransferTimeMs` | integer() | Time to receive the entire response payload starting the clock on receiving the first fragment. |

**TrawlerFetchReplyDataRedirects** - 18 attributes

| Attribute | Type | Description |
|---|---|---|
| `BadSSLCertificate` | String.t | The server SSL certificate chain in SSLCertificateInfo protobuf format. See this field in FetchReplyData (i.e., the initial hop) for more description on when it will be populated. |
| `CrawlTimes` | GoogleApi.ContentWarehouse.V1.Model.TrawlerCrawlTimes.t | Per redirect hop timestamps. This |
| `DownloadTime` | integer() | Download time of this fetch (ms) |
| `Endpoints` | GoogleApi.ContentWarehouse.V1.Model.TrawlerTCPIPInfo.t | ## stats If fetched, ip info. |
| `HSTSInfo` | String.t | This specifies if the url in a redirect was rewritten to HTTPS because of an HSTS policy for the domain. See comments on FetchReplyData.HSTSInfo for how this field's values. A redirect that was rewritten with HSTS will have HSTS_STATUS_REWRITTEN ## here. |
| `HTTPResponseCode` | integer() | The HTTP response code for this hop. We need this since multiple response codes may have the same redirect type (e.g., 302 and 307 are both REDIRECT_TEMPORARILY), but clients may want to know which one was received. Note this is set only for the hops that are followed (i.e., TargetUrl is present). If the last redirect hop was not followed the fetch status will be URL_NOT_FOLLOWED, and the response code will be in the top level ProtocolResponse field. |
| `HopPageNoIndexInfo` | integer() | Extra trawler::PageNoIndexInfo for this hop. Integer: ORed together bits from trawler::PageNoIndexInfo. The information specified by this field comes from the http header or content of the source url, not the &quot;TargetUrl&quot; in this Redirects group. |
| `HopReuseInfo` | String.t | trawler::ReuseInfo with status of IMS/IMF/cache query, for this hop. |
| `HopRobotsInfo` | integer() | Extra trawler::RobotsInfo for this hop. Integer: ORed together bits from trawler::RobotsInfo |
| `HostId` | String.t | If known, the hostid for this hop |
| `HttpRequestHeaders` | String.t | The http headers we sent for fetching this redirect hop. Not normally filled in, unless FetchParams.WantSentHeaders is set. |
| `HttpResponseHeaders` | String.t | The http headers we received from this redirect hop. Trawler does not fill this in; this is intended as a placeholder for crawls like webmirror that fill in and want to track this across redirect hops. |
| `RawTargetUrl` | String.t | bytes: can contain bad encoding. |
| `RefreshTime` | integer() | Refresh time in meta redirect tag |
| `RobotsTxt` | String.t | The robots.txt we used for this fetch. Not normally filled in unless WantRobotsBody is set. |
| `SourceBody` | GoogleApi.ContentWarehouse.V1.Model.TrawlerFetchBodyData.t | For meta-redirects, this field may contain the body of the source document. Currently only filled client side and not implemented (yet) for server-side redirects. |
| `TargetUrl` | String.t | Difference between the following two fields: TargetUrl is set when we have followed the redirect target, and the url is canonicalized. RawTargetUrl is set in either of the following two cases: (1) The url has not be been followed. For example, the redirect is intended to be handled by the client. In the fetch reply response, you will see the url's status as URL_NOT_FOLLOWED-NOT_FOLLOWED |
| `Type` | String.t | URL and redirect type |

**TrawlerHostBucketData** - 12 attributes

| Attribute | Type | Description |
|---|---|---|
| `ClientTrafficFraction` | number() | How much existing traffic |
| `ClientWeightFraction` | number() | belong to the client How much weight the client |
| `CurrentActiveConnections` | integer() | How many connections are actively used for downloading ? |
| `IsFull` | boolean() | Is this bucket currently full ? |
| `LastScheduleIntervalMs` | String.t | How many ms ago we last scheduled a url |
| `MaxActiveConnections` | number() | The current hostload value (# of connections) - if negative does not apply |
| `MediumTermLoad` | number() | The load the recent times (the actual hostload that we apply is MaxActiveConnections / MediumTermLoad) - a hostload of 1.00 is normal, while over 1.0 is higher than normal load |
| `MinInterRequestSecs` | number() | The min delay between requests (in secs) - if negative does not apply |
| `NonFullIntervalMs` | String.t | If is full, when is becoming non-full (in ms) |
| `TotalCapacityQps` | number() | The following four fields attempt to make things simpler for clients to estimate available capacity. They are not populated yet as of 2013/08/21. Even after they are populated, they may change. So talk to trawler-dev@ before you use the fields. Total qps for this hostid |
| `TotalUsedQps` | number() | Currently used qps |
| `urllist` | list(GoogleApi.ContentWarehouse.V1.Model.TrawlerHostBucketDataUrlList.t) | *(no description provided in leak)* |

**TrawlerPolicyData** - 2 attributes

| Attribute | Type | Description |
|---|---|---|
| `ExtraData` | integer() | in roboted case, the RobotsInfo |
| `Label` | String.t | &quot;spam&quot; or &quot;roboted:googlebot&quot; |

**TrawlerSSLCertificateInfo** - 10 attributes

| Attribute | Type | Description |
|---|---|---|
| `ALPNNegotiatedProtocol` | String.t | ALPN negotiated protocol, see |
| `CertificateChain` | list(String.t) | If present, this consists of the remote webserver's X.509 certificate chain in DER format. The chain stored here is the |
| `ErrorMessages` | list(String.t) | ErrorMessages contains errors from HTTPS validation. Examples of such errors include invalid certificates, failure to build a certificate chain, certificates that do not match the expected hostname, and internal errors. If ErrorMessages is empty, HTTPS validation succeeded. Otherwise, it failed. This is the only guarantee about the contents of this field, though legacy code exists that embeds invalid assumptions, b/70904498. New code should not do anything with this field other than test whether |
| `IsTruncated` | boolean() | This SSLCertificateInfo had its fields truncated because it was too large. It is no longer set (cl/205356251) but may be true in old records. |
| `OCSPResponse` | String.t | Stapled OCSP response obtained during the TLS handshake, if any. An OCSP (Online Certificate Status Protocol) response is an indication, signed by the issuing CA, that the certificate has not been revoked. A TLS handshake extension allows servers to &quot;staple&quot; a response to the certificate served in the handshake, saving the need for the client to fetch it itself from the CA. This field contain the stapled OCSP response if the server served one. See RFC6066, Section 8 for the data format |
| `SCTList` | String.t | SCTList obtained during the TLS handshake, if any. See RFC6962, Section 3.3 for the data format: |
| `SSLCipherSuite` | integer() | *(no description provided in leak)* |
| `SSLCipherSuiteName` | String.t | *(no description provided in leak)* |
| `SSLProtocolVersion` | integer() | Details about the SSL/TLS protocol and cipher. See RFC5246 and google3/crawler/trawler/hope/proto/ssl.proto for more details. |
| `SSLProtocolVersionName` | String.t | The names of the SSL protocol version and cipher suite. These strings are implementation defined and may be subject to change. |

**TrawlerTCPIPInfo** - 4 attributes

| Attribute | Type | Description |
|---|---|---|
| `DestinationIPAddressPacked` | String.t | Address of the destination host. Extract with trawler::DestinationIP() or decode with PackedStringToIPAddress(). |
| `DestinationPort` | integer() | *(no description provided in leak)* |
| `SourceIPAddressPacked` | String.t | Source address of the crawl machine we originated the fetch from. Extract with trawler::SourceIP() or decode with PackedStringToIPAddress(). |
| `SourcePort` | integer() | *(no description provided in leak)* |

**TrawlerThrottleClientData** - 2 attributes

| Attribute | Type | Description |
|---|---|---|
| `IsBandwidthThrottle` | boolean() | *(no description provided in leak)* |
| `MaxAllowedRate` | number() | Max doc_requestor urls/second allowed from this client to this fetcher. |

**CrawlerChangerateUrlChangerate** - 21 attributes

| Attribute | Type | Description |
|---|---|---|
| `approximatedPosterior` | GoogleApi.ContentWarehouse.V1.Model.CrawlerChangerateMultipleComponentDistribution.t | The approximated posterior distribution. |
| `averageChangeSignificance` | float() | The &quot;significance&quot; of the average change we saw of this document (from 0 to 1). Influenced by content changes. This can be used for prioritizing the crawl (higher significance first). |
| `changeperiod` | integer() | //////////////////////////////////////////////////////////////////////////// The classic changerate estimation. //////////////////////////////////////////////////////////////////////////// The classic estimate of change period (in seconds). It is computed by inserted a &quot;fake&quot; change and no-change interval as a prior distribution. This field is generally not used and should NOT be accessed directly. See above for correct method for determining the change period estimate. |
| `confidence` | float() | The confidence (between 0 and 1) in the changeperiod guess. |
| `globalBasedChangePeriod` | integer() | //////////////////////////////////////////////////////////////////////////// The changerate estimation based on the global prior. //////////////////////////////////////////////////////////////////////////// The global-based changeperiod. This is our estimate (in seconds) for the average time between changes. It is computed using the new prior method based on global_based_prior_period and the global_based_prior_strength specified below. This is used for computing pattern priors. Use pattern_based |
| `globalBasedChangePeriodConfidence` | float() | The 'confidence' of the global-based changeperiod. This is the n-th root of the posterior evaluated at MAP point, where n is the number of history intervals. For now, it is hard to interpret the meaning of the absolute values of 'average' posterior cross different sets of data. |
| `globalBasedPriorPeriod` | float() | The 2 parameters below specify the prior employed in calculating the global_based_change_period. These values are precomputed through an offline analysis and specified via flags. |
| `globalBasedPriorStrength` | float() | *(no description provided in leak)* |
| `lastChangeSignificance` | float() | The &quot;significance&quot; of the last change we saw of this document (from 0 to 1). Influenced by content changes, etc. This can be used for prioritizing the crawl (higher significance first). |
| `lastChanged` | integer() | The last time (unix timestamp) we saw a changed copy of the document. Provided iff we have seen the page change. |
| `lastFetched` | integer() | The last time (unix timestamp) we saw a fetched copy of the document. |
| `numIntervals` | integer() | The number of intervals we've seen for this document (where an interval is two different versions). |
| `patternBasedChangePeriod` | integer() | //////////////////////////////////////////////////////////////////////////// The changerate estimation based on the pattern prior. //////////////////////////////////////////////////////////////////////////// The pattern-based changeperiod. This is our estimate (in seconds) for the average time between changes. It is calculated based on the pattern_based_prior_period and pattern_based_prior_strength below. This quantity will eventually replace the old changeperiod calculation. |
| `patternBasedChangePeriodConfidence` | float() | The same as global_based_change_period_confidence, except it is computed using pattern based priors. |
| `patternBasedLowerChangePeriod` | integer() | The lower edge of a confidence interval for the pattern-based change period. |
| `patternBasedPriorPeriod` | float() | The 2 parameters below specify the prior employed in calculating the pattern_based_change_period. These values are calculated in a separate process and looked up based on the URL pattern. |
| `patternBasedPriorStrength` | float() | *(no description provided in leak)* |
| `patternChangePeriodVersion` | integer() | The version number of the algorithm, refer to ChangePeriodVersion for more information. |
| `type` | integer() | //////////////////////////////////////////////////////////////////////////// Basic information of a document. //////////////////////////////////////////////////////////////////////////// The type of the document determined by crawl histories, refer to TYPE for more information. |
| `ugcChangePeriod` | integer() | //////////////////////////////////////////////////////////////////////////// The UGC changerate estimation. //////////////////////////////////////////////////////////////////////////// Information on change period generated from user generated content (UGC) change history. |
| `ugcChangePeriodConfidence` | float() | *(no description provided in leak)* |

**CrawlerChangerateUrlHistory** - 3 attributes

| Attribute | Type | Description |
|---|---|---|
| `change` | list(GoogleApi.ContentWarehouse.V1.Model.CrawlerChangerateUrlChange.t) | All the changes we've seen for this URL. |
| `latestVersion` | GoogleApi.ContentWarehouse.V1.Model.CrawlerChangerateUrlVersion.t | The latest version we've seen. |
| `url` | String.t | This field in only set in 'url_history' column of Union repository to avoid having to read CompositeDocs. |

**CrawlerChangerateUrlChange** - 12 attributes

| Attribute | Type | Description |
|---|---|---|
| `additionalChangesMerged` | integer() | Duplicate UrlChanges crawled within a specified time range will be merged together. UrlChanges are considered duplicates if the simhash, simhash_is_trusted, simhash_v2, simhash_v2_is_trusted, and shingle_simhash are the same. additional_changes_merged indiciates the number of duplicate UrlChanges merged into this UrlChange. |
| `fractionalTileChange` | float() | Deprecated fields. The fraction of tiles (0 to 1) that changed. |
| `interval` | integer() | The length in seconds of the change. |
| `offDomainLinksChange` | boolean() | Whether the content of the off-domain links changed. |
| `offDomainLinksCount` | integer() | The new count of off-domain links, if they changed. |
| `onDomainLinksCount` | integer() | The new count of on-domain links, if the count changed. |
| `onDomainLinksCountChange` | boolean() | Whether the number of on-domain links changed. |
| `shingleSimhash` | GoogleApi.ContentWarehouse.V1.Model.IndexingConverterShingleFingerprint.t | The old simhash value obtained from shingles. |
| `simhash` | String.t | The simhash-v1 value. Use of simhash-v1 is deprecated, and newer UrlChange should only contain simhash-v2. During this transition period, UrlChange can contain either simhash or simhash_v2. It is possible that previous UrlChange only contain simhash-v1 and the next UrlChange only contain simhash-v2. In this case, we skip that interval in our changerate computation. [go/changerate-simhash-v2-migration] |
| `simhashIsTrusted` | boolean() | Whether the simhash-v1 should be trusted. |
| `simhashV2` | String.t | The simhash-v2 value. |
| `simhashV2IsTrusted` | boolean() | Whether the simhash-v2 value should be trusted. |

**CrawlerChangerateUrlVersion** - 10 attributes

| Attribute | Type | Description |
|---|---|---|
| `additionalChangesMerged` | integer() | Same as the field in UrlChange. This allows us to merge identical UrlVersions into a single UrlVersion. |
| `contentType` | integer() | The content type of the page. |
| `isImsNotModified` | boolean() | Whether this is an IMS response (a 304, not modified). |
| `lastModified` | integer() | The date from the LastModified header, if present. |
| `shingleSimhash` | GoogleApi.ContentWarehouse.V1.Model.IndexingConverterShingleFingerprint.t | The simhash value obtained from shingles. |
| `simhash` | String.t | The simhash-v1 value. The simhash-v1 is now deprecated and new UrlVersions should only populate simhash-v2. During migration phase from using simhash-v1 to simhash-v2, it is possible that previous UrlChange only contain simhash-v1 and the next UrlChange / UrlVersion could only contain simhash-v2. In this case, we skip that interval in our changerate computation. [go/changerate-simhash-v2-migration] |
| `simhashIsTrusted` | boolean() | Whether the simhash-v1 should be trusted. |
| `simhashV2` | String.t | The simhash-v2 value. |
| `simhashV2IsTrusted` | boolean() | Whether the simhash-v2 value should be trusted. |
| `timestamp` | integer() | The timestamp we crawled the page. |

**IndexingCrawlerIdServingDocumentIdentifier** - 3 attributes

| Attribute | Type | Description |
|---|---|---|
| `doubleIndexingExperimentId` | String.t | Only for double indexing experiments. This field is set for duplicated documents so that docjoin users will not see duplicated docs. |
| `dupExperimentId` | String.t | Only for Experimental clusters, not relevant for production serving data: Index-Dups can run experiments in Quality Clusters where different versions of the same document (e.g. with different signals) are serving in parallel. They are uniquely identified by the dup-experiment-IDs. This is for experimental clusters only. In prod-versions the member will not be set. |
| `key` | String.t | The primary identifier of a production document is the document key, which is the same as the row-key in Alexandria, and represents a URL and its crawling context. The document key is the unique identifier for each document, but multiple document keys can cover the same URL (e.g. crawled with different device types). In your production code, please always assume that the document key is the only way to uniquely identify a document. Link for more background information: |

### Patents relevant to Stage 1

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

##### US8037055B2 - Sitemap generating client for web crawler

- **Core concept:** A client-side sitemap generator that discovers URLs from file systems, access logs, and content management systems to produce sitemaps for crawlers, improving crawl coverage and efficiency.
- **Connected leak modules:** `PerDocData`, `QualityNsrNsrData`
- **SEO claims:**
  - The sitemap client accesses multiple sources: file system, access logs, pre-made URL lists, and CMS data
  - Document information is extracted from these sources and used to generate sitemaps
  - Sitemaps include URLs and metadata about documents available on a website
  - The system improves discovery-based crawling by providing comprehensive URL lists
  - Sitemaps help crawlers find URLs that might not be discoverable through link following
  - Access logs reveal URLs that receive traffic but may not be well-linked internally
- **SEO action:** Keep sitemaps complete, current, and free of junk URLs. They are crawler input, not decoration. The leak's hostAge and domainAge fields confirm crawl discovery timing feeds into trust signals.

##### US8386459B1 - Scheduling a recrawl

- **Core concept:** Estimates a change period for each URL based on crawl history, sets a crawl period relative to the change period, and adjusts crawl scheduling using importance rank (PageRank) plus hint lists to prioritize recrawling of important and frequently-changing pages.
- **Connected leak modules:** `crawler`, `freshness`, `pagerank`, `indexing`, `scheduling`
- **SEO claims:**
  - Recrawl schedule is determined by estimating a change period for each item using history of crawl information (frequency of content change)
  - Crawl period is set relative to the change period (e.g., half the change period) to ensure freshness
  - Adjustment criteria combines an importance rank for an item (based on PageRank) with a list of hints that provide crawl periods for items matching specific patterns
  - Crawl periods are 'bucketized' into groups such as daily, weekly, monthly, and yearly
  - More overdue items are recrawled before less overdue items when sorting the schedule
  - Hints allow overriding crawl periods for items containing specific information, ensuring critical content is crawled more frequently
- **SEO action:** Ensure your most important pages have high PageRank/internal authority so they get crawled more frequently. Use sitemap lastmod dates and changefreq hints to signal crawl priority. Maintain consistent update cadences so the crawler's estimated change period matches your actual content refresh rate.

##### US8782032B2 - Minimizing visibility of stale content in web searching including revising web crawl intervals of documents

- **Core concept:** Assigns documents to crawl-scheduling tiers with distinct crawl interval ranges, dynamically revises crawl intervals by comparing document instances (fingerprints), and uses user view rates and document update rates to minimize stale content visibility.
- **Connected leak modules:** `crawler`, `freshness`, `navboost`, `indexing`, `scheduling`, `tiered_index`
- **SEO claims:**
  - Documents are assigned to crawl-scheduling tiers, each tier having a distinct associated range of web crawl intervals
  - Crawl interval is dynamically revised by comparing document fingerprints before and after crawl to detect changes
  - Changes are classified as critical or non-critical, with critical changes triggering reindexing and potentially shorter intervals
  - Crawl interval is determined using a desired likelihood that a user will not see stale content, a user view rate (impression rate x click rate), and a document update rate
  - When a document has not changed, the document is reused (not re-indexed) and the crawl interval may be lengthened
  - Documents can be reassigned between tiers when their revised crawl interval falls outside the current tier's range
  - User click rate can be calculated using number of redirects to the document from another application
- **SEO action:** Pages that change frequently and get clicked often will be crawled more frequently. Update critical content regularly to trigger 'critical change' detection. Low-traffic, static pages will have their crawl intervals lengthened, so prioritize updates on your most-viewed pages. Monitor CTR in Search Console as it directly influences crawl frequency.

##### US9355177B2 - Web crawler scheduler that utilizes sitemaps from websites

- **Core concept:** Uses sitemap information (including lastmod, changefreq, and priority fields) to schedule document crawling, updating sitemap data by checking sitemap index last change dates and downloading fresh sitemaps.
- **Connected leak modules:** `crawler`, `scheduling`, `indexing`, `sitemap`
- **SEO claims:**
  - Sitemap information includes URLs with associated last modification date, change frequency, and priority values
  - Scheduling documents for crawling can use or be independent of a document's change frequency field
  - Scheduling documents for crawling can use or be independent of a document's priority field
  - Sitemaps can be generated using access logs, pre-made URL lists, and content management system data
  - Sitemap index includes site-specific information such as crawl intervals, crawl rate, and geographic location
  - Sitemaps can be in XML, plain-text, CSV, or semicolon-separated formats
  - URLs from access logs are filtered (error URLs separated from non-error URLs) before generating sitemaps
- **SEO action:** Submit comprehensive XML sitemaps with accurate lastmod dates. The priority and changefreq tags are read but may or may not influence scheduling. Ensure sitemap indexes have accurate lastmod dates so Google knows when to re-download them. Filter out error URLs from sitemaps.

##### US8458163B2 - System and method for enabling website owner to manage crawl rate in a website indexing system

- **Core concept:** Provides website owners a crawl rate control mechanism that compares maximum actual crawl rate against a crawl rate limit, informs owners when the limit is the bottleneck, and allows owners to adjust the limit.
- **Connected leak modules:** `crawler`, `scheduling`, `search_console`
- **SEO claims:**
  - Each website has a stored current crawl rate limit that caps how fast Googlebot can crawl it
  - The system compares the maximum crawl rate achieved over a defined period against the limit to determine if the limit is the bottleneck
  - When the crawl rate limit is NOT the limiting factor, the owner is informed that requesting a faster rate may not change actual crawl speed
  - Owners can decrease the crawl rate limit at any time
  - Resource usage statistics from prior crawl visits are provided to owners (documents accessed, bytes downloaded, average access time)
  - Recommendations for selecting new crawl rate limits are based on whether the current limit is actually the limiting factor
- **SEO action:** In Google Search Console, check if your crawl rate limit is the actual bottleneck before requesting changes. If Google is crawling below the limit, increasing the limit won't help - focus on improving page speed and server capacity instead. Use the Crawl Stats report to monitor bytes downloaded and access times.

##### US8862569B2 - Method and techniques for determining crawling schedule

- **Core concept:** Calculates re-crawl schedules by predicting the probability that web pages will be deleted, optimizing the tradeoff between the cost of unnecessary crawling and the cost of showing deleted pages to users.
- **Connected leak modules:** `crawler`, `scheduling`, `freshness`, `indexing`, `quality`
- **SEO claims:**
  - Crawl history data is used to determine page status (active vs. deleted) and calculate deletion probabilities per category
  - Re-crawl schedule minimizes a combined cost: cost of crawling unnecessarily (p1 weight) + cost of showing deleted pages (p2 weight)
  - Deletion probabilities are calculated per category and per time period, then aggregated for the website
  - Crawl score formula: p1*|T| + p2 * sum(P(c,i) * F(T,i)), where P is deletion probability and F is a time function
  - The optimal re-crawl schedule selects the set of time periods with the minimum crawl score
  - Pages in categories with higher deletion rates are crawled more frequently to avoid showing stale/deleted content
- **SEO action:** For classified ads, product listings, or other expiring content, ensure pages return proper 410 Gone or 404 status when content is deleted so Google can detect deletion patterns. Categories with high turnover need more frequent crawling - maintain accurate sitemap updates for these sections. Remove expired content promptly to avoid Google's 'deleted page penalty' in crawl scheduling.

---
