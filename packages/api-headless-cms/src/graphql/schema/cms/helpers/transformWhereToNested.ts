const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);

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

    return Object.entries(where).reduce<Record<string, unknown>>((result, [key, value]) => {
        if (key === "AND" || key === "OR") {
            if (!Array.isArray(value)) {
                return {
                    ...result,
                    [key]: value
                };
            }
            return {
                ...result,
                [key]: value.map(item => transformWhereToNested(item))
            };
        }

        const dotIndex = key.indexOf(".");

        if (dotIndex === -1) {
            if (FORBIDDEN_KEYS.has(key)) {
                throw new Error(`Invalid where key: "${key}".`);
            }
            return {
                ...result,
                [key]: value
            };
        }

        const head = key.slice(0, dotIndex);
        const tail = key.slice(dotIndex + 1);

        if (FORBIDDEN_KEYS.has(head)) {
            throw new Error(`Invalid where key: "${head}".`);
        }

        if (Object.hasOwn(result, head)) {
            return {
                ...result,
                [head]: {
                    ...(result[head] as Record<string, unknown>),
                    ...transformWhereToNested({ [tail]: value })
                }
            };
        }

        return {
            ...result,
            [head]: transformWhereToNested({ [tail]: value })
        };
    }, {});
};
