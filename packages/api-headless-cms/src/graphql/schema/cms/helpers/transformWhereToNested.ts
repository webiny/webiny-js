/**
 * Transforms a flat where object with dot-notation keys into a nested object.
 * Keys without dots are passed through unchanged.
 * Handles logical operators (AND, OR) recursively.
 *
 * @param where - Where clause object potentially containing dot-notation keys
 * @returns Nested where object compatible with the GraphQL ListWhereInput type
 *
 * @example
 * transformWhereToNested({ "values.name": "Keyboard", id: "abc" })
 * // Returns: { values: { name: "Keyboard" }, id: "abc" }
 *
 * @example
 * transformWhereToNested({ "values.price_gt": 100, "values.name_contains": "board" })
 * // Returns: { values: { price_gt: 100, name_contains: "board" } }
 */
export const transformWhereToNested = (
    where?: Record<string, unknown>
): Record<string, unknown> | undefined => {
    if (!where) {
        return undefined;
    }

    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(where)) {
        // Handle logical operators recursively.
        if (key === "AND" || key === "OR") {
            if (Array.isArray(value)) {
                result[key] = value.map(item =>
                    transformWhereToNested(item as Record<string, unknown>)
                );
            } else {
                result[key] = value;
            }
            continue;
        }

        const dotIndex = key.indexOf(".");
        if (dotIndex === -1) {
            // No dot — pass through unchanged.
            result[key] = value;
        } else {
            // Dot-notation key — expand into nested object.
            const head = key.slice(0, dotIndex);
            const tail = key.slice(dotIndex + 1);

            if (result[head] === undefined) {
                result[head] = {};
            }

            const nested = result[head] as Record<string, unknown>;
            // Recursively expand in case of multiple levels of nesting.
            const expanded = transformWhereToNested({ [tail]: value }) as Record<string, unknown>;
            Object.assign(nested, expanded);
        }
    }

    return result;
};
