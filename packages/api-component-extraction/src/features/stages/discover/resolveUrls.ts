import { fetchPage } from "./fetchPage.js";
import { parseTitle } from "./parseTitle.js";

/** Enough bytes for `<head>`, which is all this pass reads. Servers may ignore the Range and send more. */
const HEAD_BYTES = 16384;
const CONCURRENCY = 8;

export interface ResolvedUrl {
    status: number | null;
    ok: boolean;
    finalUrl: string | null;
    title: string | null;
}

/**
 * Resolve URLs the crawl never fetched, recording the status and the title in one request each.
 *
 * This is the check that makes a sitemap trustworthy or not. A sitemap entry the crawl never reached is
 * either an orphan page — real, published, linked from nowhere — or an entry the CMS left behind after
 * the page was deleted. Resolving it is the only thing that tells those apart, and doing it here means
 * the operator sees the answer at the gate rather than discovering it as an empty capture.
 */
export const resolveUrls = async (urls: string[]): Promise<Map<string, ResolvedUrl>> => {
    const resolved = new Map<string, ResolvedUrl>();
    let cursor = 0;

    const worker = async (): Promise<void> => {
        while (cursor < urls.length) {
            const index = cursor++;
            const url = urls[index];
            const response = await fetchPage(url, { rangeBytes: HEAD_BYTES });
            resolved.set(url, {
                status: response.status,
                ok: response.ok,
                finalUrl: response.finalUrl,
                title: response.html ? parseTitle(response.html) : null
            });
        }
    };

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, () => worker()));
    return resolved;
};
