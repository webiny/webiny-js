import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { createEditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPage } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelRow } from "~/editor/testing/editorFixtures.js";

const blockingReview = (id: string) => {
    return {
        reviewId: id,
        model: "cms.article",
        targetId: `target-${id}`,
        targetRevisionId: `target-${id}#0001`,
        title: `Title ${id}`,
        stepPosition: 2,
        stepCount: 3,
        stepName: "Legal sign-off"
    };
};

describe("WorkflowEditorPresenter: delete (R278, QBZ-19)", () => {
    it("asks first, naming the workflow and the model", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        await presenter.init(params);

        presenter.requestDelete();

        expect(presenter.vm.dialog).toMatchObject({
            kind: "deleteWorkflow",
            title: "Delete workflow?",
            body: "“Article review” will be removed from Article. New revisions can then be published without a review. Finished reviews keep their history.",
            confirmLabel: "Delete workflow",
            cancelLabel: "Cancel",
            destructive: true
        });
        presenter.cancelDialog();
        expect(presenter.vm.dialog).toBeNull();
        expect(useCases.deleteWorkflow).not.toHaveBeenCalled();
    });

    it("has nothing to delete for a new unsaved draft", async () => {
        const setup = createEditorPresenterSetup();
        setup.useCases.listModels.mockResolvedValue(
            createWorkflowModelPage({ rows: [createWorkflowModelRow({ workflow: null })] })
        );
        await setup.presenter.init(setup.params);
        setup.presenter.createWorkflow();

        setup.presenter.requestDelete();

        expect(setup.presenter.vm.dialog).toBeNull();
    });

    it("deletes on confirm: closes the draft, unbinds the row, clears the review cache and toasts", async () => {
        const { presenter, params, useCases, reviewUseCases, toasts } =
            createEditorPresenterSetup();
        await presenter.init(params);
        presenter.requestDelete();

        await presenter.confirmDialog();

        expect(useCases.deleteWorkflow).toHaveBeenCalledWith("workflow-1");
        expect(presenter.vm.dialog).toBeNull();
        expect(presenter.vm.header).toBeNull();
        expect(presenter.vm.empty?.title).toBe("Article has no workflow");
        expect(presenter.vm.panel.rows[0]).toMatchObject({ bound: false, subLine: "No workflow" });
        expect(reviewUseCases.invalidateWorkflows).toHaveBeenCalledTimes(1);
        expect(toasts.success).toHaveBeenCalledWith("Workflow deleted");
    });

    it("shows the dialog busy while the delete runs", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        await presenter.init(params);
        const pending = createDeferred<EditorWorkflow>();
        useCases.deleteWorkflow.mockReturnValue(pending.promise);
        presenter.requestDelete();

        const running = presenter.confirmDialog();

        expect(presenter.vm.dialog?.busy).toBe(true);
        pending.resolve(createEditorWorkflow());
        await running;
        expect(presenter.vm.dialog).toBeNull();
    });

    it("explains why a workflow with running reviews cannot be deleted (singular, with reassign)", async () => {
        const { presenter, params, useCases, app, reviewUseCases, toasts } =
            createEditorPresenterSetup({
                reassign: true
            });
        await presenter.init(params);
        useCases.deleteWorkflow.mockRejectedValue(
            new GraphQLOperationError({
                code: WorkflowErrorCode.HasActiveReviews,
                message: "Has reviews.",
                data: { count: 1, reviews: [blockingReview("r1")] }
            })
        );
        presenter.requestDelete();

        await presenter.confirmDialog();

        expect(presenter.vm.dialog).toEqual({
            kind: "blockedDelete",
            title: "This workflow can't be deleted yet",
            body: "1 review using “Article review” is in progress.",
            note: "Wait for them to finish, or open each one and cancel it. Then try again.",
            reviews: [
                {
                    reviewId: "r1",
                    title: "Title r1",
                    position: "Step 2 of 3 · Legal sign-off",
                    url: "/content/target-r1/target-r1#0001"
                }
            ],
            confirmLabel: null,
            cancelLabel: "Close",
            destructive: false,
            cancelDestructive: false,
            busy: false
        });
        expect(app.contentAdapter.getContentUrl).toHaveBeenCalledWith({
            namespace: "cms.article",
            targetId: "target-r1",
            targetRevisionId: "target-r1#0001",
            contentTypeId: null
        });
        expect(reviewUseCases.invalidateWorkflows).not.toHaveBeenCalled();
        expect(toasts.success).not.toHaveBeenCalled();

        presenter.cancelDialog();
        expect(presenter.vm.dialog).toBeNull();
        expect(presenter.vm.header?.name).toBe("Article review");
    });

    it("counts in the plural, lists at most five reviews and sends a viewer without reassign elsewhere", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        await presenter.init(params);
        const reviews = ["r1", "r2", "r3", "r4", "r5", "r6"].map(blockingReview);
        useCases.deleteWorkflow.mockRejectedValue(
            new GraphQLOperationError({
                code: WorkflowErrorCode.HasActiveReviews,
                message: "Has reviews.",
                data: { count: 9, reviews }
            })
        );
        presenter.requestDelete();

        await presenter.confirmDialog();

        expect(presenter.vm.dialog?.body).toBe("9 reviews using “Article review” are in progress.");
        expect(presenter.vm.dialog?.reviews).toHaveLength(5);
        expect(presenter.vm.dialog?.note).toBe(
            "Wait for them to finish, or ask someone with Reassign and operate to cancel them. Then try again."
        );
    });

    it("treats a workflow that is already gone as deleted", async () => {
        const { presenter, params, useCases, reviewUseCases } = createEditorPresenterSetup();
        await presenter.init(params);
        useCases.deleteWorkflow.mockRejectedValue(
            new GraphQLOperationError({
                code: WorkflowErrorCode.NotFound,
                message: "Not found.",
                data: { id: "workflow-1" }
            })
        );
        presenter.requestDelete();

        await presenter.confirmDialog();

        expect(presenter.vm.header).toBeNull();
        expect(reviewUseCases.invalidateWorkflows).toHaveBeenCalledTimes(1);
    });

    it("closes the dialog and toasts the server message for any other server error", async () => {
        const { presenter, params, useCases, toasts } = createEditorPresenterSetup();
        await presenter.init(params);
        useCases.deleteWorkflow.mockRejectedValue(
            new GraphQLOperationError({
                code: WorkflowErrorCode.Persistence,
                message: "Disk full.",
                data: null
            })
        );
        presenter.requestDelete();

        await presenter.confirmDialog();

        expect(toasts.error).toHaveBeenCalledWith("Disk full.");
        expect(presenter.vm.dialog).toBeNull();
        expect(presenter.vm.header?.name).toBe("Article review");
    });

    it("toasts that nothing was changed when the server did not respond", async () => {
        const { presenter, params, useCases, toasts } = createEditorPresenterSetup();
        await presenter.init(params);
        useCases.deleteWorkflow.mockRejectedValue(new Error("Failed to fetch"));
        presenter.requestDelete();

        await presenter.confirmDialog();

        expect(toasts.error).toHaveBeenCalledWith(
            "The server did not respond, so nothing was changed. Try again."
        );
        expect(presenter.vm.header?.name).toBe("Article review");
    });
});

