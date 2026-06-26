import { makeAutoObservable } from "mobx";
import type { ColumnDTO } from "./Column.js";
import type { IColumnsRepository } from "./IColumnsRepository.js";

export class ColumnsRepository implements IColumnsRepository {
    private readonly columns: ColumnDTO[];

    constructor(columns: ColumnDTO[]) {
        this.columns = columns;
        makeAutoObservable(this);
    }

    getColumns(): ColumnDTO[] {
        return this.sortColumns(this.columns);
    }

    init(): Promise<void> {
        return Promise.resolve();
    }

    private sortColumns(columns: ColumnDTO[]) {
        return columns
            .slice()
            .sort((a, b) => (a.name === "actions" ? 1 : b.name === "actions" ? -1 : 0));
    }
}
