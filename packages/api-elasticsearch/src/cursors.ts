/**
 * Encode a received cursor value into something that can be passed on to the user.
 */
export const encodeCursor = (cursor?: string | string[]): string | undefined => {
    if (!cursor) {
        return undefined;
    }

    cursor = Array.isArray(cursor) ? cursor.map(encodeURIComponent) : encodeURIComponent(cursor);

    try {
        return Buffer.from(JSON.stringify(cursor)).toString("base64");
    } catch (ex) {
        console.error(ex.message);
    }
    return undefined;
};
/**
 * Decode a received value into a Elasticsearch cursor.
 * If no value is received or is not decodable, return undefined.
 */
export const decodeCursor = (cursor?: string): string[] | string | undefined => {
    if (!cursor) {
        return undefined;
    }
    try {
        const value = JSON.parse(Buffer.from(cursor, "base64").toString("ascii"));

        return Array.isArray(value) ? value.map(decodeURIComponent) : decodeURIComponent(value);
    } catch (ex) {
        console.error(ex.message);
    }
    return undefined;
};
