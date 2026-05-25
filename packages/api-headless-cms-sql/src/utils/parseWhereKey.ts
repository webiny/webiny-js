const OPERATORS = [
    "not_contains",
    "not_startsWith",
    "not_between",
    "not_in",
    "contains",
    "startsWith",
    "between",
    "gte",
    "gt",
    "lte",
    "lt",
    "in",
    "not"
];

export const parseWhereKey = (key: string): { fieldId: string; operator: string } => {
    for (const op of OPERATORS) {
        if (key.endsWith(`_${op}`)) {
            return {
                fieldId: key.slice(0, -(op.length + 1)),
                operator: op
            };
        }
    }

    return { fieldId: key, operator: "eq" };
};
