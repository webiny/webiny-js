import type { ColumnSorting } from "@webiny/app-utils";
import type { SchedulerEntry, SchedulerMetaResponse } from "~/types.js";

export interface SchedulerPresenterViewModel {
    items: SchedulerEntry[];
    selectedItems: SchedulerEntry[];
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
