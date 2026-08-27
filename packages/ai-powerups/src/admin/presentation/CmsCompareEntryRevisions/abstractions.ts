import { createAbstraction } from "@webiny/feature/admin";
import type { RevisionsListPresenter } from "@webiny/app-headless-cms/exports/admin/cms/entry/editor.js";

interface CompareEntryRevisionsResult {
    html: string;
    summary: string;
}

export interface ICmsCompareEntryRevisionsViewModel {
    drawerVisible: boolean;
    revisions: RevisionsListPresenter.ViewModel["revisions"];
    selectedIds: string[];
    canCompare: boolean;
    dialogVisible: boolean;
    comparing: boolean;
    error: string | null;
    result: CompareEntryRevisionsResult | null;
}

export interface ICmsCompareEntryRevisionsPresenter {
    vm: ICmsCompareEntryRevisionsViewModel;
    showDrawer(): void;
    hideDrawer(): void;
    toggleRevision(revisionId: string): void;
    compare(modelId: string): Promise<void>;
    hideDialog(): void;
}

export const CmsCompareEntryRevisionsPresenter =
    createAbstraction<ICmsCompareEntryRevisionsPresenter>(
        "AiPowerUps/CmsCompareEntryRevisionsPresenter"
    );

export namespace CmsCompareEntryRevisionsPresenter {
    export type Interface = ICmsCompareEntryRevisionsPresenter;
    export type ViewModel = ICmsCompareEntryRevisionsViewModel;
}
