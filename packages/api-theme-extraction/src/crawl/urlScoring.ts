/**
 * Choosing which pages to look at — see the design brief, section 10.4.
 *
 * Five pages, depth one: the entry URL plus the top four scored same-origin links found in its nav
 * and footer. The budget is deliberately small — extraction runs inside a Lambda with a wall clock,
 * and a sixth page rarely changes the palette.
 *
 * All of this is pure so the selection is reproducible: the same page yields the same crawl list,
 * which is what makes a failed run cheap to re-run and a surprising result possible to debug.
 */

/** Paths that are structurally uninteresting for a theme, or actively harmful to sample. */
const PENALISED_SEGMENTS = [
    "login",
    "signin",
    "sign-in",
    "register",
    "signup",
    "sign-up",
    "cart",
    "basket",
    "checkout",
    "account",
    "profile",
    "privacy",
    "terms",
    "legal",
    "cookie",
    "cookies",
    "search",
    "logout"
];

/**
 * Segments that suggest real content laid out with the site's actual typography and spacing, rather
 * than a utility page.
 */
const PREFERRED_SEGMENTS = [
    "about",
    "blog",
    "news",
    "product",
    "products",
    "platform",
    "features",
    "pricing",
    "solutions",
    "customers",
    "case-studies",
    "docs",
    "contact",
    "services",
    "work"
];

const FILE_EXTENSION = /\.[a-z0-9]{2,5}$/i;

export interface CandidateLink {
    href: string;
    /** Where the link was found. Nav and footer links are the site's own idea of its structure. */
    source: "nav" | "footer" | "body";
}

export interface ScoredUrl {
    url: string;
    score: number;
    /** Why it scored as it did, so a surprising crawl list can be explained rather than guessed at. */
    reasons: string[];
}

interface Candidate extends ScoredUrl {
    /**
     * Hard exclusion, kept separate from the score. A utility page or a file is never worth a page
     * of budget no matter how little else is on offer, whereas a low score only means "later".
     */
    excluded: boolean;
}

export interface SelectCrawlUrlsParams {
    entryUrl: string;
    links: CandidateLink[];
    /** Total pages including the entry URL. */
    limit?: number;
}

export const DEFAULT_CRAWL_LIMIT = 5;

/**
 * The hard ceiling on pages per run.
 *
 * The model sees one screenshot per sampled page in a single call, so page count is the main driver of
 * a run's token cost. Capping it bounds worst-case spend and keeps a run comfortably inside the
 * fifteen-minute task budget — the API clamps the caller's `crawlLimit` to this before triggering.
 */
export const MAX_CRAWL_LIMIT = 10;

/**
 * Clamp a caller-supplied crawl limit to `[1, MAX_CRAWL_LIMIT]`.
 *
 * `undefined`/`null`/non-finite falls through to `undefined` so the crawl applies `DEFAULT_CRAWL_LIMIT`
 * — "omitted" and "asked for zero" are different, and only the latter should be corrected up to one.
 */
export const clampCrawlLimit = (value?: number | null): number | undefined => {
    if (value === undefined || value === null || !Number.isFinite(value)) {
        return undefined;
    }
    return Math.min(Math.max(1, Math.floor(value)), MAX_CRAWL_LIMIT);
};

/** Strips the query and fragment, and normalises the trailing slash. */
export const normaliseUrl = (raw: string, base: string): string | null => {
    let url: URL;

    try {
        url = new URL(raw, base);
    } catch {
        return null;
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
        return null;
    }

    // Two links differing only by query string are the same page for our purposes, so the query is
    // dropped before de-duplication rather than after.
    url.search = "";
    url.hash = "";

    if (url.pathname !== "/" && url.pathname.endsWith("/")) {
        url.pathname = url.pathname.slice(0, -1);
    }

    return url.toString();
};

const firstSegment = (pathname: string): string => {
    return pathname.split("/").filter(Boolean)[0] ?? "";
};

const segmentsOf = (pathname: string): string[] => {
    return pathname
        .split("/")
        .filter(Boolean)
        .map(segment => segment.toLowerCase());
};

