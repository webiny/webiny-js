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

export interface BrowserConfig {
    advancedSearch: AdvancedSearchConfig;
    table: TableConfig;
    folder: FolderConfig[];
    entry: RecordConfig[];
    bulkActions: BulkActionConfig[];
    filters: FilterConfig[];
    filtersToWhere: FiltersToWhereConverter[];
}

export const Browser = {
    AdvancedSearch,
    BulkAction,
    Filter,
    FiltersToWhere,
    Table,
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
