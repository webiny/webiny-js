import type { BulkActionConfig } from "./BulkAction.js";
import { BulkAction } from "./BulkAction.js";
import type { EntryActionConfig } from "./EntryAction.js";
import { EntryAction } from "./EntryAction.js";
import type { TableConfig } from "./Table/index.js";
import { Table } from "./Table/index.js";

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
