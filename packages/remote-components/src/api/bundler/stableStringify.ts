/** JSON with object keys sorted, so two manifests compare equal regardless of key order. */
export function stableStringify(value: unknown): string {
    if (Array.isArray(value)) {
        return `[${value.map(item => stableStringify(item)).join(",")}]`;
    }

    if (value && typeof value === "object") {
        const entries = Object.keys(value)
            .sort()
            .filter(key => (value as Record<string, unknown>)[key] !== undefined)
            .map(key => {
                const item = (value as Record<string, unknown>)[key];
                return `${JSON.stringify(key)}:${stableStringify(item)}`;
            });
        return `{${entries.join(",")}}`;
    }

    return JSON.stringify(value) ?? "null";
}
