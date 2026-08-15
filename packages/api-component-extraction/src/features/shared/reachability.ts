import { parseSitemapUrls } from "~/features/stages/discover/sitemap.js";

/**
 * A pre-flight reachability check for the Create-job screen (W9.3): can the site be resolved, and does it
 * publish a sitemap? It reuses the Discover stage's sitemap parser so "sitemap found" here means the same
 * thing it will at crawl time. Best-effort and bounded by a timeout — a slow site reports unreachable
 * rather than hanging the request.
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
    sitemapUrlCount: number;
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
            error: "The site could not be reached."
        };
    }

    let sitemapFound = false;
    let sitemapUrlCount = 0;
    const sitemapResponse = await fetchWithTimeout(new URL("/sitemap.xml", parsed).toString());
    if (sitemapResponse?.ok) {
        try {
            const urls = parseSitemapUrls(await sitemapResponse.text());
            if (urls.length > 0) {
                sitemapFound = true;
                sitemapUrlCount = urls.length;
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
        error: response.ok ? null : `The site responded with ${response.status}.`
    };
};
