import type { EntryActionConfig } from "./EntryAction.js";
import { EntryAction } from "./EntryAction.js";
import type { TableConfig } from "./Table/index.js";
import { Table } from "./Table/index.js";

export interface BrowserConfig {
    entryActions: EntryActionConfig[];
    table: TableConfig;
}

export const Browser = {
    EntryAction,
    Table
};
