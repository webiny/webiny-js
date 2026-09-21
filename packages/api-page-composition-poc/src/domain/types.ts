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

export interface PageMap {
    runId: string;
    composedOn: string;
    pages: PageMapEntry[];
    failed: PageMapFailure[];
}

export interface ComposePagesResult {
    created: number;
    failed: number;
}
