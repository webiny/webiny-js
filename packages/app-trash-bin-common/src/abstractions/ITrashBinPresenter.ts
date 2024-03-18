import { TrashBinEntryDTO } from "~/domain";
import { ColumnSort } from "~/abstractions/ISortMapper";

export interface TrashBinPresenterViewModel {
    entries: TrashBinEntryDTO[];
    selectedEntries: TrashBinEntryDTO[];
    sorting: ColumnSort[];
    loading: boolean;
}

export interface ITrashBinPresenter {
    init: () => Promise<void>;
    get vm(): TrashBinPresenterViewModel;
}
