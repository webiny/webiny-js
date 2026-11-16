import type * as aws from "@pulumi/aws";

// AWS's `Managed-CachingDisabled` cache policy. Managed policy IDs are global constants — the same
// value in every account and region — so this is hardcoded rather than resolved via
// `aws.cloudfront.getCachePolicyOutput({ name: "Managed-CachingDisabled" })` the way
// `createCloudFrontDefaultCacheBehaviorPolicies` does. The lookup would need
// `cloudfront:ListCachePolicies` on the deploy role, and that is not worth adding to every
// project's default deployment path just to avoid a constant AWS itself documents.
export const MANAGED_CACHING_DISABLED_POLICY_ID = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad";

export const STREAM_ORIGIN_ID = "graphql-stream-function-url";
export const WEB_ORIGIN_ID = "graphql-web-function-endpoint";
export const FILES_ORIGIN_ID = "fm-download-function-url";

export const ALL_METHODS = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"];

/**
 * Viewer headers every API origin needs. The header lists of the web function's and the files'
 * behaviors are built from this one, so a new `X-Webiny-*` header is added in one place.
 * `FORWARD_HEADERS` and the stream policy predate it and are left as they are, so projects that turn
 * the web function off see no change to their distribution.
 */
export const API_VIEWER_HEADERS = [
    "Origin",
    "Accept",
    "Accept-Language",
    "X-Tenant",
    "X-Webiny-Sdk",
    // Narrows the debugger's capture. Without it the edge drops the header silently.
    "X-Webiny-Debug"
];

// Needed for CORS preflight: without them the origin can't build a correct 204.
export const CORS_PREFLIGHT_HEADERS = [
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers"
];

/**
 * The headers forwarded to API Gateway, and to `fm-download` without the web function.
 */
export const FORWARD_HEADERS = [
    "Origin",
    "Authorization",
    "Accept",
    "Accept-Language",
    "X-Tenant",
    "X-Webiny-Sdk",
    // Narrows the debugger's capture. Without it here the edge drops the header silently.
    "X-Webiny-Debug"
];

export const ID_TOKEN_COOKIES = {
    forward: "whitelist",
    whitelistedNames: ["wby-id-token"]
};

export type OrderedCacheBehavior = aws.types.input.cloudfront.DistributionOrderedCacheBehavior;
export type DistributionOrigin = aws.types.input.cloudfront.DistributionOrigin;
