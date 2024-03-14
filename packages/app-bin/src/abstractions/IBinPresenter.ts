import { BinEntryDTO } from "~/domain";

export interface BinPresenterViewModel {
    entries: BinEntryDTO[];
    loading: boolean;
}

export interface IBinPresenter {
    load: () => Promise<void>;
    get vm(): BinPresenterViewModel;
}
