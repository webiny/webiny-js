import { CmsContentEntry } from "@webiny/app-headless-cms-common/types";
import { FolderItem, FolderTableItem } from "@webiny/app-aco/types";
import { EntryTableItem } from "~/types";

export const transformCmsContentEntriesToRecordEntries = (
    items: CmsContentEntry[]
): EntryTableItem[] => {
    return items.map(item => ({
        $type: "RECORD",
        $selectable: true,
        ...item
    }));
};
export const transformFolderItemsToFolderEntries = (items: FolderItem[]): FolderTableItem[] => {
    return items.map(item => ({
        $type: "FOLDER",
        $selectable: false,
        ...item
    }));
};
