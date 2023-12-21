import { makeAutoObservable } from "mobx";
import { OnColumnVisibilityChange } from "@webiny/ui/DataTable";
import { ColumnRepository } from "~/components/Table/domain";

export class ColumnPresenter {
    private repository: ColumnRepository;

    constructor(repository: ColumnRepository) {
        this.repository = repository;
        makeAutoObservable(this);
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
}
