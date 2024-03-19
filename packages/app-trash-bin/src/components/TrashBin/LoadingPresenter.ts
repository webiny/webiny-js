import { makeAutoObservable } from "mobx";
import { ILoadingPresenter, ILoadingRepository } from "@webiny/app-trash-bin-common";
import { LoadingPresenterViewModel } from "@webiny/app-trash-bin-common/abstractions/ILoadingPresenter";

export class LoadingPresenter implements ILoadingPresenter {
    private repository: ILoadingRepository;

    constructor(repository: ILoadingRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    init() {
        return Promise.resolve();
    }

    get vm(): LoadingPresenterViewModel {
        return {
            loading: this.repository.get()
        };
    }
}
