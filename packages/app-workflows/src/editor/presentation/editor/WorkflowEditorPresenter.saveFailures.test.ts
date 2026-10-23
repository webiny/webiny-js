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

const NEW_SAVED_ON = "2026-10-19T11:00:00.456Z";

const failure = (code: string, data: unknown, message: string): GraphQLOperationError => {
    return new GraphQLOperationError({ code, data, message });
};

const dirtySetup = async (appKind: "cms" | "wb" = "cms") => {
    const setup = createEditorPresenterSetup({ appKind });
    if (appKind === "wb") {
        setup.listWorkflowModels.execute.mockResolvedValue(
            createWorkflowModelPage({
                rows: [
                    createWorkflowModelRow({
                        model: "wb.page",
                        modelId: "page",
                        name: "Pages",
                        workflow: { id: "workflow-1", name: "Pages review" }
                    })
                ]
            })
        );
    }
    await setup.presenter.init(setup.params);
    setup.presenter.setName("Changed");
    return setup;
};

describe("WorkflowEditorPresenter: server validation (R267, R276, Q41)", () => {
    it("marks the step and the field the server names, scrolls to it and toasts", async () => {
        const { presenter, storeWorkflow, toasts } = await dirtySetup();
        storeWorkflow.execute.mockRejectedValue(
            failure(
                WorkflowErrorCode.Validation,
                { stepId: "step-1", field: "config.teams", workflowId: null },
                "Step needs a team."
            )
        );

        await presenter.save();

        expect(presenter.vm.flow.steps[0].error).toBe("Step needs a team.");
        expect(presenter.getStepFieldErrors("step-1")).toEqual([
            { field: "config.teams", message: "Step needs a team.", ruleId: null }
        ]);
        expect(presenter.vm.scrollRequest).toEqual({ stepId: "step-1", nonce: 1 });
        expect(toasts.error).toHaveBeenCalledWith("Could not save. Check the highlighted step.");
        expect(presenter.vm.saveBanner).toBeNull();
        expect(presenter.vm.header).toMatchObject({ dirty: true, saving: false });

        presenter.updateStep("step-1", { title: "Edited" });
        expect(presenter.vm.flow.steps[0].error).toBeNull();
    });

    it("keeps a field-less step error under an empty field so the drawer shows it at the top", async () => {
        const { presenter, storeWorkflow } = await dirtySetup();
        storeWorkflow.execute.mockRejectedValue(
            failure(
                WorkflowErrorCode.Validation,
                { stepId: "step-1", field: null, workflowId: null },
                "Step is odd."
            )
        );

        await presenter.save();

        expect(presenter.getStepFieldErrors("step-1")).toEqual([
            { field: "", message: "Step is odd.", ruleId: null }
        ]);
    });

    it("treats a step id that is not in the draft as a plain message", async () => {
        const { presenter, storeWorkflow } = await dirtySetup();
        storeWorkflow.execute.mockRejectedValue(
            failure(
                WorkflowErrorCode.Validation,
                { stepId: "gone", field: "title", workflowId: null },
                "Step gone needs a title."
            )
        );

        await presenter.save();

        expect(presenter.vm.flow.steps[0].error).toBeNull();
        expect(presenter.vm.saveBanner).toEqual({
            kind: "message",
            title: null,
            message: "Could not save the workflow — Step gone needs a title.",
            canReload: false,
            canRetry: false,
            dismissible: false
        });
    });

    it("marks the name input and shows the banner for a workflow-level name error", async () => {
        const { presenter, storeWorkflow } = await dirtySetup();
        storeWorkflow.execute.mockRejectedValue(
            failure(
                WorkflowErrorCode.Validation,
                { stepId: null, field: "name", workflowId: null },
                "Workflow name is required."
            )
        );

        await presenter.save();

        expect(presenter.vm.header?.nameError).toBe("Workflow name is required.");
        expect(presenter.vm.saveBanner?.message).toBe(
            "Could not save the workflow — Workflow name is required."
        );
    });

    it("marks the steps box for a workflow-level steps error", async () => {
        const { presenter, storeWorkflow } = await dirtySetup();
        storeWorkflow.execute.mockRejectedValue(
            failure(
                WorkflowErrorCode.Validation,
                { stepId: null, field: "steps", workflowId: null },
                "Add at least one step."
            )
        );

        await presenter.save();

        expect(presenter.vm.flow.stepsError).toBe("Add at least one step.");
    });

    it("shows the server message for any other validation or server error (Q43)", async () => {
        const { presenter, storeWorkflow } = await dirtySetup();
        storeWorkflow.execute.mockRejectedValueOnce(
            failure(WorkflowErrorCode.Validation, null, "The model does not exist.")
        );

        await presenter.save();
        expect(presenter.vm.saveBanner?.message).toBe(
            "Could not save the workflow — The model does not exist."
        );

        storeWorkflow.execute.mockRejectedValueOnce(
            failure(WorkflowErrorCode.Persistence, null, "Disk full.")
        );
        await presenter.save();
        expect(presenter.vm.saveBanner?.message).toBe("Could not save the workflow — Disk full.");
    });
});

