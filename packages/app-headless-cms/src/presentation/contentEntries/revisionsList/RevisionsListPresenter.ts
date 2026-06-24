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
    private _loading = false;
    private _revisions: CmsContentEntryRevision[] = [];
    private _visible = false;

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
        >(this, {
            modelAccessor: false,
            listRevisionsUseCase: false,
            createRevisionFromUseCase: false,
            deleteEntryRevisionUseCase: false,
            confirmation: false,
            vm: computed
        });
    }

    private get model() {
        return this.modelAccessor.getModel();
    }

    get vm(): IRevisionsListViewModel {
        return {
            loading: this._loading,
            revisions: this._revisions,
            visible: this._visible
        };
    }

    async init(entryId: string): Promise<void> {
        this._loading = true;

        try {
            const revisions = await this.listRevisionsUseCase.execute({
                model: this.model,
                entryId
            });

            runInAction(() => {
                this._revisions = revisions;
            });
        } catch {
            // Silently fail — revisions are supplementary
        } finally {
            runInAction(() => {
                this._loading = false;
            });
        }
    }

    show(): void {
        this._visible = true;
    }

    hide(): void {
        this._visible = false;
    }

    async createRevision(revisionId: string): Promise<CmsContentEntry | null> {
        this._loading = true;

        try {
            return await this.createRevisionFromUseCase.execute({
                model: this.model,
                revisionId
            });
        } catch {
            return null;
        } finally {
            runInAction(() => {
                this._loading = false;
            });
        }
    }

    async deleteRevision(revisionId: string): Promise<boolean> {
        const confirmed = await this.confirmation.confirm(DELETE_REVISION_DIALOG, { revisionId });

        if (!confirmed) {
            return false;
        }

        runInAction(() => {
            this._loading = true;
        });

        try {
            await this.deleteEntryRevisionUseCase.execute({
                model: this.model,
                revisionId
            });

            return true;
        } catch {
            return false;
        } finally {
            runInAction(() => {
                this._loading = false;
            });
        }
    }

    dispose(): void {
        this._revisions = [];
        this._visible = false;
        this._loading = false;
    }
}

export const RevisionsListPresenterImplementation = Abstraction.createImplementation({
    implementation: RevisionsListPresenterImpl,
    dependencies: [
        CmsModelContext,
        ListRevisionsUseCase,
        CreateRevisionFromUseCase,
        DeleteEntryRevisionUseCase,
        Confirmation
    ]
});
