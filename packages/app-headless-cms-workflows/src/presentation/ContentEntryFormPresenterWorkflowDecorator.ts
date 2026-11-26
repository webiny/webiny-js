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

        return {
            ...base,
            canSave: base.canSave && !this.isBlockedByReview(),
            canPublish: base.canPublish && (!wfVm.hasWorkflow || wfVm.isApproved)
        };
    }

    /*
     * A revision with a content review can't be changed. A locked revision (published or
     * unpublished) is never changed by a save either: saving it creates a new revision, and
     * that new revision starts without a review. So only an unlocked revision is blocked.
     * Blocking locked ones too left "New Revision" on screen with nothing happening on click.
     */
    private isBlockedByReview(): boolean {
        const isLocked = this.original.vm.entry?.meta.locked ?? false;
        return this.workflowPresenter.vm.hasState && !isLocked;
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
