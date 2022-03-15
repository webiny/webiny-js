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

    return JSON.parse(Buffer.from(cursor, "base64").toString("ascii"));
};
