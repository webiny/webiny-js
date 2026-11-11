/**
 * Webhook endpoints are called from the API (Lambda). Loopback and link-local addresses point
 * at the Lambda environment itself (e.g. the Lambda Runtime API on 127.0.0.1:9001), never at a
 * real receiver, and the delivery log stores the response body: refuse them.
 *
 * During local development (`webiny watch` runs invocations on the developer's machine) a local
 * receiver is a valid target, so localhost over HTTP is allowed there.
 *
 * TODO: private ranges (10/8, 172.16/12, 192.168/16, 100.64/10, fc00::/7) are still allowed,
 *  because projects deployed in a VPC may call internal receivers. Refuse them by default with
 *  an allowlist setting for VPC receivers. Also resolve DNS at delivery time (a public hostname
 *  can point to a private address) and don't follow redirects to private addresses.
 */
const isLocalDevelopment = () => process.env.WEBINY_WATCH_LOCAL_INVOCATION === "1";

const isLocalhostName = (hostname: string) => {
    return hostname === "localhost" || hostname.endsWith(".localhost");
};

const isLoopbackOrLinkLocal = (hostname: string): boolean => {
    const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();

    if (isLocalhostName(host)) {
        return true;
    }

    // IPv6: loopback, unspecified, link-local, IPv4-mapped.
    if (host.includes(":")) {
        if (host === "::1" || host === "::") {
            return true;
        }
        if (/^fe[89ab][0-9a-f]:/.test(host)) {
            return true;
        }
        // IPv4-mapped / IPv4-translated addresses. `new URL()` normalizes them to hex
        // (e.g. "::ffff:127.0.0.1" becomes "::ffff:7f00:1"), so handle both forms.
        const dotted = host.match(/^::ffff:(?:0:)?(\d+\.\d+\.\d+\.\d+)$/);
        if (dotted) {
            return isLoopbackOrLinkLocal(dotted[1]);
        }
        const hex = host.match(/^::ffff:(?:0:)?([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
        if (hex) {
            const high = parseInt(hex[1], 16);
            const low = parseInt(hex[2], 16);
            return isLoopbackOrLinkLocal(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`);
        }
        return false;
    }

    // IPv4: 0.0.0.0/8, 127.0.0.0/8, 169.254.0.0/16.
    const ipv4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (!ipv4) {
        return false;
    }
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    return a === 0 || a === 127 || (a === 169 && b === 254);
};

export const isValidEndpointUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url);
        const isLocalTarget = isLoopbackOrLinkLocal(parsed.hostname);

        if (isLocalTarget) {
            // Only a local receiver during local development, never link-local addresses.
            return (
                isLocalDevelopment() &&
                (isLocalhostName(parsed.hostname) || parsed.hostname === "127.0.0.1")
            );
        }

        return parsed.protocol === "https:";
    } catch {
        return false;
    }
};
