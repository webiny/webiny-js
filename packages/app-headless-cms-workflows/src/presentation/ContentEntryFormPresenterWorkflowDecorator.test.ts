import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { ContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/abstractions.js";
import { CmsModelContext } from "@webiny/app-headless-cms/features/contentEntry/abstractions.js";
import { WorkflowStatePresenter } from "@webiny/app-workflows/presentation/workflowState/abstractions.js";
import { ContentEntryFormPresenterWorkflowDecorator } from "./ContentEntryFormPresenterWorkflowDecorator.js";

interface SetupParams {
    status: "draft" | "published" | "unpublished";
    hasState: boolean;
    /** The revision the loaded review belongs to. Defaults to the revision in the form. */
    stateRevisionId?: string;
}

const ENTRY_ID = "entry-1#0002";

const setup = ({ status, hasState, stateRevisionId = ENTRY_ID }: SetupParams) => {
    const saveRevision = vi.fn(async () => true);
    const locked = status !== "draft";

    // Shaped like the base presenter's view model: a locked revision saves into a new one.
    const vm = {
        loading: null,
        entry: { id: ENTRY_ID, meta: { locked, status } },
        canSave: true,
        canCreateNewRevision: locked,
        canPublish: status !== "published"
    } as unknown as ContentEntryFormPresenter.ViewModel;

    const original = {
        vm,
        saveRevision
    } as unknown as ContentEntryFormPresenter.Interface;

    const container = new Container();
    container.registerInstance(ContentEntryFormPresenter, original);
    container.registerInstance(CmsModelContext, {
        getModel: () => ({ modelId: "article", tags: [] })
    } as unknown as CmsModelContext.Interface);
    container.registerInstance(WorkflowStatePresenter, {
        vm: { id: stateRevisionId, hasWorkflow: true, hasState, isApproved: hasState }
    } as unknown as WorkflowStatePresenter.Interface);
    container.registerDecorator(ContentEntryFormPresenterWorkflowDecorator);

    return { presenter: container.resolve(ContentEntryFormPresenter), saveRevision };
};

describe("ContentEntryFormPresenterWorkflowDecorator", () => {
    it("creates a new revision of a published revision that went through a review", async () => {
        const { presenter, saveRevision } = setup({ status: "published", hasState: true });

        expect(presenter.vm.canSave).toBe(true);

        const saved = await presenter.saveRevision({ skipValidation: true });
        expect(saved).toBe(true);
        expect(saveRevision).toHaveBeenCalledWith({ skipValidation: true });
    });

    it("keeps a draft that is under review read-only", async () => {
        const { presenter, saveRevision } = setup({ status: "draft", hasState: true });

        expect(presenter.vm.canSave).toBe(false);

        const saved = await presenter.saveRevision();
        expect(saved).toBe(false);
        expect(saveRevision).not.toHaveBeenCalled();
    });

    it("saves a draft that has no review", async () => {
        const { presenter, saveRevision } = setup({ status: "draft", hasState: false });

        expect(presenter.vm.canSave).toBe(true);

        const saved = await presenter.saveRevision();
        expect(saved).toBe(true);
        expect(saveRevision).toHaveBeenCalled();
    });

    it("doesn't let a new draft be published on the approval of the revision it came from", async () => {
        const { presenter, saveRevision } = setup({
            status: "draft",
            hasState: true,
            stateRevisionId: "entry-1#0001"
        });

        expect(presenter.vm.canPublish).toBe(false);
        expect(presenter.vm.canSave).toBe(false);

        const saved = await presenter.saveRevision();
        expect(saved).toBe(false);
        expect(saveRevision).not.toHaveBeenCalled();
    });
});
