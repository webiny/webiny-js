/** Extract `<loc>` URLs from a sitemap.xml (or sitemap-index) body. Tolerant of namespaces/whitespace. */
export const parseSitemapUrls = (xml: string): string[] => {
    const urls: string[] = [];
    const regex = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(xml)) !== null) {
        urls.push(match[1].trim());
    }
    return urls;
};

/**
 * Same-origin links from an HTML body, resolved to absolute URLs with the fragment stripped.
 *
 * Deliberately a lightweight regex, not a DOM parse: this runs on the entry page's raw HTML only to
 * seed discovery, and a full parse buys nothing a crawl of the returned URLs would not.
 */
export const extractSameOriginLinks = (html: string, baseUrl: string): string[] => {
    let origin: string;
    try {
        origin = new URL(baseUrl).origin;
    } catch {
        return [];
    }

    const links = new Set<string>();
    const regex = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
        try {
            const resolved = new URL(match[1], baseUrl);
            if (resolved.origin === origin) {
                resolved.hash = "";
                links.add(resolved.toString());
            }
        } catch {
            // A malformed href is skipped rather than failing the crawl.
        }
    }
    return [...links];
};
