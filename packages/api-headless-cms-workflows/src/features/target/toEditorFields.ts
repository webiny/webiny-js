import type {
    CmsEntryValues,
    CmsModel,
    CmsModelField
} from "@webiny/api-headless-cms/types/index.js";
import type { ReviewTargetEditorField } from "@webiny/api-workflows/features/review/ReviewTargetEditor/abstractions.js";

/** The field types the AI may write (R172). Everything else is read-only. */
export const WRITABLE_FIELD_TYPES: string[] = [
    "text",
    "long-text",
    "number",
    "boolean",
    "datetime"
];

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

const flattenFields = (
    fields: CmsModelField[],
    values: Record<string, unknown>,
    parentPath: string[]
): ReviewTargetEditorField[] => {
    const rows: ReviewTargetEditorField[] = [];
    for (const field of fields) {
        const segments = [...parentPath, field.fieldId];
        const value = values[field.fieldId];
        const children = field.settings?.fields;
        if (field.type === "object" && !field.list && Array.isArray(children)) {
            rows.push(...flattenFields(children, isRecord(value) ? value : {}, segments));
            continue;
        }
        rows.push({
            path: segments.join("."),
            label: field.label,
            type: field.type,
            value: value === undefined ? null : value,
            writable: !field.list && WRITABLE_FIELD_TYPES.includes(field.type)
        });
    }
    return rows;
};

/**
 * The fields of a CMS revision as the target editor shows them (R172): every field, nested
 * `object` fields flattened to dotted paths, `writable` only for top-level or nested-object fields
 * of a writable type that are not `multipleValues` (`field.list`). A list object is one read-only
 * row and is never descended into, so nothing inside a `multipleValues` object is writable. Pure.
 */
export const toEditorFields = (
    model: Pick<CmsModel, "fields">,
    values: CmsEntryValues
): ReviewTargetEditorField[] => {
    return flattenFields(model.fields, values, []);
};