describe("WorkflowEditorPresenter: delete edge cases (R278, QBZ-19)", () => {
    it("deletes once for two clicks and ignores Cancel while the delete runs", async () => {
        const { presenter, params, useCases, toasts, reviewUseCases } =
            createEditorPresenterSetup();
        await presenter.init(params);
        const pending = createDeferred<EditorWorkflow>();
        useCases.deleteWorkflow.mockReturnValue(pending.promise);
        presenter.requestDelete();

        const first = presenter.confirmDialog();
        await presenter.confirmDialog();
        presenter.cancelDialog();

        expect(useCases.deleteWorkflow).toHaveBeenCalledTimes(1);
        expect(presenter.vm.dialog?.busy).toBe(true);

        pending.resolve(createEditorWorkflow());
        await first;

        expect(toasts.success).toHaveBeenCalledTimes(1);
        expect(reviewUseCases.invalidateWorkflows).toHaveBeenCalledTimes(1);
        expect(presenter.vm.dialog).toBeNull();
    });

    it("still explains a block when the server lists no readable review", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        await presenter.init(params);
        useCases.deleteWorkflow.mockRejectedValue(
            new GraphQLOperationError({
                code: WorkflowErrorCode.HasActiveReviews,
                message: "Has reviews.",
                data: { count: 3, reviews: [] }
            })
        );
        presenter.requestDelete();

        await presenter.confirmDialog();

        expect(presenter.vm.dialog?.body).toBe("3 reviews using “Article review” are in progress.");
        expect(presenter.vm.dialog?.reviews).toEqual([]);
        expect(presenter.vm.dialog?.note).not.toBeNull();
        expect(presenter.vm.dialog?.confirmLabel).toBeNull();
    });

    it("clears the review cache even when the editor was disposed while the delete ran", async () => {
        const { presenter, params, useCases, reviewUseCases, toasts } =
            createEditorPresenterSetup();
        await presenter.init(params);
        const pending = createDeferred<EditorWorkflow>();
        useCases.deleteWorkflow.mockReturnValue(pending.promise);
        presenter.requestDelete();

        const deleting = presenter.confirmDialog();
        presenter.dispose();
        pending.resolve(createEditorWorkflow());
        await deleting;

        expect(reviewUseCases.invalidateWorkflows).toHaveBeenCalledTimes(1);
        expect(toasts.success).not.toHaveBeenCalled();
    });
});
