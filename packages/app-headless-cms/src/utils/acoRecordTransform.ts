import { CmsContentEntry } from "@webiny/app-headless-cms-common/types";
import { FolderEntry, RecordEntry } from "~/admin/components/ContentEntries/Table/types";
import { FolderItem } from "@webiny/app-aco/types";

export const transformCmsContentEntryToRecordEntry = (item: CmsContentEntry): RecordEntry => {
    return {
        id: item.id,
        type: "RECORD",
        title: item.meta.title,
        description: item.meta.description,
        image: item.meta.image,
        createdBy: item.createdBy.displayName,
        savedOn: item.savedOn,
        status: item.meta.status,
        version: item.meta.version,
        original: item,
        selectable: true
    };
};
export const transformCmsContentEntriesToRecordEntries = (
    items: CmsContentEntry[]
): RecordEntry[] => {
    return items.map(item => {
        return transformCmsContentEntryToRecordEntry(item);
    });
};

export const transformFolderItemToFolderEntry = (item: FolderItem): FolderEntry => {
    return {
        id: item.id,
        type: "FOLDER",
        title: item.title,
        createdBy: item.createdBy.displayName || "-",
        savedOn: item.createdOn,
        original: item,
        selectable: false
    };
};
export const transformFolderItemsToFolderEntries = (items: FolderItem[]): FolderEntry[] => {
    return items.map(item => {
        return transformFolderItemToFolderEntry(item);
    });
};
