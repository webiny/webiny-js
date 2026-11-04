### Task 8: `WorkflowDraft` and the pure helpers

R269, R270, R272, R273, R274, R275, R276; D14, D35, D91, D96, D122, D129, D151; QBZ-8, QBZ-12, QBZ-13, QBZ-44, QBZ-45, QBZ-47, QBZ-89, QBZ-97; Review Focus 3, 5 (`00-shared.md`). The phase 9a Global Constraints, the 8b Global Constraints and the 8a Global Constraints and Rulings R202-R252 apply unchanged (read: no helper that wraps a dependency call, one class or one public function per file, one named import per line, no inline object types, no stateless private methods, comments end with a period, targeted tests, the pre-commit chain).

This task is the editor's pure core: the MobX model of the workflow being edited and every pure function the presenter (Tasks 9, 10), the step forms (Tasks 11-13) and the drawer (Task 14) need to decide something. Nothing here touches DI, a gateway or React. The presenter owns the `WorkflowDraft` instance; it never reaches a component (R234).

- **`WorkflowDraft`** (`[AWE]/model/WorkflowDraft.ts`, a plain MobX class, not a DI token). State: `id`, `name`, `models`, `steps`, and a `baseline` (`EditorWorkflow | null`). `baseline === null` while a draft is open means a draft that was never saved (Create workflow, or Save as new): it is **dirty from the start** (R276). `reset(workflow: EditorWorkflow | null)` sets the baseline to the loaded workflow (clean) or, for `null`, closes the draft (no workflow open, not dirty, empty). The contract's `reset(workflow | null)` has no data for a new draft, so `startNew({ id, name, models })` opens a draft with a null baseline, and `detachBaseline()` (Save as new, R276: same id, `savedOn` null) drops the baseline while keeping the content. `isDirty` is true when the draft is open and (the baseline is null, or the name differs, or `steps` differ from the baseline's by a key-order independent deep compare, so editing a value back to what it was is clean again). `savedOn` is `baseline?.savedOn ?? null`, the loaded string, never parsed (Review Focus 1). `getBaselineStep(stepId)` serves QBZ-13. Mutations: `setName`, `addStep(index, step)` (index clamped), `updateStep(stepId, patch)` (the id and the type never change, D91), `moveStep(from, to)` (out of range or equal is a no-op), `removeStep(stepId)`. `steps` is replaced, never mutated, and observed by reference, so a step's `config` is never turned into a MobX proxy.
- **`toInput()`** (R270, R272, Review Focus 3): `EditorWorkflowInput { id, name, models, steps }` where each step goes through `toStepInput`. Notifications become `{ id }` objects and every stored id is kept, also ids no transport lists (D151). The config is rebuilt per type with exactly the keys the server's config schema has: `review` -> `{ teams, assignment }` (the stored `assignment` object is carried **unchanged**, 9a does not edit it; a step without one gets the review defaults `{ strategy: "none", allowManualPick: false, rules: [] }`); `automation` -> `{ automationId, settings }` (`settings` defaults to `{}`); `ai` -> `{ instructions, model, tools }` (`tools` defaults to `[]` and keeps names no tool lists); a step of an unknown type keeps its stored `config` untouched.
- **`createNewStep`** (R270, R272, R273): a new step takes the Orange colour, an empty title, no description, and per type the default config: `review` `{ teams: [], assignment: <defaults> }`, `automation` `{ automationId: "", settings: {} }`, `ai` `{ instructions: "", model: "", tools: [] }` (a new AI step has no model, QBZ-89). A new People step starts with `e-mail` ticked when that transport exists, every other type starts with none (QBZ-45).
- **`validateWorkflowDraft`** (R276, QBZ-12, Review Focus 2): returns `WorkflowDraftErrors { name, steps, stepErrors }`. Every step error is `{ field, message }` with the **server's field vocabulary** (R267: `title`, `color`, `config.teams`, `config.settings.<path>`, `config.instructions`, `config.model`), so the presenter marks client errors and server errors the same way. Texts: `Enter a workflow name.`, `Add at least one step.`, `Enter a title for this step.`, `Choose at least one reviewing team.`, `{Label} is required.` (a required automation setting that is empty and has no default; the label is the property's `title`, else its key), the validator's own message for any other settings issue, `Enter instructions for the AI.`, `Choose an AI model.` (only while the AI editor exists, so an AI step that is read-only for want of the licence never blocks Save, QBZ-47), and `Enter a hex colour, e.g. #3B6FD4.` for a colour that starts with `#` and is not `#RRGGBB`.
- **`getStepTypeOptions`** (R269, D122, D35, QBZ-97, Review Focus 5): every type from `listStepTypes`, in the order returned, as `{ type, label, description, addable, reason }`. `review` is addable when `available`; `automation` only when `available` and at least one definition covers the workflow's model (`matchesAutomationScope`, `*`, `<app>.*` or the exact namespace, mirrored from the server); `ai` only when `isAiEditable` (the row is `available` **and** has a `configSchema`, R275). Reasons are the design copy: AI `Requires the AI Power-Ups licence.`; Automation `No automations are available for this model.` (CMS) / `No automations are available for pages.` (WB); a type the editor has no form for is never addable and shows the server's `unavailableReason` (which may be null). Labels: `review` People, `automation` Automation, `ai` AI, unknown types use the server `title` (D98).
- **`getStepSummary` and `getStepWarnings`** (R272-R275, QBZ-8, QBZ-13): People `{Teams joined with +}` (9a has no strategy part); Automation `{Automation name}` (the id when the definition is not listed); AI `{Model} · n tool(s)`, `{Model name} (no longer offered) · n tools` for a retired model, `No model chosen · n tools` without one, each followed by ` · can change content` when a chosen tool is listed with `changesContent` (R283; a kept name no tool lists never counts, and a list that is not loaded or is empty never appends). Warnings, in this order per type: People `{Team} has no members.` for a known team with `memberCount` 0; Automation `The automation “{id}” no longer exists.` (only when the definition list loaded) and `Saved settings no longer validate: {error}` (only when the step exists in the baseline, its stored settings fail validation, and the current settings still equal the stored ones); AI `AI Power-Ups licence missing. This step fails when reached and can be restarted once the licence is back.` when the AI editor does not exist, else `The AI model “{name}” is no longer offered. Choose another model; until then this step fails when reached.` for a stored model the loaded, non-empty model list does not contain.
- **Small shared pieces** the later tasks consume: `STEP_COLOURS` and friends (R273), `StepTypeId`, the three config readers (typed reads of the untyped `config`), `isStepReadOnly` (an unknown type, or an AI step without the AI editor, is read-only; move and delete stay enabled, QBZ-47), `isAiEditable`, `getStepTypeLabel`.

**Files:**
- Create: `packages/app-workflows/src/editor/domain/stepColours.ts`
- Create: `packages/app-workflows/src/editor/domain/isHexColour.ts`
- Create: `packages/app-workflows/src/editor/domain/StepTypeId.ts`
- Create: `packages/app-workflows/src/editor/model/isRecord.ts`
- Create: `packages/app-workflows/src/editor/model/isEqualJson.ts`
- Create: `packages/app-workflows/src/editor/model/createDefaultAssignment.ts`
- Create: `packages/app-workflows/src/editor/model/readReviewConfig.ts`
- Create: `packages/app-workflows/src/editor/model/readAutomationConfig.ts`
- Create: `packages/app-workflows/src/editor/model/readAiConfig.ts`
- Create: `packages/app-workflows/src/editor/model/EditorStepPatch.ts`
- Create: `packages/app-workflows/src/editor/model/toStepInput.ts`
- Create: `packages/app-workflows/src/editor/model/WorkflowDraft.ts`
- Create: `packages/app-workflows/src/editor/model/createNewStep.ts`
- Create: `packages/app-workflows/src/editor/model/StepFieldError.ts`
- Create: `packages/app-workflows/src/editor/model/getMissingRequiredSettings.ts`
- Create: `packages/app-workflows/src/editor/model/validateWorkflowDraft.ts`
- Create: `packages/app-workflows/src/editor/model/matchesAutomationScope.ts`
- Create: `packages/app-workflows/src/editor/model/getStepTypeLabel.ts`
- Create: `packages/app-workflows/src/editor/model/isAiEditable.ts`
- Create: `packages/app-workflows/src/editor/model/isStepReadOnly.ts`
- Create: `packages/app-workflows/src/editor/model/getStepTypeOptions.ts`
- Create: `packages/app-workflows/src/editor/model/StepContext.ts`
- Create: `packages/app-workflows/src/editor/model/getStepSummary.ts`
- Create: `packages/app-workflows/src/editor/model/isNonEmptySettings.ts`
- Create: `packages/app-workflows/src/editor/model/getAutomationWarnings.ts`
- Create: `packages/app-workflows/src/editor/model/getStepWarnings.ts`
- Create: `packages/app-workflows/src/editor/testing/draftFixtures.ts`
- Create (tests): `packages/app-workflows/src/editor/domain/stepColours.test.ts`, `packages/app-workflows/src/editor/model/isEqualJson.test.ts`, `packages/app-workflows/src/editor/model/WorkflowDraft.test.ts`, `packages/app-workflows/src/editor/model/toStepInput.test.ts`, `packages/app-workflows/src/editor/model/createNewStep.test.ts`, `packages/app-workflows/src/editor/model/validateWorkflowDraft.test.ts`, `packages/app-workflows/src/editor/model/matchesAutomationScope.test.ts`, `packages/app-workflows/src/editor/model/getStepTypeOptions.test.ts`, `packages/app-workflows/src/editor/model/isStepReadOnly.test.ts`, `packages/app-workflows/src/editor/model/getStepSummary.test.ts`, `packages/app-workflows/src/editor/model/isNonEmptySettings.test.ts`, `packages/app-workflows/src/editor/model/getAutomationWarnings.test.ts`, `packages/app-workflows/src/editor/model/getStepWarnings.test.ts`

