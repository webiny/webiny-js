import { computed, makeAutoObservable, runInAction } from "mobx";
import { RevisionsListPresenter } from "@webiny/app-headless-cms/exports/admin/cms/entry/editor.js";
import { CompareEntryRevisionsUseCase } from "~/admin/features/compareEntryRevisions/abstractions.js";
import { CmsCompareEntryRevisionsPresenter } from "./abstractions.js";
import type { ICmsCompareEntryRevisionsViewModel } from "./abstractions.js";

class CmsCompareEntryRevisionsPresenterImpl implements CmsCompareEntryRevisionsPresenter.Interface {
    private drawerVisible = false;
    private selectedIds: string[] = [];
    private dialogVisible = false;
    private comparing = false;
    private error: string | null = null;
    private result: { html: string; summary: string } | null = null;

    constructor(
        private revisionsPresenter: RevisionsListPresenter.Interface,
        private useCase: CompareEntryRevisionsUseCase.Interface
    ) {
        makeAutoObservable<CmsCompareEntryRevisionsPresenterImpl, "revisionsPresenter" | "useCase">(
            this,
            {
                revisionsPresenter: false,
                useCase: false,
                vm: computed
            }
        );
    }

    get vm(): ICmsCompareEntryRevisionsViewModel {
        return {
            drawerVisible: this.drawerVisible,
            revisions: this.revisionsPresenter.vm.revisions,
            selectedIds: this.selectedIds,
            canCompare: this.selectedIds.length === 2,
            dialogVisible: this.dialogVisible,
            comparing: this.comparing,
            error: this.error,
            result: this.result
        };
    }

    showDrawer(): void {
        this.drawerVisible = true;
    }

    hideDrawer(): void {
        this.drawerVisible = false;
        this.selectedIds = [];
    }

    toggleRevision(revisionId: string): void {
        const index = this.selectedIds.indexOf(revisionId);
        if (index >= 0) {
            this.selectedIds = this.selectedIds.filter(id => id !== revisionId);
        } else if (this.selectedIds.length < 2) {
            this.selectedIds = [...this.selectedIds, revisionId];
        }
    }

    async compare(modelId: string): Promise<void> {
        if (this.selectedIds.length !== 2) {
            return;
        }

        this.drawerVisible = false;
        this.dialogVisible = true;
        this.comparing = true;
        this.error = null;
        this.result = null;

        try {
            const result = await this.useCase.execute({
                modelId,
                revisionId1: this.selectedIds[0],
                revisionId2: this.selectedIds[1]
            });

            runInAction(() => {
                this.result = result;
            });
        } catch (e: unknown) {
            runInAction(() => {
                this.error = e instanceof Error ? e.message : "Failed to compare revisions";
            });
        } finally {
            runInAction(() => {
                this.comparing = false;
            });
        }
    }

    hideDialog(): void {
        this.dialogVisible = false;
        this.result = null;
        this.error = null;
        this.selectedIds = [];
    }
}

export const CmsCompareEntryRevisionsPresenterImplementation =
    CmsCompareEntryRevisionsPresenter.createImplementation({
        implementation: CmsCompareEntryRevisionsPresenterImpl,
        dependencies: [RevisionsListPresenter, CompareEntryRevisionsUseCase]
    });
