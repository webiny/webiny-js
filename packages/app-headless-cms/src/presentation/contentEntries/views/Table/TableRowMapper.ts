import type { FolderDto } from "@webiny/app-aco";
import type { CmsContentEntry } from "~/types.js";

interface BaseTableRow<TData = unknown> {
    id: string;
    $selectable: boolean;
    $type: string;
    data: TData;
}

export interface FolderTableRow extends BaseTableRow<FolderDto> {
    $type: "FOLDER";
    $selectable: false;
}

export interface EntryTableRow extends BaseTableRow<CmsContentEntry> {
    $type: "RECORD";
    $selectable: true;
}

export type TableRow = FolderTableRow | EntryTableRow;

export const TableRowMapper = {
    fromFolder(folder: FolderDto): FolderTableRow {
        return {
            id: folder.id,
            $type: "FOLDER",
            $selectable: false,
            data: folder
        };
    },

    fromEntry(entry: CmsContentEntry): EntryTableRow {
        return {
            id: entry.id,
            $type: "RECORD",
            $selectable: true,
            data: entry
        };
    }
};
