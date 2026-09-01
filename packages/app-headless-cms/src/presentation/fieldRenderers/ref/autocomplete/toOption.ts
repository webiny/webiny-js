import type { CmsReferenceEntry } from "~/features/contentEntry/refTypes.js";
import type { IRefEntryOption } from "./abstractions.js";

export function toOption(entry: CmsReferenceEntry): IRefEntryOption {
    return {
        id: entry.id,
        entryId: entry.entryId,
        modelId: entry.model.modelId,
        modelName: entry.model.name,
        name: entry.title,
        status: entry.status,
        published: entry.published !== null
    };
}
