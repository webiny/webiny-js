import type { ColumnSorting } from "@webiny/app-utils";
import type { SchedulerMetaResponse } from "~/types.js";
import type { WbSchedulerItem } from "~/Domain/index.js";

export interface WbSchedulerPresenterViewModel {
    items: WbSchedulerItem[];
    selectedItems: WbSchedulerItem[];
    allowSelectAll: boolean;
    isSelectedAll: boolean;
    sorting: ColumnSorting[];
    loading: Record<string, boolean>;
    isEmptyView: boolean;
    isSearchView: boolean;
    meta: SchedulerMetaResponse;
    searchQuery: string | undefined;
    searchLabel: string;
    nameColumnId: string;
}

export interface IWbSchedulerPresenter {
    get vm(): WbSchedulerPresenterViewModel;
}
