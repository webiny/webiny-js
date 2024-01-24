import { BulkAction, BulkActionConfig } from "./BulkAction";
import { FolderAction, FolderActionConfig } from "./FolderAction";
import { PageAction, PageActionConfig } from "./PageAction";
import { Table, TableConfig } from "./Table";

export interface BrowserConfig {
    bulkActions: BulkActionConfig[];
    folderActions: FolderActionConfig[];
    pageActions: PageActionConfig[];
    table: TableConfig;
}

export const Browser = {
    BulkAction,
    FolderAction,
    PageAction,
    Table
};
