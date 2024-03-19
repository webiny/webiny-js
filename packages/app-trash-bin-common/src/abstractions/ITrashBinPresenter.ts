import { ColumnSort, TrashBinEntryDTO } from "~/domain";
import { TrashBinMetaResponse } from "~/types";

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
