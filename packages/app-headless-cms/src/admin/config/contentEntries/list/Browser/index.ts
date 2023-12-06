import { BulkAction, BulkActionConfig } from "./BulkAction";
import { Filter, FilterConfig } from "./Filter";
import { FiltersToWhere, FiltersToWhereConverter } from "./FiltersToWhere";
import { FolderAction, FolderActionConfig } from "./FolderAction";

export interface BrowserConfig {
    bulkActions: BulkActionConfig[];
    filters: FilterConfig[];
    filtersToWhere: FiltersToWhereConverter[];
    folderActions: FolderActionConfig[];
}

export const Browser = {
    BulkAction,
    Filter,
    FiltersToWhere,
    FolderAction
};
