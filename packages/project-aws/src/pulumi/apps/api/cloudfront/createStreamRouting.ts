import * as aws from "@pulumi/aws";
import type { PulumiApp } from "@webiny/pulumi";
import type { ApiGraphqlStream } from "../ApiGraphqlStream.js";
import type { DistributionOrigin, OrderedCacheBehavior } from "./constants.js";
import { MANAGED_CACHING_DISABLED_POLICY_ID, STREAM_ORIGIN_ID } from "./constants.js";

/**
 * The streaming function's origin (its Function URL) and the `/stream/*` behavior.
 */
export function createStreamRouting(app: PulumiApp, graphqlStream: ApiGraphqlStream) {
    // Lets CloudFront sign requests to the Lambda Function URL with SigV4, so the URL itself can
    // stay on AWS_IAM authorization instead of being reachable from the internet.
    const oac = app.addResource(aws.cloudfront.OriginAccessControl, {
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
    // CloudFront request — that was a missing `lambda:InvokeFunction` permission (see
    // `allowFunctionUrlInvoke`). Recorded because the wrong cause was assumed first.
    //
    // Do NOT replace this with a managed origin request policy. `Managed-AllViewer` forwards
    // `Host`, which breaks OAC signing against a Function URL origin.
    // `Managed-AllViewerExceptHostHeader` (used for the blue/green router in this same package)
    // fixes `Host` but still forwards `Authorization`, which OAC signing owns here — see below.
    const originRequestPolicy = app.addResource(aws.cloudfront.OriginRequestPolicy, {
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

    const origin: DistributionOrigin = {
        // Lambda Function URL origin for streaming routes. A Function URL is a plain
        // HTTPS endpoint, hence customOriginConfig; the OAC is what makes CloudFront
        // sign the request so the URL can require AWS_IAM.
        domainName: graphqlStream.functionUrlDomain,
        originId: STREAM_ORIGIN_ID,
        originAccessControlId: oac.output.id,
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
    };

    const behavior: OrderedCacheBehavior = {
        // Streaming routes (SSE). Must come before the other behaviors so `/stream/*`
        // never falls through to the API Gateway origin, which cannot stream.
        //
        // `compress: false` is load-bearing: CloudFront compression buffers small
        // chunks, which defeats incremental delivery even though the origin streams.
        compress: false,
        allowedMethods: ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
        cachedMethods: ["GET", "HEAD"],
        // Nothing on a streaming route is cacheable. TTLs must NOT be set
        // alongside a cache policy.
        cachePolicyId: MANAGED_CACHING_DISABLED_POLICY_ID,
        originRequestPolicyId: originRequestPolicy.output.id,
        pathPattern: "/stream/*",
        // Stricter than the other behaviors' `allow-all` on purpose: a streaming route
        // carries an auth token in a header, so plain HTTP is never acceptable here.
        viewerProtocolPolicy: "https-only",
        targetOriginId: STREAM_ORIGIN_ID
    };

    return { origin, behavior };
}
