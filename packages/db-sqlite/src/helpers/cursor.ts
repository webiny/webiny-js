/**
 * Pagination cursor for SQLite-backed storage operations. Mirrors the role of
 * DynamoDB's `LastEvaluatedKey`: an opaque token the caller passes back on
 * subsequent requests to resume paging from the same position.
 *
 * The shape carries `(pk, sk)` of the last row in the previous page; query
 * helpers translate that into a `(pk, sk) > (?, ?)` predicate. GSI queries
 * may add extra fields (`gsi1Pk`, `gsi1Sk`) — the type is intentionally
 * extensible.
 *
 * The encoded form is base64url so cursors can be embedded in URLs without
 * percent-encoding.
 */
export interface Cursor {
    pk: string;
    sk: string;
    [key: string]: string;
}

export const encodeCursor = (cursor: Cursor): string => {
    return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
};

export const decodeCursor = (encoded: string): Cursor => {
    const json = Buffer.from(encoded, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as unknown;
    if (
        typeof parsed !== "object" ||
        parsed === null ||
        typeof (parsed as { pk?: unknown }).pk !== "string" ||
        typeof (parsed as { sk?: unknown }).sk !== "string"
    ) {
        throw new Error("Invalid cursor: expected an object with string pk and sk fields.");
    }
    return parsed as Cursor;
};

/**
 * Forgiving variant of `decodeCursor` — returns `null` on any parse error.
 * Useful at API boundaries where an invalid cursor should yield "start from
 * the beginning" rather than a hard error.
 */
export const tryDecodeCursor = (encoded: string | undefined | null): Cursor | null => {
    if (!encoded) {
        return null;
    }
    try {
        return decodeCursor(encoded);
    } catch {
        return null;
    }
};
