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
    /** Optional: absent on page maps composed before the signals shipped. */
    signals?: PageSignals;
}

/**
 * An instance Assemble placed on the page that composition could not turn into a component.
 *
 * There is no raw-markup fallback in this PoC: an instance whose cluster was never promoted is
 * skipped, not degraded. So this is the honest form of "what did not become a component" — the
 * section is simply absent from the composed page, and nothing on the page says so.
 */
export interface UnplacedInstance {
    /** The cluster signature Assemble asked for. */
    signature: string;
    /** Its position in the page's instance list, so it can be located in the source. */
    index: number;
}

/**
 * Per-page fidelity signals — deterministic counts, never a similarity score.
 *
 * A whole-page similarity number is worse than useless here: heights differ, fonts load differently,
 * and one missing section shifts everything below it, so a page that migrated well can read 0.62.
 * These four say *where* a page went wrong instead of how wrong it is.
 */
export interface PageSignals {
    /** Sections Segment found on the source page. */
    sourceSections: number;
    /** Instances Assemble placed on this page — what it intended to compose. */
    assembledInstances: number;
    /** Instances that actually became components on the Website Builder page. */
    composedInstances: number;
    /** The difference between the two above, named. */
    unplaced: UnplacedInstance[];
    /** Source text runs on this page, and how many of them the composed page carries. */
    textTotal: number;
    textPresent: number;
    /**
     * A sample of the runs the composed page does not carry, capped.
     *
     * A proportion says how much is missing; this says what, which is the difference between a
     * number an operator can act on and one they can only worry about. Capped because a badly
     * composed page can be missing hundreds and the page map is a key-value item, not a log.
     */
    textMissingSample: string[];
    /** This page's own destination outcome, from the same pass that produces the run totals. */
    links: PageMapLinks;
    /**
     * This page's own image outcome, read the same way as `links`.
     *
     * `rewritten` now points at File Manager; `unmigrated` still points at whatever host served it,
     * which is the number that says the page will break when that host goes away; `dropped` was
     * invented by the model and emptied.
     */
    images?: PageMapImages;
}

/** Image counters, in the same shape as the link counters beside them. */
export interface PageMapImages {
    rewritten: number;
    unmigrated: number;
    dropped: number;
}

/** A page Assemble listed that could not be created, kept so the report is honest about coverage. */
export interface PageMapFailure {
    sourceUrl: string;
    reason: string;
}

/** One decision this PoC made by fiat, recorded rather than taken silently (W10.4). */
export interface DiscardEntry {
    kind: "link.unmigrated" | "link.invented" | "image.invented" | "image.unmigrated";
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