describe("WorkflowEditorPresenter: the model already has a workflow (QBZ-18, QBZ-44)", () => {
    const duplicate = (message = "The model already has a workflow.") => {
        return failure(
            WorkflowErrorCode.Validation,
            { stepId: null, field: "models", workflowId: "workflow-9" },
            message
        );
    };

    it("names the other workflow in the CMS banner", async () => {
        const { presenter, getWorkflow, storeWorkflow } = await dirtySetup();
        storeWorkflow.execute.mockRejectedValue(duplicate());
        getWorkflow.execute.mockResolvedValueOnce(
            createEditorWorkflow({ id: "workflow-9", name: "Article approval" })
        );

        await presenter.save();

        expect(getWorkflow.execute).toHaveBeenLastCalledWith({ app: "cms", id: "workflow-9" });
        expect(presenter.vm.saveBanner).toEqual({
            kind: "duplicate",
            title: null,
            message:
                "Could not save the workflow — Article already has a workflow: “Article approval”. A model can have one workflow.",
            canReload: true,
            canRetry: false,
            dismissible: false
        });
    });

    it("words the banner for pages in the Website Builder", async () => {
        const { presenter, getWorkflow, storeWorkflow } = await dirtySetup("wb");
        storeWorkflow.execute.mockRejectedValue(duplicate());
        getWorkflow.execute.mockResolvedValueOnce(
            createEditorWorkflow({ id: "workflow-9", name: "Pages approval" })
        );

        await presenter.save();

        expect(presenter.vm.saveBanner?.message).toBe(
            "Could not save the workflow — Pages already have a workflow: “Pages approval”. Pages can have one workflow."
        );
        expect(getWorkflow.execute).toHaveBeenLastCalledWith({ app: "wb", id: "workflow-9" });
    });

    it("falls back to the row's bound workflow name when the other one cannot be read", async () => {
        const { presenter, getWorkflow, storeWorkflow } = await dirtySetup();
        storeWorkflow.execute.mockRejectedValue(duplicate());
        getWorkflow.execute.mockRejectedValueOnce(new Error("down"));

        await presenter.save();

        expect(presenter.vm.saveBanner?.message).toBe(
            "Could not save the workflow — Article already has a workflow: “Article review”. A model can have one workflow."
        );
        expect(presenter.vm.saveBanner?.canReload).toBe(true);
    });

    it("falls back to the server message, without Reload, when no name is known", async () => {
        const setup = createEditorPresenterSetup();
        setup.listWorkflowModels.execute.mockResolvedValue(
            createWorkflowModelPage({ rows: [createWorkflowModelRow({ workflow: null })] })
        );
        await setup.presenter.init(setup.params);
        setup.presenter.createWorkflow();
        setup.storeWorkflow.execute.mockRejectedValue(duplicate("Article already has one."));
        setup.getWorkflow.execute.mockRejectedValueOnce(new Error("down"));
        const stepId = setup.presenter.addStep(0, "review") ?? "";
        setup.presenter.updateStep(stepId, {
            title: "Legal",
            config: { teams: ["team-1"], assignment: null }
        });

        await setup.presenter.save();

        expect(setup.presenter.vm.saveBanner).toMatchObject({
            kind: "message",
            message: "Could not save the workflow — Article already has one.",
            canReload: false
        });
    });

    it("Reload asks first, keeps the draft on Keep editing and loads the other workflow on Reload", async () => {
        const { presenter, getWorkflow, storeWorkflow } = await dirtySetup();
        storeWorkflow.execute.mockRejectedValue(duplicate());
        const other = createEditorWorkflow({
            id: "workflow-9",
            name: "Article approval",
            savedOn: NEW_SAVED_ON
        });
        getWorkflow.execute.mockResolvedValue(other);
        await presenter.save();

        presenter.reloadDuplicate();

        expect(presenter.vm.dialog).toEqual({
            kind: "reloadWorkflow",
            title: "Reload workflow?",
            body: "Your unsaved draft for Article is lost, and the existing workflow “Article approval” opens.",
            note: null,
            reviews: [],
            confirmLabel: "Reload",
            cancelLabel: "Keep editing",
            destructive: true,
            cancelDestructive: false,
            busy: false
        });

        presenter.cancelDialog();
        expect(presenter.vm.dialog).toBeNull();
        expect(presenter.vm.header?.name).toBe("Changed");

        presenter.reloadDuplicate();
        await presenter.confirmDialog();

        expect(getWorkflow.execute).toHaveBeenLastCalledWith({ app: "cms", id: "workflow-9" });
        expect(presenter.vm.header).toMatchObject({ name: "Article approval", dirty: false });
        expect(presenter.vm.saveBanner).toBeNull();
        expect(presenter.vm.dialog).toBeNull();
        expect(presenter.vm.panel.rows[0].subLine).toBe("1 step");
    });
});

