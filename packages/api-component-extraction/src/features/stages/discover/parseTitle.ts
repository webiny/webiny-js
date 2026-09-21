/**
 * Extract the `<title>` text from an HTML document, entity-decoded and whitespace-collapsed; null when
 * the document has none.
 *
 * Titles are not in a sitemap, so they come from the body of a page that was fetched anyway — the crawl
 * already holds the HTML of everything it walked, and the resolve pass reads the head of the rest.
 */
export const parseTitle = (html: string): string | null => {
    const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (!match) {
        return null;
    }
    const text = match[1]
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#0?39;|&apos;/gi, "'")
        .replace(/\s+/g, " ")
        .trim();
    return text || null;
};
