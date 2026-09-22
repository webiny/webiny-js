/** One migrated page: where it came from, and what it became in Website Builder. */
export interface PageMapEntry {
    /** The page URL as Assemble recorded it. */
    sourceUrl: string;
    /** The same URL after normalisation, which is what W10.3 matches links against. */
    normalizedUrl: string;
    /** The Website Builder path, e.g. `/` or `/pricing`. */
    path: string;
    title: string;
    /** The created page's revision id, and the stable entry id across revisions. */
    pageId: string;
    entryId: string;
}

/** A page Assemble listed that could not be created, kept so the report is honest about coverage. */
export interface PageMapFailure {
    sourceUrl: string;
    reason: string;
}

/** One decision this PoC made by fiat, recorded rather than taken silently (W10.4). */
export interface DiscardEntry {
    kind: "link.unmigrated" | "link.invented";
    /** The migrated page the occurrence is on. */
    page: string;
    /** The source page it came from. */
    sourceUrl: string;
    /** What was left as it was, and why it is here. */
    detail: string;
}

/**
 * The link-rewriting reconciliation (W10.3). `before` and `after` must be equal: a drop means
 * normalisation lost a destination instead of rewriting it, and `rewritten + external + unmigrated`
 * must account for every one of them.
 */
export interface PageMapLinks {
    before: number;
    after: number;
    rewritten: number;
    external: number;
    unmigrated: number;
    /**
     * Destinations the model invented and the credibility rule emptied, counted before the rest —
     * they never reach the page, so they are not part of the before/after reconciliation.
     */
    dropped: number;
    /**
     * Of those, the ones whose page turned out to be in this migration and were restored to it.
     * Counted apart from `rewritten` on purpose: rewriting a destination the page really had and
     * recovering one the model invented are different claims, and one number would hide both.
     */
    recovered: number;
}

export interface PageMap {
    runId: string;
    composedOn: string;
    pages: PageMapEntry[];
    failed: PageMapFailure[];
    links: PageMapLinks;
    discarded: DiscardEntry[];
}

export interface ComposePagesResult {
    created: number;
    failed: number;
    links: PageMapLinks;
}