**Interfaces:**
- Consumes: Task 5 (`[AWE]/domain/types.ts`, read from Task 5's task file): `EditorWorkflow { id; name; models: string[]; steps: EditorStep[]; createdOn: string; savedOn: string; createdBy; savedBy }`, `EditorStep { id; title; color; description: string | null; type: string; notificationIds: string[]; config: unknown }`, `EditorWorkflowInput { id; name; models: string[]; steps: EditorStepInput[] }` with `EditorStepInput { id; title; color; description: string | null; type; notifications: { id: string }[]; config: unknown }`, `EditorStepType { type; title; available: boolean; unavailableReason: string | null; configSchema: JsonSchema | null }`, `AutomationDefinition { id; name; models: string[]; settingsSchema: JsonSchema | null }`, `NotificationTransport { id; title; description: string | null }`, `WorkflowTeamSummary { id; name; memberCount: number }`, `AiModel { id; name; providerId; providerName }`; the Task 5 fixtures `[AWET]/editorFixtures.ts` (`createEditorStep`, `createEditorWorkflow`, `createEditorStepType`, `createAutomationDefinition`, `createNotificationTransport`, `createWorkflowTeamSummary`, `createAiModel`); Task 3 (`@webiny/app-admin/features/formModel/jsonSchema/`) `JsonSchema` and `createJsonSchemaValidator(schema): { validate(value: unknown): { valid: boolean; issues: { path: string; message: string }[] } }`. Existing (verified): `@webiny/app-admin` is already a dependency of `app-workflows`; `mobx` `makeAutoObservable` and `observableRef` as in `ReviewerPickerPresenter.ts`.
- Produces: `WorkflowDraft` (+ `NewDraftParams`), `EditorStepPatch`, `toStepInput`, `createNewStep` (+ `NewStepParams`), `validateWorkflowDraft` (+ `ValidateWorkflowDraftParams`, `WorkflowDraftErrors`, `StepValidationErrors`, `StepFieldError`), `getStepTypeOptions` (+ `StepTypeOptionsParams`, `StepTypeOption`), `matchesAutomationScope`, `getStepSummary`, `getStepWarnings`, `getAutomationWarnings` (`AutomationWarnings { warning; settingsWarning }`, shared with the step drawer's automation cards, Task 12), `isNonEmptySettings`, `StepContext`, `isStepReadOnly`, `isAiEditable`, `getStepTypeLabel`, `readReviewConfig`, `readAutomationConfig`, `readAiConfig`, `createDefaultAssignment`, `isEqualJson`, `isRecord`, `STEP_COLOURS`, `DEFAULT_STEP_COLOUR`, `FALLBACK_STEP_COLOUR`, `HEX_COLOUR_MESSAGE`, `isHexColour`, `StepTypeId`, and the fixtures `[AWET]/draftFixtures.ts` (`createReviewStep`, `createAutomationStep`, `createAiStep`, `createStepTypes`, `createWebhookAutomation`, `SETTINGS_SCHEMA`, built on Task 5's `editorFixtures.ts`). Tasks 9-14 import them by the paths above.

**Test runner note:** admin package, `yarn test <path>` only (no `test:os`); the tests are co-located `*.test.ts`. `app-workflows` has no `__tests__` folder of its own for these, so the type check is `yarn build -p @webiny/app-workflows --no-cache` (8a R243, `yarn check:test:types -p app-workflows` also lists the package because of `__tests__/reviewFields.test.ts`).

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/testing/draftFixtures.ts`. Task 5's `editorFixtures.ts` already has the generic builders (`createEditorStep`, `createEditorWorkflow`, `createEditorStepType`, `createAutomationDefinition`, `createNotificationTransport`, `createWorkflowTeamSummary`, `createAiModel`, `createAiTool`, `createWorkflowModelRow`, `createWorkflowModelPage`); this file adds only what the draft tests need on top of them: one step per type, the three step types with an AI config schema, and an automation with a settings schema. Pure (R243: no vitest, mobx or DI imports):

```ts
import type { JsonSchema } from "@webiny/app-admin/features/formModel/jsonSchema/JsonSchema.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import { createAutomationDefinition } from "~/editor/testing/editorFixtures.js";
import { createEditorStep } from "~/editor/testing/editorFixtures.js";
import { createEditorStepType } from "~/editor/testing/editorFixtures.js";

export const SETTINGS_SCHEMA: JsonSchema = {
    type: "object",
    description: "Sends the review and content to a URL when this step is reached.",
    properties: {
        url: { type: "string", title: "URL" },
        timeout: { type: "number", title: "Timeout (seconds)", minimum: 1, maximum: 120 }
    },
    required: ["url"]
};

// A People step: id `step-1`, team `team-1`, the review defaults, `e-mail` ticked.
export const createReviewStep = (overrides: Partial<EditorStep> = {}): EditorStep => {
    return createEditorStep({ title: "Legal sign-off", ...overrides });
};

export const createAutomationStep = (overrides: Partial<EditorStep> = {}): EditorStep => {
    return createEditorStep({
        id: "step-2",
        title: "Notify the CRM",
        type: "automation",
        notificationIds: [],
        config: { automationId: "send-webhook", settings: { url: "https://example.com/hook" } },
        ...overrides
    });
};

// An AI step on the default model of `createAiModel` (`openai/gpt-4o`, "GPT-4o").
export const createAiStep = (overrides: Partial<EditorStep> = {}): EditorStep => {
    return createEditorStep({
        id: "step-3",
        title: "Tone check",
        type: "ai",
        notificationIds: [],
        config: {
            instructions: "Check the tone of voice.",
            model: "openai/gpt-4o",
            tools: ["readContent"]
        },
        ...overrides
    });
};

// The three types as the server lists them; `ai` has a config schema, so the AI editor exists.
export const createStepTypes = (): EditorStepType[] => {
    return [
        createEditorStepType({ type: "review", title: "Review", configSchema: { type: "object" } }),
        createEditorStepType({ type: "ai", title: "AI", configSchema: { type: "object" } }),
        createEditorStepType({
            type: "automation",
            title: "Automation",
            configSchema: { type: "object" }
        })
    ];
};

// Covers every model and has the settings schema above.
export const createWebhookAutomation = (
    overrides: Partial<AutomationDefinition> = {}
): AutomationDefinition => {
    return createAutomationDefinition({
        id: "send-webhook",
        name: "Send webhook",
        models: ["*"],
        settingsSchema: SETTINGS_SCHEMA,
        ...overrides
    });
};
```

Create `packages/app-workflows/src/editor/domain/stepColours.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { DEFAULT_STEP_COLOUR } from "./stepColours.js";
import { FALLBACK_STEP_COLOUR } from "./stepColours.js";
import { HEX_COLOUR_MESSAGE } from "./stepColours.js";
import { STEP_COLOURS } from "./stepColours.js";
import { isHexColour } from "./isHexColour.js";

describe("STEP_COLOURS (R273)", () => {
    it("lists the ten presets in the prototype's order as theme token strings", () => {
        expect(STEP_COLOURS).toEqual([
            { label: "Orange", value: "var(--color-primary-500)" },
            { label: "Rust", value: "var(--color-primary-800)" },
            { label: "Amber", value: "var(--color-warning-600)" },
            { label: "Olive", value: "var(--color-warning-800)" },
            { label: "Teal", value: "var(--color-success-500)" },
            { label: "Green", value: "var(--color-success-800)" },
            { label: "Red", value: "var(--color-destructive-500)" },
            { label: "Maroon", value: "var(--color-destructive-700)" },
            { label: "Gray", value: "var(--color-neutral-500)" },
            { label: "Ink", value: "var(--color-neutral-900)" }
        ]);
    });

    it("takes Orange for a new step and a neutral token for an empty stored colour", () => {
        expect(DEFAULT_STEP_COLOUR).toBe("var(--color-primary-500)");
        expect(FALLBACK_STEP_COLOUR).toBe("var(--color-neutral-500)");
    });

    it("words the hex rule as the design does", () => {
        expect(HEX_COLOUR_MESSAGE).toBe("Enter a hex colour, e.g. #3B6FD4.");
    });
});

describe("isHexColour", () => {
    it("accepts #RRGGBB in either case", () => {
        expect(isHexColour("#3B6FD4")).toBe(true);
        expect(isHexColour("#3b6fd4")).toBe(true);
    });

    it("refuses anything else", () => {
        expect(isHexColour("#3B6FD")).toBe(false);
        expect(isHexColour("#3B6FD4A")).toBe(false);
        expect(isHexColour("3B6FD4")).toBe(false);
        expect(isHexColour("#GGGGGG")).toBe(false);
        expect(isHexColour("var(--color-primary-500)")).toBe(false);
        expect(isHexColour("")).toBe(false);
    });
});
```

Create `packages/app-workflows/src/editor/model/isEqualJson.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { isEqualJson } from "./isEqualJson.js";

describe("isEqualJson", () => {
    it("compares primitives", () => {
        expect(isEqualJson(1, 1)).toBe(true);
        expect(isEqualJson("a", "a")).toBe(true);
        expect(isEqualJson(null, null)).toBe(true);
        expect(isEqualJson(1, "1")).toBe(false);
        expect(isEqualJson(null, undefined)).toBe(false);
    });

    it("ignores the key order of objects", () => {
        expect(isEqualJson({ a: 1, b: { c: 2, d: 3 } }, { b: { d: 3, c: 2 }, a: 1 })).toBe(true);
    });

    it("compares arrays by position", () => {
        expect(isEqualJson([1, 2, 3], [1, 2, 3])).toBe(true);
        expect(isEqualJson([1, 2, 3], [3, 2, 1])).toBe(false);
        expect(isEqualJson([1], [1, 2])).toBe(false);
    });

    it("sees a different key set, a different value and an array against an object", () => {
        expect(isEqualJson({ a: 1 }, { a: 1, b: 2 })).toBe(false);
        expect(isEqualJson({ a: 1 }, { a: 2 })).toBe(false);
        expect(isEqualJson({ a: undefined }, {})).toBe(false);
        expect(isEqualJson([], {})).toBe(false);
        expect(isEqualJson({}, [])).toBe(false);
    });

    it("compares nested structures", () => {
        const left = { teams: ["a", "b"], assignment: { rules: [{ id: "r1" }] } };
        const right = { assignment: { rules: [{ id: "r1" }] }, teams: ["a", "b"] };

        expect(isEqualJson(left, right)).toBe(true);
    });
});
```

Create `packages/app-workflows/src/editor/model/WorkflowDraft.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { WorkflowDraft } from "./WorkflowDraft.js";

const loaded = (): WorkflowDraft => {
    const draft = new WorkflowDraft();
    const workflow = createEditorWorkflow({
        steps: [createReviewStep(), createAutomationStep(), createAiStep()]
    });
    draft.reset(workflow);
    return draft;
};

describe("WorkflowDraft: lifecycle", () => {
    it("starts closed and clean", () => {
        const draft = new WorkflowDraft();

        expect(draft.isOpen).toBe(false);
        expect(draft.isDirty).toBe(false);
        expect(draft.isNew).toBe(false);
        expect(draft.steps).toEqual([]);
        expect(draft.savedOn).toBeNull();
    });

    it("loads a workflow clean and keeps the loaded savedOn string unchanged (Review Focus 1)", () => {
        const draft = new WorkflowDraft();

        draft.reset(createEditorWorkflow({ savedOn: "2026-10-02T10:30:00.123Z" }));

        expect(draft.isOpen).toBe(true);
        expect(draft.isNew).toBe(false);
        expect(draft.isDirty).toBe(false);
        expect(draft.id).toBe("workflow-1");
        expect(draft.name).toBe("Article review");
        expect(draft.models).toEqual(["cms.article"]);
        expect(draft.savedOn).toBe("2026-10-02T10:30:00.123Z");
    });

    it("opens a new draft that is dirty from the start with no savedOn (R276)", () => {
        const draft = new WorkflowDraft();

        draft.startNew({ id: "workflow-new", name: "Article review", models: ["cms.article"] });

        expect(draft.isOpen).toBe(true);
        expect(draft.isNew).toBe(true);
        expect(draft.isDirty).toBe(true);
        expect(draft.savedOn).toBeNull();
        expect(draft.steps).toEqual([]);
        expect(draft.id).toBe("workflow-new");
    });

    it("closes with reset(null): empty, clean, nothing open", () => {
        const draft = loaded();
        draft.setName("Changed");

        draft.reset(null);

        expect(draft.isOpen).toBe(false);
        expect(draft.isDirty).toBe(false);
        expect(draft.name).toBe("");
        expect(draft.steps).toEqual([]);
        expect(draft.savedOn).toBeNull();
    });

    it("keeps the content but drops the baseline on detachBaseline (Save as new)", () => {
        const draft = loaded();

        draft.detachBaseline();

        expect(draft.isNew).toBe(true);
        expect(draft.isDirty).toBe(true);
        expect(draft.savedOn).toBeNull();
        expect(draft.id).toBe("workflow-1");
        expect(draft.steps).toHaveLength(3);
    });

    it("copies the loaded steps, so editing the draft never changes the loaded workflow", () => {
        const draft = new WorkflowDraft();
        const workflow = createEditorWorkflow({ steps: [createReviewStep()] });
        draft.reset(workflow);

        draft.updateStep("step-1", { title: "Changed" });

        expect(workflow.steps[0].title).toBe("Legal sign-off");
    });
});

describe("WorkflowDraft: dirty tracking", () => {
    it("is dirty after a rename and clean again when the name is set back", () => {
        const draft = loaded();

        draft.setName("Changed");
        expect(draft.isDirty).toBe(true);

        draft.setName("Article review");
        expect(draft.isDirty).toBe(false);
    });

    it("is dirty after a step edit and clean again when the value is set back", () => {
        const draft = loaded();

        draft.updateStep("step-1", { title: "Changed" });
        expect(draft.isDirty).toBe(true);

        draft.updateStep("step-1", { title: "Legal sign-off" });
        expect(draft.isDirty).toBe(false);
    });

    it("is not dirty when a config is replaced by an equal one with another key order", () => {
        const draft = loaded();

        draft.updateStep("step-2", {
            config: { settings: { url: "https://example.com/hook" }, automationId: "send-webhook" }
        });

        expect(draft.isDirty).toBe(false);
    });

    it("is dirty after add, remove and move", () => {
        const added = loaded();
        added.addStep(0, createReviewStep({ id: "step-9" }));
        expect(added.isDirty).toBe(true);

        const removed = loaded();
        removed.removeStep("step-1");
        expect(removed.isDirty).toBe(true);

        const moved = loaded();
        moved.moveStep(0, 1);
        expect(moved.isDirty).toBe(true);
    });

    it("is clean again when a moved step is moved back", () => {
        const draft = loaded();

        draft.moveStep(0, 2);
        draft.moveStep(2, 0);

        expect(draft.isDirty).toBe(false);
    });
});

describe("WorkflowDraft: step operations", () => {
    it("inserts a step at the index and clamps an index out of range", () => {
        const draft = loaded();

        draft.addStep(1, createReviewStep({ id: "inserted" }));
        draft.addStep(99, createReviewStep({ id: "last" }));
        draft.addStep(-5, createReviewStep({ id: "first" }));

        expect(draft.steps.map(step => step.id)).toEqual([
            "first",
            "step-1",
            "inserted",
            "step-2",
            "step-3",
            "last"
        ]);
    });

    it("updates a step by id and never changes its id or type (D91)", () => {
        const draft = loaded();

        draft.updateStep("step-2", { title: "Renamed", color: "#3B6FD4", description: "About" });

        const step = draft.steps[1];
        expect(step.title).toBe("Renamed");
        expect(step.color).toBe("#3B6FD4");
        expect(step.description).toBe("About");
        expect(step.id).toBe("step-2");
        expect(step.type).toBe("automation");
    });

    it("ignores an update for an unknown step", () => {
        const draft = loaded();

        draft.updateStep("missing", { title: "Nope" });

        expect(draft.isDirty).toBe(false);
    });

    it("moves a step to another position", () => {
        const draft = loaded();

        draft.moveStep(0, 2);

        expect(draft.steps.map(step => step.id)).toEqual(["step-2", "step-3", "step-1"]);
    });

    it("ignores a move that is equal or out of range", () => {
        const draft = loaded();

        draft.moveStep(1, 1);
        draft.moveStep(-1, 0);
        draft.moveStep(0, 3);
        draft.moveStep(5, 0);

        expect(draft.steps.map(step => step.id)).toEqual(["step-1", "step-2", "step-3"]);
        expect(draft.isDirty).toBe(false);
    });

    it("removes a step by id", () => {
        const draft = loaded();

        draft.removeStep("step-2");

        expect(draft.steps.map(step => step.id)).toEqual(["step-1", "step-3"]);
    });

    it("finds the baseline step by id, null for an added step", () => {
        const draft = loaded();
        draft.updateStep("step-1", { title: "Changed" });
        draft.addStep(0, createReviewStep({ id: "added" }));

        expect(draft.getBaselineStep("step-1")?.title).toBe("Legal sign-off");
        expect(draft.getBaselineStep("added")).toBeNull();
    });

    it("has no baseline step for a new draft", () => {
        const draft = new WorkflowDraft();
        draft.startNew({ id: "workflow-new", name: "New", models: ["cms.article"] });
        draft.addStep(0, createReviewStep());

        expect(draft.getBaselineStep("step-1")).toBeNull();
    });
});

describe("WorkflowDraft.toInput", () => {
    it("emits the id, name, models and the steps as server input", () => {
        const draft = loaded();

        const input = draft.toInput();

        expect(input.id).toBe("workflow-1");
        expect(input.name).toBe("Article review");
        expect(input.models).toEqual(["cms.article"]);
        expect(input.steps.map(step => step.id)).toEqual(["step-1", "step-2", "step-3"]);
        expect(input.steps[0].notifications).toEqual([{ id: "e-mail" }]);
    });

    it("emits a new draft with no steps as an empty step list", () => {
        const draft = new WorkflowDraft();
        draft.startNew({ id: "workflow-new", name: "Article review", models: ["cms.article"] });

        expect(draft.toInput().steps).toEqual([]);
    });
});
```

Create `packages/app-workflows/src/editor/model/toStepInput.test.ts` (R270, R272, Review Focus 3):

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createEditorStep } from "~/editor/testing/editorFixtures.js";
import { toStepInput } from "./toStepInput.js";

describe("toStepInput: common keys", () => {
    it("maps notification ids to objects and keeps ids no transport lists (D151)", () => {
        const input = toStepInput(createReviewStep({ notificationIds: ["e-mail", "retired-channel"] }));

        expect(input.notifications).toEqual([{ id: "e-mail" }, { id: "retired-channel" }]);
    });

    it("carries id, title, colour, description and type", () => {
        const input = toStepInput(
            createReviewStep({ id: "s", title: "T", color: "#3B6FD4", description: "D" })
        );

        expect(input).toMatchObject({
            id: "s",
            title: "T",
            color: "#3B6FD4",
            description: "D",
            type: "review"
        });
    });
});

describe("toStepInput: review config (R270)", () => {
    it("emits exactly teams and assignment", () => {
        const input = toStepInput(createReviewStep());

        expect(input.config).toEqual({
            teams: ["team-1"],
            assignment: { strategy: "none", allowManualPick: false, rules: [] }
        });
    });

    it("carries a stored assignment unchanged, with its rules", () => {
        const assignment = {
            strategy: "roundRobin",
            allowManualPick: true,
            rules: [
                {
                    id: "rule-1",
                    conditions: { requesterTeamId: "team-2" },
                    target: { type: "team", id: "team-1" }
                }
            ]
        };

        const input = toStepInput(createReviewStep({ config: { teams: ["team-1"], assignment } }));

        expect(input.config).toEqual({ teams: ["team-1"], assignment });
    });

    it("emits the review defaults for a step that has no assignment", () => {
        const input = toStepInput(createReviewStep({ config: { teams: ["team-1", "team-2"] } }));

        expect(input.config).toEqual({
            teams: ["team-1", "team-2"],
            assignment: { strategy: "none", allowManualPick: false, rules: [] }
        });
    });

    it("drops editor-only keys from the stored config", () => {
        const input = toStepInput(
            createReviewStep({
                config: { teams: ["team-1"], assignment: null, _templateId: "review", extra: 1 }
            })
        );

        expect(Object.keys(input.config as object).sort()).toEqual(["assignment", "teams"]);
    });
});

describe("toStepInput: automation config", () => {
    it("emits exactly automationId and settings", () => {
        const input = toStepInput(createAutomationStep());

        expect(input.config).toEqual({
            automationId: "send-webhook",
            settings: { url: "https://example.com/hook" }
        });
    });

    it("defaults settings to an empty object", () => {
        const input = toStepInput(createAutomationStep({ config: { automationId: "send-webhook" } }));

        expect(input.config).toEqual({ automationId: "send-webhook", settings: {} });
    });
});

describe("toStepInput: AI config", () => {
    it("emits exactly instructions, model and tools", () => {
        const input = toStepInput(createAiStep());

        expect(input.config).toEqual({
            instructions: "Check the tone of voice.",
            model: "openai/gpt-4o",
            tools: ["read-fields"]
        });
    });

    it("keeps tool names no tool lists and defaults tools to an empty list", () => {
        const kept = toStepInput(
            createAiStep({ config: { instructions: "i", model: "m", tools: ["gone-tool"] } })
        );
        const defaulted = toStepInput(createAiStep({ config: { instructions: "i", model: "m" } }));

        expect((kept.config as { tools: string[] }).tools).toEqual(["gone-tool"]);
        expect((defaulted.config as { tools: string[] }).tools).toEqual([]);
    });
});

describe("toStepInput: unknown type", () => {
    it("keeps the stored config untouched", () => {
        const config = { anything: { nested: [1, 2, 3] } };

        const input = toStepInput(createEditorStep({ type: "custom", config }));

        expect(input.type).toBe("custom");
        expect(input.config).toBe(config);
    });
});
```

Create `packages/app-workflows/src/editor/model/createNewStep.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createNotificationTransport } from "~/editor/testing/editorFixtures.js";
import { createNewStep } from "./createNewStep.js";

describe("createNewStep", () => {
    it("takes the Orange colour, an empty title and no description", () => {
        const step = createNewStep({ id: "s1", type: "review", transports: [] });

        expect(step).toMatchObject({
            id: "s1",
            type: "review",
            title: "",
            color: "var(--color-primary-500)",
            description: null
        });
    });

    it("starts a People step with no team and the review defaults (R270)", () => {
        const step = createNewStep({ id: "s1", type: "review", transports: [] });

        expect(step.config).toEqual({
            teams: [],
            assignment: { strategy: "none", allowManualPick: false, rules: [] }
        });
    });

    it("starts an Automation step with no automation and no settings", () => {
        const step = createNewStep({ id: "s1", type: "automation", transports: [] });

        expect(step.config).toEqual({ automationId: "", settings: {} });
    });

    it("starts an AI step with no model (QBZ-89)", () => {
        const step = createNewStep({ id: "s1", type: "ai", transports: [] });

        expect(step.config).toEqual({ instructions: "", model: "", tools: [] });
    });

    it("ticks e-mail on a new People step when that transport exists (R272, QBZ-45)", () => {
        const transports = [createNotificationTransport({ id: "e-mail" }), createNotificationTransport({ id: "slack" })];

        const step = createNewStep({ id: "s1", type: "review", transports });

        expect(step.notificationIds).toEqual(["e-mail"]);
    });

    it("ticks nothing when there is no e-mail transport", () => {
        const step = createNewStep({
            id: "s1",
            type: "review",
            transports: [createNotificationTransport({ id: "slack" })]
        });

        expect(step.notificationIds).toEqual([]);
    });

    it("ticks nothing on other types, even with an e-mail transport", () => {
        const transports = [createNotificationTransport({ id: "e-mail" })];

        expect(createNewStep({ id: "a", type: "automation", transports }).notificationIds).toEqual(
            []
        );
        expect(createNewStep({ id: "b", type: "ai", transports }).notificationIds).toEqual([]);
    });

    it("gives every call its own config objects", () => {
        const first = createNewStep({ id: "a", type: "review", transports: [] });
        const second = createNewStep({ id: "b", type: "review", transports: [] });

        expect(first.config).not.toBe(second.config);
    });
});
```

Create `packages/app-workflows/src/editor/model/validateWorkflowDraft.test.ts` (R276, QBZ-12):

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { validateWorkflowDraft } from "./validateWorkflowDraft.js";
import type { ValidateWorkflowDraftParams } from "./validateWorkflowDraft.js";

const params = (overrides: Partial<ValidateWorkflowDraftParams> = {}): ValidateWorkflowDraftParams => {
    return {
        name: "Article review",
        steps: [createReviewStep()],
        automations: [createWebhookAutomation()],
        aiEditable: true,
        ...overrides
    };
};

describe("validateWorkflowDraft: the workflow", () => {
    it("is clean for a valid workflow", () => {
        expect(validateWorkflowDraft(params())).toEqual({ name: null, steps: null, stepErrors: [] });
    });

    it("needs a name", () => {
        expect(validateWorkflowDraft(params({ name: "" })).name).toBe("Enter a workflow name.");
        expect(validateWorkflowDraft(params({ name: "   " })).name).toBe("Enter a workflow name.");
    });

    it("needs at least one step", () => {
        const errors = validateWorkflowDraft(params({ steps: [] }));

        expect(errors.steps).toBe("Add at least one step.");
        expect(errors.stepErrors).toEqual([]);
    });
});

describe("validateWorkflowDraft: every step", () => {
    it("needs a title", () => {
        const errors = validateWorkflowDraft(params({ steps: [createReviewStep({ title: " " })] }));

        expect(errors.stepErrors).toEqual([
            {
                stepId: "step-1",
                errors: [{ field: "title", message: "Enter a title for this step." }]
            }
        ]);
    });

    it("refuses an invalid custom hex colour and accepts presets and a valid hex", () => {
        const invalid = validateWorkflowDraft(params({ steps: [createReviewStep({ color: "#3B6F" })] }));
        const hex = validateWorkflowDraft(params({ steps: [createReviewStep({ color: "#3B6FD4" })] }));
        const preset = validateWorkflowDraft(params());
        const empty = validateWorkflowDraft(params({ steps: [createReviewStep({ color: "" })] }));

        expect(invalid.stepErrors[0].errors).toEqual([
            { field: "color", message: "Enter a hex colour, e.g. #3B6FD4." }
        ]);
        expect(hex.stepErrors).toEqual([]);
        expect(preset.stepErrors).toEqual([]);
        expect(empty.stepErrors).toEqual([]);
    });

    it("lists the steps with errors in step order and skips the clean ones", () => {
        const errors = validateWorkflowDraft(
            params({
                steps: [
                    createReviewStep({ id: "a", title: "" }),
                    createReviewStep({ id: "b" }),
                    createReviewStep({ id: "c", title: "" })
                ]
            })
        );

        expect(errors.stepErrors.map(entry => entry.stepId)).toEqual(["a", "c"]);
    });
});

describe("validateWorkflowDraft: People step", () => {
    it("needs at least one reviewing team", () => {
        const step = createReviewStep({ config: { teams: [], assignment: null } });

        const errors = validateWorkflowDraft(params({ steps: [step] }));

        expect(errors.stepErrors[0].errors).toEqual([
            { field: "config.teams", message: "Choose at least one reviewing team." }
        ]);
    });
});

describe("validateWorkflowDraft: Automation step", () => {
    it("names a required setting that is empty, with the property's title", () => {
        const step = createAutomationStep({
            config: { automationId: "send-webhook", settings: { url: "" } }
        });

        const errors = validateWorkflowDraft(params({ steps: [step] }));

        expect(errors.stepErrors[0].errors).toEqual([
            { field: "config.settings.url", message: "URL is required." }
        ]);
    });

    it("names a required setting that is missing", () => {
        const step = createAutomationStep({
            config: { automationId: "send-webhook", settings: {} }
        });

        const errors = validateWorkflowDraft(params({ steps: [step] }));

        expect(errors.stepErrors[0].errors).toEqual([
            { field: "config.settings.url", message: "URL is required." }
        ]);
    });

    it("falls back to the property key when the property has no title", () => {
        const automation = createWebhookAutomation({
            settingsSchema: {
                type: "object",
                properties: { endpoint: { type: "string" } },
                required: ["endpoint"]
            }
        });
        const step = createAutomationStep({
            config: { automationId: "send-webhook", settings: {} }
        });

        const errors = validateWorkflowDraft(params({ steps: [step], automations: [automation] }));

        expect(errors.stepErrors[0].errors).toEqual([
            { field: "config.settings.endpoint", message: "endpoint is required." }
        ]);
    });

    it("does not call a setting with a default required", () => {
        const automation = createWebhookAutomation({
            settingsSchema: {
                type: "object",
                properties: { retries: { type: "number", title: "Retries", default: 3 } },
                required: ["retries"]
            }
        });
        const step = createAutomationStep({
            config: { automationId: "send-webhook", settings: {} }
        });

        const errors = validateWorkflowDraft(params({ steps: [step], automations: [automation] }));

        expect(errors.stepErrors).toEqual([]);
    });

    it("reports another settings issue on its own path with the validator's message", () => {
        const step = createAutomationStep({
            config: {
                automationId: "send-webhook",
                settings: { url: "https://example.com/hook", timeout: 0 }
            }
        });

        const errors = validateWorkflowDraft(params({ steps: [step] }));

        expect(errors.stepErrors).toHaveLength(1);
        const [issue] = errors.stepErrors[0].errors;
        expect(issue.field).toBe("config.settings.timeout");
        expect(issue.message).not.toBe("");
    });

    it("accepts valid settings", () => {
        const errors = validateWorkflowDraft(params({ steps: [createAutomationStep()] }));

        expect(errors.stepErrors).toEqual([]);
    });

    it("skips an automation that is not listed and one without a settings schema", () => {
        const missing = createAutomationStep({
            config: { automationId: "gone", settings: {} }
        });
        const noSchema = createAutomationStep({
            id: "step-4",
            config: { automationId: "plain", settings: {} }
        });
        const plain = createWebhookAutomation({ id: "plain", settingsSchema: null });

        const errors = validateWorkflowDraft(
            params({ steps: [missing, noSchema], automations: [plain] })
        );

        expect(errors.stepErrors).toEqual([]);
    });
});

describe("validateWorkflowDraft: AI step", () => {
    it("needs instructions and a model (QBZ-89)", () => {
        const step = createAiStep({ config: { instructions: " ", model: "", tools: [] } });

        const errors = validateWorkflowDraft(params({ steps: [step] }));

        expect(errors.stepErrors[0].errors).toEqual([
            { field: "config.instructions", message: "Enter instructions for the AI." },
            { field: "config.model", message: "Choose an AI model." }
        ]);
    });

    it("never blocks Save while the AI editor does not exist (QBZ-47)", () => {
        const step = createAiStep({ config: { instructions: "", model: "", tools: [] } });

        const errors = validateWorkflowDraft(params({ steps: [step], aiEditable: false }));

        expect(errors.stepErrors).toEqual([]);
    });
});

describe("validateWorkflowDraft: unknown types", () => {
    it("checks only the common fields", () => {
        const step = createReviewStep({ type: "custom", config: { anything: true } });

        expect(validateWorkflowDraft(params({ steps: [step] })).stepErrors).toEqual([]);
    });
});
```

Create `packages/app-workflows/src/editor/model/matchesAutomationScope.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { matchesAutomationScope } from "./matchesAutomationScope.js";

describe("matchesAutomationScope (D35, R269)", () => {
    it("`*` covers every model", () => {
        expect(matchesAutomationScope(["*"], ["cms.article"])).toBe(true);
        expect(matchesAutomationScope(["*"], ["wb.page"])).toBe(true);
    });

    it("`<app>.*` covers the namespace ids of that app only", () => {
        expect(matchesAutomationScope(["cms.*"], ["cms.article"])).toBe(true);
        expect(matchesAutomationScope(["cms.*"], ["wb.page"])).toBe(false);
        expect(matchesAutomationScope(["wb.*"], ["wb.page"])).toBe(true);
    });

    it("an exact namespace id covers only that model", () => {
        expect(matchesAutomationScope(["cms.article"], ["cms.article"])).toBe(true);
        expect(matchesAutomationScope(["cms.article"], ["cms.press"])).toBe(false);
    });

    it("any one scope of the list is enough", () => {
        expect(matchesAutomationScope(["cms.press", "cms.article"], ["cms.article"])).toBe(true);
    });

    it("`cms.*` does not cover the bare prefix and an empty list covers nothing", () => {
        expect(matchesAutomationScope(["cms.*"], ["cms."])).toBe(false);
        expect(matchesAutomationScope([], ["cms.article"])).toBe(false);
    });

    it("a workflow without models is never covered", () => {
        expect(matchesAutomationScope(["*"], [])).toBe(false);
    });
});
```

Create `packages/app-workflows/src/editor/model/getStepTypeOptions.test.ts` (R269, Review Focus 5):

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createStepTypes } from "~/editor/testing/draftFixtures.js";
import { getStepTypeOptions } from "./getStepTypeOptions.js";
import type { StepTypeOptionsParams } from "./getStepTypeOptions.js";

const params = (overrides: Partial<StepTypeOptionsParams> = {}): StepTypeOptionsParams => {
    return {
        stepTypes: createStepTypes(),
        automations: [createWebhookAutomation()],
        namespace: "cms.article",
        appKind: "cms",
        ...overrides
    };
};

describe("getStepTypeOptions", () => {
    it("lists every type in the order the server returned, with the UI names (D98)", () => {
        const options = getStepTypeOptions(params());

        expect(options.map(option => option.type)).toEqual(["review", "ai", "automation"]);
        expect(options.map(option => option.label)).toEqual(["People", "AI", "Automation"]);
    });

    it("carries the picker descriptions", () => {
        const options = getStepTypeOptions(params());

        expect(options.map(option => option.description)).toEqual([
            "Members of one or more teams review.",
            "An AI model reviews against your written instructions.",
            "Runs a code-defined automation, such as Send webhook."
        ]);
    });

    it("makes every type addable when everything is available", () => {
        const options = getStepTypeOptions(params());

        expect(options.map(option => option.addable)).toEqual([true, true, true]);
        expect(options.map(option => option.reason)).toEqual([null, null, null]);
    });

    it("disables AI without the licence, with the design reason", () => {
        const stepTypes = createStepTypes().map(item => {
            return item.type === "ai"
                ? { ...item, available: false, unavailableReason: "AI powerups are not enabled." }
                : item;
        });

        const ai = getStepTypeOptions(params({ stepTypes })).find(option => option.type === "ai");

        expect(ai).toMatchObject({
            addable: false,
            reason: "Requires the AI Power-Ups licence."
        });
    });

    it("disables AI when its row has no config schema (no AI editor, R275)", () => {
        const stepTypes = createStepTypes().map(item => {
            return item.type === "ai" ? { ...item, configSchema: null } : item;
        });

        const ai = getStepTypeOptions(params({ stepTypes })).find(option => option.type === "ai");

        expect(ai).toMatchObject({
            addable: false,
            reason: "Requires the AI Power-Ups licence."
        });
    });

    it("disables Automation when no definition covers the model, with the CMS reason", () => {
        const automations = [createWebhookAutomation({ models: ["wb.page"] })];

        const automation = getStepTypeOptions(params({ automations })).find(option => {
            return option.type === "automation";
        });

        expect(automation).toMatchObject({
            addable: false,
            reason: "No automations are available for this model."
        });
    });

    it("words the Automation reason for pages in the Website Builder", () => {
        const automations = [createWebhookAutomation({ models: ["cms.*"] })];

        const automation = getStepTypeOptions(
            params({ automations, namespace: "wb.page", appKind: "wb" })
        ).find(option => option.type === "automation");

        expect(automation).toMatchObject({
            addable: false,
            reason: "No automations are available for pages."
        });
    });

    it("keeps Automation addable when one of several definitions covers the model", () => {
        const automations = [
            createWebhookAutomation({ id: "a", models: ["wb.page"] }),
            createWebhookAutomation({ id: "b", models: ["cms.*"] })
        ];

        const automation = getStepTypeOptions(params({ automations })).find(option => {
            return option.type === "automation";
        });

        expect(automation?.addable).toBe(true);
    });

    it("disables Automation when the server says it is unavailable, with the design reason", () => {
        const stepTypes = createStepTypes().map(item => {
            return item.type === "automation"
                ? { ...item, available: false, unavailableReason: "No automation is defined." }
                : item;
        });

        const automation = getStepTypeOptions(params({ stepTypes })).find(option => {
            return option.type === "automation";
        });

        expect(automation).toMatchObject({
            addable: false,
            reason: "No automations are available for this model."
        });
    });

    it("lists a type the editor has no form for, never addable, with the server's title and reason", () => {
        const stepTypes = [
            ...createStepTypes(),
            {
                type: "custom",
                title: "Custom check",
                available: false,
                unavailableReason: "Not installed.",
                configSchema: null
            }
        ];

        const custom = getStepTypeOptions(params({ stepTypes })).find(option => {
            return option.type === "custom";
        });

        expect(custom).toEqual({
            type: "custom",
            label: "Custom check",
            description: null,
            addable: false,
            reason: "Not installed."
        });
    });

    it("never makes an available unknown type addable and gives no reason of its own", () => {
        const stepTypes = [
            {
                type: "custom",
                title: "Custom check",
                available: true,
                unavailableReason: null,
                configSchema: null
            }
        ];

        const [custom] = getStepTypeOptions(params({ stepTypes }));

        expect(custom.addable).toBe(false);
        expect(custom.reason).toBeNull();
    });
});
```

Create `packages/app-workflows/src/editor/model/isStepReadOnly.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createStepTypes } from "~/editor/testing/draftFixtures.js";
import { getStepTypeLabel } from "./getStepTypeLabel.js";
import { isAiEditable } from "./isAiEditable.js";
import { isStepReadOnly } from "./isStepReadOnly.js";

const withoutAiEditor = () => {
    return createStepTypes().map(item => {
        return item.type === "ai" ? { ...item, configSchema: null } : item;
    });
};

describe("isAiEditable (R275)", () => {
    it("needs the ai row to be available and to have a config schema", () => {
        expect(isAiEditable(createStepTypes())).toBe(true);
        expect(isAiEditable(withoutAiEditor())).toBe(false);
        const unavailable = createStepTypes().map(item => {
            return item.type === "ai" ? { ...item, available: false } : item;
        });
        expect(isAiEditable(unavailable)).toBe(false);
        expect(isAiEditable([])).toBe(false);
    });
});

describe("isStepReadOnly (R270, R275, QBZ-47)", () => {
    it("is false for People and Automation steps", () => {
        expect(isStepReadOnly(createReviewStep(), createStepTypes())).toBe(false);
        expect(isStepReadOnly(createAutomationStep(), createStepTypes())).toBe(false);
    });

    it("is false for an AI step while the AI editor exists", () => {
        expect(isStepReadOnly(createAiStep(), createStepTypes())).toBe(false);
    });

    it("is true for an AI step without the AI editor", () => {
        expect(isStepReadOnly(createAiStep(), withoutAiEditor())).toBe(true);
    });

    it("is true for a step of an unknown type", () => {
        const step = createReviewStep({ type: "custom" });

        expect(isStepReadOnly(step, createStepTypes())).toBe(true);
    });
});

describe("getStepTypeLabel (D98)", () => {
    it("uses the UI names for the three known types", () => {
        const types = createStepTypes();

        expect(getStepTypeLabel("review", types)).toBe("People");
        expect(getStepTypeLabel("automation", types)).toBe("Automation");
        expect(getStepTypeLabel("ai", types)).toBe("AI");
    });

    it("uses the server title for an unknown type, then the type id", () => {
        const types = [
            ...createStepTypes(),
            {
                type: "custom",
                title: "Custom check",
                available: true,
                unavailableReason: null,
                configSchema: null
            }
        ];

        expect(getStepTypeLabel("custom", types)).toBe("Custom check");
        expect(getStepTypeLabel("other", types)).toBe("other");
    });
});
```

Create `packages/app-workflows/src/editor/model/getStepSummary.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createAiModel } from "~/editor/testing/editorFixtures.js";
import { createAiTool } from "~/editor/testing/editorFixtures.js";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createWorkflowTeamSummary } from "~/editor/testing/editorFixtures.js";
import { getStepSummary } from "./getStepSummary.js";
import type { StepContext } from "./StepContext.js";

const context = (overrides: Partial<StepContext> = {}): StepContext => {
    return {
        teams: [createWorkflowTeamSummary({ id: "team-1", name: "Legal" }), createWorkflowTeamSummary({ id: "team-2", name: "Editors" })],
        automations: [createWebhookAutomation()],
        automationsLoaded: true,
        aiModels: [createAiModel()],
        aiTools: [],
        aiEditable: true,
        baselineStep: null,
        ...overrides
    };
};

describe("getStepSummary: People", () => {
    it("joins the team names with +", () => {
        const step = createReviewStep({ config: { teams: ["team-2", "team-1"], assignment: null } });

        expect(getStepSummary(step, context())).toBe("Editors + Legal");
    });

    it("names a team that is not known as Unknown item", () => {
        const step = createReviewStep({ config: { teams: ["team-1", "gone"], assignment: null } });

        expect(getStepSummary(step, context())).toBe("Legal + Unknown item");
    });

    it("is empty without a team", () => {
        const step = createReviewStep({ config: { teams: [], assignment: null } });

        expect(getStepSummary(step, context())).toBe("");
    });
});

describe("getStepSummary: Automation", () => {
    it("shows the automation's name", () => {
        expect(getStepSummary(createAutomationStep(), context())).toBe("Send webhook");
    });

    it("shows the id when the definition is not listed", () => {
        const step = createAutomationStep({ config: { automationId: "gone", settings: {} } });

        expect(getStepSummary(step, context())).toBe("gone");
    });

    it("is empty before an automation is chosen", () => {
        const step = createAutomationStep({ config: { automationId: "", settings: {} } });

        expect(getStepSummary(step, context())).toBe("");
    });
});

describe("getStepSummary: AI", () => {
    it("shows the model and the tool count with the right plural", () => {
        const one = createAiStep({
            config: { instructions: "i", model: "openai/gpt-4o", tools: ["a"] }
        });
        const three = createAiStep({
            config: { instructions: "i", model: "openai/gpt-4o", tools: ["a", "b", "c"] }
        });
        const none = createAiStep({
            config: { instructions: "i", model: "openai/gpt-4o", tools: [] }
        });

        expect(getStepSummary(one, context())).toBe("GPT-4o · 1 tool");
        expect(getStepSummary(three, context())).toBe("GPT-4o · 3 tools");
        expect(getStepSummary(none, context())).toBe("GPT-4o · 0 tools");
    });

    it("says no model chosen for a step without a model (QBZ-89)", () => {
        const step = createAiStep({ config: { instructions: "i", model: "", tools: [] } });

        expect(getStepSummary(step, context())).toBe("No model chosen · 0 tools");
    });

    it("marks a retired model with its id as the name (QBZ-8)", () => {
        const step = createAiStep({
            config: { instructions: "i", model: "openai/old-model", tools: ["a", "b"] }
        });

        expect(getStepSummary(step, context())).toBe(
            "openai/old-model (no longer offered) · 2 tools"
        );
    });

    it("cannot tell a retired model without a loaded, non-empty list", () => {
        const step = createAiStep({
            config: { instructions: "i", model: "openai/old-model", tools: [] }
        });

        expect(getStepSummary(step, context({ aiModels: null }))).toBe("openai/old-model · 0 tools");
        expect(getStepSummary(step, context({ aiModels: [] }))).toBe("openai/old-model · 0 tools");
    });
});

describe("getStepSummary: AI tools that change content (R283)", () => {
    const reader = createAiTool({ name: "readContent", changesContent: false });
    const writer = createAiTool({ name: "updateFields", changesContent: true });
    const withTools = (tools: string[], model = "openai/gpt-4o") => {
        return createAiStep({ config: { instructions: "i", model, tools } });
    };

    it("appends can change content when a chosen tool changes content", () => {
        const step = withTools(["readContent", "updateFields"]);

        expect(getStepSummary(step, context({ aiTools: [reader, writer] }))).toBe(
            "GPT-4o · 2 tools · can change content"
        );
    });

    it("does not when no chosen tool changes content", () => {
        const step = withTools(["readContent"]);

        expect(getStepSummary(step, context({ aiTools: [reader, writer] }))).toBe(
            "GPT-4o · 1 tool"
        );
    });

    it("ignores a kept tool name no tool lists", () => {
        const step = withTools(["gone-tool"]);

        expect(getStepSummary(step, context({ aiTools: [reader, writer] }))).toBe(
            "GPT-4o · 1 tool"
        );
    });

    it("never appends while the tool list is not loaded or is empty", () => {
        const step = withTools(["updateFields"]);

        expect(getStepSummary(step, context({ aiTools: null }))).toBe("GPT-4o · 1 tool");
        expect(getStepSummary(step, context({ aiTools: [] }))).toBe("GPT-4o · 1 tool");
    });

    it("appends to the retired model and the no model forms too", () => {
        const retired = withTools(["readContent", "updateFields"], "openai/old-model");
        const none = withTools(["updateFields"], "");
        const tools = [reader, writer];

        expect(getStepSummary(retired, context({ aiTools: tools }))).toBe(
            "openai/old-model (no longer offered) · 2 tools · can change content"
        );
        expect(getStepSummary(none, context({ aiTools: tools }))).toBe(
            "No model chosen · 1 tool · can change content"
        );
    });
});

describe("getStepSummary: unknown type", () => {
    it("is empty", () => {
        const step = createReviewStep({ type: "custom", config: {} });

        expect(getStepSummary(step, context())).toBe("");
    });
});
```

Create `packages/app-workflows/src/editor/model/getStepWarnings.test.ts` (QBZ-8, QBZ-13, QBZ-47):

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createAiModel } from "~/editor/testing/editorFixtures.js";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createWorkflowTeamSummary } from "~/editor/testing/editorFixtures.js";
import { getStepWarnings } from "./getStepWarnings.js";
import type { StepContext } from "./StepContext.js";

