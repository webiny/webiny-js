/**
 * Encode a received cursor value into something that can be passed on to the user.
 */
export const encodeCursor = (cursor?: string): string | undefined => {
    if (!cursor) {
        return undefined;
    }

    return Buffer.from(JSON.stringify(cursor)).toString("base64");
};
/**
 * Decode a received value into a Elasticsearch cursor.
 * If no value is received or is not decodable, return undefined.
 */
export const decodeCursor = (cursor?: string): string | undefined => {
    if (!cursor) {
        return undefined;
    }
    try {
        return JSON.parse(Buffer.from(cursor, "base64").toString("ascii"));
    } catch (ex) {
        console.log(ex.message);
    }
    return undefined;
};
