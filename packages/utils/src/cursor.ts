export const encodeCursor = (cursor?: any) => {
    if (!cursor) {
        return null;
    }

    try {
        return Buffer.from(JSON.stringify(cursor)).toString("base64");
    } catch (ex) {
        console.log(ex.message);
        return null;
    }
};

export const decodeCursor = (cursor?: string) => {
    if (!cursor) {
        return null;
    }

    try {
        return JSON.parse(Buffer.from(cursor, "base64").toString("ascii"));
    } catch (ex) {
        console.log(ex.message);
        return null;
    }
};