const context = (overrides: Partial<StepContext> = {}): StepContext => {
    return {
        teams: [createWorkflowTeamSummary({ id: "team-1", name: "Legal", memberCount: 3 })],
        automations: [createWebhookAutomation()],
        automationsLoaded: true,
        aiModels: [createAiModel()],
        aiTools: [],
        aiEditable: true,
        baselineStep: null,
        ...overrides
    };
};

describe("getStepWarnings: People", () => {
    it("is clean when every team has members", () => {
        expect(getStepWarnings(createReviewStep(), context())).toEqual([]);
    });

    it("names each known team without members", () => {
        const step = createReviewStep({
            config: { teams: ["team-1", "team-2", "team-3"], assignment: null }
        });
        const teams = [
            createWorkflowTeamSummary({ id: "team-1", name: "Legal", memberCount: 0 }),
            createWorkflowTeamSummary({ id: "team-2", name: "Editors", memberCount: 2 }),
            createWorkflowTeamSummary({ id: "team-3", name: "Press", memberCount: 0 })
        ];

        expect(getStepWarnings(step, context({ teams }))).toEqual([
            "Legal has no members.",
            "Press has no members."
        ]);
    });

    it("does not warn about a team that is not known", () => {
        const step = createReviewStep({ config: { teams: ["gone"], assignment: null } });

        expect(getStepWarnings(step, context())).toEqual([]);
    });
});

