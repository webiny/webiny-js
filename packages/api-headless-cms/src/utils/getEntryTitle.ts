import { CmsEntry, CmsModel } from "~/types";

export function getEntryTitle(
    model: Pick<CmsModel, "titleFieldId" | "fields">,
    entry: CmsEntry
): string {
    if (!model.titleFieldId) {
        return entry.id;
    }
    const field = model.fields.find(f => f.fieldId === model.titleFieldId);
    if (!field) {
        return entry.id;
    }
    const titleFieldId = field.fieldId;
    const titleValue = entry.values[titleFieldId];
    if (!titleValue) {
        return entry.id;
    }

    const { enabled = false, values } = field.predefinedValues || {};
    if (!enabled || !values || Array.isArray(values) === false) {
        return titleValue;
    }
    for (const value of values) {
        // needs to be loose because titleValue can be a number and value can be a string - but it must match
        if (value.value == titleValue) {
            return value.label;
        }
    }
    return titleValue;
}