describe("WorkflowEditorPresenter: conflict (D131, Review Focus 1)", () => {
    const conflict = (savedBy: unknown) => {
        return failure(
            WorkflowErrorCode.Conflict,
            { savedOn: NEW_SAVED_ON, savedBy },
            "The workflow was changed."
        );
    };

    it("asks and keeps the draft until the admin reloads", async () => {
        const { presenter, storeWorkflow, toasts } = await dirtySetup();
        storeWorkflow.execute.mockRejectedValue(
            conflict({ id: "user-2", displayName: "Grace Hopper" })
        );

        await presenter.save();

        expect(presenter.vm.dialog).toEqual({
            kind: "conflict",
            title: "Someone else changed this workflow",
            body: "Grace Hopper saved a newer version of “Changed” while you were editing, so your changes were not saved. Reload to get the latest version. Reloading discards your unsaved changes.",
            note: null,
            reviews: [],
            confirmLabel: "Reload workflow",
            cancelLabel: "Keep editing",
            destructive: false,
            cancelDestructive: false,
            busy: false
        });
        expect(presenter.vm.header).toMatchObject({ name: "Changed", dirty: true });
        expect(toasts.success).not.toHaveBeenCalled();

        presenter.cancelDialog();
        expect(presenter.vm.dialog).toBeNull();
        expect(presenter.vm.header?.dirty).toBe(true);
    });

    it("says Someone when the server names nobody", async () => {
        const { presenter, storeWorkflow } = await dirtySetup();
        storeWorkflow.execute.mockRejectedValue(conflict(null));

        await presenter.save();

        expect(presenter.vm.dialog?.body.startsWith("Someone saved a newer version")).toBe(true);
    });

    it("reloads the latest version only after the dialog is confirmed", async () => {
        const { presenter, getWorkflow, storeWorkflow, toasts } = await dirtySetup();
        storeWorkflow.execute.mockRejectedValue(conflict(null));
        await presenter.save();
        getWorkflow.execute.mockResolvedValue(
            createEditorWorkflow({ name: "Their version", savedOn: NEW_SAVED_ON })
        );

        expect(presenter.vm.header?.name).toBe("Changed");
        await presenter.confirmDialog();

        expect(getWorkflow.execute).toHaveBeenLastCalledWith({ app: "cms", id: "workflow-1" });
        expect(presenter.vm.header).toMatchObject({ name: "Their version", dirty: false });
        expect(presenter.vm.dialog).toBeNull();
        expect(toasts.success).toHaveBeenCalledWith("Loaded the latest version");
    });

    it("keeps the dialog open, ready again, when the reload fails", async () => {
        const { presenter, getWorkflow, storeWorkflow, toasts } = await dirtySetup();
        storeWorkflow.execute.mockRejectedValue(conflict(null));
        await presenter.save();
        getWorkflow.execute.mockRejectedValueOnce(new Error("down"));

        await presenter.confirmDialog();

        expect(presenter.vm.dialog?.kind).toBe("conflict");
        expect(presenter.vm.dialog?.busy).toBe(false);
        expect(presenter.vm.header?.name).toBe("Changed");
        expect(toasts.error).toHaveBeenCalledWith("Could not load the workflow.");
    });
});

