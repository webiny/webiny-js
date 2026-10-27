import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { createEditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";

const SAVED_ON = "2026-10-19T11:00:00.456Z";

const conflict = (): GraphQLOperationError => {
    return new GraphQLOperationError({
        code: WorkflowErrorCode.Conflict,
        data: null,
        message: "Changed."
    });
};

const duplicate = (): GraphQLOperationError => {
    return new GraphQLOperationError({
        code: WorkflowErrorCode.Validation,
        data: { stepId: null, field: "models", workflowId: "workflow-9" },
        message: "Taken."
    });
};

const dirtySetup = async () => {
    const setup = createEditorPresenterSetup();
    await setup.presenter.init(setup.params);
    setup.presenter.setName("Changed");
    return setup;
};

describe("WorkflowEditorPresenter: save, delete and reload do not overlap", () => {
    it("refuses a delete while a save runs, and hides it", async () => {
        const { presenter, storeWorkflow } = await dirtySetup();
        const pending = createDeferred<EditorWorkflow>();
        storeWorkflow.execute.mockReturnValue(pending.promise);

        const saving = presenter.save();
        presenter.requestDelete();

        expect(presenter.vm.dialog).toBeNull();
        expect(presenter.vm.header?.canDelete).toBe(false);

        pending.resolve(createEditorWorkflow({ name: "Changed", savedOn: SAVED_ON }));
        await saving;
        expect(presenter.vm.header?.canDelete).toBe(true);
    });

    it("refuses a save and a delete while a reload runs", async () => {
        const { presenter, getWorkflow, storeWorkflow } = await dirtySetup();
        storeWorkflow.execute.mockRejectedValueOnce(conflict());
        await presenter.save();
        const pending = createDeferred<EditorWorkflow>();
        getWorkflow.execute.mockReturnValue(pending.promise);

        const reloading = presenter.confirmDialog();
        await presenter.save();
        presenter.requestDelete();

        expect(storeWorkflow.execute).toHaveBeenCalledTimes(1);
        expect(presenter.vm.dialog).toMatchObject({ kind: "conflict", busy: true });
        expect(presenter.vm.header?.canDelete).toBe(false);

        pending.resolve(createEditorWorkflow({ name: "Their version", savedOn: SAVED_ON }));
        await reloading;
        expect(presenter.vm.header?.name).toBe("Their version");
    });

    it("keeps saving until the duplicate banner is resolved, so a second save cannot overlap", async () => {
        const { presenter, getWorkflow, storeWorkflow } = await dirtySetup();
        storeWorkflow.execute.mockRejectedValueOnce(duplicate());
        const lookup = createDeferred<EditorWorkflow>();
        getWorkflow.execute.mockReturnValue(lookup.promise);

        const first = presenter.save();
        await Promise.resolve();
        await presenter.save();

        expect(storeWorkflow.execute).toHaveBeenCalledTimes(1);
        expect(presenter.vm.header?.saving).toBe(true);

        lookup.resolve(createEditorWorkflow({ id: "workflow-9", name: "Article approval" }));
        await first;

        expect(presenter.vm.saveBanner?.kind).toBe("duplicate");
        expect(presenter.vm.header?.saving).toBe(false);
    });

    it("ignores edits while a save runs, so the draft is clean after it", async () => {
        const { presenter, storeWorkflow } = await dirtySetup();
        const pending = createDeferred<EditorWorkflow>();
        storeWorkflow.execute.mockReturnValue(pending.promise);

        const saving = presenter.save();
        presenter.setName("Typed during save");
        presenter.updateStep("step-1", { title: "Typed during save" });
        presenter.moveStep(0, 1);
        const added = presenter.addStep(1, "review");
        presenter.requestDeleteStep("step-1");

        expect(added).toBeNull();
        expect(presenter.vm.dialog).toBeNull();
        expect(presenter.vm.header?.name).toBe("Changed");
        expect(presenter.vm.flow.steps).toHaveLength(1);
        expect(presenter.vm.flow.steps[0].title).not.toBe("Typed during save");

        pending.resolve(createEditorWorkflow({ name: "Changed", savedOn: SAVED_ON }));
        await saving;

        expect(presenter.vm.header).toMatchObject({ name: "Changed", dirty: false });
    });

    it("does not report a failure after the store succeeded as nothing saved", async () => {
        const { presenter, storeWorkflow, toasts } = await dirtySetup();
        storeWorkflow.execute.mockResolvedValue(
            createEditorWorkflow({ name: "Changed", savedOn: SAVED_ON })
        );
        toasts.success.mockImplementation(() => {
            throw new Error("toast failed");
        });

        await expect(presenter.save()).rejects.toThrow("toast failed");

        expect(presenter.vm.saveBanner).toBeNull();
        expect(presenter.vm.header).toMatchObject({ dirty: false, saving: false });
    });

    it("does not replace an open dialog with the delete dialog", async () => {
        const { presenter, params } = createEditorPresenterSetup();
        await presenter.init(params);
        presenter.requestDeleteStep("step-1");
        presenter.requestDelete();

        expect(presenter.vm.dialog?.kind).toBe("deleteStep");
    });

    it("does not replace an open dialog with the reload dialog", async () => {
        const { presenter, getWorkflow, storeWorkflow } = await dirtySetup();
        storeWorkflow.execute.mockRejectedValue(duplicate());
        getWorkflow.execute.mockResolvedValueOnce(
            createEditorWorkflow({ id: "workflow-9", name: "Article approval" })
        );
        await presenter.save();
        presenter.requestDeleteStep("step-1");

        presenter.reloadDuplicate();

        expect(presenter.vm.dialog?.kind).toBe("deleteStep");
    });

    it("is not stuck saving when handling a failure throws", async () => {
        const { presenter, storeWorkflow, toasts } = await dirtySetup();
        storeWorkflow.execute.mockRejectedValue(
            new GraphQLOperationError({
                code: WorkflowErrorCode.Validation,
                data: { stepId: "step-1", field: "title", workflowId: null },
                message: "Bad."
            })
        );
        toasts.error.mockImplementation(() => {
            throw new Error("toast failed");
        });

        await expect(presenter.save()).rejects.toThrow("toast failed");

        expect(presenter.vm.header).toMatchObject({ saving: false, canSave: true });
    });
});
