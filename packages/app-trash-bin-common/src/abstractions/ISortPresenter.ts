import { ColumnSort } from "~/domain";

export interface SortPresenterViewModel {
    sorting: ColumnSort[];
}

export interface ISortPresenter {
    init: () => Promise<void>;
    get vm(): SortPresenterViewModel;
}
