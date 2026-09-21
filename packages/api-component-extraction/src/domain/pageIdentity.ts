/*
 * Page identity — the URL reduced to what actually addresses a page.
 *
 * The folding rules are deliberately the same ones the page-composition rewriting pass applies when it
 * decides whether a link points at a migrated page: an index file addresses its directory, a page
 * extension is not part of the address, a trailing slash is not a distinct page, and a query string or
 * fragment cannot survive migration at all because a Website Builder page path carries neither.
 *
 * Discover and rewriting have to agree on which URLs are one page. If they disagree, a page captured
 * under two spellings becomes two captured pages that later collide on a single Website Builder path,
 * and one of them silently wins.
 */

/** An index file addresses its directory: `/about/index.html` and `/about/` are one page. */
const INDEX_FILE = /\/index\.(html?|php|aspx?)$/i;

/** A page extension is not part of the address: `/pricing.html` and `/pricing` are one page. */
const PAGE_EXTENSION = /\.(html?|php|aspx?)$/i;

/**
 * `www.` is not a different site.
 *
 * A sitemap listing `www.example.com` URLs for a job given `example.com` is common enough that treating
 * the two as different hosts would drop the entire sitemap as off-host and look like the sitemap was
 * broken — the exact misreading this hardening is meant to prevent.
 */
export const foldHost = (host: string): string => host.toLowerCase().replace(/^www\./, "");

/**
 * Is this URL on the site being crawled?
 *
 * One definition, used by both the crawl and the resolve check. They ask it about different things — a
 * link to follow, and where a request landed — but if they answered it differently, one of them would
 * let another site into the run.
 */
export const isSameSite = (url: string | null, siteHost: string): boolean => {
    if (!url) {
        return false;
    }
    try {
        return foldHost(new URL(url).host) === foldHost(siteHost);
    } catch {
        return false;
    }
};

/**
 * The identity of the page a URL addresses: folded host plus folded path, with no scheme, query or
 * fragment.
 *
 * Returns null when the URL is not a page reference at all — unparseable, or a scheme such as `mailto:`
 * that addresses no page. The scheme is left out on purpose: `http://x.com/a` and `https://x.com/a` are
 * one page, and a site with mixed-protocol links would otherwise be captured twice.
 */
export const pageIdentity = (url: string, base?: string): string | null => {
    let parsed: URL;
    try {
        parsed = base ? new URL(url, base) : new URL(url);
    } catch {
        return null;
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return null;
    }

    /*
     * Lower-cased to match the rewriting pass, which slugifies every segment to build the page path —
     * so `/Pricing` and `/pricing` migrate to one path whether or not we call them one page here.
     */
    const path =
        parsed.pathname
            .replace(INDEX_FILE, "/")
            .replace(PAGE_EXTENSION, "")
            .replace(/\/+$/, "")
            .toLowerCase() || "/";

    return `${foldHost(parsed.host)}${path}`;
};
