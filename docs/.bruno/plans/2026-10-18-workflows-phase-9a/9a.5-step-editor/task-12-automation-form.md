### Task 12: Automation step form

R269, R270, R271, R274, R276; D14, D35, D37, D66; QBZ-13, QBZ-14, QBZ-40 (secret clauses dropped, D67 superseded); Q43; design README 4 (Automation General), `research-spec.md` 4.1-4.3; Review Focus 3, 4. This task adds what an Automation step needs on top of Task 11: the form builder (the common fields, the automation radio cards, the settings generated from the definition's JSON schema by the `app-admin` adapter), the data and patch functions, the pure helpers the drawer presenter composes (the cards list, the warnings, the switch confirmation, the empty text), the `AutomationCardsRenderer` and the switch confirmation dialog. The presenter that owns the switch state is Task 14.

- **Form shape (R270, R274):** `buildAutomationStepForm({ definition })` returns a `FormModelFactory.Config` with `title`, `color`, `description`, `automationId`, `settings` (only when the definition has a settings schema, otherwise no settings field, a null schema means no settings form) and `notifications`, in that order. The Automation config is exactly `{ automationId, settings }`: `getAutomationStepPatch` writes `automationId` from the form and `settings` through `formDataToJsonSchemaValue(schema, data)`; a definition with no schema keeps the stored `settings` of the same automation (default `{}`), and a step switched to another automation starts with `{}`.
- **Settings (R271):** `registry.object()` labelled `Settings` with the sub line `Fields defined by {automation}.`, its children from `buildFieldsFromJsonSchema(schema, registry, { uiRenderers: { team: STEP_FORM_RENDERER.teams } })` (a `user` hint has no 9a picker and falls back to plain text; Task 3 owns that). The adapter already marks every required property without a default with the design's `{Label} is required.` (Label is the property's `title`, else its key, Task 3), so the builder adds only live validation after each edit of a top-level setting (QBZ-13); the form test proves the message against the real adapter. No secret fields exist (D67).
- **Cards (R274):** `getAutomationCards` lists the definitions covering the workflow's model (`matchesAutomationScope`, Task 8) with their name and the settings schema's top-level `description` when there is one (definitions have no description field), plus the stored definition even when it does not cover the model, so the field never points at a card that is not shown. The cards are admin-ui `RadioGroup` items; a click calls `automations.select(id)` (the presenter decides between switching at once and asking), never `field.onChange`.
- **Empty, loading, failed:** no cards: `No automations are available for this model.` (CMS) or `No automations are available for pages.` (a `wb.` namespace); while loading only the label shows; a failed list shows the danger alert `Could not load the step options.` with `Try again`.
- **Warnings (R274, QBZ-13):** `The automation “{id}” no longer exists.` when the stored `automationId` is not listed (the stored id is all the step knows, so it stands in for the name); `Saved settings no longer validate: {error}` (the first issue's message) only when the stored settings are non-empty, fail `createJsonSchemaValidator(schema)` and the admin has not changed them in this session (`settingsPristine`). Both render as warning alerts under the cards.
- **Switch (QBZ-14):** with settings entered the drawer asks `Switch to “{automation}”?` / `The settings for {current} are cleared. The change applies when you save the workflow.` with `Cancel` / `Switch automation` (the `, including the saved signing secret` clause is dropped, no secrets); without settings it switches at once. `buildSwitchConfirmation` builds the texts, `SwitchAutomationDialog` shows them; the drawer owns the state (Task 14), so this dialog is not part of Task 18's `vm.dialog`.

**Files:**
- Create: `packages/app-workflows/src/editor/presentation/stepForm/automationFormMessages.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/getSchemaDescription.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/hasTeamSetting.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/getAutomationCards.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/getAutomationEmptyText.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/buildSwitchConfirmation.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/buildAutomationStepForm.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/getAutomationFormData.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/getAutomationStepPatch.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/renderers/AutomationCardsRenderer.tsx`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/components/SwitchAutomationDialog.tsx`
- Modify: `packages/app-workflows/src/editor/WorkflowEditorConfig.tsx`
- Modify: `packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/automationFormPure.test.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/buildAutomationStepForm.test.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/renderers/AutomationCardsRenderer.test.tsx`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/components/SwitchAutomationDialog.test.tsx`

**Interfaces:**
- Consumes: Task 11 (`StepFormOptions`, `StepFormAutomationOption`, `STEP_FORM_RENDERER`, `STEP_FORM_MESSAGES`, `buildCommonFields`, `getCommonFormData`, `getCommonStepPatch`, `validateAfterChange`, `createStepFormOptions`, `createTestFormModelFactory`, `renderStepFormField`, `useStepFormOptions`, `AutomationFormValues`), Task 3 (`JsonSchema`, `JsonSchemaFieldOptions`, `buildFieldsFromJsonSchema`, `jsonSchemaValueToFormData`, `formDataToJsonSchemaValue`, `createJsonSchemaValidator`, all from `@webiny/app-admin`), Task 5 (`AutomationDefinition { id; name; models: string[]; settingsSchema: JsonSchema | null }`, `EditorStep` from `~/editor/domain/types.js`, `createAutomationDefinition` from `~/editor/testing/editorFixtures.js`), Task 9 (`getTeamSettingKeys` from `~/editor/model/getTeamSettingKeys.js`), Task 8 (`getAutomationWarnings` and `AutomationWarnings { warning; settingsWarning }` from `~/editor/model/getAutomationWarnings.js` and `isNonEmptySettings` from `~/editor/model/isNonEmptySettings.js`, both used by Task 14's drawer presenter and tested in Task 8; `matchesAutomationScope(automationModels: string[], workflowModels: string[]) from `~/editor/model/matchesAutomationScope.js`, `isRecord` from `~/editor/model/isRecord.js`, `readAutomationConfig` from `~/editor/model/readAutomationConfig.js`, `EditorStepPatch` from `~/editor/model/EditorStepPatch.js`, `createWebhookAutomation` and `createAutomationStep` from `~/editor/testing/draftFixtures.js`). Existing (verified): admin-ui `RadioGroup`, `Dialog` (`CancelAction`, `ConfirmAction`), `Alert`, `Text`, `FormComponentLabel`, `FormComponentErrorMessage`; `renderWithAdminUi`.
- Produces: `AUTOMATION_FORM_MESSAGES`, `getSchemaDescription`, `hasTeamSetting`, `getAutomationCards`, `getAutomationEmptyText`, `buildSwitchConfirmation` (`SwitchAutomationConfirmationVm { title; body; cancelLabel; confirmLabel }`), `buildAutomationStepForm`, `getAutomationFormData`, `getAutomationStepPatch`, `AutomationCardsRenderer`, `SwitchAutomationDialog`.

**Test runner note:** admin package, `yarn test <path>` only. The adapter functions are the real ones from `@webiny/app-admin` (Task 3), so the form tests prove the two packages fit together; a schema with a `team` hint is not used here (Task 3 tests every hint).

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/presentation/stepForm/automationFormPure.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { JsonSchema } from "@webiny/app-admin";
import { createAutomationDefinition } from "~/editor/testing/editorFixtures.js";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { getAutomationCards } from "./getAutomationCards.js";
import { getAutomationEmptyText } from "./getAutomationEmptyText.js";
import { buildSwitchConfirmation } from "./buildSwitchConfirmation.js";
import { hasTeamSetting } from "./hasTeamSetting.js";
import { getSchemaDescription } from "./getSchemaDescription.js";

const WEBHOOK = createWebhookAutomation();
const SLACK = createAutomationDefinition({
    id: "post-to-slack",
    name: "Post to Slack",
    models: ["cms.*"],
    settingsSchema: null
});
const PAGES_ONLY = createAutomationDefinition({
    id: "translate-page",
    name: "Translate page",
    models: ["wb.page"],
    settingsSchema: null
});

describe("getSchemaDescription (R274)", () => {
    it("reads the top-level description", () => {
        expect(getSchemaDescription(WEBHOOK.settingsSchema)).toBe(
            "Sends the review and content to a URL when this step is reached."
        );
    });

    it("is null for no schema, no description or a blank one", () => {
        expect(getSchemaDescription(null)).toBeNull();
        expect(getSchemaDescription({ type: "object" })).toBeNull();
        expect(getSchemaDescription({ type: "object", description: "" })).toBeNull();
    });
});

describe("hasTeamSetting (R271, R284)", () => {
    it("is true when a top-level setting carries the team ui hint", () => {
        const schema: JsonSchema = {
            type: "object",
            properties: { owner: { type: "string", ui: "team" }, url: { type: "string" } }
        };

        expect(hasTeamSetting(schema)).toBe(true);
    });

    it("is false for a schema without it, no schema or an odd schema", () => {
        expect(hasTeamSetting(createWebhookAutomation().settingsSchema)).toBe(false);
        expect(hasTeamSetting(null)).toBe(false);
        expect(hasTeamSetting({ type: "string" })).toBe(false);
    });
});

describe("getAutomationCards (D35, R274)", () => {
    it("lists the definitions covering the model, with the schema description", () => {
        const cards = getAutomationCards({
            definitions: [WEBHOOK, SLACK, PAGES_ONLY],
            namespace: "cms.article",
            selectedId: null
        });

        expect(cards).toEqual([
            {
                id: "send-webhook",
                name: "Send webhook",
                description: "Sends the review and content to a URL when this step is reached."
            },
            { id: "post-to-slack", name: "Post to Slack", description: null }
        ]);
    });

    it("also lists the stored definition when it does not cover the model", () => {
        const cards = getAutomationCards({
            definitions: [WEBHOOK, PAGES_ONLY],
            namespace: "cms.article",
            selectedId: "translate-page"
        });

        expect(cards.map(card => card.id)).toEqual(["send-webhook", "translate-page"]);
    });

    it("is empty when nothing covers the model", () => {
        expect(
            getAutomationCards({ definitions: [PAGES_ONLY], namespace: "cms.article", selectedId: null })
        ).toEqual([]);
    });
});

describe("a null namespace (R284)", () => {
    it("covers nothing, except the stored definition, and words the empty text for the model", () => {
        const cards = getAutomationCards({
            definitions: [WEBHOOK, SLACK],
            namespace: null,
            selectedId: "post-to-slack"
        });

        expect(cards.map(card => card.id)).toEqual(["post-to-slack"]);
        expect(getAutomationEmptyText(null)).toBe("No automations are available for this model.");
    });
});

describe("getAutomationEmptyText (R269)", () => {
    it("names the model in the CMS and pages in the Website Builder", () => {
        expect(getAutomationEmptyText("cms.article")).toBe(
            "No automations are available for this model."
        );
        expect(getAutomationEmptyText("wb.page")).toBe("No automations are available for pages.");
    });
});

describe("buildSwitchConfirmation (QBZ-14)", () => {
    it("builds the design texts", () => {
        expect(buildSwitchConfirmation({ nextName: "Post to Slack", currentName: "Send webhook" })).toEqual({
            title: "Switch to “Post to Slack”?",
            body: "The settings for Send webhook are cleared. The change applies when you save the workflow.",
            cancelLabel: "Cancel",
            confirmLabel: "Switch automation"
        });
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/buildAutomationStepForm.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createAutomationDefinition } from "~/editor/testing/editorFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createTestFormModelFactory } from "~/editor/testing/createTestFormModelFactory.js";
import { buildAutomationStepForm } from "./buildAutomationStepForm.js";
import { getAutomationFormData } from "./getAutomationFormData.js";
import { getAutomationStepPatch } from "./getAutomationStepPatch.js";
import { STEP_FORM_RENDERER } from "./stepFormRendererNames.js";

const WEBHOOK = createWebhookAutomation();

const createForm = (definition = WEBHOOK) => {
    return createTestFormModelFactory().create(buildAutomationStepForm({ definition }));
};

// Task 8's automation step with the title and Notify via the common-field assertions below expect.
const automationStep = (settings: unknown = { url: "https://x.test", timeout: 30 }) => {
    return createAutomationStep({
        id: "step-1",
        title: "Legal sign-off",
        notificationIds: ["e-mail"],
        config: { automationId: "send-webhook", settings }
    });
};

describe("buildAutomationStepForm (R270, R274)", () => {
    it("has the common fields, the automation cards, the settings and Notify via, in order", () => {
        const form = createForm();
        const names = form.vm.layout.flatMap(node => {
            return node.type === "row" ? node.fields.map(field => field.name) : [node.type];
        });

        expect(names).toEqual([
            "title",
            "color",
            "description",
            "automationId",
            "settings",
            "notifications"
        ]);
    });

    it("describes the automation field and the Automation description placeholder", () => {
        const form = createForm();

        expect(form.field("automationId").vm.label).toBe("Automation");
        expect(form.field("automationId").vm.renderer).toBe(STEP_FORM_RENDERER.automations);
        expect(form.field("description").vm.placeholder).toBe(
            "What this automation does. Shown to the requester and reviewers."
        );
    });

    it("generates the settings from the schema under a Settings heading with its sub line", () => {
        const form = createForm();
        const settings = form.field("settings").vm;
        const rendererSettings = settings.rendererSettings as {
            itemDescription: (data: Record<string, unknown>) => string;
        };

        expect(settings.label).toBe("Settings");
        expect(form.field("settings.url").vm.label).toBe("URL");
        expect(form.field("settings.timeout").vm.label).toBe("Timeout (seconds)");
        expect(rendererSettings.itemDescription({})).toBe("Fields defined by Send webhook.");
    });

    it("has no settings field for a definition with no settings schema, or no definition", () => {
        const slack = createAutomationDefinition({ id: "post-to-slack", settingsSchema: null });

        expect(() => createForm(slack).field("settings")).toThrow();
        expect(() => {
            createTestFormModelFactory()
                .create(buildAutomationStepForm({ definition: null }))
                .field("settings");
        }).toThrow();
    });

    it("requires a setting with the design message {Label} is required. (R276)", async () => {
        const form = createForm();
        const url = form.field("settings.url");

        expect(await url.validate({ force: true })).toBe(false);
        expect(url.vm.validation.message).toBe("URL is required.");

        url.setValue("https://x.test");

        expect(await url.validate({ force: true })).toBe(true);
    });

    it("validates a setting after each edit (QBZ-13)", async () => {
        const form = createForm();

        form.field("settings.url").vm.onChange("https://x.test");
        form.field("settings.url").vm.onChange("");

        await vi.waitFor(() => {
            expect(form.field("settings.url").vm.validation.message).toBe("URL is required.");
        });
    });

    it("loads a step with its settings without becoming dirty", () => {
        const form = createForm();

        form.setData(getAutomationFormData(automationStep(), WEBHOOK), { dirty: false });

        expect(form.isDirty).toBe(false);
        expect(form.getData().automationId).toBe("send-webhook");
        expect(form.field("settings.url").getValue()).toBe("https://x.test");
    });
});

describe("getAutomationFormData", () => {
    it("reads the stored automation id and turns the settings into form data", () => {
        const data = getAutomationFormData(automationStep(), WEBHOOK);

        expect(data.automationId).toBe("send-webhook");
        expect(data.settings).not.toBeNull();
        expect(data.title).toBe("Legal sign-off");
    });

    it("has no settings form data when there is no schema", () => {
        const slack = createAutomationDefinition({ settingsSchema: null });

        expect(getAutomationFormData(automationStep(), slack).settings).toBeNull();
        expect(getAutomationFormData(automationStep(), null).settings).toBeNull();
    });

    it("reads a step with no automation as null", () => {
        const step = createReviewStep({ type: "automation", config: {} });

        expect(getAutomationFormData(step, null).automationId).toBeNull();
    });
});

describe("getAutomationStepPatch (R270, Review Focus 3)", () => {
    it("writes exactly the Automation config keys: automationId and settings", () => {
        const step = automationStep();
        const values = getAutomationFormData(step, WEBHOOK);

        const patch = getAutomationStepPatch(step, values, WEBHOOK);

        expect(patch.config).toEqual({
            automationId: "send-webhook",
            settings: { url: "https://x.test", timeout: 30 }
        });
    });

    it("round-trips the stored settings through the form data", () => {
        const step = automationStep({ url: "https://x.test", timeout: 30 });
        const values = getAutomationFormData(step, WEBHOOK);

        const patch = getAutomationStepPatch(step, values, WEBHOOK);

        expect(patch.config).toEqual({
            automationId: "send-webhook",
            settings: { url: "https://x.test", timeout: 30 }
        });
    });

    it("writes the edited settings", () => {
        const step = automationStep({ url: "https://x.test" });
        const values = getAutomationFormData(step, WEBHOOK);
        const settings = { ...values.settings, url: "https://y.test" };

        const patch = getAutomationStepPatch(step, { ...values, settings }, WEBHOOK);

        expect(patch.config).toEqual({
            automationId: "send-webhook",
            settings: { url: "https://y.test" }
        });
    });

    it("keeps the stored settings of the same automation when the definition has no settings schema", () => {
        const slack = createAutomationDefinition({ id: "post-to-slack", settingsSchema: null });
        const step = createReviewStep({
            type: "automation",
            config: { automationId: "post-to-slack", settings: { anything: "kept" } }
        });

        const patch = getAutomationStepPatch(step, getAutomationFormData(step, slack), slack);

        expect(patch.config).toEqual({
            automationId: "post-to-slack",
            settings: { anything: "kept" }
        });
    });

    it("starts a switched step with empty settings (QBZ-14)", () => {
        const slack = createAutomationDefinition({ id: "post-to-slack", settingsSchema: null });
        const step = automationStep({ url: "https://x.test" });

        const patch = getAutomationStepPatch(
            step,
            { ...getAutomationFormData(step, slack), automationId: "post-to-slack" },
            slack
        );

        expect(patch.config).toEqual({ automationId: "post-to-slack", settings: {} });
    });

    it("writes an empty id for a step with no automation, and empty settings when none are stored", () => {
        const step = createReviewStep({ type: "automation", config: {} });

        const patch = getAutomationStepPatch(step, getAutomationFormData(step, null), null);

        expect(patch.config).toEqual({ automationId: "", settings: {} });
    });

    it("includes the common fields", () => {
        const step = automationStep();

        const patch = getAutomationStepPatch(step, getAutomationFormData(step, WEBHOOK), WEBHOOK);

        expect(patch.title).toBe("Legal sign-off");
        expect(patch.notificationIds).toEqual(["e-mail"]);
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/AutomationCardsRenderer.test.tsx`:

```tsx
import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createStepFormOptions } from "~/editor/testing/createStepFormOptions.js";
import { createTestFormModelFactory } from "~/editor/testing/createTestFormModelFactory.js";
import { renderStepFormField } from "~/editor/testing/renderStepFormField.js";
import type { StepFormAutomationsOptions } from "../StepFormOptions.js";
import { buildAutomationStepForm } from "../buildAutomationStepForm.js";
import { AutomationCardsRenderer } from "./AutomationCardsRenderer.js";


const automations = (
    overrides: Partial<StepFormAutomationsOptions> = {}
): StepFormAutomationsOptions => {
    return {
        loading: false,
        failed: false,
        retry: vi.fn(),
        options: [
            { id: "send-webhook", name: "Send webhook", description: "Sends the review to a URL." },
            { id: "post-to-slack", name: "Post to Slack", description: null }
        ],
        emptyText: "No automations are available for this model.",
        warning: null,
        settingsWarning: null,
        select: vi.fn(),
        ...overrides
    };
};

const renderCards = (automationId: string | null, options: StepFormAutomationsOptions) => {
    const form = createTestFormModelFactory().create(
        buildAutomationStepForm({ definition: createWebhookAutomation() })
    );
    form.setData({ automationId }, { dirty: false });
    renderStepFormField({
        form,
        name: "automationId",
        Renderer: AutomationCardsRenderer,
        options: createStepFormOptions({ automations: options })
    });
    return form;
};

describe("AutomationCardsRenderer (R274)", () => {
    afterEach(() => {
        cleanup();
    });

    it("lists the automations as radio cards with name and description, the stored one selected", () => {
        renderCards("send-webhook", automations());

        const webhook = screen.getByRole("radio", { name: /Send webhook/ });
        const slack = screen.getByRole("radio", { name: /Post to Slack/ });
        expect(webhook.getAttribute("aria-checked")).toBe("true");
        expect(slack.getAttribute("aria-checked")).toBe("false");
        expect(screen.getByText("Sends the review to a URL.")).toBeDefined();
        expect(screen.getByText("Automation")).toBeDefined();
    });

    it("asks the options to select instead of changing the field (the presenter decides, QBZ-14)", () => {
        const select = vi.fn();
        const form = renderCards("send-webhook", automations({ select }));

        fireEvent.click(screen.getByRole("radio", { name: /Post to Slack/ }));

        expect(select).toHaveBeenCalledWith("post-to-slack");
        expect(form.field("automationId").getValue()).toBe("send-webhook");
    });

    it("shows the reason when no automation covers the model", () => {
        renderCards(null, automations({ options: [] }));

        expect(screen.queryAllByRole("radio")).toHaveLength(0);
        expect(screen.getByText("No automations are available for this model.")).toBeDefined();
    });

    it("shows the missing-automation and stale-settings warnings", () => {
        renderCards(
            "gone",
            automations({
                warning: "The automation “gone” no longer exists.",
                settingsWarning: "Saved settings no longer validate: URL is required."
            })
        );

        expect(screen.getByText("The automation “gone” no longer exists.")).toBeDefined();
        expect(
            screen.getByText("Saved settings no longer validate: URL is required.")
        ).toBeDefined();
    });

    it("shows only the label while the list loads", () => {
        renderCards(null, automations({ options: [], loading: true }));

        expect(screen.getByText("Automation")).toBeDefined();
        expect(screen.queryByText("No automations are available for this model.")).toBeNull();
    });

    it("shows the options failure with Try again", () => {
        const retry = vi.fn();
        renderCards(null, automations({ options: [], failed: true, retry }));

        expect(screen.getByText("Could not load the step options.")).toBeDefined();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(retry).toHaveBeenCalledTimes(1);
    });

    it("shows a server error on the automation field", () => {
        const form = createTestFormModelFactory().create(
            buildAutomationStepForm({ definition: createWebhookAutomation() })
        );
        form.field("automationId").setValidation({
            isValid: false,
            message: "The automation is not available for this model."
        });
        renderStepFormField({
            form,
            name: "automationId",
            Renderer: AutomationCardsRenderer,
            options: createStepFormOptions({ automations: automations() })
        });

        expect(screen.getByText("The automation is not available for this model.")).toBeDefined();
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/components/SwitchAutomationDialog.test.tsx`:

```tsx
import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { SwitchAutomationDialog } from "./SwitchAutomationDialog.js";


const confirmation = {
    title: "Switch to “Post to Slack”?",
    body: "The settings for Send webhook are cleared. The change applies when you save the workflow.",
    cancelLabel: "Cancel",
    confirmLabel: "Switch automation"
};

describe("SwitchAutomationDialog (QBZ-14)", () => {
    afterEach(() => {
        cleanup();
    });

    it("shows the title, the body and the two buttons", () => {
        renderWithAdminUi(
            <SwitchAutomationDialog confirmation={confirmation} onConfirm={vi.fn()} onCancel={vi.fn()} />
        );

        expect(screen.getByText("Switch to “Post to Slack”?")).toBeDefined();
        expect(
            screen.getByText(
                "The settings for Send webhook are cleared. The change applies when you save the workflow."
            )
        ).toBeDefined();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeDefined();
        expect(screen.getByRole("button", { name: "Switch automation" })).toBeDefined();
    });

    it("confirms with Switch automation", () => {
        const onConfirm = vi.fn();
        const onCancel = vi.fn();
        renderWithAdminUi(
            <SwitchAutomationDialog confirmation={confirmation} onConfirm={onConfirm} onCancel={onCancel} />
        );

        fireEvent.click(screen.getByRole("button", { name: "Switch automation" }));

        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onCancel).not.toHaveBeenCalled();
    });

    it("cancels with Cancel", () => {
        const onConfirm = vi.fn();
        const onCancel = vi.fn();
        renderWithAdminUi(
            <SwitchAutomationDialog confirmation={confirmation} onConfirm={onConfirm} onCancel={onCancel} />
        );

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
    });
});
```

Modify `packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx`: in the `registers ...` case replace

```tsx
    it("registers the step colour, teams picker and transport renderers", () => {
```

with

```tsx
    it("registers the step colour, teams picker, transport and automation renderers", () => {
```

and replace

```tsx
        expect(names).toEqual(["workflowStepColour", "workflowTeamsPicker", "workflowTransports"]);
```

with

```tsx
        expect(names).toEqual([
            "workflowStepColour",
            "workflowTeamsPicker",
            "workflowTransports",
            "workflowAutomationCards"
        ]);
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn build -p @webiny/app-admin 2>&1 | tail -10
yarn test packages/app-workflows/src/editor/presentation/stepForm/automationFormPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/buildAutomationStepForm.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/AutomationCardsRenderer.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/components/SwitchAutomationDialog.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx 2>&1 | tail -30
```

`app-workflows` tests resolve `@webiny/app-admin` from its `dist`, so Task 3's exports need that build first. Expected: the first four fail with `Failed to resolve import` for the module under test (`getAutomationCards.js`, `buildAutomationStepForm.js`, `AutomationCardsRenderer.js`, `SwitchAutomationDialog.js`); `WorkflowEditorConfig.test.tsx` fails because `workflowAutomationCards` is not registered (the names list has three entries). Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/presentation/stepForm/automationFormMessages.ts`:

```ts
// Copy of the Automation step form (research-spec.md 4.1-4.3, R269, R274).
export const AUTOMATION_FORM_MESSAGES = {
    descriptionPlaceholder: "What this automation does. Shown to the requester and reviewers.",
    noAutomationsForModel: "No automations are available for this model.",
    noAutomationsForPages: "No automations are available for pages.",
    switchCancel: "Cancel",
    switchConfirm: "Switch automation"
} as const;
```

Create `packages/app-workflows/src/editor/presentation/stepForm/getSchemaDescription.ts`:

```ts
import type { JsonSchema } from "@webiny/app-admin";
import { isRecord } from "~/editor/model/isRecord.js";

// The settings schema's top-level `description` (definitions have no description field, R274), or null.
export const getSchemaDescription = (schema: JsonSchema | null): string | null => {
    const record: unknown = schema;
    if (!isRecord(record)) {
        return null;
    }
    const description = record.description;
    if (typeof description === "string" && description !== "") {
        return description;
    }
    return null;
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/hasTeamSetting.ts`:

```ts
import type { JsonSchema } from "@webiny/app-admin";
import { getTeamSettingKeys } from "~/editor/model/getTeamSettingKeys.js";

/*
 * True when a top-level setting of the schema carries the `team` ui hint: the drawer then asks
 * for the first team results, so the setting's picker has options (R284). The key list is Task 9's
 * `getTeamSettingKeys`, which also feeds the editor's team-name lookup.
 */
export const hasTeamSetting = (schema: JsonSchema | null): boolean => {
    return getTeamSettingKeys(schema).length > 0;
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/getAutomationCards.ts`:

```ts
import type { AutomationDefinition } from "~/editor/domain/types.js";
import { matchesAutomationScope } from "~/editor/model/matchesAutomationScope.js";
import type { StepFormAutomationOption } from "./StepFormOptions.js";
import { getSchemaDescription } from "./getSchemaDescription.js";

export interface AutomationCardsParams {
    definitions: AutomationDefinition[];
    // The workflow's model, e.g. `cms.article` or `wb.page`; null when no model is open (R284): nothing covers it.
    namespace: string | null;
    selectedId: string | null;
}

/*
 * The cards of the automation field (D35, R274): the definitions covering the workflow's model,
 * plus the stored one even when it does not cover it, so the field never points at a hidden card.
 */
export const getAutomationCards = (params: AutomationCardsParams): StepFormAutomationOption[] => {
    const { definitions, namespace, selectedId } = params;
    const cards: StepFormAutomationOption[] = [];

    for (const definition of definitions) {
        const covers = namespace !== null && matchesAutomationScope(definition.models, [namespace]);
        if (!covers && definition.id !== selectedId) {
            continue;
        }
        cards.push({
            id: definition.id,
            name: definition.name,
            description: getSchemaDescription(definition.settingsSchema)
        });
    }

    return cards;
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/getAutomationEmptyText.ts`:

```ts
import { AUTOMATION_FORM_MESSAGES } from "./automationFormMessages.js";

// The reason shown when no automation covers the model (R269, QBZ-44): pages in the Website Builder.
export const getAutomationEmptyText = (namespace: string | null): string => {
    if (namespace !== null && namespace.startsWith("wb.")) {
        return AUTOMATION_FORM_MESSAGES.noAutomationsForPages;
    }
    return AUTOMATION_FORM_MESSAGES.noAutomationsForModel;
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/buildSwitchConfirmation.ts`:

```ts
import { AUTOMATION_FORM_MESSAGES } from "./automationFormMessages.js";

export interface SwitchAutomationConfirmationVm {
    title: string;
    body: string;
    cancelLabel: string;
    confirmLabel: string;
}

export interface SwitchConfirmationParams {
    nextName: string;
    currentName: string;
}

// The texts of "Switch to “{automation}”?" (QBZ-14); the signing-secret clause is dropped (D67).
export const buildSwitchConfirmation = (
    params: SwitchConfirmationParams
): SwitchAutomationConfirmationVm => {
    return {
        title: `Switch to “${params.nextName}”?`,
        body: `The settings for ${params.currentName} are cleared. The change applies when you save the workflow.`,
        cancelLabel: AUTOMATION_FORM_MESSAGES.switchCancel,
        confirmLabel: AUTOMATION_FORM_MESSAGES.switchConfirm
    };
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/buildAutomationStepForm.ts`:

```ts
import { buildFieldsFromJsonSchema } from "@webiny/app-admin";
import type { FormModelFactory } from "@webiny/app-admin";
import type { JsonSchema } from "@webiny/app-admin";
import type { JsonSchemaFieldOptions } from "@webiny/app-admin";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import { AUTOMATION_FORM_MESSAGES } from "./automationFormMessages.js";
import { buildCommonFields } from "./buildCommonFields.js";
import { STEP_FORM_RENDERER } from "./stepFormRendererNames.js";
import { validateAfterChange } from "./validateAfterChange.js";

// The `team` hint of a setting renders as the teams picker; a `user` hint falls back to text in 9a (R271).
const SETTINGS_OPTIONS: JsonSchemaFieldOptions = {
    uiRenderers: { team: STEP_FORM_RENDERER.teams }
};

function buildSettingsField(
    registry: FormModelFactory.FieldBuilderRegistry,
    automationName: string,
    schema: JsonSchema
): FormModelFactory.FieldBuilder {
    return registry
        .object()
        .label("Settings")
        .renderer("objectAccordionSingle", {
            open: true,
            itemDescription: () => `Fields defined by ${automationName}.`
        })
        .fields(nested => {
            const builders = buildFieldsFromJsonSchema(schema, nested, SETTINGS_OPTIONS);
            for (const [key, builder] of Object.entries(builders)) {
                builder.afterChange(validateAfterChange(`settings.${key}`));
            }
            return builders;
        });
}

export interface AutomationStepFormParams {
    // The chosen definition; null for a step with no (or an unlisted) automation: no settings field.
    definition: AutomationDefinition | null;
}

/*
 * The Automation step form (R270, R274): the common fields, the automation cards, the settings
 * generated from the definition's JSON schema, and Notify via. One body, no tabs.
 */
export const buildAutomationStepForm = (
    params: AutomationStepFormParams
): FormModelFactory.Config => {
    const { definition } = params;

    return {
        fields: registry => {
            const common = buildCommonFields({
                registry,
                descriptionPlaceholder: AUTOMATION_FORM_MESSAGES.descriptionPlaceholder,
                readOnly: false
            });

            const automationId = registry
                .text()
                .label("Automation")
                .renderer(STEP_FORM_RENDERER.automations)
                .afterChange(validateAfterChange("automationId"));

            const fields: Record<string, FormModelFactory.FieldBuilder> = {
                title: common.title,
                color: common.color,
                description: common.description,
                automationId
            };

            if (definition !== null && definition.settingsSchema !== null) {
                fields.settings = buildSettingsField(
                    registry,
                    definition.name,
                    definition.settingsSchema
                );
            }

            fields.notifications = common.notifications;

            return fields;
        }
    };
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/getAutomationFormData.ts`:

```ts
import { jsonSchemaValueToFormData } from "@webiny/app-admin";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStep } from "~/editor/domain/types.js";
import { readAutomationConfig } from "~/editor/model/readAutomationConfig.js";
import type { AutomationFormValues } from "./StepFormData.js";
import { getCommonFormData } from "./getCommonFormData.js";

/*
 * The Automation step as form values: the common fields, the stored automation id (null for none)
 * and the settings converted to form data by the adapter (R271). A definition with no schema has
 * no settings form.
 */
export const getAutomationFormData = (
    step: EditorStep,
    definition: AutomationDefinition | null
): AutomationFormValues => {
    const config = readAutomationConfig(step.config);
    const common = getCommonFormData(step);

    let automationId: string | null = null;
    if (config.automationId !== "") {
        automationId = config.automationId;
    }

    let settings: Record<string, unknown> | null = null;
    if (definition !== null && definition.settingsSchema !== null) {
        settings = jsonSchemaValueToFormData(definition.settingsSchema, config.settings);
    }

    return { ...common, automationId, settings };
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/getAutomationStepPatch.ts`:

```ts
import { formDataToJsonSchemaValue } from "@webiny/app-admin";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorStepPatch } from "~/editor/model/EditorStepPatch.js";
import { readAutomationConfig } from "~/editor/model/readAutomationConfig.js";
import type { AutomationFormValues } from "./StepFormData.js";
import { getCommonStepPatch } from "./getCommonStepPatch.js";

/*
 * What Done writes for an Automation step: the common fields and the config
 * `{ automationId, settings }` (R270, Review Focus 3). Settings go back through the adapter; a
 * definition with no schema keeps the stored settings of the same automation.
 */
export const getAutomationStepPatch = (
    step: EditorStep,
    values: AutomationFormValues,
    definition: AutomationDefinition | null
): EditorStepPatch => {
    const stored = readAutomationConfig(step.config);
    const common = getCommonStepPatch(step, values);

    // The stored settings belong to the stored automation only; a switched step starts empty (QBZ-14).
    let settings: unknown = {};
    if (values.automationId === stored.automationId) {
        settings = stored.settings;
    }
    if (definition !== null && definition.settingsSchema !== null && values.settings !== null) {
        settings = formDataToJsonSchemaValue(definition.settingsSchema, values.settings);
    }

    return { ...common, config: { automationId: values.automationId ?? "", settings } };
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/AutomationCardsRenderer.tsx`:

```tsx
import React from "react";
import { Alert } from "@webiny/admin-ui";
import { FormComponentErrorMessage } from "@webiny/admin-ui";
import { FormComponentLabel } from "@webiny/admin-ui";
import { RadioGroup } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { STEP_FORM_MESSAGES } from "../stepFormMessages.js";
import { useStepFormOptions } from "../useStepFormOptions.js";
import "../stepFormRendererNames.js";

/*
 * The automation as radio cards (R274, D14): name and description per definition. A click asks the
 * options to select, the drawer presenter decides between switching at once and confirming (QBZ-14).
 */
export const AutomationCardsRenderer = createFieldRenderer<"workflowAutomationCards">(({ field }) => {
    const { automations } = useStepFormOptions();
    const invalid = field.validation.isValid === false;
    const value = typeof field.value === "string" ? field.value : undefined;

    const label = (
        <FormComponentLabel
            text={field.label}
            required
            disabled={field.disabled}
            invalid={invalid}
        />
    );

    if (automations.failed) {
        return (
            <div className={"w-full"}>
                {label}
                <Alert
                    type={"danger"}
                    variant={"subtle"}
                    actions={
                        <Alert.Action text={STEP_FORM_MESSAGES.tryAgain} onClick={automations.retry} />
                    }
                >
                    {STEP_FORM_MESSAGES.optionsFailed}
                </Alert>
            </div>
        );
    }

    if (automations.loading) {
        return <div className={"w-full"}>{label}</div>;
    }

    const items = automations.options.map(option => {
        return {
            value: option.id,
            label: (
                <span className={"flex flex-col"}>
                    <span className={"font-semibold"}>{option.name}</span>
                    {option.description && <span className={"text-sm"}>{option.description}</span>}
                </span>
            )
        };
    });

    return (
        <div className={"flex w-full flex-col gap-sm"}>
            {label}
            {automations.options.length === 0 && <Text size={"sm"}>{automations.emptyText}</Text>}
            {automations.options.length > 0 && (
                <RadioGroup
                    items={items}
                    value={value}
                    disabled={field.disabled}
                    onChange={id => automations.select(id)}
                />
            )}
            <FormComponentErrorMessage
                text={field.validation.message}
                invalid={invalid}
                disabled={field.disabled}
            />
            {automations.warning && (
                <Alert type={"warning"} variant={"subtle"}>
                    {automations.warning}
                </Alert>
            )}
            {automations.settingsWarning && (
                <Alert type={"warning"} variant={"subtle"}>
                    {automations.settingsWarning}
                </Alert>
            )}
        </div>
    );
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/components/SwitchAutomationDialog.tsx`:

```tsx
import React from "react";
import { Dialog } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import type { SwitchAutomationConfirmationVm } from "../buildSwitchConfirmation.js";

export interface SwitchAutomationDialogProps {
    confirmation: SwitchAutomationConfirmationVm;
    onConfirm: () => void;
    onCancel: () => void;
}

// "Switch to “{automation}”?" (QBZ-14). The drawer presenter owns when it shows and what the buttons do.
export const SwitchAutomationDialog = createReactiveComponent(function SwitchAutomationDialog(
    props: SwitchAutomationDialogProps
) {
    const { confirmation, onConfirm, onCancel } = props;

    return (
        <Dialog
            open
            onOpenChange={open => {
                if (!open) {
                    onCancel();
                }
            }}
            title={confirmation.title}
            actions={
                <>
                    <Dialog.CancelAction text={confirmation.cancelLabel} />
                    <Dialog.ConfirmAction text={confirmation.confirmLabel} onClick={onConfirm} />
                </>
            }
        >
            <p>{confirmation.body}</p>
        </Dialog>
    );
});
```

Modify `packages/app-workflows/src/editor/WorkflowEditorConfig.tsx`. Add the import after the `TransportCheckboxesRenderer` import:

```tsx
import { AutomationCardsRenderer } from "~/editor/presentation/stepForm/renderers/AutomationCardsRenderer.js";
```

and the entry after the transports entry, before `</AdminConfig>`:

```tsx
            <AdminConfig.Form.FieldRenderer
                name={STEP_FORM_RENDERER.automations}
                component={AutomationCardsRenderer}
            />
```

- [ ] **Step 4: Run the tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm/automationFormPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/buildAutomationStepForm.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/AutomationCardsRenderer.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/components/SwitchAutomationDialog.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx 2>&1 | tail -20
```

Expected: all pass. The `buildAutomationStepForm` and round-trip cases run the real Task 3 adapter; if its form-data shape differs from the shape assumed in `getAutomationFormData` (a plain record keyed by property name), fix `getAutomationFormData` / `getAutomationStepPatch` here, not the adapter.

- [ ] **Step 5: Run the existing tests covering the changed code and type check**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm/buildCommonFields.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepForm/buildPeopleStepForm.test.ts 2>&1 | tail -20
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: Task 11's tests still pass; the build type-checks the new files.

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
git commit -m "feat(app-workflows): add the automation step form" -m "The Automation step form: automation radio cards over the definitions covering the model, settings generated from the JSON schema through the app-admin adapter with the design's required message, the data and patch functions, the card warnings, and the switch-automation confirmation." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. In the commit command, replace the literal `<CURRENT_SESSION_URL>` with the `https://claude.ai/code/session_...` URL of the session that runs the commit. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **Task 3 names and types are as its Produces entry says** (`jsonSchemaValueToFormData(schema, value): Record<string, unknown>`, `formDataToJsonSchemaValue(schema, data)`, `createJsonSchemaValidator(schema).validate(value)`, `JsonSchemaFieldOptions { uiRenderers }`), imported from the `@webiny/app-admin` root; build `app-admin` before this task (Task 3 says so). The round-trip and settings-field tests run the real adapter; if its form-data shape differs from a plain record keyed by property name, fix `getAutomationFormData` and `getAutomationStepPatch` here, not the adapter.
- **`{Label} is required.` comes from the adapter** (Task 3 marks each required property without a default with it); `buildAutomationStepForm` only adds live validation, and the form test runs against the real adapter.
- **`matchesAutomationScope(automationModels, workflowModels)`** takes the workflow's models as a list (Task 8); `getAutomationCards` passes `[namespace]`.
- **Switch confirmation is the drawer's own dialog**, not an entry of Task 18's `vm.dialog` union: Task 9 says the switch-automation confirmation of Task 12 is the drawer's. Task 14's drawer presenter holds `switchConfirmation` and `StepDrawer` renders `SwitchAutomationDialog`.
- **Name for a missing automation:** the stored `automationId` stands in for `{name}` in `The automation “{name}” no longer exists.` because a step stores only the id (Task 8's `getStepWarnings` does the same for the card).
- **`wb.` namespace test:** `getAutomationEmptyText` tells pages from models by the `wb.` prefix (the Website Builder row is `wb.page`); no other source of the app kind reaches the drawer. `getAutomationStepPatch` keeps the stored settings only for the stored automation id; a switched step writes `{}`.
- **Warning logic overlaps Task 8's `getStepWarnings`** on purpose: the card computes its lines from the baseline, the drawer from what is open in this session (`settingsPristine`).
- Size: large (ten small pure files, one form builder, one renderer, one dialog, four test files); one review gate.
