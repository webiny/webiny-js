import { createAbstraction } from "@webiny/feature/admin";
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
}

export type TableRow = FolderTableRow | EntryTableRow;

export interface ITableRowMapper {
    fromEntry(entry: CmsContentEntry): EntryTableRow;
}

export const TableRowMapper = createAbstraction<ITableRowMapper>("Cms/EntryTableRowMapper");

export namespace TableRowMapper {
    export type Interface = ITableRowMapper;
}

class TableRowMapperImpl implements ITableRowMapper {
    fromEntry(entry: CmsContentEntry): EntryTableRow {
        return {
            id: entry.id,
            $type: "RECORD",
            $selectable: true,
            data: entry
        };
    }
}

export const TableRowMapperImplementation = TableRowMapper.createImplementation({
    implementation: TableRowMapperImpl,
    dependencies: []
});

export function folderToTableRow(folder: FolderDto): FolderTableRow {
    return {
        id: folder.id,
        $type: "FOLDER",
        $selectable: false,
        data: folder
    };
}
