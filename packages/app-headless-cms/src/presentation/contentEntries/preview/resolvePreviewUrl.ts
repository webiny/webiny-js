interface EntryData {
    values?: Record<string, unknown>;
}

export function resolveSlugPattern(pattern: string, entry: EntryData): string {
    return pattern.replace(/\{values\.(\w+)\}/g, (_match, fieldId: string) => {
        const value = entry.values ? entry.values[fieldId] : undefined;
        if (value !== null && value !== undefined && value !== "") {
            return String(value);
        }
        return "";
    });
}

export function buildEditorUrl(prefix: string): string {
    const base = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
    return `${base}/preview`;
}

export function buildDisplayUrl(prefix: string, slugPattern: string, entry: EntryData): string {
    const base = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
    const slug = resolveSlugPattern(slugPattern, entry);
    if (!slug) {
        return base;
    }
    return `${base}/${slug}`;
}
