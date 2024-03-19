import { ColumnSort, TrashBinEntryDTO } from "~/domain";

export interface TrashBinPresenterViewModel {
    entries: TrashBinEntryDTO[];
    selectedEntries: TrashBinEntryDTO[];
    sorting: ColumnSort[];
    loading: Record<string, boolean>;
}

export interface ITrashBinPresenter {
    init: () => Promise<void>;
    get vm(): TrashBinPresenterViewModel;
}
