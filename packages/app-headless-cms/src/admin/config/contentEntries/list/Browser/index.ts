import { createFolderFieldDecoratorFactory } from "@webiny/app-aco";
import type { AdvancedSearchConfig } from "./AdvancedSearch/index.js";
import { AdvancedSearch } from "./AdvancedSearch/index.js";
import type { BulkActionConfig } from "./BulkAction.js";
import { BulkAction } from "./BulkAction.js";
import { EntryAction } from "./EntryAction.js";
import type { FilterConfig } from "./Filter.js";
import { Filter } from "./Filter.js";
import type { FiltersToWhereConverter } from "./FiltersToWhere.js";
import { FiltersToWhere } from "./FiltersToWhere.js";
import { FolderAction } from "./FolderAction.js";
import type { TableConfig } from "./Table/index.js";
import { Table } from "./Table/index.js";
import { shouldDecorateFolderField } from "./FolderFieldDecorator.js";
import { FolderDropConfirmation } from "./FolderDropConfirmation.js";
import { FolderConfig } from "@webiny/app-aco/config/folder";
import { RecordConfig } from "@webiny/app-aco/config/record";
import type { SidebarFooterConfig } from "./SidebarFooter.js";
import { SidebarFooter } from "./SidebarFooter.js";

export type { SidebarFooterConfig };

export interface BrowserConfig {
    advancedSearch: AdvancedSearchConfig;
    table: TableConfig;
    folder: FolderConfig[];
    entry: RecordConfig[];
    bulkActions: BulkActionConfig[];
    filters: FilterConfig[];
    filtersToWhere: FiltersToWhereConverter[];
    sidebarFooter: SidebarFooterConfig[];
}

export const Browser = {
    AdvancedSearch,
    BulkAction,
    Filter,
    FiltersToWhere,
    Table,
    Sidebar: {
        Footer: SidebarFooter
    },
    Folder: {
        ExtensionField: {
            createDecorator: createFolderFieldDecoratorFactory({
                scope: "cms",
                shouldDecorate: shouldDecorateFolderField
            })
        },
        Action: FolderAction,
        DropConfirmation: FolderDropConfirmation
    },
    Entry: {
        Action: EntryAction
    }
};
