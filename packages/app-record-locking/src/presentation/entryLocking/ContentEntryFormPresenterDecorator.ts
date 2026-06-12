import { computed, makeAutoObservable } from "mobx";
import {
    ContentEntryFormPresenter,
    type IContentEntryFormPresenter,
    type IContentEntryFormViewModel
} from "@webiny/app-headless-cms/presentation/contentEntries/form/abstractions.js";
import { RecordLockingPresenter } from "./abstractions.js";

class ContentEntryFormPresenterWithLocking implements IContentEntryFormPresenter {
    constructor(
        private lockingPresenter: RecordLockingPresenter.Interface,
        private original: IContentEntryFormPresenter
    ) {
        makeAutoObservable<ContentEntryFormPresenterWithLocking, "lockingPresenter" | "original">(
            this,
            {
                lockingPresenter: false,
                original: false,
                vm: computed
            }
        );
    }

    get vm(): IContentEntryFormViewModel {
        const base = this.original.vm;
        const canEdit = this.lockingPresenter.vm.canEdit;

        return {
            ...base,
            canSave: base.canSave && canEdit,
            canPublish: base.canPublish && canEdit,
            canUnpublish: base.canUnpublish && canEdit,
            canDelete: base.canDelete && canEdit
        };
    }

    async saveRevision(options?: { skipValidation?: boolean }): Promise<boolean> {
        const result = await this.original.saveRevision(options);

        if (result) {
            await this.lockingPresenter.refreshLock();
        }

        return result;
    }

    publishRevision(): Promise<boolean> {
        return this.original.publishRevision();
    }

    unpublishRevision(): Promise<boolean> {
        return this.original.unpublishRevision();
    }

    deleteEntry(): Promise<boolean> {
        return this.original.deleteEntry();
    }

    loadRevision(id: string): Promise<void> {
        return this.original.loadRevision(id);
    }

    newEntry(): void {
        return this.original.newEntry();
    }

    reset(): void {
        return this.original.reset();
    }
}

export const ContentEntryFormPresenterLockingDecorator = ContentEntryFormPresenter.createDecorator({
    decorator: ContentEntryFormPresenterWithLocking,
    dependencies: [RecordLockingPresenter]
});
