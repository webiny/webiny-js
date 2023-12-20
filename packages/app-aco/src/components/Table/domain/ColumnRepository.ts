import { makeAutoObservable } from "mobx";
import { ColumnVisibility as IColumnVisibility } from "@webiny/ui/DataTable";
import { ColumnDTO } from "~/components/Table/domain/Column";
import { LocalStorage } from "~/components/Table/LocalStorage";

export class ColumnRepository {
    private visibilityStorage: LocalStorage<IColumnVisibility>;
    private columns: ColumnDTO[] = [];
    private columnVisibility: IColumnVisibility = {};

    constructor(columns: ColumnDTO[], visibilityStorage: LocalStorage<IColumnVisibility>) {
        this.visibilityStorage = visibilityStorage;
        this.columns = columns;
        this.columnVisibility = this.loadColumnVisibility();
        makeAutoObservable(this);
    }

    getColumns() {
        return this.columns;
    }

    getColumnVisibility() {
        return this.columnVisibility;
    }

    updateColumnVisibility(columnVisibility: IColumnVisibility) {
        this.columnVisibility = columnVisibility;
        this.visibilityStorage.setToStorage(columnVisibility);
    }

    private loadColumnVisibility() {
        // Get the state from Local Storage
        const fromStorage = this.visibilityStorage.getFromStorage();

        // If the user saved a configuration previously, return it
        if (fromStorage) {
            return fromStorage;
        }

        // Otherwise calculate it from the columns configuration
        return this.columns.reduce((state, column) => {
            const { name, visible } = column;

            state[name] = visible;

            return state;
        }, {} as IColumnVisibility);
    }
}
