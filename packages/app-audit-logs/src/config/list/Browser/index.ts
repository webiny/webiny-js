import type { FilterConfig } from "./Filter";
import { Filter } from "./Filter";
import type { FiltersToWhereConverter } from "./FiltersToWhere";
import { FiltersToWhere } from "./FiltersToWhere";

export interface BrowserConfig {
    filters: FilterConfig[];
    filtersToWhere: FiltersToWhereConverter[];
}

export const Browser = {
    Filter,
    FiltersToWhere
};
