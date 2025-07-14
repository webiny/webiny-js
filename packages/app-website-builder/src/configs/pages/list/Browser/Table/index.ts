import { Column, type ColumnConfig } from "./Column";

export interface TableConfig {
    columns: ColumnConfig[];
}

export const Table = {
    Column
};
