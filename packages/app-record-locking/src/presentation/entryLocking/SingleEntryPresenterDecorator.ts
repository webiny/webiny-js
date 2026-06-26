import { computed, makeAutoObservable } from "mobx";
import {
    SingleEntryPresenter,
    type ISingleEntryPresenter,
    type ISingleEntryViewModel
} from "@webiny/app-headless-cms/presentation/contentEntries/singleEntry/abstractions.js";
import { RecordLockingPresenter } from "./abstractions.js";

class SingleEntryPresenterWithLocking implements ISingleEntryPresenter {
    constructor(
        private lockingPresenter: RecordLockingPresenter.Interface,
        private original: ISingleEntryPresenter
    ) {
        makeAutoObservable<SingleEntryPresenterWithLocking, "lockingPresenter" | "original">(this, {
            lockingPresenter: false,
            original: false,
            vm: computed
        });
    }

    get vm(): ISingleEntryViewModel {
        const base = this.original.vm;
        const canEdit = this.lockingPresenter.vm.canEdit;

        return {
            ...base,
            canSave: base.canSave && canEdit
        };
    }

    async init(): Promise<void> {
        return this.original.init();
    }

    async save(): Promise<boolean> {
        return this.original.save();
    }

    dispose(): void {
        return this.original.dispose();
    }
}

export const SingleEntryPresenterLockingDecorator = SingleEntryPresenter.createDecorator({
    decorator: SingleEntryPresenterWithLocking,
    dependencies: [RecordLockingPresenter]
});
