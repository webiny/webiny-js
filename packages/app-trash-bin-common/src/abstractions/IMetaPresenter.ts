import { MetaDTO } from "~/domain/Meta";

export interface MetaPresenterViewModel {
    meta: MetaDTO;
}

export interface IMetaPresenter {
    init: () => Promise<void>;
    get vm(): MetaPresenterViewModel;
}
