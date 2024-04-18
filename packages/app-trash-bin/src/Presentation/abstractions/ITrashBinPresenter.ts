import { ColumnSorting } from "@webiny/app-utils";
import { TrashBinItemDTO } from "~/Domain";
import { TrashBinMetaResponse } from "~/types";

export interface TrashBinPresenterViewModel {
    items: TrashBinItemDTO[];
    restoredItems: TrashBinItemDTO[];
    selectedItems: TrashBinItemDTO[];
    sorting: ColumnSorting[];
    loading: Record<string, boolean>;
    isEmptyView: boolean;
    isSearchView: boolean;
    meta: TrashBinMetaResponse;
    searchQuery: string | undefined;
    searchLabel: string;
    nameColumnId: string;
}

export interface ITrashBinPresenter {
    get vm(): TrashBinPresenterViewModel;
    getRestoredItemById(id: string): TrashBinItemDTO | undefined;
}
