import type { ColumnConfig } from "./Column.js";
import { Column } from "./Column.js";
import type { SortingConfig } from "./Sorting.js";
import { Sorting } from "./Sorting.js";
export interface TableConfig {
    columns: ColumnConfig[];
    sorting: SortingConfig[];
}

export const Table = {
    Column,
    Sorting
};
