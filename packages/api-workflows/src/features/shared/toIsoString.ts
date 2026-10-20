/** CMS returns `datetime` values as `Date` when read from storage and as strings on write. */
export const toIsoString = (value: unknown): string | null => {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === "string" && value.length > 0) {
        return value;
    }
    return null;
};
