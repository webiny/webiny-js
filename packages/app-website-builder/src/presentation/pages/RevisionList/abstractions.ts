import { createAbstraction } from "@webiny/feature/admin";
import type { PageRevision } from "~/domain/PageRevision/PageRevision.js";

export interface IRevisionListPresenterInit {
    entryId: string;
}

/**
 * A revision plus what may be done to it. Capabilities are part of the view model so that the
 * view never derives policy, and so that other apps can restrict actions by decorating this
 * presenter instead of the individual menu items.
 */
export interface IRevisionListItemVm {
    revision: PageRevision;
    canCreateFrom: boolean;
    canEdit: boolean;
    canPublish: boolean;
    canUnpublish: boolean;
    canDelete: boolean;
}

export interface IRevisionListVm {
    revisions: IRevisionListItemVm[];
    isLoading: boolean;
    isMutating: boolean;
    isEmpty: boolean;
}

export interface IRevisionListPresenter {
    init(params: IRevisionListPresenterInit): void;
    vm: IRevisionListVm;
}

export const RevisionListPresenter = createAbstraction<IRevisionListPresenter>(
    "WebsiteBuilder/RevisionListPresenter"
);

export namespace RevisionListPresenter {
    export type Interface = IRevisionListPresenter;
    export type Init = IRevisionListPresenterInit;
    export type ViewModel = IRevisionListVm;
    export type ItemViewModel = IRevisionListItemVm;
}