describe("WorkflowEditorPresenter: deleted while editing (D123, QBZ-94)", () => {
    const notFound = () => {
        return failure(WorkflowErrorCode.NotFound, { id: "workflow-1" }, "Workflow not found.");
    };

    it("offers to save as new or discard", async () => {
        const { presenter, storeWorkflow } = await dirtySetup();
        storeWorkflow.execute.mockRejectedValue(notFound());

        await presenter.save();

        expect(presenter.vm.dialog).toMatchObject({
            kind: "deleted",
            title: "This workflow was deleted",
            body: "“Changed” was deleted while you were editing, so your changes were not saved. Save them as a new workflow for Article, or discard them.",
            confirmLabel: "Save as new workflow",
            cancelLabel: "Discard changes",
            cancelDestructive: true
        });
        expect(presenter.vm.header?.dirty).toBe(true);
    });

    it("discards: the draft closes and the model shows its empty state", async () => {
        const { presenter, storeWorkflow } = await dirtySetup();
        storeWorkflow.execute.mockRejectedValue(notFound());
        await presenter.save();

        presenter.cancelDialog();

        expect(presenter.vm.dialog).toBeNull();
        expect(presenter.vm.header).toBeNull();
        expect(presenter.vm.empty?.title).toBe("Article has no workflow");
        expect(presenter.vm.panel.rows[0]).toMatchObject({
            bound: false,
            subLine: "No workflow",
            unsaved: false
        });
    });

    it("saves as new: the same id, a null savedOn, then the success toast", async () => {
        const { presenter, storeWorkflow, toasts } = await dirtySetup();
        storeWorkflow.execute.mockRejectedValueOnce(notFound());
        await presenter.save();
        storeWorkflow.execute.mockResolvedValueOnce(
            createEditorWorkflow({ name: "Changed", savedOn: NEW_SAVED_ON })
        );

        await presenter.confirmDialog();

        const call = storeWorkflow.execute.mock.calls[1][0];
        expect(call.savedOn).toBeNull();
        expect(call.data.id).toBe("workflow-1");
        expect(call.data.name).toBe("Changed");
        expect(toasts.success).toHaveBeenCalledWith("Saved as a new workflow");
        expect(presenter.vm.dialog).toBeNull();
        expect(presenter.vm.header).toMatchObject({ name: "Changed", dirty: false });
    });
});

