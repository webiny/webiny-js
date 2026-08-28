import { computed, makeAutoObservable, runInAction } from "mobx";
import type { CmsContentEntry, CmsContentEntryRevision } from "~/types.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import { ListRevisionsUseCase } from "~/features/contentEntry/listRevisions/abstractions.js";
import { CreateRevisionFromUseCase } from "~/features/contentEntry/createRevisionFrom/abstractions.js";
import { DeleteEntryRevisionUseCase } from "~/features/contentEntry/deleteEntryRevision/abstractions.js";
import { CmsModelContext } from "~/features/contentEntry/abstractions.js";
import {
    RevisionsListPresenter as Abstraction,
    type IRevisionsListPresenter,
    type IRevisionsListViewModel
} from "./abstractions.js";

export const DELETE_REVISION_DIALOG = "delete-revision";

class RevisionsListPresenterImpl implements IRevisionsListPresenter {
    private loading = false;
    private revisions: CmsContentEntryRevision[] = [];
    private visible = false;
    private entryId: string | null = null;

    constructor(
        private modelAccessor: CmsModelContext.Interface,
        private listRevisionsUseCase: ListRevisionsUseCase.Interface,
        private createRevisionFromUseCase: CreateRevisionFromUseCase.Interface,
        private deleteEntryRevisionUseCase: DeleteEntryRevisionUseCase.Interface,
        private confirmation: Confirmation.Interface
    ) {
        makeAutoObservable<
            RevisionsListPresenterImpl,
            | "modelAccessor"
            | "listRevisionsUseCase"
            | "createRevisionFromUseCase"
            | "deleteEntryRevisionUseCase"
            | "confirmation"
            | "entryId"
        >(this, {
            modelAccessor: false,
            listRevisionsUseCase: false,
            createRevisionFromUseCase: false,
            deleteEntryRevisionUseCase: false,
            confirmation: false,
            entryId: false,
            vm: computed
        });
    }

    private get model() {
        return this.modelAccessor.getModel();
    }

    get vm(): IRevisionsListViewModel {
        return {
            loading: this.loading,
            revisions: this.revisions,
            visible: this.visible
        };
    }

    async init(entryId: string): Promise<void> {
        this.loading = true;
        this.entryId = entryId;

        try {
            const revisions = await this.listRevisionsUseCase.execute({
                model: this.model,
                entryId
            });

            runInAction(() => {
                this.revisions = revisions;
            });
        } catch {
            // Silently fail — revisions are supplementary
        } finally {
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    show(): void {
        this.visible = true;
    }

    hide(): void {
        this.visible = false;
    }

    async createRevision(revisionId: string): Promise<CmsContentEntry | null> {
        this.loading = true;

        try {
            const entry = await this.createRevisionFromUseCase.execute({
                model: this.model,
                revisionId
            });

            await this.refreshRevisions(revisionId);

            return entry;
        } catch {
            return null;
        } finally {
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    async deleteRevision(revisionId: string): Promise<boolean> {
        const confirmed = await this.confirmation.confirm(DELETE_REVISION_DIALOG, { revisionId });

        if (confirmed === false) {
            return false;
        }

        runInAction(() => {
            this.loading = true;
        });

        try {
            await this.deleteEntryRevisionUseCase.execute({
                model: this.model,
                revisionId
            });

            await this.refreshRevisions(revisionId);

            return true;
        } catch {
            return false;
        } finally {
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    private async refreshRevisions(revisionId: string): Promise<void> {
        const entryId = this.entryId ?? revisionId.split("#")[0];

        try {
            const revisions = await this.listRevisionsUseCase.execute({
                model: this.model,
                entryId
            });

            runInAction(() => {
                this.revisions = revisions;
            });
        } catch {
            // Silently fail — revisions are supplementary.
        }
    }

    dispose(): void {
        this.revisions = [];
        this.visible = false;
        this.loading = false;
        this.entryId = null;
    }
}

export const RevisionsListPresenter = Abstraction.createImplementation({
    implementation: RevisionsListPresenterImpl,
    dependencies: [
        CmsModelContext,
        ListRevisionsUseCase,
        CreateRevisionFromUseCase,
        DeleteEntryRevisionUseCase,
        Confirmation
    ]
});