describe("getStepWarnings: Automation", () => {
    it("is clean for a listed automation with valid settings", () => {
        expect(getStepWarnings(createAutomationStep(), context())).toEqual([]);
    });

    it("warns when the stored automation no longer exists", () => {
        const step = createAutomationStep({ config: { automationId: "gone", settings: {} } });

        expect(getStepWarnings(step, context())).toEqual([
            "The automation “gone” no longer exists."
        ]);
    });

    it("does not call an automation gone while the list did not load", () => {
        const step = createAutomationStep({ config: { automationId: "gone", settings: {} } });

        expect(getStepWarnings(step, context({ automationsLoaded: false, automations: [] }))).toEqual(
            []
        );
    });

    it("does not warn before an automation is chosen", () => {
        const step = createAutomationStep({ config: { automationId: "", settings: {} } });

        expect(getStepWarnings(step, context())).toEqual([]);
    });

    it("warns that saved settings no longer validate when they are unchanged (QBZ-13)", () => {
        const stored = createAutomationStep({
            config: { automationId: "send-webhook", settings: { url: 5 } }
        });

        const warnings = getStepWarnings(stored, context({ baselineStep: stored }));

        expect(warnings).toHaveLength(1);
        expect(warnings[0].startsWith("Saved settings no longer validate: ")).toBe(true);
        expect(warnings[0].length).toBeGreaterThan("Saved settings no longer validate: ".length);
    });

    it("says nothing once the admin changed the settings in this session (QBZ-13)", () => {
        const stored = createAutomationStep({
            config: { automationId: "send-webhook", settings: { url: 5 } }
        });
        const edited = createAutomationStep({
            config: { automationId: "send-webhook", settings: { url: 6 } }
        });

        expect(getStepWarnings(edited, context({ baselineStep: stored }))).toEqual([]);
    });

    it("says nothing about the settings of a step that is not on the server yet", () => {
        const step = createAutomationStep({
            config: { automationId: "send-webhook", settings: { url: 5 } }
        });

        expect(getStepWarnings(step, context({ baselineStep: null }))).toEqual([]);
    });

    it("says nothing when the stored settings still validate", () => {
        const stored = createAutomationStep();

        expect(getStepWarnings(stored, context({ baselineStep: stored }))).toEqual([]);
    });
});