describe("WorkflowEditorPresenter: the server did not respond (QBZ-10)", () => {
    it("shows the banner and keeps the draft dirty", async () => {
        const { presenter, storeWorkflow } = await dirtySetup();
        storeWorkflow.execute.mockRejectedValue(new Error("Failed to fetch"));

        await presenter.save();

        expect(presenter.vm.saveBanner).toEqual({
            kind: "transport",
            title: "Could not save the workflow",
            message: "The server did not respond, so nothing was saved. Your changes are kept.",
            canReload: false,
            canRetry: true,
            dismissible: true
        });
        expect(presenter.vm.header).toMatchObject({ dirty: true, saving: false, canSave: true });
    });

    it("dismisses the banner", async () => {
        const { presenter, storeWorkflow } = await dirtySetup();
        storeWorkflow.execute.mockRejectedValue(new Error("Failed to fetch"));
        await presenter.save();

        presenter.dismissBanner();

        expect(presenter.vm.saveBanner).toBeNull();
    });

    it("Try again toasts Retrying… and saves again", async () => {
        const { presenter, storeWorkflow, toasts } = await dirtySetup();
        storeWorkflow.execute.mockRejectedValueOnce(new Error("Failed to fetch"));
        await presenter.save();
        storeWorkflow.execute.mockResolvedValueOnce(
            createEditorWorkflow({ name: "Changed", savedOn: NEW_SAVED_ON })
        );

        await presenter.retrySave();

        expect(toasts.info).toHaveBeenCalledWith("Retrying…");
        expect(storeWorkflow.execute).toHaveBeenCalledTimes(2);
        expect(presenter.vm.saveBanner).toBeNull();
        expect(presenter.vm.header?.dirty).toBe(false);
    });

    it("clears a banner when the next save starts", async () => {
        const { presenter, storeWorkflow } = await dirtySetup();
        storeWorkflow.execute.mockRejectedValueOnce(new Error("Failed to fetch"));
        await presenter.save();
        storeWorkflow.execute.mockResolvedValueOnce(
            createEditorWorkflow({ name: "Changed", savedOn: NEW_SAVED_ON })
        );

        await presenter.save();

        expect(presenter.vm.saveBanner).toBeNull();
    });
});

describe("WorkflowEditorPresenter: after every kind of failure (M10.3)", () => {
    const failures: Array<[string, () => Error]> = [
        ["a conflict", () => failure(WorkflowErrorCode.Conflict, null, "Changed.")],
        ["not found", () => failure(WorkflowErrorCode.NotFound, null, "Gone.")],
        [
            "a step error",
            () =>
                failure(
                    WorkflowErrorCode.Validation,
                    { stepId: "step-1", field: "title", workflowId: null },
                    "Bad."
                )
        ],
        ["a transport error", () => new Error("Failed to fetch")],
        ["a server error", () => failure(WorkflowErrorCode.Persistence, null, "Disk full.")]
    ];

    it.each(failures)(
        "is not saving any more after %s, and can save again",
        async (_name, create) => {
            const { presenter, storeWorkflow } = await dirtySetup();
            storeWorkflow.execute.mockRejectedValue(create());

            await presenter.save();

            expect(presenter.vm.header).toMatchObject({ saving: false, dirty: true });
        }
    );
});

describe("WorkflowEditorPresenter: Save as new that fails (QBZ-94)", () => {
    it("keeps the draft new and unsaved, and the retry still sends a null savedOn", async () => {
        const { presenter, storeWorkflow } = await dirtySetup();
        storeWorkflow.execute.mockRejectedValueOnce(
            failure(WorkflowErrorCode.NotFound, { id: "workflow-1" }, "Gone.")
        );
        await presenter.save();
        storeWorkflow.execute.mockRejectedValueOnce(new Error("Failed to fetch"));

        await presenter.confirmDialog();

        expect(presenter.vm.saveBanner?.kind).toBe("transport");
        expect(presenter.vm.header).toMatchObject({ dirty: true, canDelete: false });

        storeWorkflow.execute.mockResolvedValueOnce(
            createEditorWorkflow({ name: "Changed", savedOn: NEW_SAVED_ON })
        );
        await presenter.retrySave();

        expect(storeWorkflow.execute.mock.calls[2][0].savedOn).toBeNull();
        expect(presenter.vm.header?.dirty).toBe(false);
    });
});

describe("WorkflowEditorPresenter: a Reload that fails (QBZ-18)", () => {
    it("keeps the banner and the dialog, ready again", async () => {
        const { presenter, getWorkflow, storeWorkflow } = await dirtySetup();
        storeWorkflow.execute.mockRejectedValue(
            failure(
                WorkflowErrorCode.Validation,
                { stepId: null, field: "models", workflowId: "workflow-9" },
                "Taken."
            )
        );
        getWorkflow.execute.mockResolvedValueOnce(
            createEditorWorkflow({ id: "workflow-9", name: "Article approval" })
        );
        await presenter.save();
        presenter.reloadDuplicate();
        getWorkflow.execute.mockRejectedValueOnce(new Error("down"));

        await presenter.confirmDialog();

        expect(presenter.vm.dialog).toMatchObject({ kind: "reloadWorkflow", busy: false });
        expect(presenter.vm.saveBanner?.kind).toBe("duplicate");
        expect(presenter.vm.header?.name).toBe("Changed");
    });
});

