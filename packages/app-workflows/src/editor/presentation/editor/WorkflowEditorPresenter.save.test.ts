import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { createEditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import { EDITOR_SAVED_ON } from "~/editor/testing/editorFixtures.js";
import { createEditorStep } from "~/editor/testing/editorFixtures.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPage } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelRow } from "~/editor/testing/editorFixtures.js";

const ids = vi.hoisted(() => {
    return { next: 0 };
});

vi.mock("@webiny/utils/generateId.js", () => {
    return {
        generateAlphaNumericId: () => {
            ids.next += 1;
            return `id-${ids.next}`;
        }
    };
});

beforeEach(() => {
    ids.next = 0;
});

const NEW_SAVED_ON = "2026-10-19T11:00:00.456Z";

describe("WorkflowEditorPresenter: save (R276, Review Focus 1)", () => {
    it("cannot save a clean draft", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        await presenter.init(params);

        expect(presenter.vm.header?.canSave).toBe(false);
        await presenter.save();

        expect(useCases.storeWorkflow).not.toHaveBeenCalled();
    });

    it("sends the draft with the loaded savedOn string unchanged", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        await presenter.init(params);
        presenter.setName("Changed");

        await presenter.save();

        expect(useCases.storeWorkflow).toHaveBeenCalledTimes(1);
        const call = useCases.storeWorkflow.mock.calls[0][0];
        expect(call.savedOn).toBe(EDITOR_SAVED_ON);
        expect(call.data.id).toBe("workflow-1");
        expect(call.data.name).toBe("Changed");
        expect(call.data.models).toEqual(["cms.article"]);
        expect(call.data.steps[0].notifications).toEqual([{ id: "e-mail" }]);
    });

    it("makes the returned workflow the baseline, updates the row, clears the review cache and toasts", async () => {
        const { presenter, params, useCases, reviewUseCases, toasts } =
            createEditorPresenterSetup();
        await presenter.init(params);
        presenter.setName("Renamed");
        const saved: EditorWorkflow = createEditorWorkflow({
            name: "Renamed",
            savedOn: NEW_SAVED_ON
        });
        useCases.storeWorkflow.mockResolvedValue(saved);

        await presenter.save();

        expect(presenter.vm.header).toMatchObject({
            name: "Renamed",
            dirty: false,
            saving: false,
            canSave: false
        });
        expect(presenter.vm.panel.rows[0].subLine).toBe("1 step");
        expect(reviewUseCases.invalidateWorkflows).toHaveBeenCalledTimes(1);
        expect(toasts.success).toHaveBeenCalledWith("Workflow saved");
        expect(presenter.vm.saveBanner).toBeNull();

        presenter.setName("Again");
        await presenter.save();
        expect(useCases.storeWorkflow.mock.calls[1][0].savedOn).toBe(NEW_SAVED_ON);
    });

    it("saves a new draft with a null savedOn and binds the row to it", async () => {
        const setup = createEditorPresenterSetup();
        setup.useCases.listModels.mockResolvedValue(
            createWorkflowModelPage({ rows: [createWorkflowModelRow({ workflow: null })] })
        );
        await setup.presenter.init(setup.params);
        setup.presenter.createWorkflow();
        const stepId = setup.presenter.addStep(0, "review") ?? "";
        setup.presenter.updateStep(stepId, {
            title: "Legal",
            config: {
                teams: ["team-1"],
                assignment: { strategy: "none", allowManualPick: false, rules: [] }
            }
        });
        setup.useCases.storeWorkflow.mockResolvedValue(
            createEditorWorkflow({
                id: "id-1",
                name: "Article review",
                steps: [createEditorStep({ id: stepId, title: "Legal" })]
            })
        );

        await setup.presenter.save();

        const call = setup.useCases.storeWorkflow.mock.calls[0][0];
        expect(call.savedOn).toBeNull();
        expect(call.data.steps[0].config).toEqual({
            teams: ["team-1"],
            assignment: { strategy: "none", allowManualPick: false, rules: [] }
        });
        expect(setup.presenter.vm.panel.rows[0]).toMatchObject({ bound: true, subLine: "1 step" });
        expect(setup.presenter.vm.header?.canDelete).toBe(true);
    });

    it("shows saving and ignores a second save while one is running", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        await presenter.init(params);
        presenter.setName("Changed");
        const pending = createDeferred<EditorWorkflow>();
        useCases.storeWorkflow.mockReturnValue(pending.promise);

        const first = presenter.save();
        await presenter.save();

        expect(useCases.storeWorkflow).toHaveBeenCalledTimes(1);
        expect(presenter.vm.header).toMatchObject({ saving: true, canSave: false });

        pending.resolve(createEditorWorkflow({ name: "Changed", savedOn: NEW_SAVED_ON }));
        await first;

        expect(presenter.vm.header?.saving).toBe(false);
    });
});

