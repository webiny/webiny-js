import {
    ColumnVisibility as IColumnVisibility,
    DefaultData,
    OnColumnVisibilityChange,
    Sorting,
    TableRow
} from "@webiny/ui/DataTable";
import { makeAutoObservable } from "mobx";
import { ColumnDTO } from "~/components/Table/domain";
import { ColumnPresenter } from "~/components/Table/ColumnPresenter";
import { DataPresenter } from "~/components/Table/DataPresenter";

export interface TablePresenterViewModel<T> {
    columns: ColumnDTO[];
    data: T[];
    selected: DefaultData[];
    columnVisibility: IColumnVisibility;
    initialSorting: Sorting;
}

export interface ITablePresenter<T extends DefaultData> {
    loadData: (data: T[]) => Promise<void>;
    updateColumnVisibility: OnColumnVisibilityChange;
    enableRowSelection: (row: TableRow<T>) => boolean;
    get vm(): TablePresenterViewModel<T>;
}

export class TablePresenter<T extends DefaultData> implements ITablePresenter<T> {
    private columnPresenter: ColumnPresenter;
    private dataPresenter: DataPresenter<T>;

    constructor(columnPresenter: ColumnPresenter, dataPresenter: DataPresenter<T>) {
        this.columnPresenter = columnPresenter;
        this.dataPresenter = dataPresenter;
        makeAutoObservable(this);
    }

    async loadData(data: T[]) {
        await this.dataPresenter.loadData(data);
    }

    async loadSelected(selected: DefaultData[]) {
        await this.dataPresenter.loadSelected(selected);
    }

    get vm() {
        return {
            columns: this.columnPresenter.vm.columns,
            columnVisibility: this.columnPresenter.vm.columnVisibility,
            data: this.dataPresenter.vm.data,
            selected: this.dataPresenter.vm.selected,
            initialSorting: [
                {
                    id: "savedOn",
                    desc: true
                }
            ]
        };
    }

    public updateColumnVisibility: OnColumnVisibilityChange = updaterOrValue =>
        this.columnPresenter.updateColumnVisibility(updaterOrValue);

    public enableRowSelection = (row: TableRow<T>) => this.dataPresenter.enableRowSelection(row);
}