describe("WorkflowEditorPresenter: a reload or a discard closes the drawer (R284)", () => {
    it("closes the open step and clears the scroll request on the conflict Reload", async () => {
        const { presenter, storeWorkflow } = await dirtySetup();
        presenter.openStep("step-1");
        storeWorkflow.execute.mockRejectedValue(
            failure(
                WorkflowErrorCode.Validation,
                { stepId: "step-1", field: "title", workflowId: null },
                "Bad."
            )
        );
        await presenter.save();
        expect(presenter.vm.scrollRequest).not.toBeNull();
        storeWorkflow.execute.mockRejectedValue(failure(WorkflowErrorCode.Conflict, null, "x"));
        await presenter.save();

        await presenter.confirmDialog();

        expect(presenter.vm.openStepId).toBeNull();
        expect(presenter.vm.scrollRequest).toBeNull();
        expect(presenter.vm.dialog).toBeNull();
    });

    it("closes the open step when the deleted dialog's Discard closes the draft", async () => {
        const { presenter, storeWorkflow } = await dirtySetup();
        presenter.openStep("step-1");
        storeWorkflow.execute.mockRejectedValue(
            failure(WorkflowErrorCode.NotFound, { id: "workflow-1" }, "Gone.")
        );
        await presenter.save();

        presenter.cancelDialog();

        expect(presenter.vm.openStepId).toBeNull();
    });
});

describe("WorkflowEditorPresenter: a busy dialog (Review Focus 1)", () => {
    it("runs the conflict Reload once for two clicks and ignores Keep editing meanwhile", async () => {
        const { presenter, getWorkflow, storeWorkflow } = await dirtySetup();
        storeWorkflow.execute.mockRejectedValue(failure(WorkflowErrorCode.Conflict, null, "x"));
        await presenter.save();
        const pending = createDeferred<EditorWorkflow>();
        getWorkflow.execute.mockClear();
        getWorkflow.execute.mockReturnValue(pending.promise);

        const first = presenter.confirmDialog();
        await presenter.confirmDialog();
        presenter.cancelDialog();

        expect(getWorkflow.execute).toHaveBeenCalledTimes(1);
        expect(presenter.vm.dialog).toMatchObject({ kind: "conflict", busy: true });

        pending.resolve(createEditorWorkflow({ name: "Their version", savedOn: NEW_SAVED_ON }));
        await first;

        expect(presenter.vm.dialog).toBeNull();
        expect(presenter.vm.header?.name).toBe("Their version");
    });
});

describe("WorkflowEditorPresenter: saving never stays stuck", () => {
    it("resets saving when applying the saved workflow throws", async () => {
        const { presenter, storeWorkflow } = await dirtySetup();
        const malformed = createEditorWorkflow();
        const models = malformed.models;
        let reads = 0;
        // Only the first read throws, which is the one applySaved makes.
        Object.defineProperty(malformed, "models", {
            get() {
                reads += 1;
                if (reads === 1) {
                    throw new Error("unreadable models");
                }
                return models;
            }
        });
        storeWorkflow.execute.mockResolvedValue(malformed);

        await presenter.save().catch(() => undefined);

        expect(presenter.vm.header?.saving).toBe(false);
    });

    it("resets saving when mapping the save error throws", async () => {
        const { presenter, storeWorkflow } = await dirtySetup();
        const broken = failure(WorkflowErrorCode.Conflict, null, "x");
        Object.defineProperty(broken, "code", {
            get() {
                throw new Error("unreadable code");
            }
        });
        storeWorkflow.execute.mockRejectedValue(broken);

        await presenter.save().catch(() => undefined);

        expect(presenter.vm.header?.saving).toBe(false);
    });
});
