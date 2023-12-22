import { ColumnVisibility, OnColumnVisibilityChange, Sorting } from "@webiny/ui/DataTable";
import { makeAutoObservable } from "mobx";
import { ColumnDTO } from "./domain";
import { ColumnsPresenter } from "./ColumnsPresenter";

export interface TablePresenterViewModel {
    columns: ColumnDTO[];
    columnsVisibility: ColumnVisibility;
    initialSorting: Sorting;
}

export interface ITablePresenter {
    get vm(): TablePresenterViewModel;
}

export class TablePresenter implements ITablePresenter {
    private columnsPresenter: ColumnsPresenter;

    constructor(columnsPresenter: ColumnsPresenter) {
        this.columnsPresenter = columnsPresenter;
        makeAutoObservable(this);
    }

    get vm() {
        return {
            columns: this.columnsPresenter.vm.columns,
            columnsVisibility: this.columnsPresenter.vm.columnsVisibility,
            initialSorting: [
                {
                    id: "savedOn",
                    desc: true
                }
            ]
        };
    }

    public updateColumnVisibility: OnColumnVisibilityChange = updaterOrValue =>
        this.columnsPresenter.updateColumnVisibility(updaterOrValue);
}
