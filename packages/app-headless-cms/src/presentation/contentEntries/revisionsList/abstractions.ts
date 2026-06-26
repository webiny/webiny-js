import { createAbstraction } from "@webiny/feature/admin";
import type { CmsContentEntry, CmsContentEntryRevision } from "~/types.js";

export interface IRevisionsListViewModel {
    loading: boolean;
    revisions: CmsContentEntryRevision[];
    visible: boolean;
}

export interface IRevisionsListPresenter {
    vm: IRevisionsListViewModel;
    init(entryId: string): Promise<void>;
    show(): void;
    hide(): void;
    createRevision(revisionId: string): Promise<CmsContentEntry | null>;
    deleteRevision(revisionId: string): Promise<boolean>;
    dispose(): void;
}

export const RevisionsListPresenter =
    createAbstraction<IRevisionsListPresenter>("RevisionsListPresenter");

export namespace RevisionsListPresenter {
    export type Interface = IRevisionsListPresenter;
    export type ViewModel = IRevisionsListViewModel;
}
