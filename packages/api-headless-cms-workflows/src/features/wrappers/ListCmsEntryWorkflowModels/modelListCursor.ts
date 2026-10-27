/** Where the next page of the editor model list starts (R99). */
export interface ModelListCursor {
    offset: number;
}

interface ParsedModelListCursor {
    offset?: unknown;
}

/** Opaque: base64 of JSON `{ offset }`. Pure. */
export const encodeModelListCursor = (cursor: ModelListCursor): string => {
    return Buffer.from(JSON.stringify({ offset: cursor.offset })).toString("base64");
};

/** `null` for anything `encodeModelListCursor` does not produce. Pure. */
export const decodeModelListCursor = (value: string): ModelListCursor | null => {
    let parsed: unknown;
    try {
        parsed = JSON.parse(Buffer.from(value, "base64").toString("utf8"));
    } catch {
        return null;
    }
    if (typeof parsed !== "object" || parsed === null) {
        return null;
    }
    const offset = (parsed as ParsedModelListCursor).offset;
    if (typeof offset !== "number" || !Number.isInteger(offset) || offset < 0) {
        return null;
    }
    return { offset };
};
