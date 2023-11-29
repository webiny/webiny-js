/**
 * Should not be used by users as method is prone to breaking changes.
 * @internal
 */
export const formatDate = (date?: Date | string | null): string | undefined => {
    if (!date) {
        return undefined;
    } else if (date instanceof Date) {
        return date.toISOString();
    }
    return new Date(date).toISOString();
};

/**
 * Should not be used by users as method is prone to breaking changes.
 * @internal
 */
export const getDate = <T extends string | undefined = string | undefined>(
    input?: Date | string | null,
    defaultValue?: Date | string | null
): T => {
    if (!input) {
        return formatDate(defaultValue) as T;
    }
    if (input instanceof Date) {
        return formatDate(input) as T;
    }
    return formatDate(new Date(input)) as T;
};
