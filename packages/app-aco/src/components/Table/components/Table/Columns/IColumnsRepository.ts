import { ColumnDTO } from "./Column";

export interface IColumnsRepository {
    init(): Promise<void>;
    getColumns(): ColumnDTO[];
}
