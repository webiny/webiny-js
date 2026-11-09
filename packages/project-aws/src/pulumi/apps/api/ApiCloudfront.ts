import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import type { PulumiApp } from "@webiny/pulumi";
import type { PulumiAppModule } from "@webiny/pulumi";
import type { PulumiAppResource } from "@webiny/pulumi";
import { createAppModule } from "@webiny/pulumi";

import { ApiFileManager } from "./ApiFileManager.js";
import { ApiGateway } from "./ApiGateway.js";
import { ApiGraphqlStream } from "./ApiGraphqlStream.js";
import { ApiGraphqlWeb } from "./ApiGraphqlWeb.js";

export type ApiCloudfront = PulumiAppModule<typeof ApiCloudfront>;

// AWS's `Managed-CachingDisabled` cache policy. Managed policy IDs are global constants — the same
// value in every account and region — so this is hardcoded rather than resolved via
// `aws.cloudfront.getCachePolicyOutput({ name: "Managed-CachingDisabled" })` the way
// `createCloudFrontDefaultCacheBehaviorPolicies` does. The lookup would need
// `cloudfront:ListCachePolicies` on the deploy role, and that is not worth adding to every
// project's default deployment path just to avoid a constant AWS itself documents.
const MANAGED_CACHING_DISABLED_POLICY_ID = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad";

const STREAM_ORIGIN_ID = "graphql-stream-function-url";
const WEB_ORIGIN_ID = "graphql-web-function-endpoint";
const FILES_ORIGIN_ID = "fm-download-function-url";

const ALL_METHODS = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"];

/**
 * Viewer headers every API origin needs. The header lists of the web function's and the files'
 * behaviors are built from this one, so a new `X-Webiny-*` header is added in one place.
 * `forwardHeaders` and the stream policy below predate it and are left as they are, so projects that
 * turn the web function off see no change to their distribution.
 */
const API_VIEWER_HEADERS = [
    "Origin",
    "Accept",
    "Accept-Language",
    "X-Tenant",
    "X-Webiny-Sdk",
    // Narrows the debugger's capture. Without it the edge drops the header silently.
    "X-Webiny-Debug"
];

// Needed for CORS preflight: without them the origin can't build a correct 204.
const CORS_PREFLIGHT_HEADERS = ["Access-Control-Request-Method", "Access-Control-Request-Headers"];

