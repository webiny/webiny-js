### Task 13: AI step form

R270, R275, R276; D101, D109, D138, D139; Q43, Q44; QBZ-8, QBZ-12, QBZ-39, QBZ-46, QBZ-47, QBZ-89; design README 4 (AI), `research2-admin.md` 5 (every AI string below is copied from it); Review Focus 3. This task adds the AI step's form: the builder (the common fields plus Instructions, Model and Tools), the data and patch functions, the pure helpers the drawer presenter composes (the model options with the retired and failed states, whether the editor is available), the model picker renderer and the tools renderer. The licence read-only state is a `readOnly` flag of the builder; the presenter and the alert are Task 14.

- **Form shape (R270, R275):** `buildAiStepForm({ readOnly })` returns a `FormModelFactory.Config` with `title`, `color`, `description`, `instructions`, `model`, `tools`, `notifications`, in that order. The AI config is exactly `{ instructions, model, tools }` (`aiStepConfigSchema`): `getAiStepPatch` writes the instructions untouched (the server trims the model and de-duplicates the tools), `model` as the stored `<providerId>/<modelId>` string and `tools` including the names the form carries.
- **Instructions (copy from `research2-admin.md` 5):** a textarea, label `Instructions`, required (`Enter instructions for the AI.`), placeholder `Check tone of voice, flag any personal data…`, description `The AI reviews the revision against these instructions, then approves or rejects it and lists the issues it found.`.
- **Model (R275, QBZ-89):** label `Model`, description `Models available through AI Power-Ups.`, required (`Choose an AI model.`), the single `WorkflowPicker` over the models of `listAiModels` (placeholder `Search models`, options labelled with the model name and the provider name as the description; the picker draws the label, description and required marker, Task 4). A new step starts with no model, there is no default. Search is client-side over the loaded list (the query has no `search`). Four states: a stored model that is not in the loaded list is **retired** (QBZ-8): the picker shows it as `{name} (no longer offered)` with the warning `The AI model “{name}” is no longer offered. Choose another model; until then this step fails when reached.`, not a save blocker (the stored model id stands for the name, the step stores nothing else); a **failed** list (QBZ-89) disables the picker and shows a destructive row `Could not load AI models.` with a ghost `Retry` button, the stored model still shown; an **empty** list disables the picker and shows `No AI models are available. Check the AI Power-Ups configuration.`; **no model chosen** shows `Choose an AI model.` under the field when validated and blocks save.
- **Tools (R275):** label `Tools`, checkboxes over `listAiTools` (title, with the description under it). Names stored on the step that are not listed are kept on every change and never shown (like transports). Each row is the title, the tag `Changes content` (admin-ui `Tag` with the `edit_note` icon) when the tool has `changesContent` (R283; the prototype's `edit_document` icon does not exist in `@webiny/icons`), and the description line. The design's hint `Tools marked “Changes content” can edit the revision while it is in review. The editor reloads and tells the author when that happens.` shows under the list whenever the list shows (not in the loading, failed or empty states). A server error on `config.tools` shows under the list (the field's validation message, drawn after the list). A failed list shows `Could not load the step options.` with `Try again` (R281, which names AI tools).
- **Available or read-only (R275, QBZ-47):** the editor exists only when the `ai` row of `listStepTypes` is `available` and has a `configSchema` (`isAiEditable` of Task 8), which also means `listAiModels` exists; otherwise an existing AI step is read-only (`readOnly: true` disables every field) with the drawer alert `AI Power-Ups licence missing` / `This step is read-only. Reviews that reach it fail; they can be restarted once the licence is back.` (the alert is shown by Task 14; the texts are `AI_FORM_MESSAGES`). Move and delete stay enabled (Task 16).

**Files:**
- Create: `packages/app-workflows/src/editor/presentation/stepForm/aiFormMessages.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/getAiModelOptions.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/buildAiStepForm.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/getAiFormData.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/getAiStepPatch.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/renderers/AiModelPickerRenderer.tsx`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/renderers/AiToolsRenderer.tsx`
- Modify: `packages/app-workflows/src/editor/WorkflowEditorConfig.tsx`
- Modify: `packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/aiFormPure.test.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/buildAiStepForm.test.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/renderers/AiModelPickerRenderer.test.tsx`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/renderers/AiToolsRenderer.test.tsx`

**Interfaces:**
- Consumes: Task 11 (`StepFormOptions`, `STEP_FORM_RENDERER`, `STEP_FORM_MESSAGES`, `buildCommonFields`, `getCommonFormData`, `getCommonStepPatch`, `validateAfterChange`, `AiFormValues`, `createStepFormOptions`, `createTestFormModelFactory`, `renderStepFormField`, `useStepFormOptions`), Task 4 (`PickerOption`, `WorkflowPicker` with `label`, `description`, `required`), Task 5 (`AiModel { id; name; providerId; providerName }`, `EditorStep`), Task 5 (`AiTool.changesContent`, fixture `createAiTool`), Task 8 (`isAiEditable`, `readAiConfig`, `EditorStepPatch`, and the fixture `createAiStep` from `~/editor/testing/draftFixtures.js`). Existing (verified): admin-ui `Alert`, `Button`, `CheckboxGroup`, `Tag` (`variant`, `content`, `icon`), `FormComponentLabel`, `FormComponentDescription`, `FormComponentErrorMessage`, `Text`; `@webiny/icons/edit_note.svg`.
- Produces: `AI_FORM_MESSAGES`, `getAiModelOptions` (`AiModelOptions { options; selected; empty }`), `buildAiStepForm`, `getAiFormData`, `getAiStepPatch`, `AiModelPickerRenderer`, `AiToolsRenderer`.

**Test runner note:** admin package, `yarn test <path>` only. `WorkflowPicker` is replaced by a stub in the model renderer test (the props are asserted, Task 4 tests the picker).

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/presentation/stepForm/aiFormPure.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { AiModel } from "~/editor/domain/types.js";
import { getAiModelOptions } from "./getAiModelOptions.js";

const MODELS: AiModel[] = [
    { id: "anthropic/claude-balanced", name: "Claude Balanced", providerId: "anthropic", providerName: "Anthropic" },
    { id: "openai/gpt-fast", name: "GPT Fast", providerId: "openai", providerName: "OpenAI" }
];

const RETIRED_WARNING =
    "The AI model “anthropic/gone” is no longer offered. Choose another model; until then this step fails when reached.";

describe("getAiModelOptions (R275, QBZ-8, QBZ-89)", () => {
    it("lists the models with the provider name as the description", () => {
        const result = getAiModelOptions({ models: MODELS, loaded: true, query: "", selectedId: null });

        expect(result.options).toEqual([
            { id: "anthropic/claude-balanced", label: "Claude Balanced", description: "Anthropic", warning: null },
            { id: "openai/gpt-fast", label: "GPT Fast", description: "OpenAI", warning: null }
        ]);
        expect(result.selected).toBeNull();
        expect(result.empty).toBe(false);
    });

    it("filters by the query on the model and the provider name, case-insensitively", () => {
        const byModel = getAiModelOptions({ models: MODELS, loaded: true, query: " gpt ", selectedId: null });
        const byProvider = getAiModelOptions({ models: MODELS, loaded: true, query: "ANTHRO", selectedId: null });

        expect(byModel.options.map(option => option.id)).toEqual(["openai/gpt-fast"]);
        expect(byProvider.options.map(option => option.id)).toEqual(["anthropic/claude-balanced"]);
    });

    it("keeps the selected model whatever the query", () => {
        const result = getAiModelOptions({
            models: MODELS,
            loaded: true,
            query: "gpt",
            selectedId: "anthropic/claude-balanced"
        });

        expect(result.selected?.label).toBe("Claude Balanced");
        expect(result.selected?.warning).toBeNull();
    });

    it("shows a stored model the list does not offer as retired, with the warning (QBZ-8)", () => {
        const result = getAiModelOptions({
            models: MODELS,
            loaded: true,
            query: "",
            selectedId: "anthropic/gone"
        });

        expect(result.selected).toEqual({
            id: "anthropic/gone",
            label: "anthropic/gone (no longer offered)",
            description: null,
            warning: RETIRED_WARNING
        });
    });

    it("keeps a stored model shown without a retired warning while the list is not loaded", () => {
        const result = getAiModelOptions({
            models: [],
            loaded: false,
            query: "",
            selectedId: "anthropic/claude-balanced"
        });

        expect(result.selected).toEqual({
            id: "anthropic/claude-balanced",
            label: "anthropic/claude-balanced",
            description: null,
            warning: null
        });
        expect(result.empty).toBe(false);
    });

    it("is empty only when a loaded list has no model", () => {
        expect(getAiModelOptions({ models: [], loaded: true, query: "", selectedId: null }).empty).toBe(true);
        expect(getAiModelOptions({ models: [], loaded: false, query: "", selectedId: null }).empty).toBe(false);
        expect(getAiModelOptions({ models: MODELS, loaded: true, query: "zzz", selectedId: null }).empty).toBe(false);
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/buildAiStepForm.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createTestFormModelFactory } from "~/editor/testing/createTestFormModelFactory.js";
import { buildAiStepForm } from "./buildAiStepForm.js";
import { getAiFormData } from "./getAiFormData.js";
import { getAiStepPatch } from "./getAiStepPatch.js";
import { STEP_FORM_RENDERER } from "./stepFormRendererNames.js";

const createForm = (readOnly = false) => {
    return createTestFormModelFactory().create(buildAiStepForm({ readOnly }));
};

// Task 8's AI step with the title and Notify via the common-field assertions below expect.
const aiStep = (
    config: unknown = {
        instructions: "Check tone",
        model: "anthropic/claude-balanced",
        tools: ["read-fields"]
    }
) => {
    return createAiStep({
        id: "step-1",
        title: "Legal sign-off",
        notificationIds: ["e-mail"],
        config
    });
};

describe("buildAiStepForm (R270, R275)", () => {
    it("has the common fields, instructions, model, tools and Notify via, in order, with no tabs", () => {
        const form = createForm();
        const names = form.vm.layout.flatMap(node => {
            return node.type === "row" ? node.fields.map(field => field.name) : [node.type];
        });

        expect(names).toEqual([
            "title",
            "color",
            "description",
            "instructions",
            "model",
            "tools",
            "notifications"
        ]);
    });

    it("uses the AI description placeholder", () => {
        expect(createForm().field("description").vm.placeholder).toBe(
            "What this AI check is for. Shown to the requester and reviewers."
        );
    });

    it("describes Instructions (research2-admin.md 5)", () => {
        const instructions = createForm().field("instructions").vm;

        expect(instructions.label).toBe("Instructions");
        expect(instructions.placeholder).toBe("Check tone of voice, flag any personal data…");
        expect(instructions.description).toBe(
            "The AI reviews the revision against these instructions, then approves or rejects it and lists the issues it found."
        );
        expect(instructions.renderer).toBe("textarea");
    });

    it("describes Model and Tools", () => {
        const form = createForm();

        expect(form.field("model").vm.label).toBe("Model");
        expect(form.field("model").vm.description).toBe("Models available through AI Power-Ups.");
        expect(form.field("model").vm.renderer).toBe(STEP_FORM_RENDERER.aiModel);
        expect(form.field("tools").vm.label).toBe("Tools");
        expect(form.field("tools").vm.renderer).toBe(STEP_FORM_RENDERER.aiTools);
        expect(form.field("tools").vm.isList).toBe(true);
    });

    it("requires instructions and a model with the design messages (QBZ-12)", async () => {
        const form = createForm();

        expect(await form.field("instructions").validate({ force: true })).toBe(false);
        expect(form.field("instructions").vm.validation.message).toBe("Enter instructions for the AI.");
        expect(await form.field("model").validate({ force: true })).toBe(false);
        expect(form.field("model").vm.validation.message).toBe("Choose an AI model.");

        form.field("instructions").setValue("Check tone");
        form.field("model").setValue("anthropic/claude-balanced");

        expect(await form.field("instructions").validate({ force: true })).toBe(true);
        expect(await form.field("model").validate({ force: true })).toBe(true);
    });

    it("starts a new step with no model (QBZ-89)", () => {
        expect(createForm().field("model").getValue()).toBeNull();
    });

    it("validates instructions and model after each edit (QBZ-13)", async () => {
        const form = createForm();

        form.field("model").vm.onChange("anthropic/claude-balanced");
        form.field("model").vm.onChange(null);

        await vi.waitFor(() => {
            expect(form.field("model").vm.validation.message).toBe("Choose an AI model.");
        });
    });

    it("disables every field when read-only (QBZ-47)", () => {
        const readOnly = createForm(true);

        ["title", "color", "description", "instructions", "model", "tools", "notifications"].forEach(name => {
            expect(readOnly.field(name).vm.disabled).toBe(true);
        });
        expect(createForm(false).field("instructions").vm.disabled).toBe(false);
    });

    it("loads a step without becoming dirty", () => {
        const form = createForm();

        form.setData(getAiFormData(aiStep()), { dirty: false });

        expect(form.isDirty).toBe(false);
        expect(form.getData()).toMatchObject({
            instructions: "Check tone",
            model: "anthropic/claude-balanced",
            tools: ["read-fields"]
        });
    });
});

describe("getAiFormData", () => {
    it("reads the stored config, treating a missing model as none", () => {
        const data = getAiFormData(aiStep({ instructions: "Check tone", tools: [] }));

        expect(data.instructions).toBe("Check tone");
        expect(data.model).toBeNull();
        expect(data.tools).toEqual([]);
    });

    it("keeps every stored tool name and ignores what is not a string", () => {
        const data = getAiFormData(aiStep({ instructions: "", model: "m/x", tools: ["a", 1, "gone"] }));

        expect(data.tools).toEqual(["a", "gone"]);
    });

    it("reads an empty config as empty values", () => {
        const data = getAiFormData(aiStep({}));

        expect(data.instructions).toBe("");
        expect(data.model).toBeNull();
        expect(data.tools).toEqual([]);
    });
});

describe("getAiStepPatch (R270, Review Focus 3)", () => {
    it("writes exactly the AI config keys: instructions, model and tools", () => {
        const step = aiStep();

        const patch = getAiStepPatch(step, getAiFormData(step));

        expect(Object.keys(patch.config ?? {}).sort()).toEqual(["instructions", "model", "tools"]);
        expect(patch.config).toEqual({
            instructions: "Check tone",
            model: "anthropic/claude-balanced",
            tools: ["read-fields"]
        });
    });

    it("writes the edited values and keeps tool names the list no longer offers", () => {
        const step = aiStep();

        const patch = getAiStepPatch(step, {
            ...getAiFormData(step),
            instructions: "Check tone and links",
            model: "openai/gpt-fast",
            tools: ["gone", "check-links"]
        });

        expect(patch.config).toEqual({
            instructions: "Check tone and links",
            model: "openai/gpt-fast",
            tools: ["gone", "check-links"]
        });
    });

    it("writes an empty model for a step with none, so the server names the field", () => {
        const step = aiStep({});

        const patch = getAiStepPatch(step, getAiFormData(step));

        expect(patch.config).toEqual({ instructions: "", model: "", tools: [] });
    });

    it("includes the common fields", () => {
        const step = aiStep();

        const patch = getAiStepPatch(step, getAiFormData(step));

        expect(patch.title).toBe("Legal sign-off");
        expect(patch.notificationIds).toEqual(["e-mail"]);
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/AiModelPickerRenderer.test.tsx`:

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
import { createStepFormOptions } from "~/editor/testing/createStepFormOptions.js";
import { createTestFormModelFactory } from "~/editor/testing/createTestFormModelFactory.js";
import { renderStepFormField } from "~/editor/testing/renderStepFormField.js";
import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { StepFormAiModelsOptions } from "../StepFormOptions.js";
import { buildAiStepForm } from "../buildAiStepForm.js";
import { AiModelPickerRenderer } from "./AiModelPickerRenderer.js";

interface ModelPickerStubProps {
    label: string;
    description?: string;
    required?: boolean;
    value: string | null;
    selected: PickerOption | null;
    options: PickerOption[];
    placeholder: string;
    disabled: boolean;
    error: string | null;
    onChange(id: string | null): void;
    onSearch(search: string): void;
}

// A stub of the Task 4 picker: it exposes the props the renderer passes and two buttons.
vi.mock("~/components/picker/WorkflowPicker.js", async () => {
    const react = await import("react");
    return {
        WorkflowPicker: (props: ModelPickerStubProps) => {
            return react.createElement(
                "div",
                {
                    "data-testid": "model-picker",
                    "data-label": props.label,
                    "data-description": props.description ?? "",
                    "data-required": String(props.required ?? false),
                    "data-value": props.value ?? "",
                    "data-selected": props.selected?.label ?? "",
                    "data-warning": props.selected?.warning ?? "",
                    "data-options": props.options.map(option => option.id).join(","),
                    "data-placeholder": props.placeholder,
                    "data-disabled": String(props.disabled),
                    "data-error": props.error ?? ""
                },
                react.createElement(
                    "button",
                    { onClick: () => props.onChange("openai/gpt-fast") },
                    "pick"
                ),
                react.createElement("button", { onClick: () => props.onChange(null) }, "clear"),
                react.createElement("button", { onClick: () => props.onSearch("gpt") }, "search")
            );
        }
    };
});

const MODEL: PickerOption = {
    id: "anthropic/claude-balanced",
    label: "Claude Balanced",
    description: "Anthropic",
    warning: null
};

const aiModels = (overrides: Partial<StepFormAiModelsOptions> = {}): StepFormAiModelsOptions => {
    return {
        loading: false,
        failed: false,
        retry: vi.fn(),
        options: [MODEL],
        selected: null,
        empty: false,
        search: vi.fn(),
        ...overrides
    };
};

const renderModel = (model: string | null, options: StepFormAiModelsOptions) => {
    const form = createTestFormModelFactory().create(buildAiStepForm({ readOnly: false }));
    form.setData({ model }, { dirty: false });
    renderStepFormField({
        form,
        name: "model",
        Renderer: AiModelPickerRenderer,
        options: createStepFormOptions({ aiModels: options })
    });
    return form;
};

describe("AiModelPickerRenderer (R275, QBZ-8, QBZ-89)", () => {
    afterEach(() => {
        cleanup();
    });

    it("passes the label, description, value, options, selected model and placeholder to the picker", () => {
        renderModel("anthropic/claude-balanced", aiModels({ selected: MODEL }));

        const picker = screen.getByTestId("model-picker");
        expect(picker.getAttribute("data-value")).toBe("anthropic/claude-balanced");
        expect(picker.getAttribute("data-selected")).toBe("Claude Balanced");
        expect(picker.getAttribute("data-options")).toBe("anthropic/claude-balanced");
        expect(picker.getAttribute("data-placeholder")).toBe("Search models");
        expect(picker.getAttribute("data-disabled")).toBe("false");
        expect(picker.getAttribute("data-label")).toBe("Model");
        expect(picker.getAttribute("data-description")).toBe("Models available through AI Power-Ups.");
        expect(picker.getAttribute("data-required")).toBe("true");
    });

    it("writes the picked id to the field, clears it with null and forwards a search", () => {
        const search = vi.fn();
        const form = renderModel(null, aiModels({ search }));

        fireEvent.click(screen.getByText("pick"));
        expect(form.field("model").getValue()).toBe("openai/gpt-fast");

        fireEvent.click(screen.getByText("clear"));
        expect(form.field("model").getValue()).toBeNull();

        fireEvent.click(screen.getByText("search"));
        expect(search).toHaveBeenCalledWith("gpt");
    });

    it("passes a retired model's label and warning through (QBZ-8)", () => {
        const retired: PickerOption = {
            id: "anthropic/gone",
            label: "anthropic/gone (no longer offered)",
            description: null,
            warning:
                "The AI model “anthropic/gone” is no longer offered. Choose another model; until then this step fails when reached."
        };
        renderModel("anthropic/gone", aiModels({ selected: retired }));

        const picker = screen.getByTestId("model-picker");
        expect(picker.getAttribute("data-selected")).toBe("anthropic/gone (no longer offered)");
        expect(picker.getAttribute("data-warning")).toBe(retired.warning);
    });

    it("shows the no-model error under the field when validated", async () => {
        const form = createTestFormModelFactory().create(buildAiStepForm({ readOnly: false }));
        await form.field("model").validate({ force: true });
        renderStepFormField({
            form,
            name: "model",
            Renderer: AiModelPickerRenderer,
            options: createStepFormOptions({ aiModels: aiModels() })
        });

        expect(screen.getByTestId("model-picker").getAttribute("data-error")).toBe("Choose an AI model.");
    });

    it("disables the picker and offers Retry when the list failed (QBZ-89)", () => {
        const retry = vi.fn();
        renderModel(
            "anthropic/claude-balanced",
            aiModels({ failed: true, retry, options: [], selected: MODEL })
        );

        const picker = screen.getByTestId("model-picker");
        expect(picker.getAttribute("data-disabled")).toBe("true");
        expect(picker.getAttribute("data-selected")).toBe("Claude Balanced");
        expect(screen.getByText("Could not load AI models.")).toBeDefined();

        fireEvent.click(screen.getByRole("button", { name: "Retry" }));

        expect(retry).toHaveBeenCalledTimes(1);
    });

    it("disables the picker and explains when the list is empty (QBZ-89)", () => {
        renderModel(null, aiModels({ empty: true, options: [] }));

        expect(screen.getByTestId("model-picker").getAttribute("data-disabled")).toBe("true");
        expect(
            screen.getByText("No AI models are available. Check the AI Power-Ups configuration.")
        ).toBeDefined();
        expect(screen.queryByText("Could not load AI models.")).toBeNull();
    });

    it("shows no list message while the models load", () => {
        renderModel(null, aiModels({ loading: true, options: [] }));

        expect(screen.queryByText("Could not load AI models.")).toBeNull();
        expect(
            screen.queryByText("No AI models are available. Check the AI Power-Ups configuration.")
        ).toBeNull();
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/AiToolsRenderer.test.tsx`:

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
import { createStepFormOptions } from "~/editor/testing/createStepFormOptions.js";
import { createTestFormModelFactory } from "~/editor/testing/createTestFormModelFactory.js";
import { renderStepFormField } from "~/editor/testing/renderStepFormField.js";
import type { StepFormAiToolsOptions } from "../StepFormOptions.js";
import { buildAiStepForm } from "../buildAiStepForm.js";
import { AiToolsRenderer } from "./AiToolsRenderer.js";

const tools = (overrides: Partial<StepFormAiToolsOptions> = {}): StepFormAiToolsOptions => {
    return {
        loading: false,
        failed: false,
        retry: vi.fn(),
        options: [
            {
                name: "read-fields",
                title: "Read fields",
                description: "Reads every field of the revision under review.",
                changesContent: false
            },
            {
                name: "update-fields",
                title: "Update fields",
                description: "Edits field values in the revision under review.",
                changesContent: true
            },
            {
                name: "check-links",
                title: "Check links",
                description: "Opens links in the content and reports broken ones.",
                changesContent: false
            }
        ],
        ...overrides
    };
};

const createForm = (stored: string[]) => {
    const form = createTestFormModelFactory().create(buildAiStepForm({ readOnly: false }));
    form.setData({ tools: stored }, { dirty: false });
    return form;
};

const renderTools = (form: ReturnType<typeof createForm>, options: StepFormAiToolsOptions) => {
    renderStepFormField({
        form,
        name: "tools",
        Renderer: AiToolsRenderer,
        options: createStepFormOptions({ aiTools: options })
    });
};

describe("AiToolsRenderer (R275)", () => {
    afterEach(() => {
        cleanup();
    });

    it("lists one checkbox per tool with its title and description, the stored ones ticked", () => {
        renderTools(createForm(["read-fields"]), tools());

        const read = screen.getByRole("checkbox", { name: /Read fields/ });
        const links = screen.getByRole("checkbox", { name: /Check links/ });
        expect(read.getAttribute("aria-checked")).toBe("true");
        expect(links.getAttribute("aria-checked")).toBe("false");
        expect(screen.getByText("Reads every field of the revision under review.")).toBeDefined();
        expect(screen.getByText("Tools")).toBeDefined();
    });

    it("tags only the tool that changes content, and shows the hint under the list (R283)", () => {
        renderTools(createForm([]), tools());

        expect(screen.getAllByText("Changes content")).toHaveLength(1);
        expect(screen.getByRole("checkbox", { name: /Update fields.*Changes content/ })).toBeDefined();
        expect(
            screen.getByText(
                "Tools marked “Changes content” can edit the revision while it is in review. The editor reloads and tells the author when that happens."
            )
        ).toBeDefined();
    });

    it("shows no hint in the loading, failed and empty states", () => {
        const hint =
            "Tools marked “Changes content” can edit the revision while it is in review. The editor reloads and tells the author when that happens.";

        renderTools(createForm([]), tools({ options: [], loading: true }));
        expect(screen.queryByText(hint)).toBeNull();
        cleanup();
        renderTools(createForm([]), tools({ options: [], failed: true }));
        expect(screen.queryByText(hint)).toBeNull();
        cleanup();
        renderTools(createForm([]), tools({ options: [] }));
        expect(screen.queryByText(hint)).toBeNull();
    });

    it("ticks a tool and keeps the stored names the list does not offer", () => {
        const form = createForm(["gone"]);
        renderTools(form, tools());

        fireEvent.click(screen.getByRole("checkbox", { name: /Check links/ }));

        expect(form.field("tools").getValue()).toEqual(["gone", "check-links"]);
    });

    it("unticks only the clicked tool", () => {
        const form = createForm(["gone", "read-fields", "check-links"]);
        renderTools(form, tools());

        fireEvent.click(screen.getByRole("checkbox", { name: /Read fields/ }));

        expect(form.field("tools").getValue()).toEqual(["gone", "check-links"]);
    });

    it("never shows a stored name the list does not contain", () => {
        renderTools(createForm(["gone"]), tools());

        expect(screen.queryByText("gone")).toBeNull();
        expect(screen.getAllByRole("checkbox")).toHaveLength(3);
    });

    it("shows a server error on the tools field under the list", () => {
        const form = createForm([]);
        form.field("tools").setValidation({ isValid: false, message: "Tool “gone” is not defined." });
        renderTools(form, tools());

        expect(screen.getByText("Tool “gone” is not defined.")).toBeDefined();
    });

    it("shows the options failure with Try again", () => {
        const retry = vi.fn();
        renderTools(createForm([]), tools({ options: [], failed: true, retry }));

        expect(screen.getByText("Could not load the step options.")).toBeDefined();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(retry).toHaveBeenCalledTimes(1);
    });

    it("shows only the label while the tools load", () => {
        renderTools(createForm([]), tools({ options: [], loading: true }));

        expect(screen.getByText("Tools")).toBeDefined();
        expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    });

    it("renders nothing when the list loaded with no tool (there is no copy for it)", () => {
        renderTools(createForm([]), tools({ options: [] }));

        expect(screen.queryByText("Tools")).toBeNull();
        expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    });
});
```

Modify `packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx`: replace the case title

```tsx
    it("registers the step colour, teams picker, transport and automation renderers", () => {
```

with

```tsx
    it("registers the colour, teams, transport, automation, AI model and AI tools renderers", () => {
```

and replace the expectation

```tsx
        expect(names).toEqual([
            "workflowStepColour",
            "workflowTeamsPicker",
            "workflowTransports",
            "workflowAutomationCards"
        ]);
```

with

```tsx
        expect(names).toEqual([
            "workflowStepColour",
            "workflowTeamsPicker",
            "workflowTransports",
            "workflowAutomationCards",
            "workflowAiModel",
            "workflowAiTools"
        ]);
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm/aiFormPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/buildAiStepForm.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/AiModelPickerRenderer.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/AiToolsRenderer.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx 2>&1 | tail -30
```

Expected: the first four fail with `Failed to resolve import` for `getAiModelOptions.js`, `buildAiStepForm.js`, `AiModelPickerRenderer.js` and `AiToolsRenderer.js`; `WorkflowEditorConfig.test.tsx` fails because the two AI renderers are not registered. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/presentation/stepForm/aiFormMessages.ts`:

```ts
// Copy of the AI step form (research2-admin.md 5; QBZ-8, QBZ-39, QBZ-46, QBZ-47, QBZ-89, R281).
export const AI_FORM_MESSAGES = {
    descriptionPlaceholder: "What this AI check is for. Shown to the requester and reviewers.",
    instructionsPlaceholder: "Check tone of voice, flag any personal data…",
    instructionsHint:
        "The AI reviews the revision against these instructions, then approves or rejects it and lists the issues it found.",
    instructionsRequired: "Enter instructions for the AI.",
    modelHint: "Models available through AI Power-Ups.",
    modelRequired: "Choose an AI model.",
    modelPlaceholder: "Search models",
    modelsFailed: "Could not load AI models.",
    modelsEmpty: "No AI models are available. Check the AI Power-Ups configuration.",
    changesContentTag: "Changes content",
    toolsHint:
        "Tools marked “Changes content” can edit the revision while it is in review. The editor reloads and tells the author when that happens.",
    retry: "Retry",
    licenceTitle: "AI Power-Ups licence missing",
    licenceText:
        "This step is read-only. Reviews that reach it fail; they can be restarted once the licence is back."
} as const;
```

Create `packages/app-workflows/src/editor/presentation/stepForm/getAiModelOptions.ts`:

```ts
import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { AiModel } from "~/editor/domain/types.js";

export interface AiModelOptionsParams {
    models: AiModel[];
    // The list loaded successfully (it may still be empty).
    loaded: boolean;
    query: string;
    selectedId: string | null;
}

export interface AiModelOptions {
    options: PickerOption[];
    selected: PickerOption | null;
    empty: boolean;
}

function toOption(model: AiModel): PickerOption {
    return { id: model.id, label: model.name, description: model.providerName, warning: null };
}

function matches(model: AiModel, needle: string): boolean {
    return (
        model.name.toLowerCase().includes(needle) || model.providerName.toLowerCase().includes(needle)
    );
}

/*
 * The model picker's options (R275): client-side search over the loaded list; the stored model
 * always shows. One the loaded list does not offer is retired (QBZ-8): its label says so and it
 * carries the warning, which does not block saving. While the list is not loaded the stored id
 * stands for the name, with no warning because nothing is known.
 */
export const getAiModelOptions = (params: AiModelOptionsParams): AiModelOptions => {
    const { models, loaded, query, selectedId } = params;
    const needle = query.trim().toLowerCase();
    const options = models.filter(model => matches(model, needle)).map(toOption);

    let selected: PickerOption | null = null;
    if (selectedId !== null) {
        const known = models.find(model => model.id === selectedId);
        if (known) {
            selected = toOption(known);
        } else if (loaded) {
            selected = {
                id: selectedId,
                label: `${selectedId} (no longer offered)`,
                description: null,
                warning: `The AI model “${selectedId}” is no longer offered. Choose another model; until then this step fails when reached.`
            };
        } else {
            selected = { id: selectedId, label: selectedId, description: null, warning: null };
        }
    }

    return { options, selected, empty: loaded && models.length === 0 };
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/buildAiStepForm.ts`:

```ts
import type { FormModelFactory } from "@webiny/app-admin";
import { AI_FORM_MESSAGES } from "./aiFormMessages.js";
import { buildCommonFields } from "./buildCommonFields.js";
import { STEP_FORM_RENDERER } from "./stepFormRendererNames.js";
import { validateAfterChange } from "./validateAfterChange.js";

export interface AiStepFormParams {
    // The AI step without the licence (R275, QBZ-47): every field is disabled.
    readOnly: boolean;
}

/*
 * The AI step form (R270, R275): the common fields, Instructions, Model, Tools and Notify via. One
 * body, no tabs. A new step has no model (QBZ-89).
 */
export const buildAiStepForm = (params: AiStepFormParams): FormModelFactory.Config => {
    const { readOnly } = params;

    return {
        fields: registry => {
            const common = buildCommonFields({
                registry,
                descriptionPlaceholder: AI_FORM_MESSAGES.descriptionPlaceholder,
                readOnly
            });

            const instructions = registry
                .text()
                .label("Instructions")
                .placeholder(AI_FORM_MESSAGES.instructionsPlaceholder)
                .description(AI_FORM_MESSAGES.instructionsHint)
                .renderer("textarea", { rows: 6 })
                .required(AI_FORM_MESSAGES.instructionsRequired)
                .afterChange(validateAfterChange("instructions"))
                .disabled(readOnly);

            const model = registry
                .text()
                .label("Model")
                .description(AI_FORM_MESSAGES.modelHint)
                .renderer(STEP_FORM_RENDERER.aiModel)
                .required(AI_FORM_MESSAGES.modelRequired)
                .afterChange(validateAfterChange("model"))
                .disabled(readOnly);

            const tools = registry
                .text()
                .list()
                .label("Tools")
                .renderer(STEP_FORM_RENDERER.aiTools)
                .disabled(readOnly);

            return {
                title: common.title,
                color: common.color,
                description: common.description,
                instructions,
                model,
                tools,
                notifications: common.notifications
            };
        }
    };
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/getAiFormData.ts`:

```ts
import type { EditorStep } from "~/editor/domain/types.js";
import { readAiConfig } from "~/editor/model/readAiConfig.js";
import type { AiFormValues } from "./StepFormData.js";
import { getCommonFormData } from "./getCommonFormData.js";

// The AI step as form values: the common fields, the instructions, the model (null for none) and every stored tool name.
export const getAiFormData = (step: EditorStep): AiFormValues => {
    const config = readAiConfig(step.config);
    const common = getCommonFormData(step);

    let model: string | null = null;
    if (config.model !== "") {
        model = config.model;
    }

    return { ...common, instructions: config.instructions, model, tools: config.tools };
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/getAiStepPatch.ts`:

```ts
import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorStepPatch } from "~/editor/model/EditorStepPatch.js";
import type { AiFormValues } from "./StepFormData.js";
import { getCommonStepPatch } from "./getCommonStepPatch.js";

/*
 * What Done writes for an AI step: the common fields and the config
 * `{ instructions, model, tools }` (R270, Review Focus 3). The instructions go back untouched, the
 * tools include the names the list no longer offers, a step with no model writes an empty one so
 * the server names the field.
 */
export const getAiStepPatch = (step: EditorStep, values: AiFormValues): EditorStepPatch => {
    const common = getCommonStepPatch(step, values);

    return {
        ...common,
        config: {
            instructions: values.instructions ?? "",
            model: values.model ?? "",
            tools: values.tools ?? []
        }
    };
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/AiModelPickerRenderer.tsx`:

```tsx
import React from "react";
import { Button } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { WorkflowPicker } from "~/components/picker/WorkflowPicker.js";
import { AI_FORM_MESSAGES } from "../aiFormMessages.js";
import { useStepFormOptions } from "../useStepFormOptions.js";
import "../stepFormRendererNames.js";

/*
 * Model (R275, QBZ-8, QBZ-89): the single picker over `listAiModels`. A failed or empty list
 * disables it and says why; the stored model stays shown (the options carry it as `selected`, with
 * the retired warning when the loaded list does not offer it). The picker draws the label, the
 * description and the required marker.
 */
export const AiModelPickerRenderer = createFieldRenderer<"workflowAiModel">(({ field }) => {
    const { aiModels } = useStepFormOptions();
    const invalid = field.validation.isValid === false;
    const error = invalid ? (field.validation.message ?? null) : null;
    const value = typeof field.value === "string" ? field.value : null;

    return (
        <div className={"flex w-full flex-col gap-xs"}>
            <WorkflowPicker
                label={field.label ?? ""}
                description={field.description}
                required={field.required}
                value={value}
                selected={aiModels.selected}
                options={aiModels.options}
                onSearch={aiModels.search}
                onChange={id => field.onChange(id)}
                placeholder={AI_FORM_MESSAGES.modelPlaceholder}
                disabled={field.disabled || aiModels.failed || aiModels.empty}
                error={error}
            />
            {aiModels.failed && (
                <div className={"flex items-center gap-sm text-destructive-primary"}>
                    <Text size={"sm"}>{AI_FORM_MESSAGES.modelsFailed}</Text>
                    <Button
                        variant={"ghost"}
                        size={"sm"}
                        text={AI_FORM_MESSAGES.retry}
                        onClick={aiModels.retry}
                    />
                </div>
            )}
            {aiModels.empty && <Text size={"sm"}>{AI_FORM_MESSAGES.modelsEmpty}</Text>}
        </div>
    );
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/AiToolsRenderer.tsx`:

```tsx
import React from "react";
import { Alert } from "@webiny/admin-ui";
import { CheckboxGroup } from "@webiny/admin-ui";
import { FormComponentDescription } from "@webiny/admin-ui";
import { FormComponentErrorMessage } from "@webiny/admin-ui";
import { FormComponentLabel } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { ReactComponent as EditNoteIcon } from "@webiny/icons/edit_note.svg";
import { AI_FORM_MESSAGES } from "../aiFormMessages.js";
import { STEP_FORM_MESSAGES } from "../stepFormMessages.js";
import { useStepFormOptions } from "../useStepFormOptions.js";
import "../stepFormRendererNames.js";

/*
 * Tools (R275, R283): one checkbox per tool of `listAiTools`, tagged `Changes content` when the tool
 * can edit the revision, with the design's hint under the list. Names stored on the step that the list does
 * not offer are kept on every change and never shown (like transports). A server error on
 * `config.tools` shows under the list through the field's validation.
 */
export const AiToolsRenderer = createFieldRenderer<"workflowAiTools">(({ field }) => {
    const { aiTools } = useStepFormOptions();
    const stored: string[] = Array.isArray(field.value) ? field.value : [];
    const knownNames = aiTools.options.map(option => option.name);
    const known = new Set(knownNames);
    const kept = stored.filter(name => !known.has(name));
    const ticked = stored.filter(name => known.has(name));

    if (aiTools.failed) {
        return (
            <div className={"w-full"}>
                <FormComponentLabel text={field.label} disabled={field.disabled} />
                <Alert
                    type={"danger"}
                    variant={"subtle"}
                    actions={
                        <Alert.Action text={STEP_FORM_MESSAGES.tryAgain} onClick={aiTools.retry} />
                    }
                >
                    {STEP_FORM_MESSAGES.optionsFailed}
                </Alert>
            </div>
        );
    }

    if (aiTools.loading) {
        return (
            <div className={"w-full"}>
                <FormComponentLabel text={field.label} disabled={field.disabled} />
            </div>
        );
    }

    if (aiTools.options.length === 0) {
        return null;
    }

    const items = aiTools.options.map(option => {
        return {
            value: option.name,
            label: (
                <span className={"flex flex-col gap-xs"}>
                    <span className={"flex items-center gap-sm"}>
                        <span>{option.title}</span>
                        {option.changesContent && (
                            <Tag
                                variant={"neutral-light"}
                                content={AI_FORM_MESSAGES.changesContentTag}
                                icon={<EditNoteIcon />}
                            />
                        )}
                    </span>
                    <span className={"text-sm"}>{option.description}</span>
                </span>
            )
        };
    });
    const invalid = field.validation.isValid === false;

    return (
        <div className={"w-full"}>
            <CheckboxGroup
                label={field.label}
                disabled={field.disabled}
                items={items}
                value={ticked}
                onChange={values => {
                    field.onChange([...kept, ...values]);
                    field.onBlur();
                }}
            />
            <FormComponentErrorMessage
                text={field.validation.message}
                invalid={invalid}
                disabled={field.disabled}
            />
            <FormComponentDescription
                text={AI_FORM_MESSAGES.toolsHint}
                disabled={field.disabled}
            />
        </div>
    );
});
```

Modify `packages/app-workflows/src/editor/WorkflowEditorConfig.tsx`. Add the imports after the `AutomationCardsRenderer` import:

```tsx
import { AiModelPickerRenderer } from "~/editor/presentation/stepForm/renderers/AiModelPickerRenderer.js";
import { AiToolsRenderer } from "~/editor/presentation/stepForm/renderers/AiToolsRenderer.js";
```

and the entries after the automations entry, before `</AdminConfig>`:

```tsx
            <AdminConfig.Form.FieldRenderer
                name={STEP_FORM_RENDERER.aiModel}
                component={AiModelPickerRenderer}
            />
            <AdminConfig.Form.FieldRenderer
                name={STEP_FORM_RENDERER.aiTools}
                component={AiToolsRenderer}
            />
```

- [ ] **Step 4: Run the tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm/aiFormPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/buildAiStepForm.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/AiModelPickerRenderer.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/AiToolsRenderer.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx 2>&1 | tail -20
```

Expected: all pass.

- [ ] **Step 5: Run the existing tests covering the changed code and type check**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm/buildAutomationStepForm.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepForm/buildPeopleStepForm.test.ts 2>&1 | tail -20
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: Tasks 11 and 12 tests still pass; the build type-checks the new files.

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
git commit -m "feat(app-workflows): add the AI step form" -m "The AI step form: instructions, a model picker over the configured models with the empty, failed, no-model and retired-model states, a tools list that keeps names the list no longer offers, the data and patch functions, and the read-only mode for a missing licence." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. In the commit command, replace the literal `<CURRENT_SESSION_URL>` with the `https://claude.ai/code/session_...` URL of the session that runs the commit. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **`Changes content` is sourced by R283:** `AiTool.changesContent: boolean` (Task 5; `listAiTools` selects it), `StepFormAiToolOption.changesContent` (Task 11 types, mapped by Task 14), the tag with `edit_note.svg` (the prototype's `edit_document` does not exist in `@webiny/icons`) and the hint under the list are built here; Task 8's step summary appends ` · can change content`.
- **No copy for an empty tool list:** the sources have none, so `AiToolsRenderer` renders nothing when the list loaded with no tool.
- **Shared pieces come from Tasks 5 and 8:** `EditorStepType`, `AiModel` (`id` is `<providerId>/<modelId>`), `isAiEditable`, `readAiConfig`, `EditorStepPatch`, `createAiStep`. The picker description is the provider name only (the design's `{provider} · {description}` has no description to join).
- **Hints are `description`, not `help`:** Task 4 says the admin-ui `hint` is only a tooltip icon and asks callers to pass `field.description`; the Instructions and Model texts are set with `.description(...)`.
- **The model name for a retired model is its id:** a step stores only `<providerId>/<modelId>`, so `{name}` in `The AI model “{name}” is no longer offered. ...` and `{name} (no longer offered)` is that id (the design's own "Unknown id fallback: shows the id as name").
- **`WorkflowPicker` retired warning:** the single picker shows `selected.warning` as a line under the input (A100, Task 4).
- **Licence alert texts live here** (`AI_FORM_MESSAGES.licenceTitle`, `licenceText`) and are shown by Task 14's drawer; the card line `AI Power-Ups licence missing. This step fails when reached and can be restarted once the licence is back.` belongs to Task 8's `getStepWarnings`.
- Size: medium (five small source files, two renderers, four test files).
