import type { CmsEntryValues, CmsModel } from "~/types/index.js";

const TITLE_PREFIX = "Copy of ";

/**
 * Prepares the complete values of the duplicated entry, so it can be stored with a single create operation.
 * Values are deep-cloned once and only the title (when it is a text field) is changed. All other values,
 * including unique fields, are copied as-is, since validation is skipped when creating the duplicate.
 */
export const prepareDuplicateValues = <T extends CmsEntryValues = CmsEntryValues>(
    model: Pick<CmsModel, "titleFieldId" | "fields">,
    source: T
): T => {
    const values = structuredClone(source) as CmsEntryValues;

    const titleField = model.titleFieldId
        ? model.fields.find(field => field.fieldId === model.titleFieldId)
        : undefined;
    if (!titleField || titleField.type !== "text") {
        return values as T;
    }

    const title = values[titleField.fieldId];
    if (typeof title === "string" && title) {
        values[titleField.fieldId] = `${TITLE_PREFIX}${title}`;
    }

    return values as T;
};
