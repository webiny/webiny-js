import { makeAutoObservable, runInAction } from "mobx";
import { ColumnDTO } from "./Column";
import { IColumnsRepository } from "./IColumnsRepository";

export class ColumnsRepository implements IColumnsRepository {
    private columns: ColumnDTO[] = [];

    constructor(columns: ColumnDTO[]) {
        this.columns = columns;
        makeAutoObservable(this);
    }

    get() {
        return this.columns;
    }

    async update(column: ColumnDTO) {
        const columnIndex = this.columns.findIndex(c => c.name === column.name);
        if (columnIndex > -1) {
            runInAction(() => {
                this.columns = [
                    ...this.columns.slice(0, columnIndex),
                    {
                        ...this.columns[columnIndex],
                        ...column
                    },
                    ...this.columns.slice(columnIndex + 1)
                ];
            });
        }
    }
}
