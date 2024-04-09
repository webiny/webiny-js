const maps: Record<string, string> = {
    id: "entryId",
    id_in: "entryId_in",
    id_not: "entryId_not",
    id_not_in: "entryId_not_in"
};

export const remapWhere = <T extends Record<string, any>>(where?: T): T | undefined => {
    if (!where) {
        return undefined;
    }
    const result: T = { ...where };
    for (const key in maps) {
        const value = result[key];
        delete result[key];
        if (value === undefined) {
            continue;
        }
        const newKey = maps[key];
        result[newKey as keyof T] = value;
    }
    return result;
};
