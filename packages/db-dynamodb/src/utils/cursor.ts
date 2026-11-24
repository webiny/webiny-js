import { parseJson } from "@webiny/utils/parseJson.js";
export const encodeCursor = (cursor?: any): string | null => {
    if (!cursor) {
        return null;
    }

    return Buffer.from(JSON.stringify(cursor)).toString("base64");
};

export const decodeCursor = (cursor?: string | null): string | null => {
    if (!cursor) {
        return null;
    }

    return parseJson(Buffer.from(cursor, "base64").toString("ascii"));
};
