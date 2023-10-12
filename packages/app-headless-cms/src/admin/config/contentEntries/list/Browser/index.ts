import { Filter, FilterConfig } from "./Filter";
import { FiltersToWhere, FiltersToWhereConverter } from "./FiltersToWhere";

export interface BrowserConfig {
    filters: FilterConfig[];
    filtersToWhere: FiltersToWhereConverter[];
}

export const Browser = {
    Filter,
    FiltersToWhere
};
