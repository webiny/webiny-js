import * as aws from "@pulumi/aws";
import type { PulumiApp } from "@webiny/pulumi";
import type { ApiGraphqlWeb } from "../ApiGraphqlWeb.js";
import type { DistributionOrigin, OrderedCacheBehavior } from "./constants.js";
import {
    ALL_METHODS,
    API_VIEWER_HEADERS,
    CORS_PREFLIGHT_HEADERS,
    WEB_ORIGIN_ID
} from "./constants.js";

/**
 * The web function's origin and behaviors: `/graphql` and `/cms*` without caching, and `/wb/*` with
 * caching keyed on the auth headers. `<Api.Route>` paths are added to these later, by
 * `addWebRouteBehavior`, with `routeCachePolicyId`.
 */
export function createWebRouting(app: PulumiApp, graphqlWeb: ApiGraphqlWeb) {
    // For `/graphql` and `/cms*`. These routes are not meant to be cached: this policy exists only so
    // that `Authorization` reaches the web function on GET and HEAD requests. CloudFront strips
    // `Authorization` from GET and HEAD unless it is part of the cache key, and an origin request
    // policy is not allowed to forward it, so the cache key is the only place it can go. POST and the other methods keep `Authorization`
    // with or without this policy.
    //
    // The managed CachingDisabled policy can't have a cache key: a policy whose TTLs are all 0 takes
    // none. So this one has a 1 second max TTL, the smallest that allows a key, and a default of 0, and
    // nothing is cached unless the API sends `Cache-Control`.
    //
    // Every header the API reads is in the key, so even that one second is only ever shared by
    // identical requests: same tenant, same token in either header, same cookie, same query string.
    // Keys are also what gets forwarded, so there is no separate origin request policy to keep in
    // step. That is ten headers, the most a cache policy takes. `Host` is not among them: the endpoint
    // answers 404 to any Host but its own.
    const credentialsCacheKey: aws.types.input.cloudfront.CachePolicyParametersInCacheKeyAndForwardedToOrigin =
        {
            enableAcceptEncodingGzip: true,
            enableAcceptEncodingBrotli: true,
            headersConfig: {
                headerBehavior: "whitelist",
                headers: {
                    items: [
                        ...API_VIEWER_HEADERS,
                        ...CORS_PREFLIGHT_HEADERS,
                        "Authorization",
                        "X-Webiny-Authorization"
                    ]
                }
            },
            cookiesConfig: {
                cookieBehavior: "whitelist",
                cookies: { items: ["wby-id-token"] }
            },
            queryStringsConfig: { queryStringBehavior: "all" }
        };
    const uncachedPolicy = app.addResource(aws.cloudfront.CachePolicy, {
        name: "api-web-uncached-policy",
        config: {
            comment: "API web function routes: not cached, keyed on the caller's credentials",
            minTtl: 0,
            defaultTtl: 0,
            maxTtl: 1,
            parametersInCacheKeyAndForwardedToOrigin: credentialsCacheKey
        }
    });

    // For `<Api.Route>` paths. Same cache key as above, so `Authorization` still reaches the web
    // function on GET, and the same default of 0, so a route is cached only when its handler sends
    // `Cache-Control`. The max is a year, so a route that serves public data can be cached at the
    // edge as long as it says; `/graphql` and `/cms*` stay capped at one second whatever a response
    // says. Nothing invalidates route paths on its own: a route cached for long needs an invalidation
    // (`CdnCache` in `@webiny/api-core`) when what it serves changes.
    const routeCachePolicy = app.addResource(aws.cloudfront.CachePolicy, {
        name: "api-web-route-cache-policy",
        config: {
            comment: "Api.Route paths on the API web function: cached only when the route says so",
            minTtl: 0,
            defaultTtl: 0,
            maxTtl: 31536000,
            parametersInCacheKeyAndForwardedToOrigin: credentialsCacheKey
        }
    });

    // `/wb/*` is cached, as it was behind API Gateway: `InvalidateRedirectsCache` invalidates
    // `/wb/redirects` after a change. The website builder SDK calls `GET /wb/redirects` with an
    // `Authorization` header, and CloudFront only passes that header on a GET when it is part of the
    // cache key, so it is. Same headers, TTLs and no cookies as the old behavior; cookies stay out so
    // a response authorized by one visitor's cookie is never cached for another. That is ten headers,
    // the most a cache policy takes.
    const wbCachePolicy = app.addResource(aws.cloudfront.CachePolicy, {
        name: "api-web-wb-cache-policy",
        config: {
            comment: "Website builder routes on the API web function, keyed on the auth headers",
            minTtl: 0,
            defaultTtl: 86400,
            maxTtl: 31536000,
            parametersInCacheKeyAndForwardedToOrigin: {
                enableAcceptEncodingGzip: true,
                enableAcceptEncodingBrotli: true,
                headersConfig: {
                    headerBehavior: "whitelist",
                    headers: {
                        items: [
                            ...API_VIEWER_HEADERS,
                            ...CORS_PREFLIGHT_HEADERS,
                            "Authorization",
                            "X-Webiny-Authorization"
                        ]
                    }
                },
                cookiesConfig: { cookieBehavior: "none" },
                queryStringsConfig: { queryStringBehavior: "all" }
            }
        }
    });

    const oac = app.addResource(aws.cloudfront.OriginAccessControl, {
        name: "api-web-oac",
        config: {
            description: "Signs CloudFront requests to the API web function endpoint",
            originAccessControlOriginType: "lambda",
            // The only value web functions accept.
            signingBehavior: "always-amz-auth",
            signingProtocol: "sigv4"
        }
    });

    const behaviors: OrderedCacheBehavior[] = [];
    for (const pathPattern of ["/graphql", "/cms*"]) {
        behaviors.push({
            compress: true,
            allowedMethods: ALL_METHODS,
            cachedMethods: ["GET", "HEAD"],
            cachePolicyId: uncachedPolicy.output.id,
            pathPattern,
            viewerProtocolPolicy: "allow-all",
            targetOriginId: WEB_ORIGIN_ID
        });
    }
    behaviors.push({
        compress: true,
        allowedMethods: ALL_METHODS,
        cachedMethods: ["GET", "HEAD", "OPTIONS"],
        cachePolicyId: wbCachePolicy.output.id,
        pathPattern: "/wb/*",
        viewerProtocolPolicy: "allow-all",
        targetOriginId: WEB_ORIGIN_ID
    });

    const origin: DistributionOrigin = {
        domainName: graphqlWeb.endpoint.output.domainName,
        originId: WEB_ORIGIN_ID,
        originAccessControlId: oac.output.id,
        customOriginConfig: {
            httpPort: 80,
            httpsPort: 443,
            originProtocolPolicy: "https-only",
            originSslProtocols: ["TLSv1.2"],
            originReadTimeout: 60
        }
    };

    return { origin, behaviors, routeCachePolicyId: routeCachePolicy.output.id };
}
