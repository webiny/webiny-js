import { createAbstraction } from "@webiny/feature/admin";
import type { CmsContentEntry, CmsContentEntryRevision } from "~/types.js";

/**
 * A revision plus what may be done to it. Capabilities are part of the view model so that the
 * view never derives policy, and so that other apps can restrict actions by decorating this
 * presenter instead of the individual menu items.
 */
export interface IRevisionsListItemViewModel {
    revision: CmsContentEntryRevision;
    canPublish: boolean;
    canUnpublish: boolean;
}

export interface IRevisionsListViewModel {
    loading: boolean;
    revisions: CmsContentEntryRevision[];
    /** `revisions` with their capabilities, in the same order. */
    items: IRevisionsListItemViewModel[];
    visible: boolean;
}

export interface IRevisionsListPresenter {
    vm: IRevisionsListViewModel;
    init(entryId: string): Promise<void>;
    show(): void;
    hide(): void;
    createRevision(revisionId: string): Promise<CmsContentEntry | null>;
    publishRevision(revisionId: string): Promise<boolean>;
    unpublishRevision(revisionId: string): Promise<boolean>;
    updateRevisionNote(revisionId: string, currentDescription: string): Promise<boolean>;
    deleteRevision(revisionId: string): Promise<boolean>;
    dispose(): void;
}

export const RevisionsListPresenter =
    createAbstraction<IRevisionsListPresenter>("RevisionsListPresenter");

export namespace RevisionsListPresenter {
    export type Interface = IRevisionsListPresenter;
    export type ViewModel = IRevisionsListViewModel;
    export type ItemViewModel = IRevisionsListItemViewModel;
}
