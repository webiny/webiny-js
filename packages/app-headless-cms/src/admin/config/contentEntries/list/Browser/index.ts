import { BulkAction, BulkActionConfig } from "./BulkAction";
import { Filter, FilterConfig } from "./Filter";
import { FiltersToWhere, FiltersToWhereConverter } from "./FiltersToWhere";
import { FolderAction, FolderActionConfig } from "./FolderAction";
import { Table, TableConfig } from "./Table";

export interface BrowserConfig {
    bulkActions: BulkActionConfig[];
    filters: FilterConfig[];
    filtersToWhere: FiltersToWhereConverter[];
    folderActions: FolderActionConfig[];
    table: TableConfig;
}

export const Browser = {
    BulkAction,
    Filter,
    FiltersToWhere,
    FolderAction,
    Table
};
