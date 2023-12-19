import { makeAutoObservable, runInAction } from "mobx";
import {
    ColumnVisibility as IColumnVisibility,
    OnColumnVisibilityChange
} from "@webiny/ui/DataTable";
import { ColumnRepository } from "~/components/Table/domain/ColumnRepository";
import { ColumnDTO } from "~/components/Table/domain";

export class ColumnPresenter {
    private repository: ColumnRepository;
    private columns: ColumnDTO[] = [];
    private columnVisibility: IColumnVisibility = {};

    constructor(repository: ColumnRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async load() {
        const columns = await this.repository.listColumns();
        const columnVisibility = await this.repository.getColumnVisibility();

        runInAction(() => {
            this.columns = columns;
            this.columnVisibility = columnVisibility;
        });
    }

    public updateColumnVisibility: OnColumnVisibilityChange = updaterOrValue => {
        if (!this.columnVisibility) {
            return;
        }

        if (typeof updaterOrValue === "function") {
            updaterOrValue(this.columnVisibility);
        }

        this.columnVisibility = {
            ...this.columnVisibility,
            ...updaterOrValue
        };

        this.repository.updateColumnVisibility(this.columnVisibility);
    };

    get vm() {
        return {
            columns: this.columns,
            columnVisibility: this.columnVisibility
        };
    }
}
