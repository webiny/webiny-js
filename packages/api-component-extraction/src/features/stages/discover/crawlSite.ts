import { foldHost, isSameSite, pageIdentity } from "~/domain/pageIdentity.js";
import { extractSameHostLinks } from "./extractSameHostLinks.js";
import { fetchPage } from "./fetchPage.js";
import { isPageUrl } from "./isPageUrl.js";
import { parseTitle } from "./parseTitle.js";

/** How deep to walk from the entry page. Four levels reaches every page of a 5-to-15-page site. */
const MAX_DEPTH = 4;
/** A ceiling on requests, so a site with a calendar or a deep archive cannot turn this into a spider. */
const MAX_FETCHES = 150;
/** The same ceiling on links recorded but not walked, so the resolve pass after this stays bounded. */
const MAX_SEEN = 150;
const CONCURRENCY = 6;

export interface CrawledPage {
    url: string;
    identity: string;
    status: number | null;
    ok: boolean;
    finalUrl: string | null;
    title: string | null;
    /** Levels from the entry page; the entry page itself is 0. */
    depth: number;
}

export interface CrawlResult {
    /** Every page the crawl fetched, keyed by page identity. */
    fetched: Map<string, CrawledPage>;
    /**
     * Pages the crawl saw linked but never fetched — past the depth limit or the request ceiling. They
     * are real discoveries with no status yet, so the resolve pass picks them up.
     */
    seen: Map<string, string>;
    /** The deepest level actually walked. */
    depth: number;
    /** True when a limit stopped the walk before it ran out of links: the ceiling, or the clock. */
    truncated: boolean;
}

/**
 * Walk the site from its entry page, breadth first, following same-host page links.
 *
 * The crawl runs on every job, whether or not a sitemap parsed, because it is the only source that
 * reports what the site actually links to. A sitemap says what a CMS believes it published; the crawl
 * says what a visitor can reach, and the two disagreeing is the thing worth seeing.
 *
 * Breadth first is not incidental. A page's distance from the home page is a decent proxy for how much
 * design it carries, so if the walk has to stop early it should stop having seen the whole top level.
 */
export const crawlSite = async (params: {
    entryUrl: string;
    maxDepth?: number;
    maxFetches?: number;
    /**
     * Checked between levels and between requests. The crawl is bounded by its own ceiling, but the
     * stage it runs in is bounded by a Lambda clock — and a stage that dies of a timeout reports
     * nothing at all, which is strictly worse than reporting a shallower crawl and saying so.
     */
    shouldStop?: () => boolean;
    onLevel?: (level: number, fetched: number) => Promise<void>;
}): Promise<CrawlResult> => {
    const maxDepth = params.maxDepth ?? MAX_DEPTH;
    const maxFetches = params.maxFetches ?? MAX_FETCHES;

    const fetched = new Map<string, CrawledPage>();
    const seen = new Map<string, string>();
    const entryIdentity = pageIdentity(params.entryUrl);
    if (!entryIdentity) {
        return { fetched, seen, depth: 0, truncated: false };
    }

    // Fixed for the whole walk: the one question a redirect must never be allowed to redefine.
    const siteHost = foldHost(new URL(params.entryUrl).host);

    let frontier: { url: string; identity: string }[] = [
        { url: params.entryUrl, identity: entryIdentity }
    ];
    const queued = new Set<string>([entryIdentity]);
    let depth = 0;
    let truncated = false;
    /*
     * Counted before the request rather than after it. Several workers run at once, so checking
     * `fetched.size` would let every worker in the window past a ceiling that only one of them should
     * have crossed — the ceiling would be advisory instead of a limit.
     */
    let started = 0;

    while (frontier.length > 0 && depth <= maxDepth) {
        const level = frontier;
        const next = new Map<string, string>();
        let cursor = 0;

        const worker = async (): Promise<void> => {
            while (cursor < level.length) {
                const index = cursor++;
                const target = level[index];

                if (started >= maxFetches || params.shouldStop?.()) {
                    truncated = true;
                    if (!seen.has(target.identity)) {
                        seen.set(target.identity, target.url);
                    }
                    continue;
                }
                started++;

                const response = await fetchPage(target.url);

                /*
                 * A URL that redirects off the host is an outbound link wearing a local URL — a
                 * `/github` that lands on github.com. It is not a page of this site, so it is not
                 * recorded as one and its links are not followed; doing either would put someone
                 * else's site into the run.
                 */
                if (response.finalUrl && !isSameSite(response.finalUrl, siteHost)) {
                    continue;
                }

                fetched.set(target.identity, {
                    url: target.url,
                    identity: target.identity,
                    status: response.status,
                    ok: response.ok,
                    finalUrl: response.finalUrl,
                    title: response.html ? parseTitle(response.html) : null,
                    depth
                });

                if (!response.html) {
                    continue;
                }

                // Resolve relative links against where the request landed, not where it was aimed.
                const base = response.finalUrl ?? target.url;
                for (const link of extractSameHostLinks(response.html, base, siteHost)) {
                    const identity = pageIdentity(link);
                    if (!identity || queued.has(identity) || !isPageUrl(link)) {
                        continue;
                    }
                    /*
                     * At the depth limit the links are still recorded, just not walked. They are pages
                     * the site links to, and leaving them out would make the union short by a level and
                     * report them as sitemap-only — reading as orphans when the crawl simply stopped.
                     */
                    if (depth >= maxDepth) {
                        if (seen.size < MAX_SEEN && !seen.has(identity)) {
                            seen.set(identity, link);
                        }
                        continue;
                    }
                    /*
                     * First spelling wins. A page linked as both `/x` and `/x/` is one page, and the
                     * later spelling overwriting the earlier would make which URL gets fetched depend
                     * on link order — and can send the fetch at the spelling that only redirects.
                     */
                    if (!next.has(identity)) {
                        next.set(identity, link);
                    }
                }
            }
        };

        await Promise.all(
            Array.from({ length: Math.min(CONCURRENCY, level.length) }, () => worker())
        );
        await params.onLevel?.(depth, fetched.size);

        for (const identity of next.keys()) {
            queued.add(identity);
        }
        frontier = [...next.entries()].map(([identity, url]) => ({ url, identity }));
        depth++;

        if (params.shouldStop?.()) {
            truncated = true;
            break;
        }
    }

    // Anything still queued when the walk stopped was discovered but never read.
    for (const target of frontier) {
        seen.set(target.identity, target.url);
    }

    return { fetched, seen, depth: Math.max(0, depth - 1), truncated };
};
