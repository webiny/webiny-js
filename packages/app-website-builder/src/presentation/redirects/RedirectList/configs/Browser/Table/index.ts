import { Column, type ColumnConfig } from "./Column.js";

export interface TableConfig {
    columns: ColumnConfig[];
}

export const Table = {
    Column
};
