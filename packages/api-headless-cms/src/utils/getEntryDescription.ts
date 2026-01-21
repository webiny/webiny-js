import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";

export function getEntryDescription<T extends CmsEntryValues = CmsEntryValues>(
    model: Pick<CmsModel, "descriptionFieldId" | "fields">,
    entry: Pick<CmsEntry<T>, "values">
): string {
    if (!model.descriptionFieldId) {
        return "";
    }
    const field = model.fields.find(f => f.fieldId === model.descriptionFieldId);
    if (!field) {
        return "";
    }
    const descriptionFieldId = field.fieldId;
    const value = entry.values[descriptionFieldId as keyof T];
    if (!value || typeof value !== "string") {
        return "";
    }
    return value;
}
