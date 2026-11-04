/*
 * True when any value is entered: null, undefined, "", empty arrays and objects with nothing
 * inside count as not entered; `false` and `0` count as entered (QBZ-14).
 */
export const isNonEmptySettings = (value: unknown): boolean => {
    if (value === null || value === undefined || value === "") {
        return false;
    }
    if (Array.isArray(value)) {
        return value.some(isNonEmptySettings);
    }
    if (typeof value === "object") {
        return Object.values(value).some(isNonEmptySettings);
    }
    return true;
};
