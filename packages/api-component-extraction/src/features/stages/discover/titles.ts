/**
 * Best-effort page-title fetching for Discover (spec §6.1 shows each URL's title). Titles aren't in a
 * sitemap, so each URL is fetched and its <title> read. Bounded: only the capped, sampled list is fetched,
 * with a per-request timeout, a Range header to pull just the head, and limited concurrency — a slow or
 * failing page yields a null title rather than stalling the stage.
 */

const USER_AGENT = "Mozilla/5.0 (compatible; WebinyBot/1.0; +https://www.webiny.com)";
const TIMEOUT_MS = 6000;
// The <title> lives in <head>, near the top — ask for just the first bytes (servers may ignore the Range).
const HEAD_BYTES = 16384;

/** Extract the <title> text from an HTML document, entity-decoded and whitespace-collapsed; null if absent. */
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

const fetchTitle = async (url: string): Promise<string | null> => {
    try {
        const response = await fetch(url, {
            headers: { "user-agent": USER_AGENT, range: `bytes=0-${HEAD_BYTES - 1}` },
            redirect: "follow",
            signal: AbortSignal.timeout(TIMEOUT_MS)
        });
        // 200 (Range ignored) and 206 (partial) both carry usable head HTML.
        if (!response.ok && response.status !== 206) {
            return null;
        }
        return parseTitle(await response.text());
    } catch {
        return null;
    }
};

/**
 * Fetch page titles for `urls` with bounded concurrency, returning a url → title map (null when a page's
 * title could not be read). Never rejects — discovery must not fail because a page was unreachable.
 */
export const fetchTitles = async (
    urls: string[],
    concurrency = 10
): Promise<Map<string, string | null>> => {
    const titles = new Map<string, string | null>();
    let cursor = 0;
    const worker = async (): Promise<void> => {
        while (cursor < urls.length) {
            const index = cursor++;
            const url = urls[index];
            titles.set(url, await fetchTitle(url));
        }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, () => worker()));
    return titles;
};
