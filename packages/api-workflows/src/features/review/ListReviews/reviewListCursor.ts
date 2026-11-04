/**
 * Where a list call stopped (R92), by value rather than by position: the `lastChangedOn` of the
 * last row it examined and the ids of every row examined at exactly that time. The next call
 * resumes at that time and leaves those ids out, so a row that leaves the list in between (an
 * approve, a reassign) never shifts the rest and no row is skipped.
 */
export interface ReviewListCursor {
    lastChangedOn: string;
    ids: string[];
}

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isStringArray = (value: unknown): value is string[] => {
    return Array.isArray(value) && value.every(item => typeof item === "string");
};

/** Opaque to clients: base64 of JSON `{ lastChangedOn, ids }`. Pure. */
export const encodeReviewListCursor = (cursor: ReviewListCursor): string => {
    const json = JSON.stringify({ lastChangedOn: cursor.lastChangedOn, ids: cursor.ids });
    return Buffer.from(json, "utf8").toString("base64");
};

/** `null` for anything `encodeReviewListCursor` did not produce. Pure. */
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
    const { lastChangedOn, ids } = parsed;
    if (typeof lastChangedOn !== "string" || !lastChangedOn || !isStringArray(ids)) {
        return null;
    }
    return { lastChangedOn, ids: [...ids] };
};
