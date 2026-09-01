type EntryData = Record<string, unknown>;

function getNestedValue(obj: EntryData, path: string): unknown {
    const parts = path.split(".");
    let current: unknown = obj;
    for (const part of parts) {
        if (current === null || current === undefined || typeof current !== "object") {
            return undefined;
        }
        current = (current as Record<string, unknown>)[part];
    }
    return current;
}

export function resolveSlugPattern(pattern: string, entry: EntryData): string {
    return pattern.replace(/\{([^}]+)\}/g, (_match, path: string) => {
        const value = getNestedValue(entry, path);
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
