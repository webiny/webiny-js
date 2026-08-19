import { compareStructural, reaction } from "mobx";
import type { IReactionDisposer } from "mobx";
import {
    ContentEntriesPresenter,
    type IContentEntriesPresenter,
    type IContentEntriesInitConfig
} from "@webiny/app-headless-cms/presentation/contentEntries/list/abstractions.js";
import { ScheduledActionsPresenter } from "./abstractions.js";

/**
 * Decorates the content-entries list presenter so the scheduled actions for the current model are
 * (re)loaded whenever the visible rows change. The reaction key includes each row's status/live,
 * so a direct publish/unpublish (which changes those, and lets the API cancel a schedule) triggers
 * a refresh without any extra signalling.
 */
class ContentEntriesPresenterWithScheduling implements IContentEntriesPresenter {
    private _disposeReaction: IReactionDisposer | null = null;

    constructor(
        private scheduledActions: ScheduledActionsPresenter.Interface,
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
            () =>
                this.original.list.vm.rows.map(
                    row => `${row.id}:${row.meta?.status ?? ""}:${row.live?.version ?? ""}`
                ),
            keys => {
                if (keys.length === 0) {
                    return;
                }
                this.scheduledActions.loadForModel(this.original.vm.model.modelId);
            },
            { fireImmediately: true, equals: compareStructural }
        );
    }

    dispose(): void {
        if (this._disposeReaction) {
            this._disposeReaction();
            this._disposeReaction = null;
        }
        this.scheduledActions.dispose();
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

export const ContentEntriesPresenterSchedulingDecorator = ContentEntriesPresenter.createDecorator({
    decorator: ContentEntriesPresenterWithScheduling,
    dependencies: [ScheduledActionsPresenter]
});
