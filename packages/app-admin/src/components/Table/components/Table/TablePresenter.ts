import type { DataTableSorting } from "@webiny/admin-ui";

export interface TablePresenterViewModel {
    initialSorting: DataTableSorting;
}

export interface ITablePresenter {
    get vm(): TablePresenterViewModel;
}

export class TablePresenter implements ITablePresenter {
    get vm() {
        return {
            initialSorting: [
                {
                    id: "savedOn",
                    desc: true
                }
            ]
        };
    }
}
