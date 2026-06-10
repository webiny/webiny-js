import type { IListViewModel, IListActions } from "~/presentation/listPresenter/abstractions.js";

export interface ListViewContextValue {
    list: IListViewModel<any>;
    actions: IListActions;
    showingFilters: boolean;
    onToggleFilters?: () => void;
}
