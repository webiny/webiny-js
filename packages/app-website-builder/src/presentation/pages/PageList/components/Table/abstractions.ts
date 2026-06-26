import { createAbstraction } from "@webiny/feature/admin";
import type { FolderTableRow as IFolderTableRow, RecordTableRow } from "@webiny/app-aco";
import type { FolderDto } from "@webiny/app-aco/domain/folder/FolderDto.js";
import type { Page, PageDto } from "~/domain/Page/index.js";

export type IPageTableRow = RecordTableRow<PageDto>;
export type ITableRow = IFolderTableRow | IPageTableRow;

export interface ITableRowMapper {
    fromPage(page: Page): ITableRow;
}

export const TableRowMapper = createAbstraction<ITableRowMapper>("WB/PageTableRowMapper");

export namespace TableRowMapper {
    export type Interface = ITableRowMapper;
    export type TableRow = ITableRow;
    export type PageTableRow = IPageTableRow;
    export type FolderTableRow = IFolderTableRow;
}

export function folderToTableRow(folder: FolderDto): ITableRow {
    return {
        id: folder.id,
        $type: "FOLDER",
        $selectable: false,
        data: folder
    };
}
