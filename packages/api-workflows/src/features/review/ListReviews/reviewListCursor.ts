import type { ReviewListSort } from "~/domain/review/types.js";

/**
 * Where a list call stopped (R92), by value rather than by position: the sort it was read in, the
 * sort value of the last row it examined (`lastChangedOn`, or the title sort key) and the ids of
 * every row examined at exactly that value. The next call resumes at that value and leaves those
 * ids out, so a row that leaves the list in between (an approve, a reassign) never shifts the rest
 * and no row is skipped. A cursor is valid only with the sort it was made with.
 */
export interface ReviewListCursor {
    sort: ReviewListSort;
    value: string;
    ids: string[];
}

type UnknownRecord = Record<string, unknown>;

const SORTS: readonly ReviewListSort[] = [
    "lastChangedOn_ASC",
    "lastChangedOn_DESC",
    "title_ASC",
    "title_DESC"
];

const isRecord = (value: unknown): value is UnknownRecord => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isStringArray = (value: unknown): value is string[] => {
    return Array.isArray(value) && value.every(item => typeof item === "string");
};

const isSort = (value: unknown): value is ReviewListSort => {
    return typeof value === "string" && (SORTS as readonly string[]).includes(value);
};

/** Opaque to clients: base64 of JSON `{ sort, value, ids }`. Pure. */
export const encodeReviewListCursor = (cursor: ReviewListCursor): string => {
    const json = JSON.stringify({ sort: cursor.sort, value: cursor.value, ids: cursor.ids });
    return Buffer.from(json, "utf8").toString("base64");
};

/**
 * `null` for anything `encodeReviewListCursor` did not produce. Pure. A title sort value can be
 * empty (an empty title); a `lastChangedOn` value cannot.
 */
export const decodeReviewListCursor = (value: string): ReviewListCursor | null => {
    let parsed: unknown;
    try {
        parsed = JSON.parse(Buffer.from(value, "base64").toString("utf8"));
    } catch {
        return null;
    }
    if (!isRecord(parsed)) {
        return null;
    }
    const { sort, value: sortValue, ids } = parsed;
    if (!isSort(sort) || typeof sortValue !== "string" || !isStringArray(ids)) {
        return null;
    }
    if (!sortValue && sort.startsWith("lastChangedOn")) {
        return null;
    }
    return { sort, value: sortValue, ids: [...ids] };
};
