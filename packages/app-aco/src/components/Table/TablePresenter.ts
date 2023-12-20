import {
    ColumnVisibility as IColumnVisibility,
    DefaultData,
    OnColumnVisibilityChange,
    Sorting,
    TableRow
} from "@webiny/ui/DataTable";
import { makeAutoObservable, runInAction } from "mobx";
import { ColumnDTO } from "~/components/Table/domain";
import { ColumnPresenter } from "~/components/Table/ColumnPresenter";

export interface TablePresenterViewModel<T> {
    columns: ColumnDTO[];
    selectedRows: T[];
    columnVisibility: IColumnVisibility;
    initialSorting: Sorting;
}

interface LoadParamsInterface<T> {
    data: T[];
    selected: DefaultData[];
}

export interface ITablePresenter<T extends DefaultData> {
    load: (configs: LoadParamsInterface<T>) => void;
    updateColumnVisibility: OnColumnVisibilityChange;
    isRowSelectable: (row: TableRow<T>) => boolean;
    get vm(): TablePresenterViewModel<T>;
}

export class TablePresenter<T extends DefaultData> implements ITablePresenter<T> {
    private columnPresenter: ColumnPresenter;
    private data: T[];
    private selected: DefaultData[];

    constructor(columnPresenter: ColumnPresenter) {
        this.columnPresenter = columnPresenter;
        this.data = [];
        this.selected = [];

        makeAutoObservable(this);
    }

    async load(params: LoadParamsInterface<T>) {
        await this.columnPresenter.load();

        runInAction(() => {
            this.data = params.data;
            this.selected = params.selected;
        });
    }

    get vm() {
        return {
            columns: this.columnPresenter.vm.columns,
            columnVisibility: this.columnPresenter.vm.columnVisibility,
            selectedRows: this.getSelectedRows(),
            initialSorting: this.getInitialSorting()
        };
    }

    public updateColumnVisibility: OnColumnVisibilityChange = updaterOrValue =>
        this.columnPresenter.updateColumnVisibility(updaterOrValue);

    public isRowSelectable(row: TableRow<T>) {
        return row.original.$selectable || false;
    }

    private getInitialSorting = () => {
        return [
            {
                id: "savedOn",
                desc: true
            }
        ];
    };

    private getSelectedRows() {
        return this.data.filter(row => this.selected.find(item => row.id === item.id));
    }
}
