import type { ColumnSorting } from "@webiny/app-utils";
import type { SchedulerMetaResponse } from "~/types.js";
import type { SchedulerItem } from "~/Domain/index.js";

export interface SchedulerPresenterViewModel {
    items: SchedulerItem[];
    selectedItems: SchedulerItem[];
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

export interface ISchedulerPresenter {
    get vm(): SchedulerPresenterViewModel;
}
