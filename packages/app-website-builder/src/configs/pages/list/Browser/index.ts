import { PageAction, PageActionConfig } from "./PageAction";
import { Table, TableConfig } from "./Table";
import {
    FiltersToWhere,
    type FiltersToWhereConverter
} from "~/configs/pages/list/Browser/FiltersToWhere.js";
import { Filter, type FilterConfig } from "~/configs/pages/list/Browser/Filter.js";
import { FolderAction, FolderActionConfig } from "~/configs/pages/list/Browser/FolderAction.js";

export interface BrowserConfig {
    filters: FilterConfig[];
    filtersToWhere: FiltersToWhereConverter[];
    folderActions: FolderActionConfig[];
    pageActions: PageActionConfig[];
    table: TableConfig;
}

export const Browser = {
    Filter,
    FiltersToWhere,
    Folder: {
        Action: FolderAction
    },
    PageAction,
    Table
};
