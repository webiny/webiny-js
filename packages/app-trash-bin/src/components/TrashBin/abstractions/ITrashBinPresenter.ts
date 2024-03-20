import { ColumnSort, TrashBinItemDTO } from "@webiny/app-trash-bin-common";
import { TrashBinMetaResponse } from "@webiny/app-trash-bin-common/types";

export interface TrashBinPresenterViewModel {
    items: TrashBinItemDTO[];
    selectedItems: TrashBinItemDTO[];
    sorting: ColumnSort[];
    loading: Record<string, boolean>;
    meta: TrashBinMetaResponse;
}

export interface ITrashBinPresenter {
    init: () => Promise<void>;
    get vm(): TrashBinPresenterViewModel;
}