export const ApiCloudfront = createAppModule({
    name: "ApiCloudfront",
    config(app: PulumiApp) {
        const graphqlStream = app.getModule(ApiGraphqlStream);
        const fileManager = app.getModule(ApiFileManager);
        // Present unless the project sets `<Infra.Api.WebFunction enabled={false} />`.
        const graphqlWeb = app.getModule(ApiGraphqlWeb, { optional: true });
        // Present only without the web function.
        const gateway = app.getModule(ApiGateway, { optional: true });

        const cookies = {
            forward: "whitelist",
            whitelistedNames: ["wby-id-token"]
        };

        const forwardHeaders = [
            "Origin",
            "Authorization",
            "Accept",
            "Accept-Language",
            "X-Tenant",
            "X-Webiny-Sdk",
            // Narrows the debugger's capture. Without it here the edge drops the header silently.
            "X-Webiny-Debug"
        ];

        // Lets CloudFront sign requests to the Lambda Function URL with SigV4, so the URL itself can
        // stay on AWS_IAM authorization instead of being reachable from the internet.
        const streamOac = app.addResource(aws.cloudfront.OriginAccessControl, {
            name: "api-stream-oac",
            config: {
                description: "Signs CloudFront requests to the streaming Lambda Function URL",
                originAccessControlOriginType: "lambda",
                signingBehavior: "always",
                signingProtocol: "sigv4"
            }
        });

        // The streaming behavior uses a cache policy + origin request policy instead of the legacy
        // `forwardedValues` the other behaviors use, because legacy forwarded values are deprecated
        // and this policy also has to forward the two CORS preflight headers (see below).
        //
        // It is NOT what fixed the `AccessDeniedException` that made Lambda reject every signed
        // CloudFront request — that was a missing `lambda:InvokeFunction` permission (see the two
        // permissions at the bottom of this file). Recorded because the wrong cause was assumed first.
        //
        // Do NOT replace this with a managed origin request policy. `Managed-AllViewer` forwards
        // `Host`, which breaks OAC signing against a Function URL origin.
        // `Managed-AllViewerExceptHostHeader` (used for the blue/green router in this same package)
        // fixes `Host` but still forwards `Authorization`, which OAC signing owns here — see below.
        const streamOriginRequestPolicy = app.addResource(aws.cloudfront.OriginRequestPolicy, {
            name: "api-stream-origin-request-policy",
            config: {
                comment: "Headers/cookies forwarded to the streaming Lambda Function URL origin",
                headersConfig: {
                    headerBehavior: "whitelist",
                    headers: {
                        items: [
                            "Origin",
                            "Accept",
                            "Accept-Language",
                            // Required for CORS preflight: without these the origin can't build a
                            // correct 204, so the browser blocks the real request.
                            "Access-Control-Request-Method",
                            "Access-Control-Request-Headers",
                            "X-Tenant",
                            "X-Webiny-Sdk",
                            // `Authorization` is deliberately ABSENT — OAC signing owns that header.
                            // Clients send their token in `X-Webiny-Authorization` instead.
                            "X-Webiny-Authorization"
                        ]
                    }
                },
                cookiesConfig: {
                    cookieBehavior: "whitelist",
                    cookies: { items: ["wby-id-token"] }
                },
                queryStringsConfig: { queryStringBehavior: "all" }
            }
        });

        const origins: aws.types.input.cloudfront.DistributionOrigin[] = [
            {
                // Lambda Function URL origin for streaming routes. A Function URL is a plain
                // HTTPS endpoint, hence customOriginConfig; the OAC is what makes CloudFront
                // sign the request so the URL can require AWS_IAM.
                domainName: graphqlStream.functionUrlDomain,
                originId: STREAM_ORIGIN_ID,
                originAccessControlId: streamOac.output.id,
                customOriginConfig: {
                    httpPort: 80,
                    httpsPort: 443,
                    originProtocolPolicy: "https-only",
                    originSslProtocols: ["TLSv1.2"],
                    // NOT a cap on how long a response may stream. It is an IDLE timeout,
                    // applied twice: to time-to-first-byte, and to the gap between any two
                    // subsequent packets. A stream that keeps emitting can run as long as the
                    // Lambda lives (300s here); only silence longer than this kills it.
                    //
                    // Raised from the 30s default because that is shorter than a slow model's
                    // time to first token: CloudFront would abandon the stream while the Lambda
                    // kept working. 60s is the ceiling without an AWS quota increase — a route
                    // whose quiet gaps could exceed it must emit SSE heartbeat comments
                    // (`: ping\n\n`), which clients ignore by spec, resetting the timer.
                    originReadTimeout: 60
                }
            }
        ];
        // The routes that are not GraphQL: file delivery (`/files/*`, `/private/*` and the default
        // behavior, which serves files by alias) and, without the web function, everything else.
        let filesOriginId: pulumi.Input<string>;
        let filesForwardHeaders = forwardHeaders;
        const apiBehaviors: aws.types.input.cloudfront.DistributionOrderedCacheBehavior[] = [];

        if (graphqlWeb) {
            const web = createWebRouting(app, graphqlWeb);
            origins.push(web.origin);
            apiBehaviors.push(...web.behaviors);

            const files = createFilesRouting(app, fileManager);
            origins.push(files.origin);
            filesOriginId = FILES_ORIGIN_ID;
            // An OAC signs every request to a Function URL, so `Authorization` belongs to the
            // signature. File requests authenticate with the `wby-id-token` cookie or with
            // `X-Webiny-Authorization`, which `fm-download` reads first.
            filesForwardHeaders = [...API_VIEWER_HEADERS, "X-Webiny-Authorization"];
        } else if (gateway) {
            // First, where it was before the web function existed, so projects that turn the web
            // function off see no change to the distribution.
            origins.unshift({
                domainName: gateway.stage.output.invokeUrl.apply(
                    (url: string) => new URL(url).hostname
                ),
                originPath: gateway.stage.output.invokeUrl.apply(
                    (url: string) => new URL(url).pathname
                ),
                originId: gateway.api.output.name,
                customOriginConfig: {
                    httpPort: 80,
                    httpsPort: 443,
                    originProtocolPolicy: "https-only",
                    originSslProtocols: ["TLSv1.2"]
                }
            });
            filesOriginId = gateway.api.output.name;
            for (const pathPattern of ["/cms*", "/wb/*"]) {
                apiBehaviors.push({
                    compress: true,
                    allowedMethods: ALL_METHODS,
                    cachedMethods: ["GET", "HEAD", "OPTIONS"],
                    forwardedValues: {
                        cookies: {
                            forward: "none"
                        },
                        headers: forwardHeaders,
                        queryString: true
                    },
                    pathPattern,
                    viewerProtocolPolicy: "allow-all",
                    targetOriginId: gateway.api.output.name
                });
            }
        } else {
            throw new Error("The API has neither a web function nor an API Gateway to route to.");
        }

        const distribution = app.addResource(aws.cloudfront.Distribution, {
            name: "api-cloudfront",
            config: {
                httpVersion: "http2and3",
                waitForDeployment: false,
                isIpv6Enabled: true,
                enabled: true,
                defaultCacheBehavior: {
                    compress: true,
                    allowedMethods: ALL_METHODS,
                    cachedMethods: ["GET", "HEAD", "OPTIONS"],
                    forwardedValues: {
                        cookies,
                        headers: filesForwardHeaders,
                        queryString: true
                    },
                    // MinTTL <= DefaultTTL <= MaxTTL
                    minTtl: 0,
                    defaultTtl: 0,
                    maxTtl: 86400,
                    targetOriginId: filesOriginId,
                    viewerProtocolPolicy: "allow-all"
                },
                orderedCacheBehaviors: [
                    {
                        // Streaming routes (SSE). Must come before the other behaviors so `/stream/*`
                        // never falls through to the API Gateway origin, which cannot stream.
                        //
                        // `compress: false` is load-bearing: CloudFront compression buffers small
                        // chunks, which defeats incremental delivery even though the origin streams.
                        compress: false,
                        allowedMethods: [
                            "GET",
                            "HEAD",
                            "OPTIONS",
                            "PUT",
                            "POST",
                            "PATCH",
                            "DELETE"
                        ],
                        cachedMethods: ["GET", "HEAD"],
                        // Nothing on a streaming route is cacheable. TTLs must NOT be set
                        // alongside a cache policy.
                        cachePolicyId: MANAGED_CACHING_DISABLED_POLICY_ID,
                        originRequestPolicyId: streamOriginRequestPolicy.output.id,
                        pathPattern: "/stream/*",
                        // Stricter than the other behaviors' `allow-all` on purpose: a streaming route
                        // carries an auth token in a header, so plain HTTP is never acceptable here.
                        viewerProtocolPolicy: "https-only",
                        targetOriginId: STREAM_ORIGIN_ID
                    },
                    ...apiBehaviors,
                    {
                        allowedMethods: ["HEAD", "GET", "OPTIONS"],
                        cachedMethods: ["HEAD", "GET", "OPTIONS"],
                        forwardedValues: {
                            cookies: {
                                forward: "none"
                            },
                            headers: filesForwardHeaders,
                            queryString: true
                        },
                        // MinTTL <= DefaultTTL <= MaxTTL
                        minTtl: 0,
                        defaultTtl: 0,
                        maxTtl: 2592000,
                        pathPattern: "/files/*",
                        viewerProtocolPolicy: "allow-all",
                        targetOriginId: filesOriginId
                    },
                    {
                        allowedMethods: ["HEAD", "GET", "OPTIONS"],
                        cachedMethods: ["HEAD", "GET", "OPTIONS"],
                        forwardedValues: {
                            cookies: cookies,
                            headers: filesForwardHeaders,
                            queryString: true
                        },
                        // MinTTL <= DefaultTTL <= MaxTTL
                        minTtl: 0,
                        defaultTtl: 0,
                        maxTtl: 2592000,
                        pathPattern: "/private/*",
                        viewerProtocolPolicy: "allow-all",
                        targetOriginId: filesOriginId
                    }
                ],
                origins,
                restrictions: {
                    geoRestriction: {
                        restrictionType: "none"
                    }
                },
                viewerCertificate: {
                    cloudfrontDefaultCertificate: true
                }
            },
            opts: {
                // We are ignoring changes to the "staging" property. This is because of the following.
                // With the 5.41.0 release of Webiny, we also upgraded Pulumi to v6. This introduced a change
                // with how Cloudfront distributions are deployed, where Pulumi now also controls the new
                // `staging` property.
                // If not set, Pulumi will default it to `false`. Which is fine, but, the problem is
                // that, because this property did not exist before, it will always be considered as a change
                // upon deployment.
                // We might think this is fine, but, the problem is that a change in this property causes
                // a full replacement of the Cloudfront distribution, which is not acceptable. Especially
                // if a custom domain has already been associated with the distribution. This then would
                // require the user to disassociate the domain, wait for the distribution to be replaced,
                // and then re-associate the domain. This is not a good experience.
                ignoreChanges: ["staging"]
            }
        });

        // Allows THIS distribution — and nothing else — to invoke the streaming Function URL. Created
        // after the distribution because it needs its ARN; the Function URL is useless until it exists.
        //
        // BOTH statements are required. The OAC-for-Lambda docs list `lambda:InvokeFunctionUrl` AND
        // `lambda:InvokeFunction`; with only the former, Lambda's authorizer rejects every signed
        // request from CloudFront with `AccessDeniedException` and the function is never invoked.
        app.addResource(aws.lambda.Permission, {
            name: "graphql-stream-url-cloudfront-invoke",
            config: {
                action: "lambda:InvokeFunctionUrl",
                function: graphqlStream.functions.graphqlStream.output.name,
                principal: "cloudfront.amazonaws.com",
                sourceArn: distribution.output.arn,
                functionUrlAuthType: "AWS_IAM",
                statementId: "allow-cloudfront-invoke-function-url"
            }
        });

        app.addResource(aws.lambda.Permission, {
            name: "graphql-stream-cloudfront-invoke-function",
            config: {
                action: "lambda:InvokeFunction",
                function: graphqlStream.functions.graphqlStream.output.name,
                principal: "cloudfront.amazonaws.com",
                sourceArn: distribution.output.arn,
                statementId: "allow-cloudfront-invoke-function"
            }
        });

        if (graphqlWeb) {
            allowFunctionUrlInvoke(app, {
                name: "fm-download",
                functionName: fileManager.functions.download.output.name,
                distributionArn: distribution.output.arn
            });

            // Lets THIS distribution invoke the web function endpoint. The resource is the function;
            // the statement names the endpoint.
            app.addResource(aws.lambdaweb.ResourcePolicy, {
                name: "graphql-web-cloudfront-invoke",
                config: {
                    resourceArn: graphqlWeb.fn.output.arn,
                    policy: pulumi.jsonStringify({
                        Version: "2012-10-17",
                        Statement: [
                            {
                                Effect: "Allow",
                                Principal: { Service: "cloudfront.amazonaws.com" },
                                Action: "lambda:InvokeWebFunctionEndpoint",
                                Resource: graphqlWeb.endpoint.output.arn,
                                Condition: {
                                    StringEquals: { "aws:SourceArn": distribution.output.arn }
                                }
                            }
                        ]
                    })
                }
            });
        }

        if (graphqlWeb) {
            // `<Api.Route>` routes. Their `ApiPulumi` handler runs before any resource is created,
            // so the distribution's config can still change when a route arrives.
            graphqlWeb.onRoute(routePath => {
                addWebRouteBehavior(distribution, routePath);
            });
        }

        return distribution;
    }
});

