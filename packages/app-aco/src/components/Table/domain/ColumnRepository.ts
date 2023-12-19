import { makeAutoObservable } from "mobx";
import { ColumnVisibility as IColumnVisibility } from "@webiny/ui/DataTable";
import { ColumnDTO } from "~/components/Table/domain/Column";
import { LocalStorage } from "~/components/Table/LocalStorage";

export class ColumnRepository {
    private visibilityStorage: LocalStorage<IColumnVisibility>;
    private columns: ColumnDTO[] = [];

    constructor(namespace: string, columns: ColumnDTO[]) {
        this.visibilityStorage = new LocalStorage(`webiny_column_visibility_${namespace}`);
        this.columns = columns;
        makeAutoObservable(this);
    }

    async listColumns() {
        return this.columns;
    }

    async getColumnVisibility() {
        const fromStorage = this.visibilityStorage.getFromStorage();

        if (fromStorage) {
            return fromStorage;
        }

        return this.columns.reduce((columnVisibility, column) => {
            const { name, visible } = column;

            columnVisibility[name] = visible;

            return columnVisibility;
        }, {} as IColumnVisibility);
    }

    async updateColumnVisibility(columnVisibility: IColumnVisibility) {
        this.visibilityStorage.setToStorage(columnVisibility);
    }
}