describe("WorkflowEditorPresenter: client validation (R276, QBZ-12, Review Focus 2)", () => {
    it("marks an empty name, sends nothing and toasts the fields message", async () => {
        const { presenter, params, useCases, toasts } = createEditorPresenterSetup();
        await presenter.init(params);
        presenter.setName("  ");

        await presenter.save();

        expect(useCases.storeWorkflow).not.toHaveBeenCalled();
        expect(presenter.vm.header?.nameError).toBe("Enter a workflow name.");
        expect(toasts.error).toHaveBeenCalledWith("Fix the highlighted fields before saving.");
        expect(presenter.vm.header?.dirty).toBe(true);

        presenter.setName("Fixed");
        expect(presenter.vm.header?.nameError).toBeNull();
    });

    it("marks the step count when there is no step", async () => {
        const { presenter, params, toasts } = createEditorPresenterSetup();
        await presenter.init(params);
        presenter.requestDeleteStep("step-1");
        await presenter.confirmDialog();

        await presenter.save();

        expect(presenter.vm.flow.stepsError).toBe("Add at least one step.");
        expect(toasts.error).toHaveBeenCalledWith("Fix the highlighted fields before saving.");
    });

    it("marks a step, scrolls to it and toasts the steps message", async () => {
        const { presenter, params, toasts } = createEditorPresenterSetup();
        await presenter.init(params);
        presenter.updateStep("step-1", { title: "" });

        await presenter.save();

        expect(presenter.vm.flow.steps[0].error).toBe("Enter a title for this step.");
        expect(presenter.getStepFieldErrors("step-1")).toEqual([
            { field: "title", message: "Enter a title for this step." }
        ]);
        expect(presenter.vm.scrollRequest).toEqual({ stepId: "step-1", nonce: 1 });
        expect(toasts.error).toHaveBeenCalledWith("Fix the highlighted steps before saving.");

        await presenter.save();
        expect(presenter.vm.scrollRequest).toEqual({ stepId: "step-1", nonce: 2 });

        presenter.updateStep("step-1", { title: "Fixed" });
        expect(presenter.vm.flow.steps[0].error).toBeNull();
        expect(presenter.getStepFieldErrors("step-1")).toEqual([]);
    });

    it("needs a reviewing team", async () => {
        const { presenter, params } = createEditorPresenterSetup();
        await presenter.init(params);
        presenter.updateStep("step-1", { config: { teams: [], assignment: null } });

        await presenter.save();

        expect(presenter.getStepFieldErrors("step-1")).toEqual([
            { field: "config.teams", message: "Choose at least one reviewing team." }
        ]);
    });

    it("blocks an invalid custom hex colour", async () => {
        const { presenter, params } = createEditorPresenterSetup();
        await presenter.init(params);
        presenter.updateStep("step-1", { color: "#12" });

        await presenter.save();

        expect(presenter.getStepFieldErrors("step-1")[0]).toEqual({
            field: "color",
            message: "Enter a hex colour, e.g. #3B6FD4."
        });
    });

    it("names a required automation setting", async () => {
        const { presenter, params } = createEditorPresenterSetup();
        await presenter.init(params);
        const id = presenter.addStep(1, "automation") ?? "";
        presenter.updateStep(id, {
            title: "Notify",
            config: { automationId: "send-webhook", settings: {} }
        });

        await presenter.save();

        expect(presenter.getStepFieldErrors(id)).toEqual([
            { field: "config.settings.url", message: "URL is required." }
        ]);
    });
});

