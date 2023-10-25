import { BulkAction, BulkActionConfig } from "./BulkAction";
import { Filter, FilterConfig } from "./Filter";
import { FiltersToWhere, FiltersToWhereConverter } from "./FiltersToWhere";
import { FilterByTags } from "./FilterByTags";

export interface BrowserConfig {
    bulkActions: BulkActionConfig[];
    filters: FilterConfig[];
    filtersToWhere: FiltersToWhereConverter[];
    filterByTags: Boolean;
}

export const Browser = {
    BulkAction,
    Filter,
    FiltersToWhere,
    FilterByTags
};
