export const extractWhereParams = (key: string) => {
    const result = key.split("_");
    const fieldId = result.shift();
    if (!fieldId) {
        return null;
    }
    const rawOp = result.length === 0 ? "eq" : result.join("_");
    /**
     * When rawOp is not, it means it is equal negated so just return that.
     */
    if (rawOp === "not") {
        return {
            fieldId,
            operation: "eq",
            negate: true
        };
    }
    const negate = rawOp.match("not_") !== null;
    const operation = rawOp.replace("not_", "");
    return {
        fieldId,
        operation,
        negate
    };
};
