import { PrimitiveValue } from "~/types";

/**
 * Encode a received cursor value into something that can be passed on to the user.
 */
export const encodeCursor = (cursor?: string | string[] | null): string | undefined => {
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
export const decodeCursor = (cursor?: string | null): PrimitiveValue[] | undefined => {
    if (!cursor) {
        return undefined;
    }
    try {
        const value = JSON.parse(Buffer.from(cursor, "base64").toString("ascii"));
        if (Array.isArray(value)) {
            return value.map(decodeURIComponent);
        }
        const decoded = decodeURIComponent(value);
        return decoded ? [decoded] : undefined;
    } catch (ex) {
        console.error(ex.message);
    }
    return undefined;
};
