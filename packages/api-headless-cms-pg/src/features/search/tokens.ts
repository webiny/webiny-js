/* Longest value kept in an equality token; GIN keys must stay well below the index row limit. */
export const MAX_TOKEN_VALUE_LENGTH = 512;

/**
 * Canonical text form of a value inside the `tok` array. Writer and query compiler must agree on it:
 * numbers use JS number formatting (5, 5.0 and "5" become "5"), booleans "true"/"false".
 */
export const tokenValue = (value: unknown): string => {
    if (typeof value === "number") {
        return String(value);
    }
    if (typeof value === "boolean") {
        return value ? "true" : "false";
    }
    if (value instanceof Date) {
        return String(value.getTime());
    }
    return String(value).slice(0, MAX_TOKEN_VALUE_LENGTH);
};

/* Token key for a path without a slot column (by its storage key); slotted paths use the slot name ("t12"). */
export const overflowTokenKey = (key: string): string => `o:${key}`;

export const createToken = (scopeId: number, slot: string, value: unknown): string => {
    return `${scopeId}:${slot}:${tokenValue(value)}`;
};

/**
 * Marks a row whose scalar slot is NULL (a value token always has a second colon). The slot indexes
 * are partial on `IS NOT NULL`, so a sorted list of an indexed scope finds its NULL rows through
 * this token instead of reading every row of the scope.
 */
export const createNullToken = (scopeId: number, slot: string): string => {
    return `${scopeId}:${slot}`;
};
