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
        return "new";
    });
}

export function buildEditorUrl(domain: string): string {
    const base = domain.endsWith("/") ? domain.slice(0, -1) : domain;
    return `${base}/preview`;
}

export function buildDisplayUrl(domain: string, path: string, entry: EntryData): string {
    const base = domain.endsWith("/") ? domain.slice(0, -1) : domain;
    const resolvedPath = resolveSlugPattern(path, entry);
    const normalizedPath = resolvedPath.startsWith("/") ? resolvedPath : `/${resolvedPath}`;
    return `${base}${normalizedPath}`;
}
