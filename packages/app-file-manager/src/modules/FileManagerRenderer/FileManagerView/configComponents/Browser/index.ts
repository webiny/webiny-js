import { BulkAction, BulkActionConfig } from "./BulkAction";
import { Filter, FilterConfig } from "./Filter";
import { FiltersToWhere, FiltersToWhereConverter } from "./FiltersToWhere";
import { FilterByTags } from "./FilterByTags";
import { FolderAction, FolderActionConfig } from "./FolderAction";
import { Table, TableConfig } from "./Table";

export interface BrowserConfig {
    bulkActions: BulkActionConfig[];
    filters: FilterConfig[];
    filtersToWhere: FiltersToWhereConverter[];
    filterByTags: Boolean;
    folderActions: FolderActionConfig[];
    table: TableConfig;
}

export const Browser = {
    BulkAction,
    Filter,
    FiltersToWhere,
    FilterByTags,
    FolderAction,
    Table
};
