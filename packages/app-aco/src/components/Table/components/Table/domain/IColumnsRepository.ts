import { ColumnDTO } from "./Column";

export interface IColumnsRepository {
    get(): ColumnDTO[];
    update(column: ColumnDTO): Promise<void>;
}
