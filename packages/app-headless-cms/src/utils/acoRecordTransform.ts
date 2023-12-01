import { CmsContentEntry } from "@webiny/app-headless-cms-common/types";
import { Entry, FolderEntry, RecordEntry } from "~/admin/components/ContentEntries/Table/types";
import { FolderItem } from "@webiny/app-aco/types";

export const transformCmsContentEntryToRecordEntry = (item: CmsContentEntry): RecordEntry => {
    return {
        id: item.id,
        $type: "RECORD",
        $selectable: true,
        title: item.meta.title,
        description: item.meta.description,
        image: item.meta.image,
        createdBy: item.createdBy.displayName,
        createdOn: item.createdOn,
        savedOn: item.savedOn,
        status: item.meta.status,
        version: item.meta.version,
        location: item.wbyAco_location,
        original: item
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
        $type: "FOLDER",
        $selectable: false,
        title: item.title,
        createdBy: item.createdBy.displayName || "-",
        createdOn: item.createdOn,
        savedOn: item.createdOn,
        original: item
    };
};
export const transformFolderItemsToFolderEntries = (items: FolderItem[]): FolderEntry[] => {
    return items.map(item => {
        return transformFolderItemToFolderEntry(item);
    });
};

export const isRecordEntry = (entry: Entry): entry is RecordEntry => {
    return entry.$type === "RECORD";
};