interface ScoreParams {
    url: URL;
    source: CandidateLink["source"];
    /** First path segments already claimed by higher-scoring candidates. */
    takenSegments: Set<string>;
}

const scoreUrl = ({ url, source, takenSegments }: ScoreParams): Candidate => {
    const reasons: string[] = [];
    let score = 0;
    let excluded = false;

    const segments = segmentsOf(url.pathname);
    const first = segments[0] ?? "";

    if (source === "nav") {
        score += 3;
        reasons.push("linked from the nav");
    } else if (source === "footer") {
        score += 2;
        reasons.push("linked from the footer");
    }

    // A distinct first segment is the strongest signal of a structurally different page. Two blog
    // posts look alike; a blog post and a pricing page do not.
    if (first && !takenSegments.has(first)) {
        score += 4;
        reasons.push("distinct section");
    } else if (first) {
        score -= 2;
        reasons.push("same section as an already-chosen page");
    }

    if (PREFERRED_SEGMENTS.includes(first)) {
        score += 3;
        reasons.push("content-looking path");
    }

    if (segments.some(segment => PENALISED_SEGMENTS.includes(segment))) {
        excluded = true;
        reasons.push("utility or legal page");
    }

    if (FILE_EXTENSION.test(url.pathname)) {
        excluded = true;
        reasons.push("looks like a file, not a page");
    }

    // Every segment past the first costs a point. A deep path is usually one item from a template,
    // and without this a depth-2 blog post ties with a depth-1 pricing page and the tie-break falls
    // to alphabetical order — which is arbitrary and picks worse pages.
    if (segments.length > 1) {
        score -= segments.length - 1;
        reasons.push("nested path");
    }

    return { url: url.toString(), score, reasons, excluded };
};

/**
 * Picks the crawl list. The entry URL is always first and always included, even if it would score
 * badly — it is what the user asked for.
 */
export const selectCrawlUrls = ({
    entryUrl,
    links,
    limit = DEFAULT_CRAWL_LIMIT
}: SelectCrawlUrlsParams): ScoredUrl[] => {
    const entry = normaliseUrl(entryUrl, entryUrl);
    if (!entry) {
        return [];
    }

    const entryOrigin = new URL(entry).origin;

    const seen = new Set<string>([entry]);
    const candidates: Array<{ url: URL; source: CandidateLink["source"] }> = [];

    for (const link of links) {
        const normalised = normaliseUrl(link.href, entry);
        if (!normalised || seen.has(normalised)) {
            continue;
        }

        const url = new URL(normalised);
        // Same-origin only: a link to a docs subdomain or a third-party site is not this theme.
        if (url.origin !== entryOrigin) {
            continue;
        }

        seen.add(normalised);
        candidates.push({ url, source: link.source });
    }

    const selected: ScoredUrl[] = [
        { url: entry, score: Number.POSITIVE_INFINITY, reasons: ["the URL you gave us"] }
    ];

    const takenSegments = new Set<string>([firstSegment(new URL(entry).pathname)].filter(Boolean));
    const remaining = [...candidates];

    // Greedy, one pick at a time: whether a candidate is in a "distinct section" depends on what has
    // already been chosen, so scores cannot be computed once up front.
    while (selected.length < limit && remaining.length > 0) {
        const scored = remaining
            .map((candidate, index) => ({
                index,
                ...scoreUrl({ ...candidate, takenSegments })
            }))
            .sort((a, b) => b.score - a.score || a.url.localeCompare(b.url));

        const best = scored.find(candidate => !candidate.excluded);

        // Everything left is a utility page or a file; sampling any of it would teach us nothing,
        // so the crawl list is simply shorter. Section 10.6 already treats fewer pages as a normal
        // outcome rather than a failure.
        if (!best) {
            break;
        }

        selected.push({ url: best.url, score: best.score, reasons: best.reasons });
        remaining.splice(best.index, 1);

        const segment = firstSegment(new URL(best.url).pathname);
        if (segment) {
            takenSegments.add(segment);
        }
    }

    return selected;
};
