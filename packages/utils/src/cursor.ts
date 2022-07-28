export type CursorInput = string | number | (string | number)[] | null;
export type CursorOutput = string | null;

export const encodeCursor = (cursor?: CursorInput): CursorOutput => {
    if (!cursor) {
        return null;
    }

    try {
        return Buffer.from(JSON.stringify(cursor)).toString("base64");
    } catch (ex) {
        console.log("Utils encode cursor.");
        console.log(ex.message);
        return null;
    }
};

export const decodeCursor = (cursor?: CursorOutput): CursorInput => {
    if (!cursor) {
        return null;
    }

    try {
        const value = Buffer.from(cursor, "base64").toString("ascii");
        if (!value) {
            return null;
        }
        return JSON.parse(value);
    } catch (ex) {
        console.log("Utils decode cursor.");
        console.log(ex.message);
        return null;
    }
};