describe("getStepWarnings: AI", () => {
    it("is clean for an offered model", () => {
        expect(getStepWarnings(createAiStep(), context())).toEqual([]);
    });

    it("warns about the licence when the AI editor does not exist, and only that", () => {
        const step = createAiStep({
            config: { instructions: "i", model: "openai/old-model", tools: [] }
        });

        expect(getStepWarnings(step, context({ aiEditable: false, aiModels: null }))).toEqual([
            "AI Power-Ups licence missing. This step fails when reached and can be restarted once the licence is back."
        ]);
    });

    it("warns about a retired model (QBZ-8)", () => {
        const step = createAiStep({
            config: { instructions: "i", model: "openai/old-model", tools: [] }
        });

        expect(getStepWarnings(step, context())).toEqual([
            "The AI model “openai/old-model” is no longer offered. Choose another model; until then this step fails when reached."
        ]);
    });

    it("does not call a model retired without a loaded, non-empty list, or before one is chosen", () => {
        const stored = createAiStep({
            config: { instructions: "i", model: "openai/old-model", tools: [] }
        });
        const fresh = createAiStep({ config: { instructions: "", model: "", tools: [] } });

        expect(getStepWarnings(stored, context({ aiModels: null }))).toEqual([]);
        expect(getStepWarnings(stored, context({ aiModels: [] }))).toEqual([]);
        expect(getStepWarnings(fresh, context())).toEqual([]);
    });
});

describe("getStepWarnings: unknown type", () => {
    it("has none", () => {
        const step = createReviewStep({ type: "custom", config: {} });

        expect(getStepWarnings(step, context())).toEqual([]);
    });
});
```

Create `packages/app-workflows/src/editor/model/isNonEmptySettings.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { isNonEmptySettings } from "./isNonEmptySettings.js";

describe("isNonEmptySettings", () => {
    it("is false for nothing entered", () => {
        expect(isNonEmptySettings(undefined)).toBe(false);
        expect(isNonEmptySettings(null)).toBe(false);
        expect(isNonEmptySettings({})).toBe(false);
        expect(isNonEmptySettings({ url: "", tags: [], nested: { a: null } })).toBe(false);
    });

    it("is true when any value is entered, also false and 0", () => {
        expect(isNonEmptySettings({ url: "https://x.test" })).toBe(true);
        expect(isNonEmptySettings({ enabled: false })).toBe(true);
        expect(isNonEmptySettings({ timeout: 0 })).toBe(true);
        expect(isNonEmptySettings({ nested: { a: ["x"] } })).toBe(true);
    });
});
```

Create `packages/app-workflows/src/editor/model/getAutomationWarnings.test.ts` (R274, QBZ-13):

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createAutomationDefinition } from "~/editor/testing/editorFixtures.js";
import { getAutomationWarnings } from "./getAutomationWarnings.js";

const WEBHOOK = createWebhookAutomation();
const SLACK = createAutomationDefinition({
    id: "post-to-slack",
    name: "Post to Slack",
    models: ["cms.*"],
    settingsSchema: null
});

describe("getAutomationWarnings (R274, QBZ-13)", () => {
    
    it("has no warning for a step with no automation", () => {
        expect(
            getAutomationWarnings({
                definitions: [WEBHOOK],
                selectedId: null,
                storedSettings: undefined,
                settingsPristine: true
            })
        ).toEqual({ warning: null, settingsWarning: null });
    });

    it("warns when the stored automation is not listed, with the id standing for the name", () => {
        const warnings = getAutomationWarnings({
            definitions: [WEBHOOK],
            selectedId: "gone",
            storedSettings: { url: "https://x.test" },
            settingsPristine: true
        });

        expect(warnings).toEqual({
            warning: "The automation “gone” no longer exists.",
            settingsWarning: null
        });
    });

    it("warns that saved settings no longer validate, only while they are unchanged", () => {
        const pristine = getAutomationWarnings({
            definitions: [WEBHOOK],
            selectedId: "send-webhook",
            storedSettings: { timeout: 500 },
            settingsPristine: true
        });
        const changed = getAutomationWarnings({
            definitions: [WEBHOOK],
            selectedId: "send-webhook",
            storedSettings: { timeout: 500 },
            settingsPristine: false
        });

        expect(pristine.warning).toBeNull();
        expect(pristine.settingsWarning?.startsWith("Saved settings no longer validate: ")).toBe(
            true
        );
        expect(changed.settingsWarning).toBeNull();
    });

    it("has no settings warning when the stored settings are valid or were never filled", () => {
        const valid = getAutomationWarnings({
            definitions: [WEBHOOK],
            selectedId: "send-webhook",
            storedSettings: { url: "https://x.test" },
            settingsPristine: true
        });
        const empty = getAutomationWarnings({
            definitions: [WEBHOOK],
            selectedId: "send-webhook",
            storedSettings: {},
            settingsPristine: true
        });

        expect(valid.settingsWarning).toBeNull();
        expect(empty.settingsWarning).toBeNull();
    });

    it("has no settings warning for a definition with no settings schema", () => {
        const warnings = getAutomationWarnings({
            definitions: [SLACK],
            selectedId: "post-to-slack",
            storedSettings: { anything: "x" },
            settingsPristine: true
        });

        expect(warnings).toEqual({ warning: null, settingsWarning: null });
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/domain/stepColours.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/isEqualJson.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/WorkflowDraft.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/toStepInput.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/createNewStep.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/validateWorkflowDraft.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/matchesAutomationScope.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/getStepTypeOptions.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/isStepReadOnly.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/getStepSummary.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/isNonEmptySettings.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/getAutomationWarnings.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/getStepWarnings.test.ts 2>&1 | tail -30
```

