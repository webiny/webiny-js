import type { CmsEntryValues } from "@webiny/api-headless-cms/types/index.js";

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

/**
 * The `values` of the entry update for dotted-path writes. The CMS update merges top-level keys
 * only, so a nested write has to carry its whole object: every object on the way is a copy of the
 * current one with the new leaf set (siblings survive), and a `null` or missing object is created.
 * Only the touched top-level keys are in the patch. The paths are already checked against the
 * model (`toEditorFields`), so they are field ids. The current values are never mutated. Pure.
 */
export const toEntryValuesPatch = (
    current: CmsEntryValues,
    updates: Record<string, unknown>
): Record<string, unknown> => {
    const patch: Record<string, unknown> = {};
    // Objects this call created: only those may be written into. A copy of an object carries the
    // current nested objects by reference, so those must be copied before they are changed.
    const copies = new Set<Record<string, unknown>>();
    for (const [path, value] of Object.entries(updates)) {
        const segments = path.split(".");
        const leaf = segments[segments.length - 1];
        let target = patch;
        let source: Record<string, unknown> = current;
        for (const segment of segments.slice(0, -1)) {
            const existing = target[segment];
            const original = source[segment];
            let copy: Record<string, unknown>;
            if (isRecord(existing) && copies.has(existing)) {
                copy = existing;
            } else {
                copy = isRecord(original) ? { ...original } : {};
                copies.add(copy);
            }
            target[segment] = copy;
            target = copy;
            source = isRecord(original) ? original : {};
        }
        target[leaf] = value;
    }
    return patch;
};
