import { BulkAction, BulkActionConfig } from "./BulkAction";
import { EntryAction, EntryActionConfig } from "./EntryAction";
import { Filter, FilterConfig } from "./Filter";
import { FiltersToWhere, FiltersToWhereConverter } from "./FiltersToWhere";
import { FolderAction, FolderActionConfig } from "./FolderAction";
import { Table, TableConfig } from "./Table";

export interface BrowserConfig {
    bulkActions: BulkActionConfig[];
    entryActions: EntryActionConfig[];
    filters: FilterConfig[];
    filtersToWhere: FiltersToWhereConverter[];
    folderActions: FolderActionConfig[];
    table: TableConfig;
}

export const Browser = {
    BulkAction,
    EntryAction,
    Filter,
    FiltersToWhere,
    FolderAction,
    Table
};
