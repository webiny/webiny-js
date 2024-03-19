import { makeAutoObservable } from "mobx";
import { ISortPresenter, ITrashBinPresenter } from "@webiny/app-trash-bin-common";

export class TrashBinPresenterWithSorting implements ITrashBinPresenter {
    private trashBinPresenter: ITrashBinPresenter;
    private sortPresenter: ISortPresenter;

    constructor(trashBinPresenter: ITrashBinPresenter, sortPresenter: ISortPresenter) {
        this.trashBinPresenter = trashBinPresenter;
        this.sortPresenter = sortPresenter;
        makeAutoObservable(this);
    }

    async init() {
        await this.trashBinPresenter.init();
        await this.sortPresenter.init();
    }

    get vm() {
        return {
            ...this.trashBinPresenter.vm,
            sorting: this.sortPresenter.vm.sorting
        };
    }
}
