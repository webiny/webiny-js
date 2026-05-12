import { createFolderFieldDecoratorFactory } from "@webiny/app-aco";
import type { BulkActionConfig } from "./BulkAction.js";
import { BulkAction } from "./BulkAction.js";
import type { FilterConfig } from "./Filter.js";
import { Filter } from "./Filter.js";
import type { FiltersToWhereConverter } from "./FiltersToWhere.js";
import { FiltersToWhere } from "./FiltersToWhere.js";
import { FilterByTags } from "./FilterByTags.js";
import { FolderAction } from "./FolderAction.js";
import { FileAction } from "./FileAction.js";
import type { TableConfig } from "./Table/index.js";
import { Table } from "./Table/index.js";
import type { BulkEditFieldConfig } from "./BulkEditField.js";
import { BulkEditField } from "./BulkEditField.js";
import { Action } from "./Grid/Action.js";
import { Thumbnail } from "./Grid/Thumbnail.js";
import type { GridConfig } from "./Grid/index.js";
import { ActionButton } from "~/presentation/FileList/components/Grid/ActionButton.js";
import { File } from "~/presentation/FileList/components/Grid/File.js";
import { shouldDecorateFolderField } from "./FolderFieldDecorator.js";
import { FolderDropConfirmation } from "./FolderDropConfirmation.js";
import { RecordConfig } from "@webiny/app-aco/config/record";

export interface BrowserConfig {
    bulkActions: BulkActionConfig[];
    bulkEditFields: BulkEditFieldConfig[];
    filters: FilterConfig[];
    filtersToWhere: FiltersToWhereConverter[];
    filterByTags: boolean;
    table: TableConfig;
    grid: GridConfig;
    file: RecordConfig;
}

export const Browser = {
    Grid: {
        Item: Object.assign(File, {
            Thumbnail,
            Action: Object.assign(Action, { IconButton: ActionButton })
        })
    },
    BulkAction,
    BulkEditField,
    Filter,
    FiltersToWhere,
    FilterByTags,
    Folder: {
        ExtensionField: {
            createDecorator: createFolderFieldDecoratorFactory({
                scope: "fm",
                shouldDecorate: shouldDecorateFolderField
            })
        },
        Action: FolderAction,
        DropConfirmation: FolderDropConfirmation
    },
    File: {
        Action: FileAction
    },
    Table
};
