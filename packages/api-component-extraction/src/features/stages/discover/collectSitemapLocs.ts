import { fetchPage } from "./fetchPage.js";
import { parseSitemap } from "./sitemap.js";

/** How many child sitemaps of an index to read. A site needing more than this is not a 5-to-15-page site. */
const MAX_CHILD_SITEMAPS = 20;

export interface CollectedSitemap {
    /** What the sitemap turned out to be, before any of its entries are judged. */
    kind: "absent" | "not-sitemap" | "urlset" | "index";
    /** Every `<loc>` read, across the sitemap and any child sitemaps. Raw: what the site claims. */
    locs: string[];
}

/**
 * Read the site's sitemap, following a sitemap index one level down.
 *
 * Following the index matters. An index's `<loc>` elements are child sitemap URLs, and a reader that
 * does not know the difference reports them as pages — they are same-host and they resolve, so every
 * downstream check passes and the run captures a handful of XML documents believing they are the site.
 */
export const collectSitemapLocs = async (entryUrl: string): Promise<CollectedSitemap> => {
    let sitemapUrl: string;
    try {
        sitemapUrl = new URL("/sitemap.xml", entryUrl).toString();
    } catch {
        return { kind: "absent", locs: [] };
    }

    const response = await fetchPage(sitemapUrl);
    if (!response.html) {
        return { kind: "absent", locs: [] };
    }

    const parsed = parseSitemap(response.html);
    if (parsed.kind === "not-sitemap") {
        return { kind: "not-sitemap", locs: [] };
    }
    if (parsed.kind === "urlset") {
        return { kind: "urlset", locs: parsed.locs };
    }

    const locs: string[] = [];
    for (const child of parsed.locs.slice(0, MAX_CHILD_SITEMAPS)) {
        const childResponse = await fetchPage(child);
        if (!childResponse.html) {
            continue;
        }
        // A child of an index should be a urlset; a nested index is not followed further.
        const childParsed = parseSitemap(childResponse.html);
        if (childParsed.kind === "urlset") {
            locs.push(...childParsed.locs);
        }
    }

    return { kind: "index", locs };
};
