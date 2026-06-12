import type { ColumnDTO } from "./Column.js";

export interface IColumnsRepository {
    init(): Promise<void>;
    getColumns(): ColumnDTO[];
}
