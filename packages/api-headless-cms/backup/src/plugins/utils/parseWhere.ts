export type WhereCondition = {
    fieldId: string;
    operator: string;
    value: any;
};

export const parseWhere = (where): WhereCondition[] => {
    const whereKeys = Object.keys(where || {});

    return whereKeys.map(key => {
        const value = where[key];
        const delim = key.indexOf("_");
        const fieldId = key.substring(0, delim > 0 ? delim : undefined);
        const operator = delim > 0 ? key.substring(delim + 1) : "eq";

        return {
            fieldId,
            operator,
            value
        };
    });
};
