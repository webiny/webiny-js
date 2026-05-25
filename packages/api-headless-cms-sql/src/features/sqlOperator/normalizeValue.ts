/* Normalizes a value for use in SQL bindings. Converts Date objects to ISO strings. */
export const normalizeValue = (value: unknown): unknown => {
    if (value instanceof Date) {
        return value.toISOString();
    }

    if (Array.isArray(value)) {
        return value.map(normalizeValue);
    }

    return value;
};
