import { createAbstraction } from "@webiny/feature/admin";
import type { PageRevision } from "~/domain/PageRevision/PageRevision.js";

export interface IRevisionListPresenterInit {
    entryId: string;
}

export interface IRevisionListVm {
    revisions: PageRevision[];
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
}
