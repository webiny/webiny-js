import { ColumnSort } from "~/abstractions/ISortMapper";

export interface SortPresenterViewModel {
    sorting: ColumnSort[];
}

export interface ISortPresenter {
    init: () => Promise<void>;
    get vm(): SortPresenterViewModel;
}
