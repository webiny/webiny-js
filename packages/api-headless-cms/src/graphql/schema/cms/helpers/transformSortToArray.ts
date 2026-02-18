/**
 * Transforms sort parameter to array of strings format expected by GraphQL schema.
 * Handles two input formats:
 * 1. Object format: {createdOn: "desc"} -> ["createdOn_DESC"]
 * 2. Array of strings: ["createdOn_DESC"] -> ["createdOn_DESC"] (pass through)
 *
 * @param sort - Sort parameter (object or array of strings)
 * @returns Array of strings in format ["field_ASC"|"field_DESC"] or undefined if no sort provided
 *
 * @example
 * transformSortToArray({createdOn: "desc"})
 * // Returns: ["createdOn_DESC"]
 *
 * @example
 * transformSortToArray(["createdOn_DESC", "name_ASC"])
 * // Returns: ["createdOn_DESC", "name_ASC"]
 */
export const transformSortToArray = (
    sort?: Record<string, unknown> | string[]
): string[] | undefined => {
    if (!sort) {
        return undefined;
    }

    // Handle array of strings format: ["createdOn_DESC", "name_ASC"]
    if (Array.isArray(sort)) {
        return sort.map(item => String(item));
    }

    // Handle object format: {createdOn: "desc", name: "asc"}
    if (typeof sort === "object") {
        return Object.entries(sort).map(([field, direction]) => {
            const normalizedDirection = String(direction).toUpperCase();
            return `${field}_${normalizedDirection}`;
        });
    }

    return undefined;
};
