import { PrimitiveValue } from "~/types";

/**
 * Encode a received cursor value into something that can be passed on to the user.
 */
export const encodeCursor = (input?: PrimitiveValue[]): string | undefined => {
    if (!input) {
        return undefined;
    }

    const cursor = Array.isArray(input)
        ? input
              .filter((item: PrimitiveValue): item is string | number | boolean => item !== null)
              .map(item => encodeURIComponent(item))
        : encodeURIComponent(input);

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
            return value.filter(item => item !== null).map(decodeURIComponent);
        }
        const decoded = decodeURIComponent(value);
        return decoded ? [decoded] : undefined;
    } catch (ex) {
        console.error(ex.message);
    }
    return undefined;
};
