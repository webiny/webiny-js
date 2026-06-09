import { RedirectAction } from "./RedirectAction.js";
import { Table, type TableConfig } from "./Table/index.js";
import { FiltersToWhere, type FiltersToWhereConverter } from "./FiltersToWhere.js";
import { Filter, type FilterConfig } from "./Filter.js";
import { FolderAction } from "./FolderAction.js";
import { BulkAction, type BulkActionConfig } from "./BulkAction.js";
import type { FolderConfig } from "@webiny/app-aco/config/folder/index.js";
import type { RecordConfig } from "@webiny/app-aco/config/record/index.js";

export interface BrowserConfig {
    bulkActions: BulkActionConfig[];
    filters: FilterConfig[];
    filtersToWhere: FiltersToWhereConverter[];
    folder: FolderConfig;
    redirect: RecordConfig;
    table: TableConfig;
}

export const Browser = {
    BulkAction,
    Filter,
    FiltersToWhere,
    Folder: {
        Action: FolderAction
    },
    Redirect: {
        Action: RedirectAction
    },
    Table
};
