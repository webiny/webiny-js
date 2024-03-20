import { ColumnSort, TrashBinEntryDTO } from "@webiny/app-trash-bin-common";
import { TrashBinMetaResponse } from "@webiny/app-trash-bin-common/types";

export interface TrashBinPresenterViewModel {
    entries: TrashBinEntryDTO[];
    selectedEntries: TrashBinEntryDTO[];
    sorting: ColumnSort[];
    loading: Record<string, boolean>;
    meta: TrashBinMetaResponse;
}

export interface ITrashBinPresenter {
    init: () => Promise<void>;
    get vm(): TrashBinPresenterViewModel;
}
