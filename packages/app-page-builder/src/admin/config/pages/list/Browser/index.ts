import { BulkAction, BulkActionConfig } from "./BulkAction";
import { FolderAction, FolderActionConfig } from "./FolderAction";
import { Table, TableConfig } from "./Table";

export interface BrowserConfig {
    bulkActions: BulkActionConfig[];
    folderActions: FolderActionConfig[];
    table: TableConfig;
}

export const Browser = {
    BulkAction,
    FolderAction,
    Table
};
