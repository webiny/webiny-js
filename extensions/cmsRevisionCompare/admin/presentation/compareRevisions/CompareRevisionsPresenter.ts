import { computed, makeAutoObservable, runInAction } from "mobx";
import { RevisionsListPresenter } from "webiny/admin/cms/entry/editor";
import { CompareRevisionsGateway } from "../../features/compareRevisions/abstractions.js";
import { CompareRevisionsPresenter } from "./abstractions.js";
import type { ICompareRevisionsViewModel } from "./abstractions.js";

class CompareRevisionsPresenterImpl implements CompareRevisionsPresenter.Interface {
    private drawerVisible = false;
    private selectedIds: string[] = [];
    private dialogVisible = false;
    private comparing = false;
    private error: string | null = null;
    private result: { html: string; summary: string } | null = null;

    constructor(
        private revisionsPresenter: RevisionsListPresenter.Interface,
        private gateway: CompareRevisionsGateway.Interface
    ) {
        makeAutoObservable<CompareRevisionsPresenterImpl, "revisionsPresenter" | "gateway">(this, {
            revisionsPresenter: false,
            gateway: false,
            vm: computed
        });
    }

    get vm(): ICompareRevisionsViewModel {
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
            const result = await this.gateway.execute({
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

export const CompareRevisionsPresenterImplementation =
    CompareRevisionsPresenter.createImplementation({
        implementation: CompareRevisionsPresenterImpl,
        dependencies: [RevisionsListPresenter, CompareRevisionsGateway]
    });
