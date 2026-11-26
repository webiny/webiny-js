import { describe, it, expect, vi } from "vitest";
import { Container } from "@webiny/di";
import {
    ContentEntryFormPresenter,
    type IContentEntryFormPresenter,
    type IContentEntryFormViewModel
} from "@webiny/app-headless-cms/presentation/contentEntries/form/abstractions.js";
import { CmsModelContext } from "@webiny/app-headless-cms/features/contentEntry/abstractions.js";
import { WorkflowStatePresenter } from "@webiny/app-workflows/presentation/workflowState/abstractions.js";
import { ContentEntryFormPresenterWorkflowDecorator } from "./ContentEntryFormPresenterWorkflowDecorator.js";

interface SetupParams {
    locked: boolean;
    status: "draft" | "published" | "unpublished";
    hasState: boolean;
}

const setup = ({ locked, status, hasState }: SetupParams) => {
    const saveRevision = vi.fn(async () => true);

    const vm = {
        loading: null,
        entry: { id: "entry-1#0001", meta: { locked, status } },
        canSave: true,
        canCreateNewRevision: locked,
        canPublish: status !== "published"
    } as unknown as IContentEntryFormViewModel;

    const original = {
        vm,
        saveRevision
    } as unknown as IContentEntryFormPresenter;

    const container = new Container();
    container.registerInstance(ContentEntryFormPresenter, original);
    container.registerInstance(CmsModelContext, {
        getModel: () => ({ modelId: "article", tags: [] })
    } as unknown as CmsModelContext.Interface);
    container.registerInstance(WorkflowStatePresenter, {
        vm: { hasWorkflow: true, hasState, isApproved: hasState }
    } as unknown as WorkflowStatePresenter.Interface);
    container.registerDecorator(ContentEntryFormPresenterWorkflowDecorator);

    return { presenter: container.resolve(ContentEntryFormPresenter), saveRevision };
};

describe("ContentEntryFormPresenterWorkflowDecorator", () => {
    it("creates a new revision of a published revision that went through a review", async () => {
        const { presenter, saveRevision } = setup({
            locked: true,
            status: "published",
            hasState: true
        });

        expect(presenter.vm.canSave).toBe(true);
        expect(presenter.vm.canCreateNewRevision).toBe(true);
        await expect(presenter.saveRevision({ skipValidation: true })).resolves.toBe(true);
        expect(saveRevision).toHaveBeenCalledWith({ skipValidation: true });
    });

    it("keeps a draft that is under review read-only", async () => {
        const { presenter, saveRevision } = setup({
            locked: false,
            status: "draft",
            hasState: true
        });

        expect(presenter.vm.canSave).toBe(false);
        await expect(presenter.saveRevision()).resolves.toBe(false);
        expect(saveRevision).not.toHaveBeenCalled();
    });

    it("saves a draft that has no review", async () => {
        const { presenter, saveRevision } = setup({
            locked: false,
            status: "draft",
            hasState: false
        });

        expect(presenter.vm.canSave).toBe(true);
        await expect(presenter.saveRevision()).resolves.toBe(true);
        expect(saveRevision).toHaveBeenCalled();
    });
});
