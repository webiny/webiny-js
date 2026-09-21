import { foldHost, pageIdentity } from "~/domain/pageIdentity.js";
import { isPageUrl } from "./isPageUrl.js";

/** The most sitemap entries to carry forward. A larger sitemap is truncated rather than resolved whole. */
const MAX_ENTRIES = 300;

export interface ValidatedSitemap {
    /** Surviving entries, one per page identity, in the order the sitemap listed them. */
    entries: { identity: string; url: string }[];
    /** Entries dropped for pointing at another host. */
    offHost: number;
    /** Entries dropped for not addressing a page — a nested sitemap, a PDF, an image. */
    nonPage: number;
    /** Entries that were duplicate spellings of a page already listed. */
    duplicate: number;
    /** True when the sitemap was longer than this stage will carry. */
    truncated: boolean;
}

/**
 * Judge what a sitemap claims, before anything trusts it: drop entries on another host, drop entries
 * that do not address a page, and fold the rest to one entry per page.
 *
 * Host comparison folds `www.`, so a sitemap listing `www.example.com` for a job given `example.com` is
 * not thrown away wholesale — that would read as a broken sitemap when the sitemap is fine.
 */
export const validateSitemapLocs = (locs: string[], entryUrl: string): ValidatedSitemap => {
    let host: string;
    try {
        host = foldHost(new URL(entryUrl).host);
    } catch {
        return { entries: [], offHost: 0, nonPage: locs.length, duplicate: 0, truncated: false };
    }

    const entries: { identity: string; url: string }[] = [];
    const seen = new Set<string>();
    let offHost = 0;
    let nonPage = 0;
    let duplicate = 0;

    for (const loc of locs) {
        let parsed: URL;
        try {
            parsed = new URL(loc, entryUrl);
        } catch {
            nonPage++;
            continue;
        }

        if (foldHost(parsed.host) !== host) {
            offHost++;
            continue;
        }

        const identity = pageIdentity(parsed.toString());
        if (!identity || !isPageUrl(parsed.toString())) {
            nonPage++;
            continue;
        }

        if (seen.has(identity)) {
            duplicate++;
            continue;
        }

        seen.add(identity);
        entries.push({ identity, url: parsed.toString() });
    }

    return {
        entries: entries.slice(0, MAX_ENTRIES),
        offHost,
        nonPage,
        duplicate,
        truncated: entries.length > MAX_ENTRIES
    };
};
