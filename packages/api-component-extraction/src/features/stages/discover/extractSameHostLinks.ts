import { foldHost } from "~/domain/pageIdentity.js";

/**
 * Same-host page links from an HTML body, resolved to absolute URLs.
 *
 * Deliberately a lightweight regex rather than a DOM parse: this runs on raw HTML only to find the next
 * URLs to walk, and a full parse buys nothing that walking the returned links would not.
 *
 * Same host, not same origin: a site that links to itself over both http and https, or mixes `www.`
 * with the bare domain, is still one site, and treating those as different would cut the crawl short at
 * the first such link.
 *
 * `siteHost` is separate from `baseUrl` on purpose, and the separation is load-bearing. Relative links
 * have to resolve against where the response actually came from, which after a redirect is not where
 * the request was aimed — but "is this the same site?" must always be asked of the site being crawled.
 * Measuring it against the base instead means one outbound redirect hands the crawl a new definition of
 * "same host" and it walks off onto somebody else's site.
 */
export const extractSameHostLinks = (html: string, baseUrl: string, siteHost: string): string[] => {
    const host = foldHost(siteHost);

    const links = new Set<string>();
    const regex = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
        try {
            const resolved = new URL(match[1], baseUrl);
            if (foldHost(resolved.host) !== host) {
                continue;
            }
            if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
                continue;
            }
            resolved.hash = "";
            links.add(resolved.toString());
        } catch {
            // A malformed href is skipped rather than failing the crawl.
        }
    }
    return [...links];
};