Expected: every file FAILS with `Failed to resolve import "./<module>.js" from "src/editor/<folder>/<test>.test.ts". Does the file exist?` (the source files do not exist yet; the fixtures import types only, which are erased). Record the RED.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/domain/stepColours.ts`:

```ts
export interface StepColour {
    label: string;
    value: string;
}

/*
 * The ten step colour presets (R273, UI-2), stored as the prototype's CSS variable strings so they
 * follow the theme (the review UI renders `step.color` as a CSS background, 8a). The labels are the
 * prototype's (`Workflow Editor.dc.html:505`).
 */
export const STEP_COLOURS: StepColour[] = [
    { label: "Orange", value: "var(--color-primary-500)" },
    { label: "Rust", value: "var(--color-primary-800)" },
    { label: "Amber", value: "var(--color-warning-600)" },
    { label: "Olive", value: "var(--color-warning-800)" },
    { label: "Teal", value: "var(--color-success-500)" },
    { label: "Green", value: "var(--color-success-800)" },
    { label: "Red", value: "var(--color-destructive-500)" },
    { label: "Maroon", value: "var(--color-destructive-700)" },
    { label: "Gray", value: "var(--color-neutral-500)" },
    { label: "Ink", value: "var(--color-neutral-900)" }
];

// A new step takes Orange.
export const DEFAULT_STEP_COLOUR = "var(--color-primary-500)";

// What a step with an empty stored colour is drawn with (the server stores "" by default).
export const FALLBACK_STEP_COLOUR = "var(--color-neutral-500)";

export const HEX_COLOUR_MESSAGE = "Enter a hex colour, e.g. #3B6FD4.";
```

Create `packages/app-workflows/src/editor/domain/isHexColour.ts`:

```ts
const HEX_COLOUR = /^#[0-9A-Fa-f]{6}$/;

// A custom colour is `#RRGGBB` (R273).
export const isHexColour = (value: string): boolean => {
    return HEX_COLOUR.test(value);
};
```

Create `packages/app-workflows/src/editor/domain/StepTypeId.ts`:

```ts
// The step type ids of the engine (`api-workflows` `domain/workflow/stepTypes.ts`).
export const StepTypeId = {
    Review: "review",
    Automation: "automation",
    Ai: "ai"
} as const;
```

Create `packages/app-workflows/src/editor/model/isRecord.ts`:

```ts
export const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};
```

Create `packages/app-workflows/src/editor/model/isEqualJson.ts`:

```ts
import { isRecord } from "./isRecord.js";

const isEqualArrays = (left: unknown[], right: unknown[]): boolean => {
    if (left.length !== right.length) {
        return false;
    }
    return left.every((item, index) => isEqualJson(item, right[index]));
};

const isEqualRecords = (left: Record<string, unknown>, right: Record<string, unknown>): boolean => {
    const leftKeys = Object.keys(left);
    if (leftKeys.length !== Object.keys(right).length) {
        return false;
    }
    return leftKeys.every(key => {
        return Object.prototype.hasOwnProperty.call(right, key) && isEqualJson(left[key], right[key]);
    });
};

/*
 * Deep equality of JSON values that ignores the key order of objects. The draft compares a step's
 * untyped `config` with the stored one: a form may rebuild the same config with its keys in
 * another order, which must not count as a change.
 */
export const isEqualJson = (left: unknown, right: unknown): boolean => {
    if (left === right) {
        return true;
    }
    if (Array.isArray(left) && Array.isArray(right)) {
        return isEqualArrays(left, right);
    }
    if (isRecord(left) && isRecord(right)) {
        return isEqualRecords(left, right);
    }
    return false;
};
```

Create `packages/app-workflows/src/editor/model/createDefaultAssignment.ts`:

```ts
export interface DefaultAssignment {
    strategy: "none";
    allowManualPick: false;
    rules: never[];
}

/*
 * The review config the server requires in full (`research-api.md` gap 9): a step without an
 * assignment gets it. 9a does not edit the assignment (R270), it only creates and carries it.
 */
export const createDefaultAssignment = (): DefaultAssignment => {
    return { strategy: "none", allowManualPick: false, rules: [] };
};
```

Create `packages/app-workflows/src/editor/model/readReviewConfig.ts`:

```ts
import { isRecord } from "./isRecord.js";

export interface ReviewConfigValue {
    teams: string[];
    // The stored assignment object, carried unchanged (R270); null when the config has none.
    assignment: Record<string, unknown> | null;
}

export const readReviewConfig = (config: unknown): ReviewConfigValue => {
    if (!isRecord(config)) {
        return { teams: [], assignment: null };
    }
    const teams = Array.isArray(config.teams) ? config.teams : [];
    const assignment = isRecord(config.assignment) ? config.assignment : null;

    return {
        teams: teams.filter((team): team is string => typeof team === "string"),
        assignment
    };
};
```

Create `packages/app-workflows/src/editor/model/readAutomationConfig.ts`:

```ts
import { isRecord } from "./isRecord.js";

export interface AutomationConfigValue {
    automationId: string;
    settings: Record<string, unknown>;
}

export const readAutomationConfig = (config: unknown): AutomationConfigValue => {
    if (!isRecord(config)) {
        return { automationId: "", settings: {} };
    }
    const automationId = typeof config.automationId === "string" ? config.automationId : "";
    const settings = isRecord(config.settings) ? config.settings : {};

    return { automationId, settings };
};
```

Create `packages/app-workflows/src/editor/model/readAiConfig.ts`:

```ts
import { isRecord } from "./isRecord.js";

export interface AiConfigValue {
    instructions: string;
    model: string;
    // Includes names no tool lists any more; they are kept on save (R275).
    tools: string[];
}

export const readAiConfig = (config: unknown): AiConfigValue => {
    if (!isRecord(config)) {
        return { instructions: "", model: "", tools: [] };
    }
    const instructions = typeof config.instructions === "string" ? config.instructions : "";
    const model = typeof config.model === "string" ? config.model : "";
    const tools = Array.isArray(config.tools) ? config.tools : [];

    return {
        instructions,
        model,
        tools: tools.filter((tool): tool is string => typeof tool === "string")
    };
};
```

Create `packages/app-workflows/src/editor/model/EditorStepPatch.ts`:

```ts
import type { EditorStep } from "~/editor/domain/types.js";

// What an edit may change: never the id and never the type (D91).
export type EditorStepPatch = Partial<Omit<EditorStep, "id" | "type">>;
```

Create `packages/app-workflows/src/editor/model/toStepInput.ts`:

```ts
import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorStepInput } from "~/editor/domain/types.js";
import { createDefaultAssignment } from "./createDefaultAssignment.js";
import { readAiConfig } from "./readAiConfig.js";
import { readAutomationConfig } from "./readAutomationConfig.js";
import { readReviewConfig } from "./readReviewConfig.js";

/*
 * The config as the server's config schema of the type has it, key for key (R270, Review Focus 3):
 * no editor-only keys, the review defaults when the step has none, the stored assignment, unknown
 * transport ids and unknown AI tool names kept. A step of a type the editor has no form for is
 * saved unchanged.
 */
const toStepConfig = (step: EditorStep): unknown => {
    if (step.type === StepTypeId.Review) {
        const config = readReviewConfig(step.config);
        const assignment = config.assignment ?? createDefaultAssignment();
        return { teams: config.teams, assignment };
    }
    if (step.type === StepTypeId.Automation) {
        const config = readAutomationConfig(step.config);
        return { automationId: config.automationId, settings: config.settings };
    }
    if (step.type === StepTypeId.Ai) {
        const config = readAiConfig(step.config);
        return { instructions: config.instructions, model: config.model, tools: config.tools };
    }
    return step.config;
};

export const toStepInput = (step: EditorStep): EditorStepInput => {
    const notifications = step.notificationIds.map(id => ({ id }));
    const config = toStepConfig(step);

    return {
        id: step.id,
        title: step.title,
        color: step.color,
        description: step.description,
        type: step.type,
        notifications,
        config
    };
};
```

Create `packages/app-workflows/src/editor/model/WorkflowDraft.ts`:

```ts
import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import type { EditorWorkflowInput } from "~/editor/domain/types.js";
import type { EditorStepPatch } from "./EditorStepPatch.js";
import { isEqualJson } from "./isEqualJson.js";
import { toStepInput } from "./toStepInput.js";

export interface NewDraftParams {
    id: string;
    name: string;
    models: string[];
}

/*
 * The workflow being edited (R276). The presenter owns the one instance and never lets it reach a
 * component (R234). `baseline` is the loaded workflow; `null` while a draft is open means a draft
 * that was never saved (Create workflow, Save as new), which is dirty from the start. `steps` is
 * replaced, never mutated, and observed by reference so a step's untyped `config` never becomes a
 * MobX proxy.
 */
export class WorkflowDraft {
    private open = false;
    private baseline: EditorWorkflow | null = null;
    private _id = "";
    private _name = "";
    private _models: string[] = [];
    private _steps: EditorStep[] = [];

    constructor() {
        makeAutoObservable<WorkflowDraft, "baseline" | "_models" | "_steps">(this, {
            baseline: observableRef,
            _models: observableRef,
            _steps: observableRef
        });
    }

    get isOpen(): boolean {
        return this.open;
    }

    get isNew(): boolean {
        return this.open && this.baseline === null;
    }

    get id(): string {
        return this._id;
    }

    get name(): string {
        return this._name;
    }

    get models(): string[] {
        return this._models;
    }

    get steps(): EditorStep[] {
        return this._steps;
    }

    // The loaded string, sent back unchanged (Review Focus 1); null for a draft never saved.
    get savedOn(): string | null {
        return this.baseline === null ? null : this.baseline.savedOn;
    }

    get isDirty(): boolean {
        if (!this.open) {
            return false;
        }
        if (this.baseline === null) {
            return true;
        }
        if (this._name !== this.baseline.name) {
            return true;
        }
        return !isEqualJson(this._steps, this.baseline.steps);
    }

    getBaselineStep(stepId: string): EditorStep | null {
        if (this.baseline === null) {
            return null;
        }
        const step = this.baseline.steps.find(item => item.id === stepId);
        return step ?? null;
    }

    reset(workflow: EditorWorkflow | null): void {
        if (workflow === null) {
            this.open = false;
            this.baseline = null;
            this._id = "";
            this._name = "";
            this._models = [];
            this._steps = [];
            return;
        }
        this.open = true;
        this.baseline = workflow;
        this._id = workflow.id;
        this._name = workflow.name;
        this._models = [...workflow.models];
        this._steps = [...workflow.steps];
    }

    startNew(params: NewDraftParams): void {
        this.open = true;
        this.baseline = null;
        this._id = params.id;
        this._name = params.name;
        this._models = [...params.models];
        this._steps = [];
    }

    // Save as new (R276): the same content and id, nothing saved to compare with.
    detachBaseline(): void {
        this.baseline = null;
    }

    setName(name: string): void {
        this._name = name;
    }

    addStep(index: number, step: EditorStep): void {
        const clamped = Math.max(0, Math.min(index, this._steps.length));
        const steps = [...this._steps];
        steps.splice(clamped, 0, step);
        this._steps = steps;
    }

    updateStep(stepId: string, patch: EditorStepPatch): void {
        this._steps = this._steps.map(step => {
            return step.id === stepId ? { ...step, ...patch } : step;
        });
    }

    moveStep(from: number, to: number): void {
        const last = this._steps.length - 1;
        if (from === to || from < 0 || from > last || to < 0 || to > last) {
            return;
        }
        const steps = [...this._steps];
        const [moved] = steps.splice(from, 1);
        steps.splice(to, 0, moved);
        this._steps = steps;
    }

    removeStep(stepId: string): void {
        this._steps = this._steps.filter(step => step.id !== stepId);
    }

    toInput(): EditorWorkflowInput {
        return {
            id: this._id,
            name: this._name,
            models: [...this._models],
            steps: this._steps.map(toStepInput)
        };
    }
}
```

Note for the executor: `{ ...step, ...patch }` can carry the patch's `id` or `type` only if a caller casts around the type; `EditorStepPatch` forbids both at compile time, and the test "never changes its id or type" passes because the patch type has no such keys.

Create `packages/app-workflows/src/editor/model/createNewStep.ts`:

```ts
import { DEFAULT_STEP_COLOUR } from "~/editor/domain/stepColours.js";
import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import { createDefaultAssignment } from "./createDefaultAssignment.js";

const EMAIL_TRANSPORT_ID = "e-mail";

export interface NewStepParams {
    id: string;
    type: string;
    transports: NotificationTransport[];
}

const createConfig = (type: string): unknown => {
    if (type === StepTypeId.Review) {
        return { teams: [], assignment: createDefaultAssignment() };
    }
    if (type === StepTypeId.Automation) {
        return { automationId: "", settings: {} };
    }
    if (type === StepTypeId.Ai) {
        return { instructions: "", model: "", tools: [] };
    }
    return {};
};