/**
 * The web function's origin and behaviors: `/graphql` and `/cms*` without caching, and `/wb/*` with
 * caching keyed on the auth headers. `<Api.Route>` paths are added to these later, by
 * `addWebRouteBehavior`.
 */
function createWebRouting(app: PulumiApp, graphqlWeb: ApiGraphqlWeb) {
    const originRequestPolicy = app.addResource(aws.cloudfront.OriginRequestPolicy, {
        name: "api-web-origin-request-policy",
        config: {
            comment: "Headers/cookies forwarded to the API web function endpoint",
            headersConfig: {
                headerBehavior: "whitelist",
                headers: {
                    // `Host` must NOT be forwarded: the endpoint answers 404 to any Host but its own.
                    // `Authorization` can't be listed in an origin request policy; with
                    // `always-amz-auth` CloudFront passes the viewer's one through on requests with a
                    // body, and clients can also use `X-Webiny-Authorization`.
                    items: [
                        ...API_VIEWER_HEADERS,
                        ...CORS_PREFLIGHT_HEADERS,
                        "X-Webiny-Authorization"
                    ]
                }
            },
            cookiesConfig: {
                cookieBehavior: "whitelist",
                cookies: { items: ["wby-id-token"] }
            },
            queryStringsConfig: { queryStringBehavior: "all" }
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

    const behaviors: aws.types.input.cloudfront.DistributionOrderedCacheBehavior[] = [];
    for (const pathPattern of ["/graphql", "/cms*"]) {
        behaviors.push({
            compress: true,
            allowedMethods: ALL_METHODS,
            cachedMethods: ["GET", "HEAD"],
            cachePolicyId: MANAGED_CACHING_DISABLED_POLICY_ID,
            originRequestPolicyId: originRequestPolicy.output.id,
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

    const origin: aws.types.input.cloudfront.DistributionOrigin = {
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

    return { origin, behaviors };
}

/**
 * `fm-download` behind its Function URL, for when there is no API Gateway. Same setup as the
 * streaming function's URL: AWS_IAM on the URL, an OAC that signs every request.
 */
function createFilesRouting(app: PulumiApp, fileManager: ApiFileManager) {
    const functionUrl = fileManager.functionUrl;
    if (!functionUrl) {
        throw new Error("`fm-download` has no Function URL to route file requests to.");
    }

    const oac = app.addResource(aws.cloudfront.OriginAccessControl, {
        name: "api-files-oac",
        config: {
            description: "Signs CloudFront requests to the fm-download Lambda Function URL",
            originAccessControlOriginType: "lambda",
            signingBehavior: "always",
            signingProtocol: "sigv4"
        }
    });

    const domainName = functionUrl.output.functionUrl.apply((url: string) => new URL(url).hostname);
    const origin: aws.types.input.cloudfront.DistributionOrigin = {
        domainName,
        originId: FILES_ORIGIN_ID,
        originAccessControlId: oac.output.id,
        customOriginConfig: {
            httpPort: 80,
            httpsPort: 443,
            originProtocolPolicy: "https-only",
            originSslProtocols: ["TLSv1.2"]
        }
    };

    return { origin };
}

interface AllowFunctionUrlInvokeParams {
    name: string;
    functionName: pulumi.Input<string>;
    distributionArn: pulumi.Input<string>;
}

/**
 * Lets the distribution call a Function URL. Both permissions are needed, as for the streaming
 * function above: with only `lambda:InvokeFunctionUrl`, Lambda rejects every signed request.
 */
function allowFunctionUrlInvoke(app: PulumiApp, params: AllowFunctionUrlInvokeParams) {
    app.addResource(aws.lambda.Permission, {
        name: `${params.name}-url-cloudfront-invoke`,
        config: {
            action: "lambda:InvokeFunctionUrl",
            function: params.functionName,
            principal: "cloudfront.amazonaws.com",
            sourceArn: params.distributionArn,
            functionUrlAuthType: "AWS_IAM",
            statementId: "allow-cloudfront-invoke-function-url"
        }
    });

    app.addResource(aws.lambda.Permission, {
        name: `${params.name}-cloudfront-invoke-function`,
        config: {
            action: "lambda:InvokeFunction",
            function: params.functionName,
            principal: "cloudfront.amazonaws.com",
            sourceArn: params.distributionArn,
            statementId: "allow-cloudfront-invoke-function"
        }
    });
}

type OrderedCacheBehavior = aws.types.input.cloudfront.DistributionOrderedCacheBehavior;

/**
 * Routes one more path to the web function. The new behavior is a copy of the `/graphql` one with a
 * different path pattern, so it gets the same policies, and it goes right before it.
 */
function addWebRouteBehavior(
    distribution: PulumiAppResource<typeof aws.cloudfront.Distribution>,
    routePath: string
): void {
    // API Gateway path parameters (`/orders/{orderId}`, `{proxy+}`) become CloudFront wildcards.
    const pathPattern = routePath.replace(/\{[^}]+\}/g, "*");

    distribution.config.orderedCacheBehaviors(current => {
        if (!Array.isArray(current)) {
            throw new Error(
                "The API distribution's ordered cache behaviors must be a plain array."
            );
        }

        const behaviors: OrderedCacheBehavior[] = current;
        const alreadyRouted = behaviors.some(behavior => behavior.pathPattern === pathPattern);
        if (alreadyRouted) {
            // Several methods on one path share a behavior; the router matches the method.
            return behaviors;
        }

        const graphqlIndex = behaviors.findIndex(behavior => {
            return behavior.targetOriginId === WEB_ORIGIN_ID && behavior.pathPattern === "/graphql";
        });
        if (graphqlIndex === -1) {
            throw new Error("The API distribution has no `/graphql` behavior on the web function.");
        }

        const routeBehavior = { ...behaviors[graphqlIndex], pathPattern };
        const result = [...behaviors];
        result.splice(graphqlIndex, 0, routeBehavior);
        return result;
    });
}
