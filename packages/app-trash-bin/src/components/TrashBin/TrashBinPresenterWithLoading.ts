import { makeAutoObservable } from "mobx";
import { ILoadingPresenter, ITrashBinPresenter } from "@webiny/app-trash-bin-common";

export class TrashBinPresenterWithLoading implements ITrashBinPresenter {
    private trashBinPresenter: ITrashBinPresenter;
    private loadingPresenter: ILoadingPresenter;

    constructor(trashBinPresenter: ITrashBinPresenter, loadingPresenter: ILoadingPresenter) {
        this.trashBinPresenter = trashBinPresenter;
        this.loadingPresenter = loadingPresenter;
        makeAutoObservable(this);
    }

    async init() {
        await this.trashBinPresenter.init();
        await this.loadingPresenter.init();
    }

    get vm() {
        return {
            ...this.trashBinPresenter.vm,
            loading: this.loadingPresenter.vm.loading
        };
    }
}
