import { CmsReferenceContentEntry, OptionItem, OptionItemCollection } from "./types";

export const convertReferenceEntryToOption = (entry: CmsReferenceContentEntry): OptionItem => {
    return {
        id: entry.id,
        entryId: entry.entryId,
        modelId: entry.model.modelId,
        modelName: entry.model.name,
        published: entry.published ? entry.published.id : null,
        latest: entry.id,
        status: entry.status,
        name: entry.title
    };
};

export const convertReferenceEntriesToOptionCollection = (
    entries: CmsReferenceContentEntry[]
): OptionItemCollection => {
    return entries.reduce((collection, entry) => {
        collection[entry.entryId] = convertReferenceEntryToOption(entry);
        return collection;
    }, {} as OptionItemCollection);
};
