import { createFolderFieldDecoratorFactory } from "@webiny/app-aco";
import type { AdvancedSearchConfig } from "./AdvancedSearch/index.js";
import { AdvancedSearch } from "./AdvancedSearch/index.js";
import type { BulkActionConfig } from "./BulkAction.js";
import { BulkAction } from "./BulkAction.js";
import type { EntryActionConfig } from "./EntryAction.js";
import { EntryAction } from "./EntryAction.js";
import type { FilterConfig } from "./Filter.js";
import { Filter } from "./Filter.js";
import type { FiltersToWhereConverter } from "./FiltersToWhere.js";
import { FiltersToWhere } from "./FiltersToWhere.js";
import type { FolderActionConfig } from "./FolderAction.js";
import { FolderAction } from "./FolderAction.js";
import type { TableConfig } from "./Table/index.js";
import { Table } from "./Table/index.js";
import { shouldDecorateFolderField } from "./FolderFieldDecorator.js";
import { FolderDropConfirmation } from "./FolderDropConfirmation.js";

export interface BrowserConfig {
    advancedSearch: AdvancedSearchConfig;
    bulkActions: BulkActionConfig[];
    entryActions: EntryActionConfig[];
    filters: FilterConfig[];
    filtersToWhere: FiltersToWhereConverter[];
    folderActions: FolderActionConfig[];
    table: TableConfig;
}

export const Browser = {
    AdvancedSearch,
    BulkAction,
    EntryAction,
    Filter,
    FiltersToWhere,
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
    Table,
    /**
     * @deprecated
     * Use `Browser.Folder.Action` instead
     */
    FolderAction
};
