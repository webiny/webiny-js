import { ColumnSort, TrashBinItemDTO } from "~/domain";
import { TrashBinMetaResponse } from "~/types";

export interface TrashBinPresenterViewModel {
    entries: TrashBinItemDTO[];
    selectedEntries: TrashBinItemDTO[];
    sorting: ColumnSort[];
    loading: Record<string, boolean>;
    meta: TrashBinMetaResponse;
}

export interface ITrashBinPresenter {
    init: () => Promise<void>;
    get vm(): TrashBinPresenterViewModel;
}
