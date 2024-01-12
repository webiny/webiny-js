import { BulkAction, BulkActionConfig } from "./BulkAction";
import { Filter, FilterConfig } from "./Filter";
import { FiltersToWhere, FiltersToWhereConverter } from "./FiltersToWhere";
import { FilterByTags } from "./FilterByTags";
import { FolderAction, FolderActionConfig } from "./FolderAction";
import { FileAction, FileActionConfig } from "./FileAction";
import { Table, TableConfig } from "./Table";
import { BulkEditField, BulkEditFieldConfig } from "./BulkEditField";

export interface BrowserConfig {
    bulkActions: BulkActionConfig[];
    bulkEditFields: BulkEditFieldConfig[];
    filters: FilterConfig[];
    filtersToWhere: FiltersToWhereConverter[];
    filterByTags: boolean;
    folderActions: FolderActionConfig[];
    fileActions: FileActionConfig[];
    table: TableConfig;
}

export const Browser = {
    BulkAction,
    BulkEditField,
    Filter,
    FiltersToWhere,
    FilterByTags,
    FolderAction,
    FileAction,
    Table
};
