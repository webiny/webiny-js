import { makeAutoObservable, runInAction } from "mobx";
import {
    ColumnVisibility as IColumnVisibility,
    OnColumnVisibilityChange
} from "@webiny/ui/DataTable";
import { ColumnRepository } from "~/components/Table/domain/ColumnRepository";
import { ColumnDTO } from "~/components/Table/domain";

export class ColumnPresenter {
    private repository: ColumnRepository;

    constructor(repository: ColumnRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async load() {
        await this.repository.listColumns();
    }

    get vm() {
        return {
            columns: this.repository.getColumns(),
            columnVisibility: this.repository.getColumnVisibility()
        };
    }

    public updateColumnVisibility: OnColumnVisibilityChange = updaterOrValue => {
        const columnVisibility = this.repository.getColumnVisibility();

        if (typeof updaterOrValue === "function") {
            this.repository.updateColumnVisibility(updaterOrValue(columnVisibility));
            return;
        }

        this.repository.updateColumnVisibility({
            ...columnVisibility,
            ...updaterOrValue
        });
    };

    private getColumnVisibility(columns: ColumnDTO[]) {
        return columns.reduce((columnVisibility, column) => {
            const { name, visible } = column;

            columnVisibility[name] = visible;

            return columnVisibility;
        }, {} as IColumnVisibility);
    }
}
