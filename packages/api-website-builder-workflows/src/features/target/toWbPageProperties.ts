import { WB_PAGE_SEO_FIELDS, WB_PAGE_TITLE_FIELD } from "./toWbPageEditorFields.js";

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

/**
 * The FULL `properties` object for the page update. The update replaces `properties` as a whole
 * (the CMS update merges top-level keys only), so every key of the current blob is carried over
 * (`path`, `language`, `social`, `seo.metaTags` and the rest) and only the written allowlisted keys
 * change. `seo` is a copy when any SEO key is written, a missing or non-object `seo` is created,
 * and an SEO key written as `null` is removed. The paths are already checked against the allowlist
 * (`toWbPageEditorFields`, `isWbPageEditorValue`), so a path is the title or one of the SEO
 * fields. The current values are never mutated. Pure.
 */
export const toWbPageProperties = (
    current: Record<string, unknown>,
    updates: Record<string, unknown>
): Record<string, unknown> => {
    const merged: Record<string, unknown> = { ...current };
    let seo: Record<string, unknown> | null = null;
    for (const [path, value] of Object.entries(updates)) {
        if (path === WB_PAGE_TITLE_FIELD.path) {
            merged.title = value;
            continue;
        }
        const field = WB_PAGE_SEO_FIELDS.find(item => item.path === path);
        if (!field) {
            continue;
        }
        if (seo === null) {
            seo = isRecord(current.seo) ? { ...current.seo } : {};
        }
        if (value === null) {
            delete seo[field.key];
        } else {
            seo[field.key] = value;
        }
    }
    if (seo !== null) {
        merged.seo = seo;
    }
    return merged;
};
