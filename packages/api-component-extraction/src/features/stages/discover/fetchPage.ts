/*
 * One HTTP read of a page, used by everything in Discover that touches the network — the sitemap fetch,
 * the link crawl, and the resolve check.
 *
 * Never throws: a discovery request failing is information (an unreachable URL), not a reason to fail
 * the stage. A network failure comes back as a null status so the caller can tell "the server said no"
 * from "the server said nothing".
 */

// Neutral, honest UA. TODO: source from the shared crawl-policy module once Discover's robots handling
// moves there — see the `@webiny/site-capture` README note about not copying theme extraction's robots.
const USER_AGENT = "Mozilla/5.0 (compatible; WebinyBot/1.0; +https://www.webiny.com)";
const TIMEOUT_MS = 8000;

export interface FetchedPage {
    /** The HTTP status after redirects, or null when the request never completed. */
    status: number | null;
    /** True for a 2xx. A 206 counts: a server honouring a Range header still served the page. */
    ok: boolean;
    /** Where the request landed, which differs from the URL asked for when a redirect moved it. */
    finalUrl: string | null;
    /** The body, when one was read. Null on a failed request. */
    html: string | null;
}

const FAILED: FetchedPage = { status: null, ok: false, finalUrl: null, html: null };

/**
 * Read a page. Pass `rangeBytes` to ask for only the first bytes — enough for `<head>` when the caller
 * wants a status and a title but not the links, which keeps a large sitemap's resolve pass cheap.
 * Servers are free to ignore the Range header, so the body may come back whole either way.
 */
export const fetchPage = async (
    url: string,
    options?: { rangeBytes?: number }
): Promise<FetchedPage> => {
    const headers: Record<string, string> = { "user-agent": USER_AGENT };
    if (options?.rangeBytes) {
        headers.range = `bytes=0-${options.rangeBytes - 1}`;
    }

    try {
        const response = await fetch(url, {
            headers,
            redirect: "follow",
            signal: AbortSignal.timeout(TIMEOUT_MS)
        });
        const ok = response.ok || response.status === 206;
        return {
            status: response.status,
            ok,
            finalUrl: response.url || url,
            html: ok ? await response.text() : null
        };
    } catch {
        return FAILED;
    }
};
