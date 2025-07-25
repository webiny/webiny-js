import { EntryAction, EntryActionConfig } from "./EntryAction";
import { Table, TableConfig } from "./Table";

export interface BrowserConfig {
    entryActions: EntryActionConfig[];
    table: TableConfig;
}

export const Browser = {
    EntryAction,
    Table
};
