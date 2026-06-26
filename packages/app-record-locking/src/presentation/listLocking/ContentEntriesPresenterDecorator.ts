import { comparer, reaction } from "mobx";
import type { IReactionDisposer } from "mobx";
import {
    ContentEntriesPresenter,
    type IContentEntriesPresenter,
    type IContentEntriesInitConfig
} from "@webiny/app-headless-cms/presentation/contentEntries/list/abstractions.js";
import { ListLockRecordsPresenter } from "./abstractions.js";

class ContentEntriesPresenterWithLocking implements IContentEntriesPresenter {
    private _disposeReaction: IReactionDisposer | null = null;

    constructor(
        private lockRecordsPresenter: ListLockRecordsPresenter.Interface,
        private original: IContentEntriesPresenter
    ) {}

    get vm() {
        return this.original.vm;
    }

    get list() {
        return this.original.list;
    }

    get folders() {
        return this.original.folders;
    }

    init(config?: IContentEntriesInitConfig): void {
        this.original.init(config);

        this._disposeReaction = reaction(
            () => this.original.list.vm.rows.map(r => r.id),
            entryIds => {
                if (entryIds.length === 0) {
                    return;
                }
                this.lockRecordsPresenter.fetchForEntries(entryIds, this.original.vm.model.modelId);
            },
            { fireImmediately: true, equals: comparer.structural }
        );
    }

    dispose(): void {
        if (this._disposeReaction) {
            this._disposeReaction();
            this._disposeReaction = null;
        }
        this.lockRecordsPresenter.dispose();
        this.original.dispose();
    }

    selectEntry(id: string) {
        this.original.selectEntry(id);
    }

    deselectEntry() {
        this.original.deselectEntry();
    }

    createEntry() {
        this.original.createEntry();
    }

    deleteEntry(id: string) {
        return this.original.deleteEntry(id);
    }

    publishEntry(id: string) {
        return this.original.publishEntry(id);
    }

    unpublishEntry(id: string) {
        return this.original.unpublishEntry(id);
    }

    moveEntry(id: string, folderId: string) {
        return this.original.moveEntry(id, folderId);
    }
}

export const ContentEntriesPresenterLockingDecorator = ContentEntriesPresenter.createDecorator({
    decorator: ContentEntriesPresenterWithLocking,
    dependencies: [ListLockRecordsPresenter]
});
