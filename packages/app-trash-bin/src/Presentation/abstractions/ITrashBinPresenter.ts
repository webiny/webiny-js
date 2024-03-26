import { TrashBinItemDTO } from "@webiny/app-trash-bin-common";
import { ColumnSorting } from "@webiny/app-utils";
import { TrashBinMetaResponse } from "@webiny/app-trash-bin-common/types";

export interface TrashBinPresenterViewModel {
    items: TrashBinItemDTO[];
    selectedItems: TrashBinItemDTO[];
    sorting: ColumnSorting[];
    loading: Record<string, boolean>;
    isEmptyView: boolean;
    meta: TrashBinMetaResponse;
    searchQuery: string | undefined;
    searchLabel: string;
}

export interface ITrashBinPresenter {
    get vm(): TrashBinPresenterViewModel;
}
