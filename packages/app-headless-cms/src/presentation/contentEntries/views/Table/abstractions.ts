import { createAbstraction } from "@webiny/feature/admin";
import type { FolderDto } from "@webiny/app-aco";
import type { CmsContentEntry } from "~/types.js";

interface BaseTableRow<TData = unknown> {
    id: string;
    $selectable: boolean;
    $type: string;
    data: TData;
}

export interface IFolderTableRow extends BaseTableRow<FolderDto> {
    $type: "FOLDER";
    $selectable: false;
}

export interface IEntryTableRow extends BaseTableRow<CmsContentEntry> {
    $type: "RECORD";
}

export interface ITableRowMapper {
    fromEntry(entry: CmsContentEntry): IEntryTableRow;
}

export const TableRowMapper = createAbstraction<ITableRowMapper>("Cms/EntryTableRowMapper");

export namespace TableRowMapper {
    export type Interface = ITableRowMapper;
    export type TableRow = IFolderTableRow | IEntryTableRow;
    export type FolderTableRow = IFolderTableRow;
    export type EntryTableRow = IEntryTableRow;
}
