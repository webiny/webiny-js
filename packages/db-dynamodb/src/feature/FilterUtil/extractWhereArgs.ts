interface ExtractWhereArgsResult {
    field: string;
    operation: string;
    negate: boolean;
}

export const extractWhereArgs = (key: string): ExtractWhereArgsResult => {
    const result = key.split("_");
    const field = result.shift() as string;
    const rawOp = result.length === 0 ? "eq" : result.join("_");
    /**
     * When rawOp is not, it means it is equal negated so just return that.
     */
    if (rawOp === "not") {
        return {
            field,
            operation: "eq",
            negate: true
        };
    }
    const negate = rawOp.match("not_") !== null;
    const operation = rawOp.replace("not_", "");
    return {
        field,
        operation,
        negate
    };
};
