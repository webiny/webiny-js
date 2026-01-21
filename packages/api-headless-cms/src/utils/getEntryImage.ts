import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";

export function getEntryImage<T extends CmsEntryValues = CmsEntryValues>(
    model: Pick<CmsModel, "imageFieldId" | "fields">,
    entry: Pick<CmsEntry<T>, "values">
): string | null {
    if (!model.imageFieldId) {
        return null;
    }
    const field = model.fields.find(f => f.fieldId === model.imageFieldId);
    if (!field) {
        return null;
    }
    const imageFieldId = field.fieldId as keyof T;
    const value = entry.values[imageFieldId];
    if (!value || typeof value !== "string") {
        return null;
    }
    return value;
}
