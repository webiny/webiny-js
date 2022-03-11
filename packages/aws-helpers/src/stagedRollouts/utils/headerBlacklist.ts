const blacklistedHeaders = new Set([
    // blacklisted headers
    "connection",
    "expect",
    "keep-Alive",
    "proxy-authenticate",
    "proxy-authorization",
    "proxy-connection",
    "trailer",
    "upgrade",
    "x-accel-buffering",
    "x-accel-charset",
    "x-accel-limit-rate",
    "x-accel-redirect",
    "x-cache",
    "x-forwarded-proto",
    "x-real-op",
    // readonly headers
    "content-length",
    "transfer-encoding",
    "via"
]);

const blacklistedHeadersRegex = [/^x-amz-cf-/, /^x-edge-/];

/**
 * Some headers cannot be modified with lambda edge.
 * Source: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/edge-functions-restrictions.html
 */
export function isHeaderBlacklisted(header: string) {
    header = header.toLocaleLowerCase();
    return blacklistedHeaders.has(header) || blacklistedHeadersRegex.some(r => r.test(header));
}
