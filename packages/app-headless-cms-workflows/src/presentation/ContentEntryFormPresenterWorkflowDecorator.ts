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
            canSave: base.canSave && !wfVm.hasState,
            canPublish: base.canPublish && (!wfVm.hasWorkflow || wfVm.isApproved)
        };
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
        if (this.workflowPresenter.vm.hasState) {
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

    newEntry(): void {
        return this.original.newEntry();
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
