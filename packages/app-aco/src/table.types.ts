import { FolderItem } from "~/types";

export interface BaseTableItem {
    $selectable: boolean;
    $type: string;
}

export interface FolderTableItem extends BaseTableItem, FolderItem {
    $type: "FOLDER";
}

export interface RecordTableItem extends BaseTableItem {
    $type: "RECORD";
}