/*
 * A new step (R270, R272, R273): Orange, no title, the config defaults of its type, and for a People
 * step `e-mail` ticked when that transport exists (QBZ-45).
 */
export const createNewStep = (params: NewStepParams): EditorStep => {
    const hasEmail = params.transports.some(transport => transport.id === EMAIL_TRANSPORT_ID);
    const ticked = params.type === StepTypeId.Review && hasEmail;

    return {
        id: params.id,
        title: "",
        color: DEFAULT_STEP_COLOUR,
        description: null,
        type: params.type,
        notificationIds: ticked ? [EMAIL_TRANSPORT_ID] : [],
        config: createConfig(params.type)
    };
};
```

Create `packages/app-workflows/src/editor/model/StepFieldError.ts`:

```ts
// `field` uses the server's vocabulary (R267): "title", "color", "config.teams",
// "config.settings.<path>", "config.instructions", "config.model", ... or "" for a server error that
// names no field.
export interface StepFieldError {
    field: string;
    message: string;
}

export interface StepValidationErrors {
    stepId: string;
    errors: StepFieldError[];
}

export interface WorkflowDraftErrors {
    name: string | null;
    steps: string | null;
    stepErrors: StepValidationErrors[];
}
```

Create `packages/app-workflows/src/editor/model/getMissingRequiredSettings.ts`:

```ts
import { isRecord } from "./isRecord.js";

export interface MissingSetting {
    key: string;
    label: string;
}

const isMissing = (value: unknown): boolean => {
    return value === undefined || value === null || value === "";
};

/*
 * The required top-level settings of an automation's schema that are empty and have no default
 * (R276: `{Label} is required.`). The label is the property's `title`, else its key. Reads the
 * schema as plain data, so an odd schema yields nothing instead of throwing.
 */
export const getMissingRequiredSettings = (
    schema: unknown,
    settings: Record<string, unknown>
): MissingSetting[] => {
    if (!isRecord(schema) || !Array.isArray(schema.required)) {
        return [];
    }
    const properties = isRecord(schema.properties) ? schema.properties : {};
    const missing: MissingSetting[] = [];

    for (const key of schema.required) {
        if (typeof key !== "string") {
            continue;
        }
        const property = properties[key];
        const definition = isRecord(property) ? property : {};
        if ("default" in definition || !isMissing(settings[key])) {
            continue;
        }
        const title = definition.title;
        const label = typeof title === "string" && title !== "" ? title : key;
        missing.push({ key, label });
    }

    return missing;
};
```

Create `packages/app-workflows/src/editor/model/validateWorkflowDraft.ts`:

```ts
import { createJsonSchemaValidator } from "@webiny/app-admin/features/formModel/jsonSchema/createJsonSchemaValidator.js";
import { HEX_COLOUR_MESSAGE } from "~/editor/domain/stepColours.js";
import { isHexColour } from "~/editor/domain/isHexColour.js";
import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStep } from "~/editor/domain/types.js";
import { getMissingRequiredSettings } from "./getMissingRequiredSettings.js";
import { readAiConfig } from "./readAiConfig.js";
import { readAutomationConfig } from "./readAutomationConfig.js";
import { readReviewConfig } from "./readReviewConfig.js";
import type { StepFieldError } from "./StepFieldError.js";
import type { StepValidationErrors } from "./StepFieldError.js";
import type { WorkflowDraftErrors } from "./StepFieldError.js";

export interface ValidateWorkflowDraftParams {
    name: string;
    steps: EditorStep[];
    automations: AutomationDefinition[];
    // False when the AI editor does not exist: an AI step is then read-only and never blocks Save.
    aiEditable: boolean;
}

const SETTINGS_FIELD = "config.settings";

function validateReviewStep(step: EditorStep): StepFieldError[] {
    const config = readReviewConfig(step.config);
    if (config.teams.length > 0) {
        return [];
    }
    return [{ field: "config.teams", message: "Choose at least one reviewing team." }];
}

function validateAutomationStep(
    step: EditorStep,
    automations: AutomationDefinition[]
): StepFieldError[] {
    const config = readAutomationConfig(step.config);
    const definition = automations.find(item => item.id === config.automationId);
    if (!definition || definition.settingsSchema === null) {
        return [];
    }

    const errors: StepFieldError[] = [];
    const reported = new Set<string>();
    const missing = getMissingRequiredSettings(definition.settingsSchema, config.settings);
    for (const setting of missing) {
        reported.add(setting.key);
        errors.push({
            field: `${SETTINGS_FIELD}.${setting.key}`,
            message: `${setting.label} is required.`
        });
    }

    const validator = createJsonSchemaValidator(definition.settingsSchema);
    const result = validator.validate(config.settings);
    for (const issue of result.issues) {
        if (reported.has(issue.path)) {
            continue;
        }
        const field = issue.path === "" ? SETTINGS_FIELD : `${SETTINGS_FIELD}.${issue.path}`;
        errors.push({ field, message: issue.message });
    }

    return errors;
}

function validateAiStep(step: EditorStep): StepFieldError[] {
    const config = readAiConfig(step.config);
    const errors: StepFieldError[] = [];
    if (config.instructions.trim() === "") {
        errors.push({ field: "config.instructions", message: "Enter instructions for the AI." });
    }
    if (config.model.trim() === "") {
        errors.push({ field: "config.model", message: "Choose an AI model." });
    }
    return errors;
}

function validateTypeConfig(
    step: EditorStep,
    params: ValidateWorkflowDraftParams
): StepFieldError[] {
    if (step.type === StepTypeId.Review) {
        return validateReviewStep(step);
    }
    if (step.type === StepTypeId.Automation) {
        return validateAutomationStep(step, params.automations);
    }
    if (step.type === StepTypeId.Ai && params.aiEditable) {
        return validateAiStep(step);
    }
    return [];
}

function validateStep(step: EditorStep, params: ValidateWorkflowDraftParams): StepFieldError[] {
    const errors: StepFieldError[] = [];
    if (step.title.trim() === "") {
        errors.push({ field: "title", message: "Enter a title for this step." });
    }
    if (step.color.startsWith("#") && !isHexColour(step.color)) {
        errors.push({ field: "color", message: HEX_COLOUR_MESSAGE });
    }
    const typeErrors = validateTypeConfig(step, params);

    return [...errors, ...typeErrors];
}

/*
 * The client-side checks that run before a save (R276, QBZ-12). A step error uses the server's
 * field vocabulary (R267), so the presenter marks client and server errors the same way. Stale
 * configuration (a team without members, a missing automation, a retired model) is a warning, not
 * a blocker, and is not checked here.
 */
export const validateWorkflowDraft = (params: ValidateWorkflowDraftParams): WorkflowDraftErrors => {
    const stepErrors: StepValidationErrors[] = [];
    for (const step of params.steps) {
        const errors = validateStep(step, params);
        if (errors.length > 0) {
            stepErrors.push({ stepId: step.id, errors });
        }
    }

    return {
        name: params.name.trim() === "" ? "Enter a workflow name." : null,
        steps: params.steps.length === 0 ? "Add at least one step." : null,
        stepErrors
    };
};
```

Create `packages/app-workflows/src/editor/model/matchesAutomationScope.ts`:

```ts
const WILDCARD_SUFFIX = ".*";

const coversModel = (automationModel: string, workflowModel: string): boolean => {
    if (automationModel === "*") {
        return true;
    }
    if (
        automationModel.endsWith(WILDCARD_SUFFIX) &&
        automationModel.length > WILDCARD_SUFFIX.length
    ) {
        // "cms.*" covers "cms.article": the namespace prefix up to and including the dot.
        const prefix = automationModel.slice(0, -1);
        return workflowModel.startsWith(prefix) && workflowModel.length > prefix.length;
    }
    return automationModel === workflowModel;
};

/*
 * Whether an automation's `models` cover every model of a workflow (D35, R269): `"*"` covers all,
 * `"<app>.*"` the namespace ids starting with `"<app>."`, anything else is an exact namespace id. A
 * client mirror of `matchesAutomationScope` in `api-workflows` (`domain/automation/`), so the editor
 * never offers an automation the server would refuse to save.
 */
export const matchesAutomationScope = (
    automationModels: string[],
    workflowModels: string[]
): boolean => {
    if (workflowModels.length === 0) {
        return false;
    }
    return workflowModels.every(workflowModel => {
        return automationModels.some(automationModel => {
            return coversModel(automationModel, workflowModel);
        });
    });
};
```

Create `packages/app-workflows/src/editor/model/getStepTypeLabel.ts`:

```ts
import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { EditorStepType } from "~/editor/domain/types.js";

const UI_NAMES: Record<string, string> = {
    [StepTypeId.Review]: "People",
    [StepTypeId.Automation]: "Automation",
    [StepTypeId.Ai]: "AI"
};

// The UI names of the known types (D98); an unknown type shows the server's title, else its id.
export const getStepTypeLabel = (type: string, stepTypes: EditorStepType[]): string => {
    const known = UI_NAMES[type];
    if (known !== undefined) {
        return known;
    }
    const listed = stepTypes.find(item => item.type === type);
    return listed ? listed.title : type;
};
```

Create `packages/app-workflows/src/editor/model/isAiEditable.ts`:

```ts
import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { EditorStepType } from "~/editor/domain/types.js";

/*
 * The AI editor exists only when the `ai` row is available and has a config schema (R275): then
 * `listAiModels` exists too (`research2-api.md` C).
 */
export const isAiEditable = (stepTypes: EditorStepType[]): boolean => {
    const row = stepTypes.find(item => item.type === StepTypeId.Ai);
    return row !== undefined && row.available && row.configSchema !== null;
};
```

Create `packages/app-workflows/src/editor/model/isStepReadOnly.ts`:

```ts
import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import { isAiEditable } from "./isAiEditable.js";

const KNOWN_TYPES: string[] = [StepTypeId.Review, StepTypeId.Automation, StepTypeId.Ai];

/*
 * A step of a type the editor has no form for, and an AI step while the AI editor does not exist,
 * are shown read-only and saved unchanged (R270, R275). Move and delete stay enabled (QBZ-47).
 */
export const isStepReadOnly = (step: EditorStep, stepTypes: EditorStepType[]): boolean => {
    if (!KNOWN_TYPES.includes(step.type)) {
        return true;
    }
    return step.type === StepTypeId.Ai && !isAiEditable(stepTypes);
};
```

Create `packages/app-workflows/src/editor/model/getStepTypeOptions.ts`:

```ts
import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import { getStepTypeLabel } from "./getStepTypeLabel.js";
import { isAiEditable } from "./isAiEditable.js";
import { matchesAutomationScope } from "./matchesAutomationScope.js";

export type WorkflowEditorAppKind = "cms" | "wb";

export interface StepTypeOptionsParams {
    stepTypes: EditorStepType[];
    automations: AutomationDefinition[];
    // The workflow's model, e.g. `cms.article` or `wb.page`.
    namespace: string;
    appKind: WorkflowEditorAppKind;
}

// Render-ready (R234): the type picker shows `label`, `description` and, when not addable, `reason`.
export interface StepTypeOption {
    type: string;
    label: string;
    description: string | null;
    addable: boolean;
    reason: string | null;
}

const DESCRIPTIONS: Record<string, string> = {
    [StepTypeId.Review]: "Members of one or more teams review.",
    [StepTypeId.Automation]: "Runs a code-defined automation, such as Send webhook.",
    [StepTypeId.Ai]: "An AI model reviews against your written instructions."
};

const AI_REASON = "Requires the AI Power-Ups licence.";
const AUTOMATION_REASON_CMS = "No automations are available for this model.";
const AUTOMATION_REASON_WB = "No automations are available for pages.";

interface Availability {
    addable: boolean;
    reason: string | null;
}

function getAvailability(item: EditorStepType, params: StepTypeOptionsParams): Availability {
    if (item.type === StepTypeId.Ai) {
        const addable = isAiEditable(params.stepTypes);
        return { addable, reason: addable ? null : AI_REASON };
    }
    if (item.type === StepTypeId.Automation) {
        const covering = params.automations.filter(definition => {
            return matchesAutomationScope(definition.models, [params.namespace]);
        });
        const addable = item.available && covering.length > 0;
        const reason = params.appKind === "wb" ? AUTOMATION_REASON_WB : AUTOMATION_REASON_CMS;
        return { addable, reason: addable ? null : reason };
    }
    if (item.type === StepTypeId.Review) {
        return {
            addable: item.available,
            reason: item.available ? null : item.unavailableReason
        };
    }
    // A type the editor has no form for is listed but never addable; no design copy exists for it.
    return { addable: false, reason: item.unavailableReason };
}

/*
 * Every type from `listStepTypes`, in the order returned, with whether it can be added and why not
 * (R269, D122, D35, QBZ-97). Pure.
 */
