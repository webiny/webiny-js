import { CmsReferenceContentEntry, OptionItem, OptionItemCollection } from "./types";
import { CmsContentEntryStatusType } from "~/types";

export const convertReferenceEntryToOption = (entry: CmsReferenceContentEntry): OptionItem => {
    return {
        id: entry.id,
        entryId: entry.entryId,
        modelId: entry.model.modelId,
        modelName: entry.model.name,
        published: entry.published ? entry.published.id : null,
        latest: entry.id,
        status: entry.status,
        name: entry.title,
        folderId: entry.wbyAco_location?.folderId
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

export const getEntryStatus = (item: OptionItem): CmsContentEntryStatusType => {
    if (item.status === "published") {
        return "published";
    } else if (item.status === "unpublished" || (!item.published && item.status === "draft")) {
        return "unpublished";
    }
    return "draft";
};

export const getItemStatusText = (item: OptionItem): string => {
    const status = getEntryStatus(item);
    switch (status) {
        case "published":
            return "This entry is published.";
        case "unpublished":
            return "This entry has not been published.";
        default:
            return "Latest revision of this entry is in draft stage.";
    }
};
