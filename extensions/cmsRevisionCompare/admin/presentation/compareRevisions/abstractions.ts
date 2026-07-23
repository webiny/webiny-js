import { createAbstraction } from "webiny/admin";
import type { RevisionsListPresenter } from "webiny/admin/cms/entry/editor";

interface CompareRevisionsResult {
    html: string;
    summary: string;
}

export interface ICompareRevisionsViewModel {
    drawerVisible: boolean;
    revisions: RevisionsListPresenter.ViewModel["revisions"];
    selectedIds: string[];
    canCompare: boolean;
    dialogVisible: boolean;
    comparing: boolean;
    error: string | null;
    result: CompareRevisionsResult | null;
}

export interface ICompareRevisionsPresenter {
    vm: ICompareRevisionsViewModel;
    showDrawer(): void;
    hideDrawer(): void;
    toggleRevision(revisionId: string): void;
    compare(modelId: string): Promise<void>;
    hideDialog(): void;
}

export const CompareRevisionsPresenter = createAbstraction<ICompareRevisionsPresenter>(
    "CmsRevisionCompare/CompareRevisionsPresenter"
);

export namespace CompareRevisionsPresenter {
    export type Interface = ICompareRevisionsPresenter;
    export type ViewModel = ICompareRevisionsViewModel;
}
