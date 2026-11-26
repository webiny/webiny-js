import { computed, makeAutoObservable } from "mobx";
import {
    ContentEntryFormPresenter,
    type IContentEntryFormPresenter,
    type IContentEntryFormViewModel
} from "@webiny/app-headless-cms/presentation/contentEntries/form/abstractions.js";
import { CmsModelContext } from "@webiny/app-headless-cms/features/contentEntry/abstractions.js";
import { WorkflowStatePresenter } from "@webiny/app-workflows/presentation/workflowState/abstractions.js";
import { CMS_MODEL_SINGLETON_TAG } from "@webiny/app-headless-cms-common";

class ContentEntryFormPresenterWithWorkflow implements IContentEntryFormPresenter {
    constructor(
        private workflowPresenter: WorkflowStatePresenter.Interface,
        private modelAccessor: CmsModelContext.Interface,
        private original: IContentEntryFormPresenter
    ) {
        makeAutoObservable<
            ContentEntryFormPresenterWithWorkflow,
            "workflowPresenter" | "modelAccessor" | "original"
        >(this, {
            workflowPresenter: false,
            modelAccessor: false,
            original: false,
            vm: computed
        });
    }

    get vm(): IContentEntryFormViewModel {
        const base = this.original.vm;
        const wfVm = this.workflowPresenter.vm;

        const isApproved = wfVm.isApproved && !this.isStateOfAnotherRevision();

        return {
            ...base,
            canSave: base.canSave && !this.isBlockedByReview(),
            canPublish: base.canPublish && (!wfVm.hasWorkflow || isApproved)
        };
    }

    /*
     * A revision with a content review can't be changed. A save that creates a new revision
     * (on a published or unpublished revision) doesn't change it either, and the new revision
     * starts without a review, so only the other saves are blocked. Blocking all of them left
     * "New Revision" on screen with nothing happening on click.
     */
    private isBlockedByReview(): boolean {
        if (this.isStateOfAnotherRevision()) {
            return true;
        }
        return this.workflowPresenter.vm.hasState && !this.original.vm.canCreateNewRevision;
    }

    /*
     * The review state is loaded for one revision, in `loadRevision`. Right after "New Revision"
     * the form already holds the new draft, while the loaded review still belongs to the
     * revision it was created from, until the route change loads the draft. That approval
     * must not let the draft be published.
     */
    private isStateOfAnotherRevision(): boolean {
        const entryId = this.original.vm.entry?.id;
        const stateRevisionId = this.workflowPresenter.vm.id;
        if (!entryId || !stateRevisionId) {
            return false;
        }
        return stateRevisionId !== entryId;
    }

    async loadRevision(id: string): Promise<void> {
        await this.original.loadRevision(id);

        const model = this.modelAccessor.getModel();
        if (model.tags.includes(CMS_MODEL_SINGLETON_TAG)) {
            return;
        }

        const title = `${model.name}: ${this.original.vm.entry?.meta?.title || "unknown"}`;
        await this.workflowPresenter.init(`cms.${model.modelId}`, id, title);
    }

    async saveRevision(options?: { skipValidation?: boolean }): Promise<boolean> {
        if (this.isBlockedByReview()) {
            return false;
        }
        return this.original.saveRevision(options);
    }

    publishRevision(): Promise<boolean> {
        return this.original.publishRevision();
    }

    unpublishRevision(): Promise<boolean> {
        return this.original.unpublishRevision();
    }

    deleteEntry(): Promise<boolean> {
        return this.original.deleteEntry();
    }

    setFolderId(folderId: string | null): void {
        this.original.setFolderId(folderId);
    }

    newEntry(initialValues?: Record<string, unknown>): void {
        return this.original.newEntry(initialValues);
    }

    patchEntryMeta(...args: Parameters<IContentEntryFormPresenter["patchEntryMeta"]>): void {
        this.original.patchEntryMeta(...args);
    }

    reset(): void {
        this.original.reset();
        this.workflowPresenter.dispose();
    }
}

export const ContentEntryFormPresenterWorkflowDecorator = ContentEntryFormPresenter.createDecorator(
    {
        decorator: ContentEntryFormPresenterWithWorkflow,
        dependencies: [WorkflowStatePresenter, CmsModelContext]
    }
);
