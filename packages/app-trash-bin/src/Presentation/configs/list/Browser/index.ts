import { BulkAction, BulkActionConfig } from "./BulkAction";
import { EntryAction, EntryActionConfig } from "./EntryAction";
import { Table, TableConfig } from "./Table";

export interface BrowserConfig {
    bulkActions: BulkActionConfig[];
    entryActions: EntryActionConfig[];
    table: TableConfig;
}

export const Browser = {
    BulkAction,
    EntryAction,
    Table
};
