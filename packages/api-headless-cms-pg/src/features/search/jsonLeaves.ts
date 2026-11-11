/**
 * Flattens a searchable-json value into (dotted sub-path, scalar) pairs. Array elements share their
 * parent's path, so a filter on "tags" matches any element, as OpenSearch's dynamic mapping does.
 */
export const jsonLeaves = (
    value: unknown,
    prefix = "",
    out: [string, unknown][] = []
): [string, unknown][] => {
    if (value === null || value === undefined) {
        return out;
    }
    if (Array.isArray(value)) {
        for (const item of value) {
            jsonLeaves(item, prefix, out);
        }
        return out;
    }
    if (typeof value === "object") {
        for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
            jsonLeaves(child, prefix ? `${prefix}.${key}` : key, out);
        }
        return out;
    }
    out.push([prefix, value]);
    return out;
};

export const jsonToken = (scopeId: number, key: string, subPath: string, value: string): string => {
    return `${scopeId}:${key}:${subPath}=${value}`;
};
