import { makeAutoObservable } from "mobx";
import { ColumnDTO } from "./Column";
import { IColumnsRepository } from "./IColumnsRepository";

export class ColumnsRepository implements IColumnsRepository {
    private readonly columns: ColumnDTO[];

    constructor(columns: ColumnDTO[]) {
        this.columns = columns;
        makeAutoObservable(this);
    }

    getColumns(): ColumnDTO[] {
        return this.columns;
    }

    init(): Promise<void> {
        return Promise.resolve();
    }
}
