import type { CmsModelField } from "~/types.js";
import type { CmsReferenceValue } from "~/features/contentEntry/refTypes.js";

type EntryData = Record<string, unknown>;

/**
 * Values of loaded referenced entries, keyed by the ref `id`.
 * `null` marks a ref that failed to load, so it isn't requested again.
 */
export type RefValuesMap = Record<string, Record<string, unknown> | null>;

function isRefValue(value: unknown): value is CmsReferenceValue {
    if (!value || typeof value !== "object") {
        return false;
    }
    const ref = value as Partial<CmsReferenceValue>;
    return typeof ref.id === "string" && typeof ref.modelId === "string";
}

/**
 * Returns the ids of ref fields that the pattern reads through,
 * e.g. `location` for `/{values.location.slug}/{values.slug}`.
 */
export function getPatternRefFieldIds(
    pattern: string,
    fields: Pick<CmsModelField, "fieldId" | "type">[]
): string[] {
    const refFieldIds = new Set(fields.filter(f => f.type === "ref").map(f => f.fieldId));
    const result = new Set<string>();
    for (const [, path] of pattern.matchAll(/\{([^}]+)\}/g)) {
        const [root, fieldId, ...rest] = path.split(".");
        if (root === "values" && rest.length > 0 && refFieldIds.has(fieldId)) {
            result.add(fieldId);
        }
    }
    return [...result];
}

/**
 * Collects the ref values held by the given fields, for both single and multiple-value fields.
 */
export function getRefValues(values: EntryData, refFieldIds: string[]): CmsReferenceValue[] {
    const refs: CmsReferenceValue[] = [];
    for (const fieldId of refFieldIds) {
        const value = values[fieldId];
        const items = Array.isArray(value) ? value : [value];
        refs.push(...items.filter(isRefValue));
    }
    return refs;
}

/**
 * Spreads loaded referenced entry values into the ref values, so `{values.location.slug}`
 * resolves against the referenced entry. Refs that aren't loaded yet are left as they are.
 */
export function withRefValues(
    entry: EntryData,
    refFieldIds: string[],
    refValues: RefValuesMap
): EntryData {
    const values = entry.values as EntryData | undefined;
    if (!values || refFieldIds.length === 0) {
        return entry;
    }

    const expand = (value: unknown) => {
        if (!isRefValue(value) || !refValues[value.id]) {
            return value;
        }
        return { ...refValues[value.id], ...value };
    };

    const expanded = { ...values };
    for (const fieldId of refFieldIds) {
        const value = values[fieldId];
        expanded[fieldId] = Array.isArray(value) ? value.map(expand) : expand(value);
    }
    return { ...entry, values: expanded };
}

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

export function buildEditorUrl(domain: string, previewPath: string): string {
    const base = domain.endsWith("/") ? domain.slice(0, -1) : domain;
    const bracketIndex = previewPath.indexOf("{");
    const staticPrefix = bracketIndex >= 0 ? previewPath.substring(0, bracketIndex) : previewPath;
    const trimmed = staticPrefix.endsWith("/") ? staticPrefix.slice(0, -1) : staticPrefix;
    return `${base}${trimmed}/preview`;
}

export function buildDisplayUrl(domain: string, path: string, entry: EntryData): string {
    const base = domain.endsWith("/") ? domain.slice(0, -1) : domain;
    const resolvedPath = resolveSlugPattern(path, entry);
    const normalizedPath = resolvedPath.startsWith("/") ? resolvedPath : `/${resolvedPath}`;
    return `${base}${normalizedPath}`;
}
