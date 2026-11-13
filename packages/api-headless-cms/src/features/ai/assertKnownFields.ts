import type { CmsModel } from "~/types/index.js";

/**
 * Refuses values keyed by a field the model does not have. The entry write would drop them without
 * a word and report success, so the assistant would tell the user it set a field that was never
 * saved. Checks the top level only; nested object fields go through the same drop.
 */
export const assertKnownFields = (model: CmsModel, values: Record<string, unknown>): void => {
    const knownFieldIds = model.fields.map(field => field.fieldId);
    const fieldIds = new Set(knownFieldIds);
    const unknown = Object.keys(values).filter(fieldId => !fieldIds.has(fieldId));

    if (!unknown.length) {
        return;
    }

    const names = unknown.map(fieldId => `"${fieldId}"`).join(", ");
    throw new Error(
        `Unknown ${unknown.length === 1 ? "field" : "fields"} ${names} in "${model.modelId}". Call describeContentModel for valid field IDs.`
    );
};
