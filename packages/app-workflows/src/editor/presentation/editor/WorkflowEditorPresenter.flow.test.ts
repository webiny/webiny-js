import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createStepTypes } from "~/editor/testing/draftFixtures.js";
import { createEditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import { createEditorStep } from "~/editor/testing/editorFixtures.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPage } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelRow } from "~/editor/testing/editorFixtures.js";
import { createAiTool } from "~/editor/testing/editorFixtures.js";
import { createDrawerSetup } from "~/editor/testing/drawerPresenterKit.js";
import { findFormFieldVm } from "~/editor/testing/findFormFieldVm.js";

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

const setupWithoutWorkflow = (appKind: "cms" | "wb" = "cms") => {
    const setup = createEditorPresenterSetup({ appKind });
    const row =
        appKind === "cms"
            ? createWorkflowModelRow({ workflow: null })
            : createWorkflowModelRow({
                  model: "wb.page",
                  modelId: "page",
                  name: "Pages",
                  workflow: null
              });
    setup.listWorkflowModels.execute.mockResolvedValue(createWorkflowModelPage({ rows: [row] }));
    return setup;
};

describe("WorkflowEditorPresenter: create a workflow (R276, R280)", () => {
    it("starts a draft named {Model} review that is dirty and has no steps", async () => {
        const { presenter, params } = setupWithoutWorkflow();
        await presenter.init(params);

        presenter.createWorkflow();

        expect(presenter.vm.empty).toBeNull();
        expect(presenter.vm.header).toMatchObject({
            name: "Article review",
            dirty: true,
            canSave: true,
            canDelete: false
        });
        expect(presenter.vm.flow).toEqual({ steps: [], stepsError: null });
        expect(presenter.vm.panel.rows[0]).toMatchObject({ unsaved: true, bound: false });
    });

    it("names a Website Builder draft after Pages", async () => {
        const { presenter, params } = setupWithoutWorkflow("wb");
        await presenter.init(params);

        presenter.createWorkflow();

        expect(presenter.vm.header?.name).toBe("Pages review");
    });

    it("does nothing when the model already has a workflow", async () => {
        const { presenter, params } = createEditorPresenterSetup();
        await presenter.init(params);

        presenter.createWorkflow();

        expect(presenter.vm.header?.name).toBe("Article review");
        expect(presenter.vm.header?.dirty).toBe(false);
    });

    it("renames the draft", async () => {
        const { presenter, params } = setupWithoutWorkflow();
        await presenter.init(params);
        presenter.createWorkflow();

        presenter.setName("Release checks");

        expect(presenter.vm.header?.name).toBe("Release checks");
    });
});

describe("WorkflowEditorPresenter: add a step (R269, R270, R272)", () => {
    it("adds a new step of an addable type at the index and returns its id", async () => {
        const { presenter, params } = createEditorPresenterSetup();
        await presenter.init(params);

        const id = presenter.addStep(1, "review");

        expect(id).toBe("id-1");
        expect(presenter.vm.openStepId).toBe("id-1");
        expect(presenter.vm.flow.steps.map(step => step.id)).toEqual(["step-1", "id-1"]);
        expect(presenter.vm.header?.dirty).toBe(true);
        const step = presenter.getStep("id-1");
        expect(step?.title).toBe("");
        expect(step?.color).toBe("var(--color-primary-500)");
        expect(step?.notificationIds).toEqual(["e-mail"]);
        expect(step?.config).toEqual({
            teams: [],
            assignment: { strategy: "none", allowManualPick: false, rules: [] }
        });
    });

    it("adds an Automation step and an AI step with their defaults", async () => {
        const { presenter, params } = createEditorPresenterSetup();
        await presenter.init(params);

        const automation = presenter.addStep(0, "automation");
        const ai = presenter.addStep(0, "ai");

        expect(presenter.getStep(automation ?? "")?.config).toEqual({
            automationId: "",
            settings: {}
        });
        expect(presenter.getStep(ai ?? "")?.config).toEqual({
            instructions: "",
            model: "",
            tools: []
        });
        expect(presenter.getStep(ai ?? "")?.notificationIds).toEqual([]);
    });

    it("does not open a step when the type is refused", async () => {
        const { presenter, params, listAutomationDefinitions } = createEditorPresenterSetup();
        listAutomationDefinitions.execute.mockResolvedValue([]);
        await presenter.init(params);

        presenter.addStep(0, "automation");

        expect(presenter.vm.openStepId).toBeNull();
    });

    it("refuses a type that is not addable and changes nothing (R269, Review Focus 5)", async () => {
        const { presenter, params, listAutomationDefinitions, listStepTypes } =
            createEditorPresenterSetup();
        listAutomationDefinitions.execute.mockResolvedValue([]);
        listStepTypes.execute.mockResolvedValue(
            createStepTypes().map(item => {
                return item.type === "ai" ? { ...item, configSchema: null } : item;
            })
        );
        await presenter.init(params);

        expect(presenter.addStep(0, "automation")).toBeNull();
        expect(presenter.addStep(0, "ai")).toBeNull();
        expect(presenter.addStep(0, "unknown")).toBeNull();

        expect(presenter.vm.flow.steps).toHaveLength(1);
        expect(presenter.vm.header?.dirty).toBe(false);
    });

    it("clamps an index beyond the end", async () => {
        const { presenter, params } = createEditorPresenterSetup();
        await presenter.init(params);

        presenter.addStep(99, "review");

        expect(presenter.vm.flow.steps.map(step => step.id)).toEqual(["step-1", "id-1"]);
    });

    it("changes nothing without an open workflow", async () => {
        const { presenter, params } = setupWithoutWorkflow();
        await presenter.init(params);

        expect(presenter.addStep(0, "review")).toBeNull();
    });
});

describe("WorkflowEditorPresenter: type picker (D122, QBZ-97)", () => {
    it("opens at an index with every type in server order and why one is disabled", async () => {
        const { presenter, params, listAutomationDefinitions } = createEditorPresenterSetup();
        listAutomationDefinitions.execute.mockResolvedValue([]);
        await presenter.init(params);

        presenter.openTypePicker(1);

        expect(presenter.vm.typePicker).toEqual({
            index: 1,
            options: [
                {
                    type: "review",
                    label: "People",
                    description: "Members of one or more teams review.",
                    addable: true,
                    reason: null
                },
                {
                    type: "ai",
                    label: "AI",
                    description: "An AI model reviews against your written instructions.",
                    addable: true,
                    reason: null
                },
                {
                    type: "automation",
                    label: "Automation",
                    description: "Runs a code-defined automation, such as Send webhook.",
                    addable: false,
                    reason: "No automations are available for this model."
                }
            ]
        });
    });

    it("words the Automation reason for pages in the Website Builder", async () => {
        const setup = createEditorPresenterSetup({ appKind: "wb" });
        setup.listWorkflowModels.execute.mockResolvedValue(
            createWorkflowModelPage({
                rows: [
                    createWorkflowModelRow({
                        model: "wb.page",
                        modelId: "page",
                        name: "Pages",
                        workflow: null
                    })
                ]
            })
        );
        setup.listAutomationDefinitions.execute.mockResolvedValue([]);
        await setup.presenter.init(setup.params);
        setup.presenter.createWorkflow();

        setup.presenter.openTypePicker(0);

        const automation = setup.presenter.vm.typePicker?.options.find(option => {
            return option.type === "automation";
        });
        expect(automation?.reason).toBe("No automations are available for pages.");
    });

    it("closes on its own and when a step is added", async () => {
        const { presenter, params } = createEditorPresenterSetup();
        await presenter.init(params);

        presenter.openTypePicker(0);
        presenter.closeTypePicker();
        expect(presenter.vm.typePicker).toBeNull();

        presenter.openTypePicker(0);
        presenter.addStep(0, "review");
        expect(presenter.vm.typePicker).toBeNull();
    });

    it("is closed when no workflow is open", async () => {
        const { presenter, params } = setupWithoutWorkflow();
        await presenter.init(params);

        presenter.openTypePicker(0);

        expect(presenter.vm.typePicker).toBeNull();
    });
});

describe("WorkflowEditorPresenter: move, update and delete a step", () => {
    const withThreeSteps = async () => {
        const setup = createEditorPresenterSetup();
        setup.getWorkflow.execute.mockResolvedValue(
            createEditorWorkflow({
                steps: [
                    createReviewStep({ id: "a", title: "First" }),
                    createReviewStep({ id: "b", title: "Second" }),
                    createReviewStep({ id: "c", title: "Third" })
                ]
            })
        );
        await setup.presenter.init(setup.params);
        return setup;
    };

    it("moves a step and renumbers the cards", async () => {
        const { presenter } = await withThreeSteps();

        presenter.moveStep(0, 2);

        expect(presenter.vm.flow.steps.map(step => step.canMoveUp)).toEqual([false, true, true]);
        expect(presenter.vm.flow.steps.map(step => step.canMoveDown)).toEqual([true, true, false]);
        expect(presenter.vm.flow.steps.map(step => [step.number, step.id])).toEqual([
            [1, "b"],
            [2, "c"],
            [3, "a"]
        ]);
        expect(presenter.vm.header?.dirty).toBe(true);
    });

    it("applies a step edit and clears nothing else", async () => {
        const { presenter } = await withThreeSteps();
        // A save refused by the client checks marks the untitled step `a`.
        presenter.updateStep("a", { title: "" });
        await presenter.save();
        const errorsOfA = presenter.getStepFieldErrors("a");
        expect(errorsOfA).not.toEqual([]);
        const stepC = presenter.getStep("c");

        presenter.updateStep("b", { title: "Renamed", color: "#3B6FD4" });

        expect(presenter.getStep("b")?.title).toBe("Renamed");
        expect(presenter.vm.flow.steps[1]).toMatchObject({ title: "Renamed", color: "#3B6FD4" });
        expect(presenter.getStep("c")).toEqual(stepC);
        expect(presenter.getStepFieldErrors("a")).toEqual(errorsOfA);
    });

    it("asks before deleting a step and keeps it on cancel", async () => {
        const { presenter } = await withThreeSteps();

        presenter.requestDeleteStep("b");

        expect(presenter.vm.dialog).toEqual({
            kind: "deleteStep",
            title: "Delete step?",
            body: "“Second” is removed from this workflow when you save. Reviews already running are not affected.",
            note: null,
            reviews: [],
            confirmLabel: "Delete step",
            cancelLabel: "Cancel",
            destructive: true,
            cancelDestructive: false,
            busy: false
        });

        presenter.cancelDialog();

        expect(presenter.vm.dialog).toBeNull();
        expect(presenter.vm.flow.steps).toHaveLength(3);
    });

    it("removes the step on confirm", async () => {
        const { presenter } = await withThreeSteps();
        presenter.requestDeleteStep("b");

        await presenter.confirmDialog();

        expect(presenter.vm.flow.steps.map(step => step.id)).toEqual(["a", "c"]);
        expect(presenter.vm.dialog).toBeNull();
        expect(presenter.vm.header?.dirty).toBe(true);
    });

    it("names an untitled step Untitled step", async () => {
        const { presenter } = await withThreeSteps();
        presenter.updateStep("b", { title: "" });

        presenter.requestDeleteStep("b");

        expect(presenter.vm.dialog?.body).toBe(
            "“Untitled step” is removed from this workflow when you save. Reviews already running are not affected."
        );
    });

    it("ignores a delete request for a step that is not there", async () => {
        const { presenter } = await withThreeSteps();

        presenter.requestDeleteStep("missing");

        expect(presenter.vm.dialog).toBeNull();
    });
});

describe("WorkflowEditorPresenter: the step cards (R234, R269, R270, R275)", () => {
    it("builds a render-ready card with the team name resolved", async () => {
        const { presenter, params } = createEditorPresenterSetup();
        await presenter.init(params);

        expect(presenter.vm.flow.steps).toEqual([
            {
                id: "step-1",
                number: 1,
                title: "Editorial check",
                color: "var(--color-primary-500)",
                typeLabel: "People",
                type: "review",
                summary: "Editors · Team pool",
                readOnly: false,
                warnings: [],
                error: null,
                canMoveUp: false,
                canMoveDown: false
            }
        ]);
    });

    it("says Untitled step for an empty title and uses the neutral colour for an empty one", async () => {
        const { presenter, params } = createEditorPresenterSetup();
        await presenter.init(params);

        presenter.updateStep("step-1", { title: "", color: "" });

        expect(presenter.vm.flow.steps[0]).toMatchObject({
            title: "Untitled step",
            color: "var(--color-neutral-500)"
        });
    });

    it("shows a step of an unknown type read-only under its type id", async () => {
        const { presenter, params, getWorkflow } = createEditorPresenterSetup();
        getWorkflow.execute.mockResolvedValue(
            createEditorWorkflow({
                steps: [createEditorStep({ id: "x", type: "custom", config: { anything: 1 } })]
            })
        );

        await presenter.init(params);

        expect(presenter.vm.flow.steps[0]).toMatchObject({
            type: "custom",
            typeLabel: "custom",
            readOnly: true,
            summary: ""
        });
        expect(presenter.isStepReadOnly("x")).toBe(true);
    });

    it("shows an AI step read-only with the licence warning when the AI editor does not exist (QBZ-47)", async () => {
        const { presenter, params, getWorkflow, listStepTypes } = createEditorPresenterSetup();
        listStepTypes.execute.mockResolvedValue(
            createStepTypes().map(item => {
                return item.type === "ai" ? { ...item, available: false } : item;
            })
        );
        getWorkflow.execute.mockResolvedValue(
            createEditorWorkflow({
                steps: [
                    createEditorStep({
                        id: "ai-1",
                        type: "ai",
                        config: { instructions: "i", model: "openai/gpt-4o", tools: [] }
                    })
                ]
            })
        );

        await presenter.init(params);

        expect(presenter.vm.flow.steps[0]).toMatchObject({ readOnly: true, typeLabel: "AI" });
        expect(presenter.vm.flow.steps[0].warnings).toEqual([
            {
                text: "AI Power-Ups licence missing. This step fails when reached and can be restarted once the licence is back.",
                severity: "warning"
            }
        ]);
    });

    it("has no step error strip and no field errors before a save", async () => {
        const { presenter, params } = createEditorPresenterSetup();
        await presenter.init(params);

        expect(presenter.vm.flow.steps[0].error).toBeNull();
        expect(presenter.getStepFieldErrors("step-1")).toEqual([]);
        expect(presenter.vm.scrollRequest).toBeNull();
        expect(presenter.vm.openStepId).toBeNull();
        expect(presenter.vm.flow.stepsError).toBeNull();
        expect(presenter.vm.header?.nameError).toBeNull();
    });
});

describe("WorkflowEditorPresenter: the open step (R284)", () => {
    const withTwoModels = async () => {
        const setup = createEditorPresenterSetup();
        setup.listWorkflowModels.execute.mockResolvedValue(
            createWorkflowModelPage({
                rows: [
                    createWorkflowModelRow(),
                    createWorkflowModelRow({
                        model: "cms.press",
                        modelId: "press",
                        name: "Press",
                        workflow: null
                    })
                ]
            })
        );
        await setup.presenter.init(setup.params);
        return setup;
    };

    it("opens a step of the draft and closes it", async () => {
        const { presenter, params } = createEditorPresenterSetup();
        await presenter.init(params);

        presenter.openStep("step-1");
        expect(presenter.vm.openStepId).toBe("step-1");

        presenter.closeStep();
        expect(presenter.vm.openStepId).toBeNull();
    });

    it("ignores a step that is not in the draft", async () => {
        const { presenter, params } = createEditorPresenterSetup();
        await presenter.init(params);

        presenter.openStep("missing");

        expect(presenter.vm.openStepId).toBeNull();
    });

    it("opens a read-only step too, the drawer shows it read-only", async () => {
        const { presenter, params, getWorkflow } = createEditorPresenterSetup();
        getWorkflow.execute.mockResolvedValue(
            createEditorWorkflow({
                steps: [createEditorStep({ id: "x", type: "custom", config: {} })]
            })
        );
        await presenter.init(params);

        presenter.openStep("x");

        expect(presenter.vm.openStepId).toBe("x");
    });

    it("does not open a step of the workflow that was open before a model without one", async () => {
        const { presenter } = await withTwoModels();
        expect(presenter.getStep("step-1")).not.toBeNull();

        await presenter.selectModel("press");
        presenter.openStep("step-1");

        expect(presenter.vm.openStepId).toBeNull();
    });

    it("closes when another model is opened", async () => {
        const { presenter } = await withTwoModels();
        presenter.openStep("step-1");

        await presenter.selectModel("press");

        expect(presenter.vm.openStepId).toBeNull();
    });

    it("closes when the open step is removed, and stays open for another step's removal", async () => {
        const setup = createEditorPresenterSetup();
        setup.getWorkflow.execute.mockResolvedValue(
            createEditorWorkflow({
                steps: [createReviewStep({ id: "a" }), createReviewStep({ id: "b" })]
            })
        );
        await setup.presenter.init(setup.params);
        setup.presenter.openStep("a");

        setup.presenter.requestDeleteStep("b");
        await setup.presenter.confirmDialog();
        expect(setup.presenter.vm.openStepId).toBe("a");

        setup.presenter.requestDeleteStep("a");
        await setup.presenter.confirmDialog();
        expect(setup.presenter.vm.openStepId).toBeNull();
    });

    it("is closed by dispose", async () => {
        const { presenter, params } = createEditorPresenterSetup();
        await presenter.init(params);
        presenter.openStep("step-1");

        presenter.dispose();

        expect(presenter.vm.openStepId).toBeNull();
    });
});

describe("WorkflowEditorPresenter: edits not yet applied from the open drawer (leave guard)", () => {
    const withOpenDrawer = async () => {
        const setup = createEditorPresenterSetup();
        await setup.presenter.init(setup.params);
        setup.presenter.openStep("step-1");
        const drawer = createDrawerSetup([]).presenter;
        drawer.open(setup.presenter, "step-1");
        return { presenter: setup.presenter, drawer };
    };

    it("counts the drawer's edits as unsaved, without enabling Save, until Done applies them", async () => {
        const { presenter, drawer } = await withOpenDrawer();
        expect(presenter.vm.header?.dirty).toBe(false);

        findFormFieldVm(drawer.vm.form, "title")?.onChange("Edited in the drawer");

        expect(presenter.vm.header?.dirty).toBe(true);
        expect(presenter.vm.header?.canSave).toBe(false);

        await drawer.done();

        expect(presenter.vm.openStepId).toBeNull();
        expect(presenter.getStep("step-1")?.title).toBe("Edited in the drawer");
        expect(presenter.vm.header?.dirty).toBe(true);
        expect(presenter.vm.header?.canSave).toBe(true);
    });

    it("goes back to the draft's state when the drawer closes without applying", async () => {
        const { presenter, drawer } = await withOpenDrawer();
        findFormFieldVm(drawer.vm.form, "title")?.onChange("Dropped");
        expect(presenter.vm.header?.dirty).toBe(true);

        drawer.close();

        expect(presenter.vm.header?.dirty).toBe(false);
    });

    it("goes back to the draft's state when the editor closes the step", async () => {
        const { presenter, drawer } = await withOpenDrawer();
        findFormFieldVm(drawer.vm.form, "title")?.onChange("Dropped");

        presenter.closeStep();

        expect(presenter.vm.header?.dirty).toBe(false);
    });

    it("drops the count when the drawer is disposed", async () => {
        const { presenter, drawer } = await withOpenDrawer();
        findFormFieldVm(drawer.vm.form, "title")?.onChange("Dropped");

        drawer.dispose();

        expect(presenter.vm.header?.dirty).toBe(false);
    });
});

describe("WorkflowEditorPresenter.getNamespace (R284)", () => {
    it("is the open CMS model's namespace", async () => {
        const { presenter, params } = createEditorPresenterSetup();
        await presenter.init(params);

        expect(presenter.getNamespace()).toBe("cms.article");
    });

    it("is wb.page in the Website Builder", async () => {
        const { presenter, params } = setupWithoutWorkflow("wb");
        await presenter.init(params);

        expect(presenter.getNamespace()).toBe("wb.page");
    });

    it("is null with no model open", async () => {
        const { presenter, params, listWorkflowModels } = createEditorPresenterSetup();
        listWorkflowModels.execute.mockResolvedValue(createWorkflowModelPage({ rows: [] }));
        await presenter.init(params);

        expect(presenter.getNamespace()).toBeNull();
    });
});

describe("WorkflowEditorPresenter: AI tool that changes content (R283)", () => {
    const aiWorkflow = () => {
        return createEditorWorkflow({
            steps: [
                createEditorStep({
                    id: "ai-1",
                    type: "ai",
                    notificationIds: [],
                    config: { instructions: "i", model: "openai/gpt-4o", tools: ["readContent"] }
                })
            ]
        });
    };

    it("adds can change content to the summary when a chosen tool changes content", async () => {
        const { presenter, params, getWorkflow, listAiTools } = createEditorPresenterSetup();
        getWorkflow.execute.mockResolvedValue(aiWorkflow());
        listAiTools.execute.mockResolvedValue([createAiTool({ changesContent: true })]);

        await presenter.init(params);

        expect(presenter.vm.flow.steps[0].summary).toBe("GPT-4o · 1 tool · can change content");
    });

    it("leaves the summary plain for a tool that does not change content", async () => {
        const { presenter, params, getWorkflow } = createEditorPresenterSetup();
        getWorkflow.execute.mockResolvedValue(aiWorkflow());

        await presenter.init(params);

        expect(presenter.vm.flow.steps[0].summary).toBe("GPT-4o · 1 tool");
    });

    it("leaves it plain while the tool list failed to load", async () => {
        const { presenter, params, getWorkflow, listAiTools } = createEditorPresenterSetup();
        getWorkflow.execute.mockResolvedValue(aiWorkflow());
        listAiTools.execute.mockRejectedValueOnce(new Error("down"));

        await presenter.init(params);

        expect(presenter.vm.flow.steps[0].summary).toBe("GPT-4o · 1 tool");
    });
});
