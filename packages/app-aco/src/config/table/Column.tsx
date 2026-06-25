import { Column as BaseColumn } from "@webiny/app-admin/config/table/Column.js";
import type { TableRow } from "~/table.types.js";
import type { FolderTableRow } from "~/table.types.js";

export type { ColumnConfig, ColumnProps } from "@webiny/app-admin/config/table/Column.js";

const isFolderRow = (row: TableRow): row is FolderTableRow => {
    return row.$type === "FOLDER";
};

export const Column = Object.assign(BaseColumn, { isFolderRow });
