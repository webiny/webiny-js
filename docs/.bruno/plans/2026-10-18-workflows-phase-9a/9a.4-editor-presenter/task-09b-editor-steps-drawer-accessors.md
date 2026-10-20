### Task 9b: Editor presenter: steps, drawer accessors and team search

R234, R267 (field vocabulary of step errors), R269, R270, R272, R276 (create), R280, R283, R284; D91, D122; QBZ-47, QBZ-97; Review Focus 5, 9 (`00-shared.md`). Everything stated for Task 9 (Global Constraints, code style, test rules) applies here unchanged.

Task 9 left the presenter with the shell (init, options, model list, open model, team names at load). This task adds everything about the steps of the open workflow, as exact hunks against the files Task 9 created: creating a draft, the step cards (render-ready VMs with the summaries and warnings of Task 8), the type picker, adding, moving and deleting steps, the open step (`openStep`, `closeStep`, `vm.openStepId`, R284), the accessors the step drawer (Task 14) reads, and the team search the People form's picker uses. Task 10 adds save and delete.

- **Create (R276, R280).** `createWorkflow()` on a model without a workflow starts a draft named `{Model} review` with no steps, the model's namespace and a generated id; it is dirty from the start. `setName(name)` renames the draft and clears the name error.
- **Type picker and add (R269, R270, R272, R284).** `openTypePicker(index)` / `closeTypePicker()` drive `vm.typePicker { index, options }` (Task 8's `getStepTypeOptions`: every type in server order, `addable`, `reason`). `addStep(index, type)` adds a `createNewStep` at the index when the type is addable, closes the picker, **opens the new step** (`vm.openStepId`, so the drawer opens, R284) and returns the new id; for a type that is not addable it returns null and changes nothing.
- **The open step (R284).** `openStep(stepId)` sets `vm.openStepId` when a workflow is open and the step is in the draft (a read-only step opens too: the drawer shows it read-only); `closeStep()` clears it. It is also cleared when another model opens, when the open step is removed and by `dispose`.
- **Move and delete.** `moveStep(from, to)` is the draft's. `requestDeleteStep(stepId)` opens `Delete step?`; `confirmDialog()` removes the step and clears its errors.
- **Cards (R234, R269, R270, R275, R283).** `vm.flow { steps, stepsError }`: a `StepCardVm` per step with the title (`Untitled step` when empty), the colour (the neutral fallback for an empty one), the type label and id, the summary and warnings of Task 8 (`StepContext` now carries the loaded team, automation, AI model and AI tool lists, each only once its list is `ready`), `readOnly`, `canMoveUp` and `canMoveDown` (computed here, not in the component) and the error strip (the first client or server error of the step, filled by Task 10).
- **Drawer accessors (R284, R234).** `getStep(stepId)`, `updateStep(stepId, patch)` (the drawer's Done; clears that step's errors), `getStepFieldErrors(stepId)`, `isStepReadOnly(stepId)`, `getNamespace(): string | null` (the open model's namespace, `cms.article` or `wb.page`, null with no model open), plus Task 9's `getOptions()` and `retryOptions()`.
- **Team search (R268, R282, Review Focus 9).** `searchTeams(search)` (an empty search runs at once, any other is debounced 250 ms because every call scans the users for `memberCount`) fills the results and merges them into the known teams; `getTeamOptions()` exposes `{ results, known, loading, failed }`; `retryTeams()` repeats the last search. A failed search shows the options banner too, and the banner's Try again (`retryOptions`) repeats it.

**Files:** (all under `packages/app-workflows/src`)
- Create: `editor/presentation/editor/dialogs/deleteStepDialog.ts`
- Create: `editor/presentation/editor/buildStepCardVm.ts`
- Modify: `editor/presentation/editor/abstractions.ts`
- Modify: `editor/presentation/editor/PendingDialog.ts`
- Modify: `editor/presentation/editor/WorkflowEditorPresenter.ts`
- Create (tests): `editor/presentation/editor/dialogs/deleteStepDialog.test.ts`, `editor/presentation/editor/buildStepCardVm.test.ts`, `editor/presentation/editor/WorkflowEditorPresenter.flow.test.ts`, `editor/presentation/editor/WorkflowEditorPresenter.teamSearch.test.ts`

**Interfaces:**
- Consumes: Task 9 (the presenter, `createEditorPresenterSetup`, `PendingDialog`, `OptionList`, the dialog VM), Task 8 (`createNewStep`, `getStepSummary`, `getStepWarnings`, `getStepTypeLabel`, `getStepTypeOptions` and `StepTypeOption`, `isStepReadOnly`, `isAiEditable`, `StepContext` with `aiTools`, `StepFieldError`, `StepValidationErrors`, `EditorStepPatch`, `FALLBACK_STEP_COLOUR`, the fixtures `draftFixtures.ts`), Task 5 (`EditorStep`, `WorkflowTeamSummary`, `AiTool` with `changesContent`, the fixtures). Existing (verified): `generateAlphaNumericId` (`@webiny/utils/generateId.js`).
- Produces: presenter members `createWorkflow`, `setName`, `openTypePicker`, `closeTypePicker`, `openStep`, `closeStep`, `addStep`, `moveStep`, `requestDeleteStep`, `getStep`, `updateStep`, `getStepFieldErrors`, `isStepReadOnly`, `getNamespace`, `getTeamOptions`, `searchTeams`, `retryTeams`; VM fields `flow`, `typePicker`, `openStepId`, `scrollRequest` (set by Task 10); the types `StepCardVm` (`id`, `number`, `title`, `color`, `typeLabel`, `type`, `summary`, `readOnly`, `warnings`, `error`, `canMoveUp`, `canMoveDown`), `WorkflowFlowVm`, `TypePickerVm`, `ScrollRequestVm`, `WorkflowTeamOptions`; the dialog kind `deleteStep` and `RemoveStepAction`. Task 14's `StepDrawerSource` is the structural subset `getStep`, `updateStep`, `getStepFieldErrors`, `isStepReadOnly`, `getOptions`, `getTeamOptions`, `searchTeams`, `retryTeams`, `retryOptions`, `getNamespace`.

**Test runner note:** admin package, `yarn test <path>` only. The tests reuse `createEditorPresenterSetup` from Task 9 and `createDeferred` from Task 6; the flow test mocks the id generator.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/presentation/editor/dialogs/deleteStepDialog.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { deleteStepDialog } from "./deleteStepDialog.js";

describe("deleteStepDialog (QBZ-12 prototype copy)", () => {
    it("names the step", () => {
        expect(deleteStepDialog("Legal sign-off")).toEqual({
            kind: "deleteStep",
            title: "Delete step?",
            body: "“Legal sign-off” is removed from this workflow when you save. Reviews already running are not affected.",
            note: null,
            reviews: [],
            confirmLabel: "Delete step",
            cancelLabel: "Cancel",
            destructive: true,
            cancelDestructive: false,
            busy: false
        });
    });

    it("says Untitled step for a step with no title", () => {
        expect(deleteStepDialog("").body).toBe(
            "“Untitled step” is removed from this workflow when you save. Reviews already running are not affected."
        );
    });
});
```

Create `packages/app-workflows/src/editor/presentation/editor/buildStepCardVm.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { buildStepCardVm } from "./buildStepCardVm.js";
import type { StepCardParams } from "./buildStepCardVm.js";

const params = (overrides: Partial<StepCardParams> = {}): StepCardParams => {
    return {
        step: createReviewStep(),
        index: 0,
        count: 1,
        typeLabel: "People",
        summary: "Editors",
        warnings: [],
        errors: [],
        readOnly: false,
        ...overrides
    };
};

describe("buildStepCardVm", () => {
    it("numbers the card from its index and passes the texts through", () => {
        expect(buildStepCardVm(params({ index: 2, count: 4 }))).toEqual({
            id: "step-1",
            number: 3,
            title: "Legal sign-off",
            color: "var(--color-primary-500)",
            typeLabel: "People",
            type: "review",
            summary: "Editors",
            readOnly: false,
            warnings: [],
            error: null,
            canMoveUp: true,
            canMoveDown: true
        });
    });

    it("cannot move the first card up or the last card down", () => {
        const first = buildStepCardVm(params({ index: 0, count: 3 }));
        const last = buildStepCardVm(params({ index: 2, count: 3 }));
        const only = buildStepCardVm(params({ index: 0, count: 1 }));

        expect([first.canMoveUp, first.canMoveDown]).toEqual([false, true]);
        expect([last.canMoveUp, last.canMoveDown]).toEqual([true, false]);
        expect([only.canMoveUp, only.canMoveDown]).toEqual([false, false]);
    });

    it("says Untitled step and uses the neutral colour for empty values", () => {
        const card = buildStepCardVm(params({ step: createReviewStep({ title: " ", color: "" }) }));

        expect(card.title).toBe("Untitled step");
        expect(card.color).toBe("var(--color-neutral-500)");
    });

    it("shows the first error of the step as the strip", () => {
        const card = buildStepCardVm(
            params({
                errors: [
                    { field: "title", message: "Enter a title for this step." },
                    { field: "color", message: "Enter a hex colour, e.g. #3B6FD4." }
                ]
            })
        );

        expect(card.error).toBe("Enter a title for this step.");
    });

    it("carries the read-only flag and the warnings", () => {
        const card = buildStepCardVm(params({ readOnly: true, warnings: ["Editors has no members."] }));

        expect(card.readOnly).toBe(true);
        expect(card.warnings).toEqual(["Editors has no members."]);
    });
});
```

Create `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.flow.test.ts`:

```ts
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
import { createWorkflowTeamSummary } from "~/editor/testing/editorFixtures.js";

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
    setup.useCases.listModels.mockResolvedValue(createWorkflowModelPage({ rows: [row] }));
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
        const { presenter, params, config } = createEditorPresenterSetup();
        config.listAutomationDefinitions.mockResolvedValue([]);
        await presenter.init(params);

        presenter.addStep(0, "automation");

        expect(presenter.vm.openStepId).toBeNull();
    });

    it("refuses a type that is not addable and changes nothing (R269, Review Focus 5)", async () => {
        const { presenter, params, config } = createEditorPresenterSetup();
        config.listAutomationDefinitions.mockResolvedValue([]);
        config.listStepTypes.mockResolvedValue(
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
        const { presenter, params, config } = createEditorPresenterSetup();
        config.listAutomationDefinitions.mockResolvedValue([]);
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
        setup.useCases.listModels.mockResolvedValue(
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
        setup.config.listAutomationDefinitions.mockResolvedValue([]);
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
        setup.useCases.getWorkflow.mockResolvedValue(
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

        presenter.updateStep("b", { title: "Renamed", color: "#3B6FD4" });

        expect(presenter.getStep("b")?.title).toBe("Renamed");
        expect(presenter.vm.flow.steps[1]).toMatchObject({ title: "Renamed", color: "#3B6FD4" });
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
                summary: "Editors",
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

    it("warns about a team without members", async () => {
        const { presenter, params, config } = createEditorPresenterSetup();
        config.listTeams.mockResolvedValue({
            teams: [createWorkflowTeamSummary({ id: "team-1", name: "Editors", memberCount: 0 })],
            missingIds: []
        });

        await presenter.init(params);

        expect(presenter.vm.flow.steps[0].warnings).toEqual(["Editors has no members."]);
    });

    it("shows a step of an unknown type read-only under its type id", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        useCases.getWorkflow.mockResolvedValue(
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
        const { presenter, params, useCases, config } = createEditorPresenterSetup();
        config.listStepTypes.mockResolvedValue(
            createStepTypes().map(item => {
                return item.type === "ai" ? { ...item, available: false } : item;
            })
        );
        useCases.getWorkflow.mockResolvedValue(
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
            "AI Power-Ups licence missing. This step fails when reached and can be restarted once the licence is back."
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
        setup.useCases.listModels.mockResolvedValue(
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
        const { presenter, params, useCases } = createEditorPresenterSetup();
        useCases.getWorkflow.mockResolvedValue(
            createEditorWorkflow({
                steps: [createEditorStep({ id: "x", type: "custom", config: {} })]
            })
        );
        await presenter.init(params);

        presenter.openStep("x");

        expect(presenter.vm.openStepId).toBe("x");
    });

    it("does not open a step while no workflow is open", async () => {
        const { presenter, params } = setupWithoutWorkflow();
        await presenter.init(params);

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
        setup.useCases.getWorkflow.mockResolvedValue(
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
        const { presenter, params, useCases } = createEditorPresenterSetup();
        useCases.listModels.mockResolvedValue(createWorkflowModelPage({ rows: [] }));
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
        const { presenter, params, useCases, config } = createEditorPresenterSetup();
        useCases.getWorkflow.mockResolvedValue(aiWorkflow());
        config.listAiTools.mockResolvedValue([createAiTool({ changesContent: true })]);

        await presenter.init(params);

        expect(presenter.vm.flow.steps[0].summary).toBe("GPT-4o · 1 tool · can change content");
    });

    it("leaves the summary plain for a tool that does not change content", async () => {
        const { presenter, params, useCases } = createEditorPresenterSetup();
        useCases.getWorkflow.mockResolvedValue(aiWorkflow());

        await presenter.init(params);

        expect(presenter.vm.flow.steps[0].summary).toBe("GPT-4o · 1 tool");
    });

    it("leaves it plain while the tool list failed to load", async () => {
        const { presenter, params, useCases, config } = createEditorPresenterSetup();
        useCases.getWorkflow.mockResolvedValue(aiWorkflow());
        config.listAiTools.mockRejectedValueOnce(new Error("down"));

        await presenter.init(params);

        expect(presenter.vm.flow.steps[0].summary).toBe("GPT-4o · 1 tool");
    });
});
```

Create `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.teamSearch.test.ts`:

```ts
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createEditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createWorkflowTeamSummary } from "~/editor/testing/editorFixtures.js";

afterEach(() => {
    vi.useRealTimers();
});

describe("WorkflowEditorPresenter: team names on the cards (R268)", () => {
    it("shows the resolved names of every People step", async () => {
        const { presenter, params, useCases, config } = createEditorPresenterSetup();
        useCases.getWorkflow.mockResolvedValue(
            createEditorWorkflow({
                steps: [
                    createReviewStep({
                        id: "a",
                        config: { teams: ["team-1", "team-2"], assignment: null }
                    }),
                    createReviewStep({ id: "b", config: { teams: ["team-2"], assignment: null } })
                ]
            })
        );
        config.listTeams.mockResolvedValue({
            teams: [
                createWorkflowTeamSummary({ id: "team-1", name: "Editors" }),
                createWorkflowTeamSummary({ id: "team-2", name: "Legal" })
            ],
            missingIds: []
        });

        await presenter.init(params);

        expect(presenter.vm.flow.steps.map(step => step.summary)).toEqual([
            "Editors + Legal",
            "Legal"
        ]);
        expect(presenter.getTeamOptions().known.map(team => team.id)).toEqual(["team-1", "team-2"]);
    });

    it("names a team the server could not find as Unknown item", async () => {
        const { presenter, params, config } = createEditorPresenterSetup();
        config.listTeams.mockResolvedValue({ teams: [], missingIds: ["team-1"] });

        await presenter.init(params);

        expect(presenter.vm.flow.steps[0].summary).toBe("Unknown item");
        expect(presenter.vm.optionsBanner).toBeNull();
    });

    it("warns about a team without members", async () => {
        const { presenter, params, config } = createEditorPresenterSetup();
        config.listTeams.mockResolvedValue({
            teams: [createWorkflowTeamSummary({ id: "team-1", name: "Editors", memberCount: 0 })],
            missingIds: []
        });

        await presenter.init(params);

        expect(presenter.vm.flow.steps[0].warnings).toEqual(["Editors has no members."]);
    });

    it("shows the names after Try again when the first lookup failed", async () => {
        const { presenter, params, config } = createEditorPresenterSetup();
        config.listTeams.mockRejectedValueOnce(new Error("down"));
        await presenter.init(params);
        expect(presenter.vm.flow.steps[0].summary).toBe("Unknown item");

        await presenter.retryOptions();

        expect(presenter.vm.flow.steps[0].summary).toBe("Editors");
        expect(presenter.vm.optionsBanner).toBeNull();
    });
});

describe("WorkflowEditorPresenter: team search (R268, R282)", () => {
    it("runs an empty search at once with the default limit", async () => {
        const { presenter, params, config } = createEditorPresenterSetup();
        await presenter.init(params);
        config.listTeams.mockClear();
        config.listTeams.mockResolvedValue({
            teams: [createWorkflowTeamSummary({ id: "team-9", name: "Press" })],
            missingIds: []
        });

        presenter.searchTeams("");
        await vi.waitFor(() => expect(config.listTeams).toHaveBeenCalledTimes(1));

        expect(config.listTeams).toHaveBeenCalledWith({ search: null, ids: null, limit: 50 });
        await vi.waitFor(() => expect(presenter.getTeamOptions().results).toHaveLength(1));
        expect(presenter.getTeamOptions().results[0].name).toBe("Press");
        expect(presenter.getTeamOptions().loading).toBe(false);
    });

    it("debounces a typed search by 250 ms", async () => {
        const { presenter, params, config } = createEditorPresenterSetup();
        await presenter.init(params);
        config.listTeams.mockClear();
        vi.useFakeTimers();

        presenter.searchTeams("le");
        presenter.searchTeams("leg");
        await vi.advanceTimersByTimeAsync(249);
        expect(config.listTeams).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);

        expect(config.listTeams).toHaveBeenCalledTimes(1);
        expect(config.listTeams).toHaveBeenCalledWith({ search: "leg", ids: null, limit: 50 });
    });

    it("merges the results into the known teams, so a chip keeps its name when the search narrows", async () => {
        const { presenter, params, config } = createEditorPresenterSetup();
        await presenter.init(params);
        config.listTeams.mockResolvedValue({
            teams: [createWorkflowTeamSummary({ id: "team-9", name: "Press", memberCount: 0 })],
            missingIds: []
        });

        presenter.searchTeams("");
        await vi.waitFor(() => expect(presenter.getTeamOptions().results).toHaveLength(1));

        const known = presenter.getTeamOptions().known.map(team => team.id);
        expect(known).toContain("team-1");
        expect(known).toContain("team-9");
    });

    it("flags a failed search and repeats the last search on retry", async () => {
        const { presenter, params, config } = createEditorPresenterSetup();
        await presenter.init(params);
        config.listTeams.mockClear();
        config.listTeams.mockRejectedValueOnce(new Error("down"));

        presenter.searchTeams("");
        await vi.waitFor(() => expect(presenter.getTeamOptions().failed).toBe(true));
        expect(presenter.vm.optionsBanner).not.toBeNull();

        config.listTeams.mockResolvedValueOnce({
            teams: [createWorkflowTeamSummary({ id: "team-9", name: "Press" })],
            missingIds: []
        });
        await presenter.retryTeams();

        expect(presenter.getTeamOptions().failed).toBe(false);
        expect(presenter.getTeamOptions().results[0].name).toBe("Press");
        expect(config.listTeams).toHaveBeenLastCalledWith({ search: null, ids: null, limit: 50 });
    });
});

describe("WorkflowEditorPresenter: Try again clears a failed team search (R284)", () => {
    it("repeats the search when the banner's Try again runs", async () => {
        const { presenter, params, config } = createEditorPresenterSetup();
        await presenter.init(params);
        config.listTeams.mockClear();
        config.listTeams.mockRejectedValueOnce(new Error("down"));
        presenter.searchTeams("");
        await vi.waitFor(() => expect(presenter.getTeamOptions().failed).toBe(true));
        expect(presenter.vm.optionsBanner).not.toBeNull();

        await presenter.retryOptions();

        expect(presenter.vm.optionsBanner).toBeNull();
        expect(presenter.getTeamOptions().failed).toBe(false);
        expect(config.listTeams).toHaveBeenLastCalledWith({ search: null, ids: null, limit: 50 });
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/dialogs/deleteStepDialog.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/buildStepCardVm.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.flow.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.teamSearch.test.ts 2>&1 | tail -40
```

Expected: the first two fail with `Failed to resolve import "./deleteStepDialog.js"` and `"./buildStepCardVm.js"`; the two presenter files load (Task 9's presenter exists) but fail every case with `presenter.createWorkflow is not a function`, `presenter.openStep is not a function`, `presenter.searchTeams is not a function` or `Cannot read properties of undefined` for `presenter.vm.flow`. Record the RED.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/presentation/editor/dialogs/deleteStepDialog.ts`:

```ts
import type { WorkflowEditorDialogVm } from "../abstractions.js";

// The step is only removed from the draft; the workflow changes when it is saved.
export const deleteStepDialog = (stepTitle: string): WorkflowEditorDialogVm => {
    const title = stepTitle.trim() === "" ? "Untitled step" : stepTitle;

    return {
        kind: "deleteStep",
        title: "Delete step?",
        body: `“${title}” is removed from this workflow when you save. Reviews already running are not affected.`,
        note: null,
        reviews: [],
        confirmLabel: "Delete step",
        cancelLabel: "Cancel",
        destructive: true,
        cancelDestructive: false,
        busy: false
    };
};
```

Create `packages/app-workflows/src/editor/presentation/editor/buildStepCardVm.ts`:

```ts
import { FALLBACK_STEP_COLOUR } from "~/editor/domain/stepColours.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { StepFieldError } from "~/editor/model/StepFieldError.js";
import type { StepCardVm } from "./abstractions.js";

export interface StepCardParams {
    step: EditorStep;
    // Zero based; the card shows `index + 1`.
    index: number;
    // How many steps the workflow has, to tell the last card from the others.
    count: number;
    typeLabel: string;
    summary: string;
    warnings: string[];
    errors: StepFieldError[];
    readOnly: boolean;
}

export const buildStepCardVm = (params: StepCardParams): StepCardVm => {
    const step = params.step;
    const firstError = params.errors.length > 0 ? params.errors[0].message : null;

    return {
        id: step.id,
        number: params.index + 1,
        title: step.title.trim() === "" ? "Untitled step" : step.title,
        color: step.color === "" ? FALLBACK_STEP_COLOUR : step.color,
        typeLabel: params.typeLabel,
        type: step.type,
        summary: params.summary,
        readOnly: params.readOnly,
        warnings: params.warnings,
        error: firstError,
        canMoveUp: params.index > 0,
        canMoveDown: params.index < params.count - 1
    };
};
```

Modify `packages/app-workflows/src/editor/presentation/editor/abstractions.ts`.

1. Add to the import block (one line each, after the existing `~/editor/domain/types.js` imports and the `~/editor/useCases/...` import):

```ts
import type { EditorStep } from "~/editor/domain/types.js";
import type { WorkflowTeamSummary } from "~/editor/domain/types.js";
import type { EditorStepPatch } from "~/editor/model/EditorStepPatch.js";
import type { StepTypeOption } from "~/editor/model/getStepTypeOptions.js";
import type { StepFieldError } from "~/editor/model/StepFieldError.js";
```

2. Replace

```ts
export type WorkflowEditorDialogKind = "discardChanges";
```

with

```ts
export type WorkflowEditorDialogKind = "discardChanges" | "deleteStep";
```

3. After the `OptionsBannerVm` interface add:

```ts
// One step card, render-ready (R234).
export interface StepCardVm {
    id: string;
    number: number;
    // `Untitled step` when the draft title is empty.
    title: string;
    // A `var(--color-...)` preset, `#RRGGBB`, or the neutral fallback for an empty colour.
    color: string;
    // `People`, `Automation`, `AI` or the server title of an unknown type (R269).
    typeLabel: string;
    type: string;
    summary: string;
    readOnly: boolean;
    warnings: string[];
    // The first client or server error of the step, shown as the card strip, or null.
    error: string | null;
    canMoveUp: boolean;
    canMoveDown: boolean;
}

export interface WorkflowFlowVm {
    steps: StepCardVm[];
    // `Add at least one step.` or a server `steps` error, shown in the `No steps yet` box.
    stepsError: string | null;
}

export interface TypePickerVm {
    // Where the chosen step is inserted.
    index: number;
    options: StepTypeOption[];
}

// The card the view scrolls into view after a failed save; `nonce` changes on every request.
export interface ScrollRequestVm {
    stepId: string;
    nonce: number;
}

export interface WorkflowTeamOptions {
    // The last search's results.
    results: WorkflowTeamSummary[];
    // Every team seen by id: resolved at load and from every search.
    known: WorkflowTeamSummary[];
    loading: boolean;
    failed: boolean;
}
```

4. In `IWorkflowEditorViewModel`, after `empty: EmptyWorkflowVm | null;` add:

```ts
    flow: WorkflowFlowVm;
    typePicker: TypePickerVm | null;
    // The step the drawer shows, or null (R284).
    openStepId: string | null;
    scrollRequest: ScrollRequestVm | null;
```

5. In `IWorkflowEditorPresenter`, after `selectModel(modelId: string): Promise<void>;` add:

```ts
    createWorkflow(): void;
    setName(name: string): void;
    openTypePicker(index: number): void;
    closeTypePicker(): void;
    // Opens the step (R284).
    openStep(stepId: string): void;
    closeStep(): void;
    // Returns the new step's id (and opens it), or null when the type is not addable.
    addStep(index: number, type: string): string | null;
    moveStep(from: number, to: number): void;
    requestDeleteStep(stepId: string): void;
    // Accessors for the step drawer (Task 14), not part of the VM (R234).
    getStep(stepId: string): EditorStep | null;
    updateStep(stepId: string, patch: EditorStepPatch): void;
    getStepFieldErrors(stepId: string): StepFieldError[];
    isStepReadOnly(stepId: string): boolean;
    // The open model's namespace (`cms.article`, `wb.page`), null with no model open.
    getNamespace(): string | null;
    getTeamOptions(): WorkflowTeamOptions;
    searchTeams(search: string): void;
    retryTeams(): Promise<void>;
```

Modify `packages/app-workflows/src/editor/presentation/editor/PendingDialog.ts`. Replace

```ts
// Task 9b and Task 10 add the actions of the step, save and delete dialogs here.
export type PendingAction = SwitchModelAction;
```

with

```ts
export interface RemoveStepAction {
    kind: "removeStep";
    stepId: string;
}

// Task 10 adds the actions of the save and delete dialogs here.
export type PendingAction = SwitchModelAction | RemoveStepAction;
```

Modify `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts`. Every hunk is against the file as Task 9 leaves it.

1. Imports. Add these lines to the import block (one per line, any order within the block):

```ts
import { generateAlphaNumericId } from "@webiny/utils/generateId.js";
import type { EditorStep } from "~/editor/domain/types.js";
import { createNewStep } from "~/editor/model/createNewStep.js";
import type { EditorStepPatch } from "~/editor/model/EditorStepPatch.js";
import { getStepSummary } from "~/editor/model/getStepSummary.js";
import { getStepTypeLabel } from "~/editor/model/getStepTypeLabel.js";
import { getStepTypeOptions } from "~/editor/model/getStepTypeOptions.js";
import type { StepTypeOption } from "~/editor/model/getStepTypeOptions.js";
import { getStepWarnings } from "~/editor/model/getStepWarnings.js";
import { isStepReadOnly } from "~/editor/model/isStepReadOnly.js";
import type { StepContext } from "~/editor/model/StepContext.js";
import type { StepFieldError } from "~/editor/model/StepFieldError.js";
import type { StepValidationErrors } from "~/editor/model/StepFieldError.js";
import type { ScrollRequestVm } from "./abstractions.js";
import type { TypePickerVm } from "./abstractions.js";
import type { WorkflowFlowVm } from "./abstractions.js";
import type { WorkflowTeamOptions } from "./abstractions.js";
import { buildStepCardVm } from "./buildStepCardVm.js";
import { TEAM_SEARCH_LIMIT } from "./constants.js";
import { deleteStepDialog } from "./dialogs/deleteStepDialog.js";
```

2. State. After `    private dialogBusy = false;` add:

```ts
    private typePickerIndex: number | null = null;
    private openStepId: string | null = null;
    private stepsError: string | null = null;
    private stepErrors: StepValidationErrors[] = [];
    private scrollRequest: ScrollRequestVm | null = null;
    // The last team search's results, and whether a search is running or failed.
    private teamResults: WorkflowTeamSummary[] = [];
    private teamsLoading = false;
    private teamSearchFailed = false;
    private lastTeamSearch = "";
    private teamsToken = 0;
    private teamSearchTimer: ReturnType<typeof setTimeout> | null = null;
```

3. `makeAutoObservable`. In the generic list add, after `| "teamsKnown"`: `| "teamResults"`, `| "stepErrors"`, `| "scrollRequest"`, `| "lastTeamSearch"`, `| "teamsToken"` and `| "teamSearchTimer"` (one line each). In the options object add, after `teamsKnown: observableRef,`:

```ts
            teamResults: observableRef,
            stepErrors: observableRef,
            scrollRequest: observableRef,
            lastTeamSearch: false,
            teamsToken: false,
            teamSearchTimer: false,
```

4. VM. In `get vm()` after `empty: this.buildEmpty(),` add:

```ts
            flow: this.buildFlow(),
            typePicker: this.buildTypePicker(),
            openStepId: this.openStepId,
            scrollRequest: this.scrollRequest,
```

5. `retryOptions`. Replace

```ts
    async retryOptions(): Promise<void> {
        await this.loadOptions();
        await this.resolveTeams();
    }
```

with

```ts
    async retryOptions(): Promise<void> {
        await this.loadOptions();
        await this.resolveTeams();
        // The banner also covers a failed team search of the drawer's picker (R284).
        if (this.teamSearchFailed) {
            await this.retryTeams();
        }
    }
```

6. Public methods. After the `selectModel` method add:

```ts
    createWorkflow(): void {
        const row = this.selectedRow;
        if (row === null || this.detail !== "empty") {
            return;
        }
        this.draft.startNew({
            id: generateAlphaNumericId(),
            name: `${row.name} review`,
            models: [row.model]
        });
        this.detail = "workflow";
    }

    setName(name: string): void {
        this.draft.setName(name);
        this.nameError = null;
    }

    openTypePicker(index: number): void {
        if (this.detail !== "workflow") {
            return;
        }
        this.typePickerIndex = index;
    }

    closeTypePicker(): void {
        this.typePickerIndex = null;
    }

    openStep(stepId: string): void {
        if (this.detail !== "workflow") {
            return;
        }
        if (this.draft.steps.some(step => step.id === stepId)) {
            this.openStepId = stepId;
        }
    }

    closeStep(): void {
        this.openStepId = null;
    }

    addStep(index: number, type: string): string | null {
        const option = this.getTypeOptions().find(item => item.type === type);
        if (!option || !option.addable || this.detail !== "workflow") {
            return null;
        }
        const step = createNewStep({
            id: generateAlphaNumericId(),
            type,
            transports: this.transports.items
        });
        this.draft.addStep(index, step);
        this.stepsError = null;
        this.typePickerIndex = null;
        this.openStepId = step.id;
        return step.id;
    }

    moveStep(from: number, to: number): void {
        this.draft.moveStep(from, to);
    }

    requestDeleteStep(stepId: string): void {
        const step = this.draft.steps.find(item => item.id === stepId);
        if (!step) {
            return;
        }
        this.pending = {
            vm: deleteStepDialog(step.title),
            action: { kind: "removeStep", stepId }
        };
    }

    getStep(stepId: string): EditorStep | null {
        const step = this.draft.steps.find(item => item.id === stepId);
        return step ?? null;
    }

    updateStep(stepId: string, patch: EditorStepPatch): void {
        this.draft.updateStep(stepId, patch);
        this.clearStepErrors(stepId);
    }

    getStepFieldErrors(stepId: string): StepFieldError[] {
        const entry = this.stepErrors.find(item => item.stepId === stepId);
        return entry ? entry.errors : [];
    }

    isStepReadOnly(stepId: string): boolean {
        const step = this.getStep(stepId);
        return step === null ? false : isStepReadOnly(step, this.stepTypes.items);
    }

    getNamespace(): string | null {
        const row = this.selectedRow;
        return row === null ? null : row.model;
    }

    getTeamOptions(): WorkflowTeamOptions {
        return {
            results: this.teamResults,
            known: this.teamsKnown,
            loading: this.teamsLoading,
            failed: this.teamSearchFailed
        };
    }

    searchTeams(search: string): void {
        this.cancelTeamSearchTimer();
        this.lastTeamSearch = search;
        if (search === "") {
            void this.runTeamSearch(search);
            return;
        }
        this.teamSearchTimer = setTimeout(() => {
            this.teamSearchTimer = null;
            void this.runTeamSearch(search);
        }, SEARCH_DEBOUNCE_MS);
    }

    async retryTeams(): Promise<void> {
        await this.runTeamSearch(this.lastTeamSearch);
    }
```

7. `confirmDialog`. Replace the whole method with:

```ts
    async confirmDialog(): Promise<void> {
        const pending = this.pending;
        if (pending === null || this.dialogBusy) {
            return;
        }
        const action = pending.action;
        if (action.kind === "switchModel") {
            await this.openModel(action.modelId);
            return;
        }
        this.applyRemoveStep(action.stepId);
    }
```

8. `dispose`. After `this.resolveToken += 1;` (the one in `dispose`, among the token bumps) add `this.teamsToken += 1;`; after `this.cancelModelSearchTimer();` (in `dispose`) add `this.cancelTeamSearchTimer();`; after `this.dialogBusy = false;` (end of `dispose`) add:

```ts
        this.typePickerIndex = null;
        this.openStepId = null;
        this.stepsError = null;
        this.stepErrors = [];
        this.scrollRequest = null;
        this.teamResults = [];
        this.teamsLoading = false;
        this.teamSearchFailed = false;
        this.lastTeamSearch = "";
```

9. `beginOpen`. After `this.pending = null;` (in `beginOpen`, before `this.detail = ...`) add:

```ts
        this.typePickerIndex = null;
        this.openStepId = null;
        this.stepsError = null;
        this.stepErrors = [];
        this.scrollRequest = null;
```

10. `buildOptionsBanner`. Replace `if (statuses.includes("failed") || this.teamsFailed) {` with:

```ts
        if (statuses.includes("failed") || this.teamsFailed || this.teamSearchFailed) {
```

11. Builders. After `buildDialog()` add:

```ts
    private buildFlow(): WorkflowFlowVm {
        if (this.detail !== "workflow") {
            return { steps: [], stepsError: null };
        }
        const stepTypes = this.stepTypes.items;
        const aiEditable = isAiEditable(stepTypes);
        const count = this.draft.steps.length;
        const steps = this.draft.steps.map((step, index) => {
            const context = this.getStepContext(step, aiEditable);
            const entry = this.stepErrors.find(item => item.stepId === step.id);

            return buildStepCardVm({
                step,
                index,
                count,
                typeLabel: getStepTypeLabel(step.type, stepTypes),
                summary: getStepSummary(step, context),
                warnings: getStepWarnings(step, context),
                errors: entry ? entry.errors : [],
                readOnly: isStepReadOnly(step, stepTypes)
            });
        });

        return { steps, stepsError: this.stepsError };
    }

    private buildTypePicker(): TypePickerVm | null {
        if (this.typePickerIndex === null || this.detail !== "workflow") {
            return null;
        }
        return { index: this.typePickerIndex, options: this.getTypeOptions() };
    }

    private getTypeOptions(): StepTypeOption[] {
        const params = this.params;
        const row = this.selectedRow;
        if (params === null || row === null) {
            return [];
        }
        return getStepTypeOptions({
            stepTypes: this.stepTypes.items,
            automations: this.automations.items,
            namespace: row.model,
            appKind: params.app.appKind
        });
    }

    private getStepContext(step: EditorStep, aiEditable: boolean): StepContext {
        const aiModelsReady = this.aiModels.status === "ready";
        const aiToolsReady = this.aiTools.status === "ready";

        return {
            teams: this.teamsKnown,
            automations: this.automations.items,
            automationsLoaded: this.automations.status === "ready",
            aiModels: aiModelsReady ? this.aiModels.items : null,
            aiTools: aiToolsReady ? this.aiTools.items : null,
            aiEditable,
            baselineStep: this.draft.getBaselineStep(step.id)
        };
    }
```

12. Private methods. After `applyResolvedTeams` add:

```ts
    private cancelTeamSearchTimer(): void {
        if (this.teamSearchTimer !== null) {
            clearTimeout(this.teamSearchTimer);
            this.teamSearchTimer = null;
        }
    }

    private applyRemoveStep(stepId: string): void {
        this.draft.removeStep(stepId);
        this.clearStepErrors(stepId);
        if (this.openStepId === stepId) {
            this.openStepId = null;
        }
        this.pending = null;
    }

    private clearStepErrors(stepId: string): void {
        this.stepErrors = this.stepErrors.filter(item => item.stepId !== stepId);
    }

    private async runTeamSearch(search: string): Promise<void> {
        this.teamsToken += 1;
        const token = this.teamsToken;
        this.teamsLoading = true;
        this.teamSearchFailed = false;
        const query = search === "" ? null : search;
        try {
            const result = await this.config.listTeams({
                search: query,
                ids: null,
                limit: TEAM_SEARCH_LIMIT
            });
            if (token === this.teamsToken) {
                this.applyTeamResults(result.teams);
            }
        } catch {
            if (token === this.teamsToken) {
                this.applyTeamSearchFailure();
            }
        }
    }

    private applyTeamResults(teams: WorkflowTeamSummary[]): void {
        this.teamResults = teams;
        this.teamsKnown = mergeTeams(this.teamsKnown, teams);
        this.teamsLoading = false;
    }

    private applyTeamSearchFailure(): void {
        this.teamsLoading = false;
        this.teamSearchFailed = true;
    }
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/dialogs/deleteStepDialog.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/buildStepCardVm.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.flow.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.teamSearch.test.ts 2>&1 | tail -40
```

Expected: PASS. Notes for the first run: (1) the Task 5 fakes decide the default row, workflow and team names (`Article`, `Article review`, `Editors`); change the expected strings in the tests, not the presenter, if a default differs. (2) The AI summary tests rely on `createAiModel` being `openai/gpt-4o` / `GPT-4o` and on `createAiTool` being `readContent` with `changesContent: false` (Task 5).

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.init.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.models.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.teams.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: every Task 9 test still passes with the added state (the folder run is the final check); no TypeScript errors.

- [ ] **Step 6: Pre-commit chain and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(app-workflows): add steps, drawer accessors and team search to the editor presenter" -m "The presenter creates a draft, builds the step cards with summaries and warnings, runs the type picker, adds (and opens), moves and deletes steps, keeps the open step for the drawer, exposes the accessors the step drawer reads and searches teams for the People form's picker." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. In the commit command, replace the literal `<CURRENT_SESSION_URL>` with the `https://claude.ai/code/session_...` URL of the session that runs the commit. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **Card flags.** `StepCardVm` carries `canMoveUp` and `canMoveDown` (computed here, R234); Task 16's card reads them instead of deriving them from its position.
- **`getNamespace(): string | null`** (R284 wording); Task 14's `StepDrawerSource.getNamespace` is the same type and treats null as "no automations".
- **`getOptions()` per list** (R284, from Task 9): `getStepContext` treats a list as available only once it is `ready` (a failed or loading automation list never reads as "automation gone", a failed AI list never reads as a retired model, a failed tool list never adds `can change content`).
- **`scrollRequest`** is state and a VM field here and is set by Task 10; Task 16's flow must scroll the card with `vm.scrollRequest.stepId` into view when `nonce` changes (R284).
- **The team search banner.** A failed `searchTeams` shows the options banner and the banner's Try again clears it by repeating the search; the drawer's picker also shows its own failed state through `getTeamOptions().failed`.
- Size: medium (one VM builder, one dialog builder, hunks against four files and four test files).
