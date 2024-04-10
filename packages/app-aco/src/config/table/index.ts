import { Column, ColumnConfig } from "./Column";
import { Sorting, SortingConfig } from "./Sorting";
export interface TableConfig {
    columns: ColumnConfig[];
    sorting: SortingConfig[];
}

export const Table = {
    Column,
    Sorting
};
