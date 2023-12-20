import { makeAutoObservable } from "mobx";
import { ColumnVisibility as IColumnVisibility } from "@webiny/ui/DataTable";
import { ColumnDTO } from "~/components/Table/domain/Column";
import { LocalStorage } from "~/components/Table/LocalStorage";

export class ColumnRepository {
    private visibilityStorage: LocalStorage<IColumnVisibility>;
    private columns: ColumnDTO[] = [];

    constructor(columns: ColumnDTO[], visibilityStorage: LocalStorage<IColumnVisibility>) {
        this.visibilityStorage = visibilityStorage;
        this.columns = columns;
        makeAutoObservable(this);
    }

    async listColumns() {
        this.getColumnVisibilityFromStorage();
    }

    getColumns() {
        return this.columns;
    }

    getColumnVisibility() {
        return this.columns.reduce((columnVisibility, column) => {
            const { name, visible } = column;

            columnVisibility[name] = visible;

            return columnVisibility;
        }, {} as IColumnVisibility);
    }

    updateColumnVisibility(columnVisibility: IColumnVisibility) {
        this.columns = this.columns.map(column => {
            const updatedColumn = { ...column };
            const status = columnVisibility[column.name];

            if (status !== undefined) {
                updatedColumn.visible = status;
            }

            return updatedColumn;
        });

        this.visibilityStorage.setToStorage(columnVisibility);
    }

    private getColumnVisibilityFromStorage() {
        const columnVisibility = this.visibilityStorage.getFromStorage();

        if (!columnVisibility) {
            return;
        }

        this.columns = this.columns.map(column => {
            const { name, visible } = column;

            return {
                ...column,
                visible: columnVisibility[name] ?? visible
            };
        });
    }
}
