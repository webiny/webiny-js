import { BulkAction, BulkActionConfig } from "./BulkAction";
import { Filter, FilterConfig } from "./Filter";
import { FiltersToWhere, FiltersToWhereConverter } from "./FiltersToWhere";
import { FilterByTags } from "./FilterByTags";
import { FolderAction, FolderActionConfig } from "./FolderAction";
import { FileAction, FileActionConfig } from "./FileAction";
import { Table, TableConfig } from "./Table";
import { BulkEditField, BulkEditFieldConfig } from "./BulkEditField";
import { Action } from "./Grid/Action";
import { Thumbnail } from "./Grid/Thumbnail";
import { GridConfig } from "./Grid";
import { ActionButton } from "~/components/Grid/ActionButton";

export interface BrowserConfig {
    bulkActions: BulkActionConfig[];
    bulkEditFields: BulkEditFieldConfig[];
    filters: FilterConfig[];
    filtersToWhere: FiltersToWhereConverter[];
    filterByTags: boolean;
    folderActions: FolderActionConfig[];
    fileActions: FileActionConfig[];
    table: TableConfig;
    grid: GridConfig;
}

export const Browser = {
    Grid: {
        Item: {
            Thumbnail,
            Action: Object.assign(Action, { IconButton: ActionButton })
        }
    },
    BulkAction,
    BulkEditField,
    Filter,
    FiltersToWhere,
    FilterByTags,
    FolderAction,
    FileAction,
    Table
};
