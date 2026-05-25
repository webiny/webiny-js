export interface ICursorValues {
    [column: string]: string | number | boolean | null;
}

/* Encode cursor values to a base64-encoded JSON string. */
export const encodeCursor = (values: ICursorValues): string => {
    const json = JSON.stringify(values);
    return Buffer.from(json).toString("base64");
};

/* Decode a base64-encoded cursor string back to cursor values.
 * Returns null for any invalid input. */
export const decodeCursor = (cursor: string): ICursorValues | null => {
    try {
        const json = Buffer.from(cursor, "base64").toString("utf8");
        const parsed = JSON.parse(json);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return null;
        }
        return parsed as ICursorValues;
    } catch {
        return null;
    }
};