export const getStepTypeOptions = (params: StepTypeOptionsParams): StepTypeOption[] => {
    return params.stepTypes.map(item => {
        const availability = getAvailability(item, params);
        const description = DESCRIPTIONS[item.type];

        return {
            type: item.type,
            label: getStepTypeLabel(item.type, params.stepTypes),
            description: description === undefined ? null : description,
            addable: availability.addable,
            reason: availability.reason
        };
    });
};
```

Create `packages/app-workflows/src/editor/model/StepContext.ts`:

```ts
import type { AiModel } from "~/editor/domain/types.js";
import type { AiTool } from "~/editor/domain/types.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { WorkflowTeamSummary } from "~/editor/domain/types.js";

/*
 * What a step's summary and warnings need besides the step (plain data, no VM). The presenter
 * builds one per step from what it has loaded.
 */
export interface StepContext {
    // Every team the editor knows by id (resolved at load, or seen in a search).
    teams: WorkflowTeamSummary[];
    automations: AutomationDefinition[];
    // False when the definition list did not load, so no automation is called gone.
    automationsLoaded: boolean;
    // `null` while the model list is not loaded (failed, or no AI editor).
    aiModels: AiModel[] | null;
    // `null` while the tool list is not loaded (failed, or no AI editor); drives ` · can change content` (R283).
    aiTools: AiTool[] | null;
    aiEditable: boolean;
    // The step as stored on the server; null for a step added in this session (QBZ-13).
    baselineStep: EditorStep | null;
}
```

Create `packages/app-workflows/src/editor/model/getStepSummary.ts`:

```ts
import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { EditorStep } from "~/editor/domain/types.js";
import { readAiConfig } from "./readAiConfig.js";
import { readAutomationConfig } from "./readAutomationConfig.js";
import { readReviewConfig } from "./readReviewConfig.js";
import type { StepContext } from "./StepContext.js";

const UNKNOWN_ITEM = "Unknown item";

function getReviewSummary(step: EditorStep, context: StepContext): string {
    const config = readReviewConfig(step.config);
    const names = config.teams.map(id => {
        const team = context.teams.find(item => item.id === id);
        return team ? team.name : UNKNOWN_ITEM;
    });
    return names.join(" + ");
}

function getAutomationSummary(step: EditorStep, context: StepContext): string {
    const config = readAutomationConfig(step.config);
    const definition = context.automations.find(item => item.id === config.automationId);
    return definition ? definition.name : config.automationId;
}

function anyToolChangesContent(chosen: string[], listed: AiTool[] | null): boolean {
    if (listed === null) {
        return false;
    }
    return chosen.some(name => {
        return listed.some(tool => tool.name === name && tool.changesContent);
    });
}

function getAiSummary(step: EditorStep, context: StepContext): string {
    const config = readAiConfig(step.config);
    const count = config.tools.length;
    const tools = `${count} ${count === 1 ? "tool" : "tools"}`;
    const changes = anyToolChangesContent(config.tools, context.aiTools);
    const suffix = changes ? " · can change content" : "";
    if (config.model === "") {
        return `No model chosen · ${tools}${suffix}`;
    }
    const models = context.aiModels;
    const model = models === null ? undefined : models.find(item => item.id === config.model);
    const name = model ? model.name : config.model;
    const retired = models !== null && models.length > 0 && model === undefined;
    if (retired) {
        return `${name} (no longer offered) · ${tools}${suffix}`;
    }
    return `${name} · ${tools}${suffix}`;
}

/*
 * The summary line of a step card (R272-R275): People `{Teams joined with +}` (9a has no strategy
 * part), Automation `{Automation}`, AI `{Model} · n tool(s)[ · can change content]`. Empty for a type the editor has no
 * form for. Pure.
 */
export const getStepSummary = (step: EditorStep, context: StepContext): string => {
    if (step.type === StepTypeId.Review) {
        return getReviewSummary(step, context);
    }
    if (step.type === StepTypeId.Automation) {
        return getAutomationSummary(step, context);
    }
    if (step.type === StepTypeId.Ai) {
        return getAiSummary(step, context);
    }
    return "";
};
```

Create `packages/app-workflows/src/editor/model/isNonEmptySettings.ts`:

```ts
/*
 * True when any value is entered: null, undefined, "", empty arrays and objects with nothing
 * inside count as not entered; `false` and `0` count as entered (QBZ-14).
 */
export const isNonEmptySettings = (value: unknown): boolean => {
    if (value === null || value === undefined || value === "") {
        return false;
    }
    if (Array.isArray(value)) {
        return value.some(isNonEmptySettings);
    }
    if (typeof value === "object") {
        return Object.values(value).some(isNonEmptySettings);
    }
    return true;
};
```

Create `packages/app-workflows/src/editor/model/getAutomationWarnings.ts` (moved here from the step form: the step cards and the drawer's automation cards share it):

```ts
import { createJsonSchemaValidator } from "@webiny/app-admin/features/formModel/jsonSchema/createJsonSchemaValidator.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import { isNonEmptySettings } from "./isNonEmptySettings.js";

export interface AutomationWarningsParams {
    // Every definition the server lists, not only those covering the model.
    definitions: AutomationDefinition[];
    selectedId: string | null;
    // The settings stored on the step when it was loaded.
    storedSettings: unknown;
    // True until the admin changes the settings in this session (QBZ-13).
    settingsPristine: boolean;
}

export interface AutomationWarnings {
    warning: string | null;
    settingsWarning: string | null;
}

/*
 * The two card warnings of R274: the stored automation is not listed (the id stands for the name,
 * the step stores nothing else), and the stored settings fail the definition's schema while the
 * admin has not changed them (QBZ-13). Settings never filled in are not "saved settings".
 */
export const getAutomationWarnings = (params: AutomationWarningsParams): AutomationWarnings => {
    const { definitions, selectedId, storedSettings, settingsPristine } = params;
    const warnings: AutomationWarnings = { warning: null, settingsWarning: null };

    if (selectedId === null) {
        return warnings;
    }

    const definition = definitions.find(item => item.id === selectedId);
    if (!definition) {
        warnings.warning = `The automation “${selectedId}” no longer exists.`;
        return warnings;
    }

    const schema = definition.settingsSchema;
    if (schema === null || !settingsPristine || !isNonEmptySettings(storedSettings)) {
        return warnings;
    }

    const result = createJsonSchemaValidator(schema).validate(storedSettings);
    if (!result.valid && result.issues.length > 0) {
        warnings.settingsWarning = `Saved settings no longer validate: ${result.issues[0].message}`;
    }

    return warnings;
};
```

Create `packages/app-workflows/src/editor/model/getStepWarnings.ts`:

```ts
import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { EditorStep } from "~/editor/domain/types.js";
import { getAutomationWarnings } from "./getAutomationWarnings.js";
import { isEqualJson } from "./isEqualJson.js";
import { readAiConfig } from "./readAiConfig.js";
import { readAutomationConfig } from "./readAutomationConfig.js";
import { readReviewConfig } from "./readReviewConfig.js";
import type { StepContext } from "./StepContext.js";

const LICENCE_WARNING =
    "AI Power-Ups licence missing. This step fails when reached and can be restarted once the licence is back.";

function getReviewWarnings(step: EditorStep, context: StepContext): string[] {
    const config = readReviewConfig(step.config);
    const warnings: string[] = [];
    for (const id of config.teams) {
        const team = context.teams.find(item => item.id === id);
        if (team && team.memberCount === 0) {
            warnings.push(`${team.name} has no members.`);
        }
    }
    return warnings;
}

function getAutomationStepWarnings(step: EditorStep, context: StepContext): string[] {
    // A list that did not load cannot call an automation gone (the options banner says so).
    if (!context.automationsLoaded) {
        return [];
    }
    const current = readAutomationConfig(step.config);
    const baseline = context.baselineStep === null ? null : readAutomationConfig(context.baselineStep.config);
    // QBZ-13: only the settings saved on the server, and only while the admin has not touched them.
    const pristine =
        baseline !== null &&
        baseline.automationId === current.automationId &&
        isEqualJson(baseline.settings, current.settings);
    const warnings = getAutomationWarnings({
        definitions: context.automations,
        selectedId: current.automationId === "" ? null : current.automationId,
        storedSettings: baseline === null ? undefined : baseline.settings,
        settingsPristine: pristine
    });
    return [warnings.warning, warnings.settingsWarning].filter(
        (warning): warning is string => warning !== null
    );
}

function getAiWarnings(step: EditorStep, context: StepContext): string[] {
    if (!context.aiEditable) {
        return [LICENCE_WARNING];
    }
    const config = readAiConfig(step.config);
    const models = context.aiModels;
    if (config.model === "" || models === null || models.length === 0) {
        return [];
    }
    if (models.some(item => item.id === config.model)) {
        return [];
    }
    return [
        `The AI model “${config.model}” is no longer offered. Choose another model; until then this step fails when reached.`
    ];
}

/*
 * The amber warning lines of a step card (R272-R275, QBZ-8, QBZ-13, QBZ-47). Warnings never block
 * a save. Pure.
 */
export const getStepWarnings = (step: EditorStep, context: StepContext): string[] => {
    if (step.type === StepTypeId.Review) {
        return getReviewWarnings(step, context);
    }
    if (step.type === StepTypeId.Automation) {
        return getAutomationStepWarnings(step, context);
    }
    if (step.type === StepTypeId.Ai) {
        return getAiWarnings(step, context);
    }
    return [];
};
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/domain/stepColours.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/isEqualJson.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/WorkflowDraft.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/toStepInput.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/createNewStep.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/validateWorkflowDraft.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/matchesAutomationScope.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/getStepTypeOptions.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/isStepReadOnly.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/getStepSummary.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/isNonEmptySettings.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/getAutomationWarnings.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/model/getStepWarnings.test.ts 2>&1 | tail -30
```

Expected: PASS. Notes for the first run: the two settings-issue cases (`timeout: 0` in `validateWorkflowDraft.test.ts`, `url: 5` in `getStepWarnings.test.ts`) depend on Task 3's validator reporting an issue for a number below `minimum` and for a number where a string is expected, and on its `path` being the dotted property path without a root (`timeout`, not `$.timeout`). Task 3's tests pin exactly that format (`timeout`, `headers.0.name`, `url`), checked by the consistency pass.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
# The per-file runs of Step 4 are the targeted ones; no folder run (one test file per command).
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: the build type-checks every test under `src/editor` (Tasks 5-7 tests included); no TypeScript errors (the build type-checks the co-located tests, R243).

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
git commit -m "feat(app-workflows): add the workflow draft model and its pure helpers" -m "The editor gets a MobX WorkflowDraft with a baseline (a new draft is dirty from the start), a toInput that emits the review defaults and keeps unknown transport ids, AI tools and the stored assignment, and the pure helpers for new steps, client validation, step type availability, summaries and warnings." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. In the commit command, replace the literal `<CURRENT_SESSION_URL>` with the `https://claude.ai/code/session_...` URL of the session that runs the commit. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **Task 5 shapes are read from its task file** (`task-05-editor-domain.md`): `EditorStep.notificationIds`, a nullable `description`, `EditorWorkflowInput` and `EditorStepInput` in `domain/types.ts`. Task 5's final text has exactly these names (checked by the consistency pass).
- **`draftFixtures.ts` adds only what Task 5's `editorFixtures.ts` lacks:** one step per type with the draft tests' values (an AI step needs a model id that the default `createAiModel` offers), the step types with an AI `configSchema` (Task 5's default `createEditorStepType` has none, so the AI editor would not exist), and an automation with a settings schema (Task 5's has none).
- **`WorkflowDraft` API vs the contract.** The contract lists `reset(workflow: EditorWorkflow | null)`; a new draft needs an id, a name and a model that `reset(null)` cannot carry, so `startNew(params)` and `detachBaseline()` are added and `reset(null)` means "nothing open". Names used by the contract (`setName`, `addStep`, `updateStep`, `moveStep`, `removeStep`, `toInput`, `isDirty`, `baseline`) are unchanged.
- **A retired model shows its id as the name** in the summary and the warning (`openai/old-model (no longer offered)`): once a model leaves the list no name is available (QBZ-8 shows the stored name; the contract has none to store).
- **Added files beyond the contract's list:** `getStepTypeLabel`, `isAiEditable`, `isStepReadOnly`, the three config readers, `createDefaultAssignment`, `isEqualJson`, `isRecord`, `StepContext`, `getMissingRequiredSettings`, `StepFieldError`, `isHexColour`, `StepTypeId`. They are the pure pieces Tasks 9-14 share; one function per file keeps each under the code-style rule.
- **No design copy for an available step type the editor has no form for** (a code-registered type other than `review`, `automation`, `ai`): it is listed, never addable, and shows the server's `unavailableReason` (null when available), so the picker card is disabled with no reason text. Task 17 renders a null reason as no text.
- **No design copy for a People step with no team in the summary line**: the summary is empty. Same for an Automation step before an automation is chosen.
- **No client check for an Automation step with no automation chosen** (`automationId` ""): the design lists no client message for it (QBZ-12 has none), so the server's `Step "<title>" needs an automation.` comes back with field `config.automationId` and lands on the card strip (R276).
- **Stale-automation warning shows the automation id** as the name: the definition is gone, so no name exists (the design example shows a name only because its sample data has one).
- Size: large (about 25 small files and eleven test files, all pure); it is one gate because every file is a pure function of the plain types and the tests are quick.
