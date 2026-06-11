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

    async save(): Promise<boolean> {
        const result = await this.original.save();

        if (result) {
            await this.lockingPresenter.refreshLock();
        }

        return result;
    }

    publish(): Promise<boolean> {
        return this.original.publish();
    }

    unpublish(): Promise<boolean> {
        return this.original.unpublish();
    }

    deleteEntry(): Promise<boolean> {
        return this.original.deleteEntry();
    }

    updateRevisionDescription(description: string): Promise<boolean> {
        return this.original.updateRevisionDescription(description);
    }

    loadEntry(entryId: string): Promise<void> {
        return this.original.loadEntry(entryId);
    }

    newEntry(): void {
        return this.original.newEntry();
    }

    dispose(): void {
        return this.original.dispose();
    }
}

export const ContentEntryFormPresenterLockingDecorator = ContentEntryFormPresenter.createDecorator({
    decorator: ContentEntryFormPresenterWithLocking,
    dependencies: [RecordLockingPresenter]
});
