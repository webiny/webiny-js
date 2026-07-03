import { PageAction, type PageActionConfig } from "./PageAction.js";
import { Table, type TableConfig } from "./Table/index.js";
import { FiltersToWhere, type FiltersToWhereConverter } from "./FiltersToWhere.js";
import { Filter, type FilterConfig } from "./Filter.js";
import { FolderAction, type FolderActionConfig } from "./FolderAction.js";
import { BulkAction, type BulkActionConfig } from "./BulkAction.js";
import { SidebarFooter, type SidebarFooterConfig } from "./SidebarFooter.js";

export interface BrowserConfig {
    bulkActions: BulkActionConfig[];
    filters: FilterConfig[];
    filtersToWhere: FiltersToWhereConverter[];
    folderActions: FolderActionConfig[];
    pageActions: PageActionConfig[];
    table: TableConfig;
    sidebarFooter: SidebarFooterConfig[];
}

export const Browser = {
    BulkAction,
    Filter,
    FiltersToWhere,
    Folder: {
        Action: FolderAction
    },
    Page: {
        Action: PageAction
    },
    Table,
    Sidebar: {
        Footer: SidebarFooter
    }
};