describe("WorkflowEditorPresenter: more client validation (R276, M10.3)", () => {
    it("toasts the steps message when the name and a step are both wrong", async () => {
        const { presenter, params, useCases, toasts } = createEditorPresenterSetup();
        await presenter.init(params);
        presenter.setName("");
        presenter.updateStep("step-1", { title: "" });

        await presenter.save();

        expect(useCases.storeWorkflow).not.toHaveBeenCalled();
        expect(presenter.vm.header?.nameError).toBe("Enter a workflow name.");
        expect(presenter.vm.flow.steps[0].error).toBe("Enter a title for this step.");
        expect(toasts.error).toHaveBeenCalledWith("Fix the highlighted steps before saving.");
    });

    it("needs instructions and a model for an AI step while the AI editor exists", async () => {
        const { presenter, params } = createEditorPresenterSetup();
        await presenter.init(params);
        const id = presenter.addStep(1, "ai") ?? "";
        presenter.updateStep(id, { title: "Tone" });

        await presenter.save();

        expect(presenter.getStepFieldErrors(id)).toEqual([
            { field: "config.instructions", message: "Enter instructions for the AI." },
            { field: "config.model", message: "Choose an AI model." }
        ]);
    });
});

describe("WorkflowEditorPresenter: a save in flight (R277, Review Focus 8)", () => {
    const withTwoModels = () => {
        const setup = createEditorPresenterSetup();
        setup.useCases.listModels.mockResolvedValue(
            createWorkflowModelPage({
                rows: [
                    createWorkflowModelRow(),
                    createWorkflowModelRow({
                        model: "cms.press",
                        modelId: "press",
                        name: "Press",
                        workflow: { id: "workflow-2", name: "Press approval" }
                    })
                ]
            })
        );
        return setup;
    };

    it("ignores a model switch while the store call runs, then finishes cleanly", async () => {
        const { presenter, params, useCases, reviewUseCases, toasts } = withTwoModels();
        await presenter.init(params);
        presenter.setName("Changed");
        const pending = createDeferred<EditorWorkflow>();
        useCases.storeWorkflow.mockReturnValue(pending.promise);
        useCases.getWorkflow.mockClear();

        const saving = presenter.save();
        await presenter.selectModel("press");

        expect(presenter.vm.dialog).toBeNull();
        expect(useCases.getWorkflow).not.toHaveBeenCalled();
        expect(presenter.vm.header?.saving).toBe(true);

        pending.resolve(createEditorWorkflow({ name: "Changed", savedOn: NEW_SAVED_ON }));
        await saving;

        expect(presenter.vm.header).toMatchObject({ name: "Changed", saving: false, dirty: false });
        expect(reviewUseCases.invalidateWorkflows).toHaveBeenCalledTimes(1);
        expect(toasts.success).toHaveBeenCalledWith("Workflow saved");
        expect(presenter.vm.panel.rows.map(row => row.active)).toEqual([true, false]);
    });

    it("clears the review cache even when the editor was disposed while the store ran", async () => {
        const { presenter, params, useCases, reviewUseCases, toasts } =
            createEditorPresenterSetup();
        await presenter.init(params);
        presenter.setName("Changed");
        const pending = createDeferred<EditorWorkflow>();
        useCases.storeWorkflow.mockReturnValue(pending.promise);

        const saving = presenter.save();
        presenter.dispose();
        pending.resolve(createEditorWorkflow({ name: "Changed", savedOn: NEW_SAVED_ON }));
        await saving;

        expect(reviewUseCases.invalidateWorkflows).toHaveBeenCalledTimes(1);
        expect(toasts.success).not.toHaveBeenCalled();
        expect(presenter.vm.header).toBeNull();
    });

    it("keeps the open step open after a successful save (same step ids, R284)", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        await presenter.init(params);
        presenter.openStep("step-1");
        presenter.setName("Changed");
        useCases.storeWorkflow.mockResolvedValue(
            createEditorWorkflow({ name: "Changed", savedOn: NEW_SAVED_ON })
        );

        await presenter.save();

        expect(presenter.vm.openStepId).toBe("step-1");
    });
});
