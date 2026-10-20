/** Where a list call stopped (R92): the repository page and how many of its rows were examined. */
export interface ReviewListCursor {
    /** `meta.cursor` of the repository page being read; `null` for the first page. */
    after: string | null;
    skip: number;
}

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

/** Opaque to clients: base64 of JSON `{ after, skip }`. Pure. */
export const encodeReviewListCursor = (cursor: ReviewListCursor): string => {
    return Buffer.from(JSON.stringify({ after: cursor.after, skip: cursor.skip }), "utf8").toString(
        "base64"
    );
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
    const after = typeof parsed.after === "string" ? parsed.after : null;
    if (parsed.after !== null && after === null) {
        return null;
    }
    const skip = parsed.skip;
    if (typeof skip !== "number" || !Number.isInteger(skip) || skip < 0) {
        return null;
    }
    return { after, skip };
};
