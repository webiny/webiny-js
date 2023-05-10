import { CmsEntry, CmsModel } from "~/types";

export function getEntryImage(
    model: Pick<CmsModel, "imageFieldId" | "fields">,
    entry: CmsEntry
): string | null {
    if (!model.imageFieldId) {
        return null;
    }
    const field = model.fields.find(f => f.fieldId === model.imageFieldId);
    if (!field) {
        return null;
    }
    const imageFieldId = field.fieldId;
    return entry.values[imageFieldId] || null;
}
