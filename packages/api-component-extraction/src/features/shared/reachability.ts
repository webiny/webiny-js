import { parseSitemap } from "~/features/stages/discover/sitemap.js";

/**
 * A pre-flight reachability check for the Create-job screen (W9.3): can the site be resolved, and does it
 * publish a sitemap? It reuses the Discover stage's sitemap parser so "sitemap found" here means the same
 * thing it will at crawl time. Best-effort and bounded by a timeout — a slow site reports unreachable
 * rather than hanging the request.
 *
 * One request, deliberately: unlike Discover this does not follow a sitemap index down to its children,
 * so for an index it reports how many child sitemaps were listed rather than how many pages they hold.
 * Saying "12 URLs" when those twelve are sitemaps would be the same misreading Discover now guards
 * against, so the kind is reported alongside the count and the screen labels it.
 */

const USER_AGENT = "Mozilla/5.0 (compatible; WebinyBot/1.0; +https://www.webiny.com)";
const TIMEOUT_MS = 8000;

export interface ReachabilityResult {
    /** The URL after normalising (a bare host gets an https:// scheme). */
    normalizedUrl: string;
    /** The site responded with a 2xx. */
    reachable: boolean;
    /** The HTTP status of the site response, or null if the request never completed. */
    status: number | null;
    sitemapFound: boolean;
    /** Pages for a `urlset`; child sitemaps for an `index`. Read it with `sitemapKind`. */
    sitemapUrlCount: number;
    /** What was served: a page list, an index of other sitemaps, or nothing usable. */
    sitemapKind: "urlset" | "index" | "none";
    /** A short reason when the site could not be reached; null when it was. */
    error: string | null;
}

const normalizeSiteUrl = (raw: string): string => {
    const trimmed = raw.trim();
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const fetchWithTimeout = async (url: string): Promise<Response | null> => {
    try {
        return await fetch(url, {
            headers: { "user-agent": USER_AGENT },
            redirect: "follow",
            signal: AbortSignal.timeout(TIMEOUT_MS)
        });
    } catch {
        return null;
    }
};

export const checkReachability = async (rawUrl: string): Promise<ReachabilityResult> => {
    const normalizedUrl = normalizeSiteUrl(rawUrl);
    let parsed: URL;
    try {
        parsed = new URL(normalizedUrl);
    } catch {
        return {
            normalizedUrl,
            reachable: false,
            status: null,
            sitemapFound: false,
            sitemapUrlCount: 0,
            sitemapKind: "none",
            error: "That is not a valid URL."
        };
    }

    const response = await fetchWithTimeout(parsed.toString());
    if (!response) {
        return {
            normalizedUrl,
            reachable: false,
            status: null,
            sitemapFound: false,
            sitemapUrlCount: 0,
            sitemapKind: "none",
            error: "The site could not be reached."
        };
    }

    let sitemapFound = false;
    let sitemapUrlCount = 0;
    let sitemapKind: ReachabilityResult["sitemapKind"] = "none";
    const sitemapUrl = new URL("/sitemap.xml", parsed).toString();
    const sitemapResponse = await fetchWithTimeout(sitemapUrl);
    if (sitemapResponse?.ok) {
        try {
            const body = await sitemapResponse.text();
            const sitemap = parseSitemap(body);
            if (sitemap.kind !== "not-sitemap" && sitemap.locs.length > 0) {
                sitemapFound = true;
                sitemapUrlCount = sitemap.locs.length;
                sitemapKind = sitemap.kind;
            }
        } catch {
            // A malformed sitemap is simply "not found" for the pre-flight.
        }
    }

    return {
        normalizedUrl,
        reachable: response.ok,
        status: response.status,
        sitemapFound,
        sitemapUrlCount,
        sitemapKind,
        error: response.ok ? null : `The site responded with ${response.status}.`
    };
};
