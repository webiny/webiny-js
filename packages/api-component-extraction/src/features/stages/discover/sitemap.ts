/** What a sitemap body turned out to be, and the `<loc>` URLs it carries. */
export interface ParsedSitemap {
    /**
     * `urlset` — a page list. `index` — a list of other sitemaps, whose locs are sitemaps and not
     * pages. `not-sitemap` — the body is not a sitemap at all, which is what a site serving an HTML
     * error page with a 200 status looks like.
     */
    kind: "urlset" | "index" | "not-sitemap";
    locs: string[];
}

/**
 * Parse a sitemap body: what kind it is, and the `<loc>` URLs in it. Tolerant of namespaces and
 * whitespace, and deliberately not a full XML parse — a sitemap is a flat list of `<loc>` elements.
 *
 * Telling a `urlset` from an `index` matters: an index's locs are child sitemap URLs, and reading them
 * as pages is one of the ways a bad sitemap produces a run that looks like it worked.
 */
export const parseSitemap = (xml: string): ParsedSitemap => {
    const locs: string[] = [];
    const regex = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(xml)) !== null) {
        locs.push(match[1].trim());
    }

    if (/<sitemapindex[\s>]/i.test(xml)) {
        return { kind: "index", locs };
    }
    if (/<urlset[\s>]/i.test(xml)) {
        return { kind: "urlset", locs };
    }
    return { kind: "not-sitemap", locs: [] };
};
