### Task 11: Common and People step forms

R270, R272, R273, R276, R282; D56, D66, D96, D129, D151; Q43; design README 4 (drawer General tab), `research-spec.md` 4.1-4.3 and `contract-review-1.md` string list; Review Focus 3. One FormModel form per step type, no tabs in 9a (R270): this task builds the fields every step has (Title, Colour, Description, Notify via), the People type's `teams` field, the three renderers they need (colour swatches with hex, the teams picker, the transport checkboxes), the React context the drawer provides to every renderer, and the `WorkflowEditorConfig` that registers the renderers. Tasks 12 and 13 add their forms and renderers beside it; Task 14 builds the drawer presenter that creates these forms.

- **Form shape (R270):** `buildPeopleStepForm()` returns a `FormModelFactory.Config` (the presenter calls `formModelFactory.create(config)` inline). Fields in this order: `title`, `color`, `description`, `teams`, `notifications`. The People config is exactly `{ teams, assignment }`: `getPeopleStepPatch` writes `teams` from the form and carries `assignment` unchanged (`createDefaultAssignment()` of Task 8 only when the step has none); no other key. The patch type is Task 8's `EditorStepPatch` (`Partial<Omit<EditorStep, "id" | "type">>`), so notifications travel as `notificationIds`.
- **Fields and copy (all verbatim from the sources above):** Title (`Title`, placeholder `e.g. Legal sign-off`, required, `Enter a title for this step.`); Colour (label `Colour`, shown with the required star, not blocked when empty; `HEX_COLOUR_MESSAGE` of Task 8, `Enter a hex colour, e.g. #3B6FD4.`, for a `#` value that is not `#RRGGBB`); Description (`Description`, a textarea, placeholder by type: People `What reviewers should look for in this step`, Automation `What this automation does. Shown to the requester and reviewers.`, AI `What this AI check is for. Shown to the requester and reviewers.`); Reviewing teams (`Reviewing teams`, required, `Choose at least one reviewing team.`, description `Members of these teams can review.`, the first sentence only per R270); Notify via (`Notify via`, description `In-app notifications are always sent. Who gets notified is set automatically from the step.`). The hints are the fields' visible `description` (the admin-ui `hint` prop is only a tooltip icon, Task 4 notes), not `help`.
- **Live errors (QBZ-13):** FormModel validates on blur only after a submit, so every field with a client rule validates after each change (`validateAfterChange(path)`): errors appear once the field has been edited, and the next edit replaces a server error set with `setValidation`. Task 14 marks the step's client and server errors on their fields when the drawer opens.
- **Colour (R273):** ten 28px preset circles as buttons (`aria-label` = the preset label, `aria-pressed` and a 2px ring for the selected one; the ring uses the `neutral-xstrong` token, the closest to the prototype's neutral-900), a divider, a native colour input (`title` `Pick a custom colour`, `aria-label` `Custom colour`) and a 7-character hex input (`aria-label` `Hex colour`, placeholder `#3B6FD4`). The field value is the raw text: a preset is its `var(--color-...)` string, a custom colour is what the hex box holds (`#` is prepended when missing). An unfinished hex stays in the field and shows the error but never reaches the draft: `getCommonStepPatch` keeps the step's colour unless the form colour is a non-empty valid value. A loaded colour that is neither a preset nor a hex is kept and shows as no selection with an empty hex box.
- **Notify via (R272):** one checkbox per transport (`{title} · {description}`, or the title alone). Ids on the step that are not listed are kept silently on every change and never shown (D151). With no transports the checkboxes are replaced by `Only in-app notifications are available. No other channels are configured.`; the hint stays in both cases. While the list loads only the label and hint show. A failed list shows the danger alert `Could not load the step options.` with `Try again` (R281).
- **Teams picker (R282, Q42):** `WorkflowMultiPicker` for a list field, `WorkflowPicker` (clearable) for a plain text field (the `team` ui hint of an automation setting, Task 12; R271 asks for a single-team picker renderer, this one renderer is both), placeholder `Search teams`; both pickers render the field's label, description and required marker themselves (`label`, `description`, `required` props, Task 4). `selected` and `options` come from the context; a team with no members carries the chip warning `This team has no members` (`toTeamPickerOption`); an id that is not in `selected` is shown by the picker as `Unknown item`. A failed list shows the same alert and retry as above, with the label drawn by the renderer.
- **Context (R234 channel):** the drawer presenter owns every list and passes it to the renderers through `StepFormOptionsContext` (one value, `StepFormOptions`: `teams`, `transports`, `automations`, `aiModels`, `aiTools`, each with `loading`, `failed` and `retry`). The renderers read only that; all five sections are defined here so Tasks 12-14 do not edit this file again.
- **Renderer names:** `STEP_FORM_RENDERER` (six names, one file with the `declare module` augmentation of `IFieldRendererRegistry`); `WorkflowEditorConfig` registers the three of this task with `AdminConfig.Form.FieldRenderer` and is mounted in `WorkflowsAdminApp` (Global Constraint "Registration"); Tasks 12 and 13 add their entries there.

**Files:**
- Modify: `packages/app-workflows/package.json` (add `zod`)
- Create: `packages/app-workflows/src/editor/presentation/stepForm/StepFormOptions.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/StepFormOptionsContext.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/useStepFormOptions.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/StepFormData.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/stepFormRendererNames.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/stepFormMessages.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/isValidStepColour.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/validateAfterChange.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/toTeamPickerOption.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/buildCommonFields.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/getCommonFormData.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/getCommonStepPatch.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/buildPeopleStepForm.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/getPeopleFormData.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/getPeopleStepPatch.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/renderers/StepColourRenderer.tsx`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/renderers/TeamsPickerRenderer.tsx`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/renderers/TransportCheckboxesRenderer.tsx`
- Create: `packages/app-workflows/src/editor/WorkflowEditorConfig.tsx`
- Create: `packages/app-workflows/src/editor/testing/createTestFormModelFactory.ts`
- Create: `packages/app-workflows/src/editor/testing/createStepFormOptions.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/createEmptyStepFormOptions.ts`
- Create: `packages/app-workflows/src/editor/testing/renderStepFormField.tsx`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/isValidStepColour.test.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/buildCommonFields.test.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/commonStepData.test.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/buildPeopleStepForm.test.ts`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/renderers/StepColourRenderer.test.tsx`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/renderers/TeamsPickerRenderer.test.tsx`
- Create: `packages/app-workflows/src/editor/presentation/stepForm/renderers/TransportCheckboxesRenderer.test.tsx`
- Create: `packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx`
- Modify: `packages/app-workflows/src/app.tsx`
- Modify: `packages/app-workflows/src/app.test.tsx`

**Interfaces:**
- Consumes: Task 4 (`PickerOption { id; label; description; warning }` from `~/components/picker/PickerOption.js`; `WorkflowPicker` and `WorkflowMultiPicker` from `~/components/picker/WorkflowPicker.js` and `WorkflowMultiPicker.js` with the props of the contract), Task 5 (`EditorStep { id; title; color; description: string | null; type; notificationIds: string[]; config: unknown }`, `WorkflowTeamSummary { id; name; memberCount }` from `~/editor/domain/types.js`, the fixtures `~/editor/testing/editorFixtures.js`), Task 8 (`STEP_COLOURS`, `HEX_COLOUR_MESSAGE` from `~/editor/domain/stepColours.js`, `isHexColour` from `~/editor/domain/isHexColour.js`, `EditorStepPatch` from `~/editor/model/EditorStepPatch.js`, `readReviewConfig`, `createDefaultAssignment`, the fixtures `~/editor/testing/draftFixtures.js`), 9a.2/`app-admin` (`FormModelFactory`, `FormModel`, `AdminConfig`, `createReactiveComponent`, deep `createFieldRenderer`, `FormModelFeature`, `IdentityContextFeature`). Existing (verified): admin-ui `Alert`, `CheckboxGroup`, `FormComponentLabel`, `FormComponentDescription`, `FormComponentErrorMessage`, `Text`; `renderWithAdminUi` (`~/review/testing/renderWithAdminUi.js`).
- Produces: `StepFormOptions` and its section types, `StepFormOptionsContext`, `useStepFormOptions`, `StepFormData` types (`CommonFormValues`, `PeopleFormValues`, `AutomationFormValues`, `AiFormValues`), `STEP_FORM_RENDERER`, `STEP_FORM_MESSAGES`, `isValidStepColour`, `createEmptyStepFormOptions`, `validateAfterChange`, `toTeamPickerOption`, `buildCommonFields`, `getCommonFormData`, `getCommonStepPatch`, `buildPeopleStepForm`, `getPeopleFormData`, `getPeopleStepPatch`, the three renderers, `WorkflowEditorConfig`, and in `[AWET]`: `createTestFormModelFactory`, `createStepFormOptions`, `renderStepFormField` (Tasks 12-14). The step fixtures are Task 8's `[AWET]/draftFixtures.ts` (`createReviewStep`, `createAutomationStep`, `createAiStep`, `createWebhookAutomation`) on Task 5's `editorFixtures.ts`.

**Test runner note:** admin package, `yarn test <path>` only; `.tsx` tests import `React`. The picker components of Task 4 are replaced by stubs in the renderer test so it asserts the props the renderer passes, not the picker internals (Task 4 tests those).

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/testing/createTestFormModelFactory.ts` (DI, so a non-pure file of the testing folder, R243):

```ts
import { Container } from "@webiny/di";
import { FormModelFactory } from "@webiny/app-admin";
import { FormModelFeature } from "@webiny/app-admin/features/formModel/feature.js";
import { IdentityContextFeature } from "@webiny/app-admin/features/security/IdentityContext/feature.js";

// The real FormModel factory in a throw-away container, as the FormModel tests build it.
export const createTestFormModelFactory = (): FormModelFactory.Interface => {
    const container = new Container();
    IdentityContextFeature.register(container);
    FormModelFeature.register(container);
    return container.resolve(FormModelFactory);
};
```

Create `packages/app-workflows/src/editor/testing/createStepFormOptions.ts` (pure):

```ts
import { createEmptyStepFormOptions } from "~/editor/presentation/stepForm/createEmptyStepFormOptions.js";
import type { StepFormOptions } from "~/editor/presentation/stepForm/StepFormOptions.js";

// The options the drawer provides, all lists loaded and empty; override one section per test.
export const createStepFormOptions = (overrides: Partial<StepFormOptions> = {}): StepFormOptions => {
    return { ...createEmptyStepFormOptions(), ...overrides };
};
```

Create `packages/app-workflows/src/editor/testing/renderStepFormField.tsx`:

```tsx
import React from "react";
import type { RenderResult } from "@testing-library/react";
import { createReactiveComponent } from "@webiny/app-admin";
import type { FormModel } from "@webiny/app-admin";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { StepFormOptionsContext } from "~/editor/presentation/stepForm/StepFormOptionsContext.js";
import type { StepFormOptions } from "~/editor/presentation/stepForm/StepFormOptions.js";
import { createStepFormOptions } from "./createStepFormOptions.js";

export interface StepFormFieldRendererProps {
    field: FormModel.FieldVM;
}

export interface RenderStepFormFieldParams {
    form: FormModel.Interface;
    name: string;
    Renderer: React.ComponentType<StepFormFieldRendererProps>;
    options?: StepFormOptions;
}

// Renders one field renderer of a real form inside the options context; re-renders on field changes.
export const renderStepFormField = (params: RenderStepFormFieldParams): RenderResult => {
    const { form, name, Renderer } = params;
    const options = params.options ?? createStepFormOptions();

    const Host = createReactiveComponent(function Host() {
        return (
            <StepFormOptionsContext.Provider value={options}>
                <Renderer field={form.field(name).vm} />
            </StepFormOptionsContext.Provider>
        );
    });

    return renderWithAdminUi(<Host />);
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/isValidStepColour.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { isValidStepColour } from "./isValidStepColour.js";

describe("isValidStepColour (R273)", () => {
    it("accepts a preset token string", () => {
        expect(isValidStepColour("var(--color-primary-500)")).toBe(true);
    });

    it("accepts #RRGGBB in either case", () => {
        expect(isValidStepColour("#3B6FD4")).toBe(true);
        expect(isValidStepColour("#3b6fd4")).toBe(true);
    });

    it("rejects an unfinished or malformed hex", () => {
        expect(isValidStepColour("#")).toBe(false);
        expect(isValidStepColour("#3B6")).toBe(false);
        expect(isValidStepColour("#3B6FD4A")).toBe(false);
        expect(isValidStepColour("#GGGGGG")).toBe(false);
    });

    it("keeps a loaded value that is neither a preset nor a hex (it is not a hex error)", () => {
        expect(isValidStepColour("blue")).toBe(true);
        expect(isValidStepColour("")).toBe(true);
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/buildCommonFields.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { createTestFormModelFactory } from "~/editor/testing/createTestFormModelFactory.js";
import { buildCommonFields } from "./buildCommonFields.js";
import { STEP_FORM_RENDERER } from "./stepFormRendererNames.js";

const createForm = (readOnly = false) => {
    return createTestFormModelFactory().create({
        fields: registry => {
            const common = buildCommonFields({
                registry,
                descriptionPlaceholder: "Describe the step",
                readOnly
            });
            return {
                title: common.title,
                color: common.color,
                description: common.description,
                notifications: common.notifications
            };
        }
    });
};

describe("buildCommonFields (R270, R272, R273)", () => {
    it("labels, placeholders and renderers", () => {
        const form = createForm();

        expect(form.field("title").vm.label).toBe("Title");
        expect(form.field("title").vm.placeholder).toBe("e.g. Legal sign-off");
        expect(form.field("color").vm.label).toBe("Colour");
        expect(form.field("color").vm.renderer).toBe(STEP_FORM_RENDERER.colour);
        expect(form.field("description").vm.label).toBe("Description");
        expect(form.field("description").vm.placeholder).toBe("Describe the step");
        expect(form.field("description").vm.renderer).toBe("textarea");
        expect(form.field("notifications").vm.label).toBe("Notify via");
        expect(form.field("notifications").vm.renderer).toBe(STEP_FORM_RENDERER.transports);
        expect(form.field("notifications").vm.isList).toBe(true);
    });

    it("shows the Notify via hint as the visible description (D96)", () => {
        const form = createForm();

        expect(form.field("notifications").vm.description).toBe(
            "In-app notifications are always sent. Who gets notified is set automatically from the step."
        );
    });

    it("requires a title with the design message (QBZ-12)", async () => {
        const form = createForm();
        const title = form.field("title");

        expect(await title.validate({ force: true })).toBe(false);
        expect(title.vm.validation.message).toBe("Enter a title for this step.");

        title.setValue("Legal sign-off");

        expect(await title.validate({ force: true })).toBe(true);
    });

    it("validates a field after each edit, so errors appear once it was edited (QBZ-13)", async () => {
        const form = createForm();
        const title = form.field("title");

        title.vm.onChange("Legal");
        title.vm.onChange("");

        await vi.waitFor(() => {
            expect(form.field("title").vm.validation.message).toBe("Enter a title for this step.");
        });
    });

    it("flags an unfinished hex colour live and accepts a finished one (R273)", async () => {
        const form = createForm();

        form.field("color").vm.onChange("#3B6");

        await vi.waitFor(() => {
            expect(form.field("color").vm.validation.message).toBe(
                "Enter a hex colour, e.g. #3B6FD4."
            );
        });

        form.field("color").vm.onChange("#3B6FD4");

        await vi.waitFor(() => {
            expect(form.field("color").vm.validation.isValid).toBe(true);
        });
    });

    it("does not block an empty colour or a loaded colour that is not a preset", async () => {
        const form = createForm();
        const color = form.field("color");

        color.setValue("blue");

        expect(await color.validate({ force: true })).toBe(true);
    });

    it("disables every field when read-only", () => {
        const form = createForm(true);

        ["title", "color", "description", "notifications"].forEach(name => {
            expect(form.field(name).vm.disabled).toBe(true);
        });
        expect(createForm(false).field("title").vm.disabled).toBe(false);
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/commonStepData.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { getCommonFormData } from "./getCommonFormData.js";
import { getCommonStepPatch } from "./getCommonStepPatch.js";

describe("getCommonFormData", () => {
    it("copies the common fields and turns a null description into an empty one", () => {
        const step = createReviewStep({ notificationIds: ["e-mail", "legacy-sms"] });

        expect(getCommonFormData(step)).toEqual({
            title: "Legal sign-off",
            color: "var(--color-primary-500)",
            description: "",
            notifications: ["e-mail", "legacy-sms"]
        });
    });

    it("does not share the notifications array with the step", () => {
        const step = createReviewStep();

        expect(getCommonFormData(step).notifications).not.toBe(step.notificationIds);
    });
});

describe("getCommonStepPatch (R270, R273, R272)", () => {
    const values = {
        title: "Legal review",
        color: "var(--color-warning-600)",
        description: "Check the claims",
        notifications: ["e-mail"]
    };

    it("writes the four common fields (notifications as notificationIds)", () => {
        expect(getCommonStepPatch(createReviewStep(), values)).toEqual({
            title: "Legal review",
            color: "var(--color-warning-600)",
            description: "Check the claims",
            notificationIds: ["e-mail"]
        });
    });

    it("turns an empty description into null and a missing title or notifications into empty values", () => {
        const patch = getCommonStepPatch(createReviewStep(), {
            title: null,
            color: null,
            description: "",
            notifications: null
        });

        expect(patch).toEqual({
            title: "",
            color: "var(--color-primary-500)",
            description: null,
            notificationIds: []
        });
    });

    it("applies a finished custom hex colour", () => {
        const patch = getCommonStepPatch(createReviewStep(), { ...values, color: "#3B6FD4" });

        expect(patch.color).toBe("#3B6FD4");
    });

    it("keeps the step's colour when the hex is unfinished or the colour was cleared (it never reaches the draft)", () => {
        const step = createReviewStep({ color: "#3B6FD4" });

        expect(getCommonStepPatch(step, { ...values, color: "#3B6" }).color).toBe("#3B6FD4");
        expect(getCommonStepPatch(step, { ...values, color: "" }).color).toBe("#3B6FD4");
    });

    it("keeps unlisted transport ids that the form carries (D151)", () => {
        const patch = getCommonStepPatch(createReviewStep(), {
            ...values,
            notifications: ["legacy-sms", "e-mail"]
        });

        expect(patch.notificationIds).toEqual(["legacy-sms", "e-mail"]);
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/buildPeopleStepForm.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createTestFormModelFactory } from "~/editor/testing/createTestFormModelFactory.js";
import { buildPeopleStepForm } from "./buildPeopleStepForm.js";
import { getPeopleFormData } from "./getPeopleFormData.js";
import { getPeopleStepPatch } from "./getPeopleStepPatch.js";
import { STEP_FORM_RENDERER } from "./stepFormRendererNames.js";

const createForm = () => {
    return createTestFormModelFactory().create(buildPeopleStepForm());
};

describe("buildPeopleStepForm (R270)", () => {
    it("has the common fields and the teams field, in the design order, with no tabs", () => {
        const form = createForm();
        const names = form.vm.layout.flatMap(node => {
            return node.type === "row" ? node.fields.map(field => field.name) : [node.type];
        });

        expect(names).toEqual(["title", "color", "description", "teams", "notifications"]);
    });

    it("describes the teams field (the hint is the first sentence only, R270)", () => {
        const teams = createForm().field("teams").vm;

        expect(teams.label).toBe("Reviewing teams");
        expect(teams.description).toBe("Members of these teams can review.");
        expect(teams.renderer).toBe(STEP_FORM_RENDERER.teams);
        expect(teams.isList).toBe(true);
    });

    it("uses the People description placeholder", () => {
        const form = createForm();

        expect(form.field("description").vm.placeholder).toBe(
            "What reviewers should look for in this step"
        );
    });

    it("requires at least one team (QBZ-12)", async () => {
        const form = createForm();
        const teams = form.field("teams");

        expect(await teams.validate({ force: true })).toBe(false);
        expect(teams.vm.validation.message).toBe("Choose at least one reviewing team.");

        teams.setValue(["team-1"]);

        expect(await teams.validate({ force: true })).toBe(true);
    });

    it("loads a step without becoming dirty and reads back what it loaded", () => {
        const form = createForm();
        const step = createReviewStep({ description: "Check claims" });

        form.setData(getPeopleFormData(step), { dirty: false });

        expect(form.isDirty).toBe(false);
        expect(form.getData()).toEqual({
            title: "Legal sign-off",
            color: "var(--color-primary-500)",
            description: "Check claims",
            teams: ["team-1"],
            notifications: ["e-mail"]
        });
    });
});

describe("getPeopleFormData", () => {
    it("lists the stored team ids and ignores anything that is not a string", () => {
        const step = createReviewStep({ config: { teams: ["team-1", 7, null, "team-2"] } });

        expect(getPeopleFormData(step).teams).toEqual(["team-1", "team-2"]);
    });

    it("is an empty list for a step with no teams", () => {
        expect(getPeopleFormData(createReviewStep({ config: {} })).teams).toEqual([]);
        expect(getPeopleFormData(createReviewStep({ config: null })).teams).toEqual([]);
    });
});

describe("getPeopleStepPatch (R270, Review Focus 3)", () => {
    const values = {
        title: "Legal review",
        color: "var(--color-warning-600)",
        description: null,
        notifications: ["e-mail"],
        teams: ["team-2"]
    };

    it("writes exactly the People config keys: teams and assignment", () => {
        const patch = getPeopleStepPatch(createReviewStep(), values);

        expect(patch.config).toEqual({
            teams: ["team-2"],
            assignment: { strategy: "none", allowManualPick: false, rules: [] }
        });
    });

    it("carries the stored assignment unchanged (9b edits it)", () => {
        const assignment = {
            strategy: "roundRobin",
            allowManualPick: true,
            rules: [{ id: "rule-1", teamId: "team-1" }]
        };
        const step = createReviewStep({ config: { teams: ["team-1"], assignment } });

        expect(getPeopleStepPatch(step, values).config).toEqual({ teams: ["team-2"], assignment });
    });

    it("defaults the assignment only when the step has none", () => {
        const step = createReviewStep({ config: { teams: ["team-1"] } });

        expect(getPeopleStepPatch(step, values).config).toEqual({
            teams: ["team-2"],
            assignment: { strategy: "none", allowManualPick: false, rules: [] }
        });
    });

    it("includes the common fields and treats missing teams as an empty list", () => {
        const patch = getPeopleStepPatch(createReviewStep(), { ...values, teams: null });

        expect(patch.title).toBe("Legal review");
        expect(patch.config).toEqual({
            teams: [],
            assignment: { strategy: "none", allowManualPick: false, rules: [] }
        });
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/StepColourRenderer.test.tsx`:

```tsx
import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { renderStepFormField } from "~/editor/testing/renderStepFormField.js";
import { createTestFormModelFactory } from "~/editor/testing/createTestFormModelFactory.js";
import { buildCommonFields } from "../buildCommonFields.js";
import { StepColourRenderer } from "./StepColourRenderer.js";

const LABELS = ["Orange", "Rust", "Amber", "Olive", "Teal", "Green", "Red", "Maroon", "Gray", "Ink"];

const createColourForm = (colour: string, readOnly = false) => {
    const form = createTestFormModelFactory().create({
        fields: registry => {
            const common = buildCommonFields({ registry, descriptionPlaceholder: "", readOnly });
            return { color: common.color };
        }
    });
    form.setData({ color: colour }, { dirty: false });
    return form;
};

const renderColour = (colour: string, readOnly = false) => {
    const form = createColourForm(colour, readOnly);
    renderStepFormField({ form, name: "color", Renderer: StepColourRenderer });
    return form;
};

const hexInput = (): HTMLInputElement => {
    const input = screen.getByLabelText("Hex colour");
    return input as HTMLInputElement;
};

describe("StepColourRenderer (R273)", () => {
    afterEach(() => {
        cleanup();
    });

    it("lists the ten presets in order as buttons named by their label", () => {
        renderColour("var(--color-primary-500)");

        const presets = LABELS.map(label => screen.getByRole("button", { name: label }));

        expect(presets).toHaveLength(10);
        expect(screen.getAllByRole("button")).toEqual(presets);
    });

    it("marks only the stored preset as pressed", () => {
        renderColour("var(--color-warning-600)");

        expect(screen.getByRole("button", { name: "Amber" }).getAttribute("aria-pressed")).toBe(
            "true"
        );
        expect(screen.getByRole("button", { name: "Orange" }).getAttribute("aria-pressed")).toBe(
            "false"
        );
    });

    it("stores the preset's token string when a swatch is clicked", () => {
        const form = renderColour("var(--color-primary-500)");

        fireEvent.click(screen.getByRole("button", { name: "Amber" }));

        expect(form.field("color").getValue()).toBe("var(--color-warning-600)");
    });

    it("types a custom hex, prepending # when it is missing", () => {
        const form = renderColour("var(--color-primary-500)");

        fireEvent.change(hexInput(), { target: { value: "3B6FD4" } });

        expect(form.field("color").getValue()).toBe("#3B6FD4");
        expect(hexInput().value).toBe("#3B6FD4");
    });

    it("keeps an unfinished hex in the field and shows the error", async () => {
        const form = renderColour("var(--color-primary-500)");

        fireEvent.change(hexInput(), { target: { value: "#3B6" } });

        expect(form.field("color").getValue()).toBe("#3B6");
        expect(hexInput().value).toBe("#3B6");
        expect(await screen.findByText("Enter a hex colour, e.g. #3B6FD4.")).toBeDefined();
    });

    it("takes the colour of the native colour input as an upper-case hex", () => {
        const form = renderColour("var(--color-primary-500)");

        fireEvent.change(screen.getByLabelText("Custom colour"), { target: { value: "#3b6fd4" } });

        expect(form.field("color").getValue()).toBe("#3B6FD4");
    });

    it("shows a stored custom hex in the hex box and presses no preset", () => {
        renderColour("#3B6FD4");

        expect(hexInput().value).toBe("#3B6FD4");
        LABELS.forEach(label => {
            expect(screen.getByRole("button", { name: label }).getAttribute("aria-pressed")).toBe(
                "false"
            );
        });
    });

    it("shows a loaded colour that is neither as no selection with an empty hex box", () => {
        renderColour("blue");

        expect(hexInput().value).toBe("");
        expect(screen.getByRole("button", { name: "Orange" }).getAttribute("aria-pressed")).toBe(
            "false"
        );
    });

    it("disables the swatches and the inputs when read-only", () => {
        renderColour("var(--color-primary-500)", true);

        expect((screen.getByRole("button", { name: "Orange" }) as HTMLButtonElement).disabled).toBe(
            true
        );
        expect(hexInput().disabled).toBe(true);
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/TeamsPickerRenderer.test.tsx`:

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
import { buildPeopleStepForm } from "../buildPeopleStepForm.js";
import { STEP_FORM_RENDERER } from "../stepFormRendererNames.js";
import { TeamsPickerRenderer } from "./TeamsPickerRenderer.js";

interface MultiPickerStubProps {
    label: string;
    description?: string;
    required?: boolean;
    values: string[];
    selected: PickerOption[];
    options: PickerOption[];
    placeholder: string;
    disabled: boolean;
    error: string | null;
    onChange(ids: string[]): void;
    onSearch(search: string): void;
}

interface SinglePickerStubProps {
    label: string;
    value: string | null;
    selected: PickerOption | null;
    placeholder: string;
    onChange(id: string | null): void;
}

// Stubs of the Task 4 pickers: they expose the props the renderer passes and two buttons.
vi.mock("~/components/picker/WorkflowMultiPicker.js", async () => {
    const react = await import("react");
    return {
        WorkflowMultiPicker: (props: MultiPickerStubProps) => {
            return react.createElement(
                "div",
                {
                    "data-testid": "multi-picker",
                    "data-label": props.label,
                    "data-description": props.description ?? "",
                    "data-required": String(props.required ?? false),
                    "data-values": props.values.join(","),
                    "data-selected": props.selected.map(option => option.id).join(","),
                    "data-options": props.options.map(option => option.id).join(","),
                    "data-placeholder": props.placeholder,
                    "data-disabled": String(props.disabled),
                    "data-error": props.error ?? ""
                },
                react.createElement(
                    "button",
                    { onClick: () => props.onChange(["team-2"]) },
                    "pick team-2"
                ),
                react.createElement("button", { onClick: () => props.onSearch("leg") }, "search")
            );
        }
    };
});

vi.mock("~/components/picker/WorkflowPicker.js", async () => {
    const react = await import("react");
    return {
        WorkflowPicker: (props: SinglePickerStubProps) => {
            return react.createElement(
                "div",
                {
                    "data-testid": "single-picker",
                    "data-label": props.label,
                    "data-value": props.value ?? "",
                    "data-selected": props.selected?.label ?? "",
                    "data-placeholder": props.placeholder
                },
                react.createElement("button", { onClick: () => props.onChange(null) }, "clear")
            );
        }
    };
});

const TEAM_1: PickerOption = { id: "team-1", label: "Legal", description: null, warning: null };
const TEAM_2: PickerOption = { id: "team-2", label: "Editors", description: null, warning: null };

const createPeopleForm = (teams: string[]) => {
    const form = createTestFormModelFactory().create(buildPeopleStepForm());
    form.setData({ teams }, { dirty: false });
    return form;
};

describe("TeamsPickerRenderer (R282, Q42)", () => {
    afterEach(() => {
        cleanup();
    });

    it("passes the label, description, value, options, selected teams and placeholder to the multi picker", () => {
        const form = createPeopleForm(["team-1"]);

        renderStepFormField({
            form,
            name: "teams",
            Renderer: TeamsPickerRenderer,
            options: createStepFormOptions({
                teams: {
                    loading: false,
                    failed: false,
                    retry: vi.fn(),
                    options: [TEAM_1, TEAM_2],
                    selected: [TEAM_1],
                    search: vi.fn()
                }
            })
        });

        const picker = screen.getByTestId("multi-picker");
        expect(picker.getAttribute("data-values")).toBe("team-1");
        expect(picker.getAttribute("data-selected")).toBe("team-1");
        expect(picker.getAttribute("data-options")).toBe("team-1,team-2");
        expect(picker.getAttribute("data-placeholder")).toBe("Search teams");
        expect(picker.getAttribute("data-label")).toBe("Reviewing teams");
        expect(picker.getAttribute("data-description")).toBe("Members of these teams can review.");
        expect(picker.getAttribute("data-required")).toBe("true");
    });

    it("writes the picked ids to the field and forwards a search to the options", () => {
        const form = createPeopleForm(["team-1"]);
        const search = vi.fn();
        renderStepFormField({
            form,
            name: "teams",
            Renderer: TeamsPickerRenderer,
            options: createStepFormOptions({
                teams: {
                    loading: false,
                    failed: false,
                    retry: vi.fn(),
                    options: [TEAM_1, TEAM_2],
                    selected: [TEAM_1],
                    search
                }
            })
        });

        fireEvent.click(screen.getByText("pick team-2"));
        fireEvent.click(screen.getByText("search"));

        expect(form.field("teams").getValue()).toEqual(["team-2"]);
        expect(search).toHaveBeenCalledWith("leg");
    });

    it("shows the validation message through the picker's error", async () => {
        const form = createPeopleForm([]);
        await form.field("teams").validate({ force: true });

        renderStepFormField({ form, name: "teams", Renderer: TeamsPickerRenderer });

        expect(screen.getByTestId("multi-picker").getAttribute("data-error")).toBe(
            "Choose at least one reviewing team."
        );
    });

    it("replaces the picker with the options failure and a Try again button", () => {
        const form = createPeopleForm(["team-1"]);
        const retry = vi.fn();
        renderStepFormField({
            form,
            name: "teams",
            Renderer: TeamsPickerRenderer,
            options: createStepFormOptions({
                teams: {
                    loading: false,
                    failed: true,
                    retry,
                    options: [],
                    selected: [],
                    search: vi.fn()
                }
            })
        });

        expect(screen.queryByTestId("multi-picker")).toBeNull();
        expect(screen.getByText("Reviewing teams")).toBeDefined();
        expect(screen.getByText("Could not load the step options.")).toBeDefined();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(retry).toHaveBeenCalledTimes(1);
    });

    it("renders a clearable single picker for a plain text field (a team setting)", () => {
        const form = createTestFormModelFactory().create({
            fields: registry => {
                return {
                    team: registry.text().label("Team").renderer(STEP_FORM_RENDERER.teams)
                };
            }
        });
        form.setData({ team: "team-2" }, { dirty: false });

        renderStepFormField({
            form,
            name: "team",
            Renderer: TeamsPickerRenderer,
            options: createStepFormOptions({
                teams: {
                    loading: false,
                    failed: false,
                    retry: vi.fn(),
                    options: [TEAM_1, TEAM_2],
                    selected: [],
                    search: vi.fn()
                }
            })
        });

        const picker = screen.getByTestId("single-picker");
        expect(picker.getAttribute("data-value")).toBe("team-2");
        expect(picker.getAttribute("data-selected")).toBe("Editors");
        expect(picker.getAttribute("data-placeholder")).toBe("Search teams");

        fireEvent.click(screen.getByText("clear"));

        expect(form.field("team").getValue()).toBeNull();
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/TransportCheckboxesRenderer.test.tsx`:

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
import type { StepFormTransportsOptions } from "../StepFormOptions.js";
import { buildPeopleStepForm } from "../buildPeopleStepForm.js";
import { TransportCheckboxesRenderer } from "./TransportCheckboxesRenderer.js";

const HINT =
    "In-app notifications are always sent. Who gets notified is set automatically from the step.";

const createForm = (notifications: string[]) => {
    const form = createTestFormModelFactory().create(buildPeopleStepForm());
    form.setData({ notifications }, { dirty: false });
    return form;
};

const transports = (overrides: Partial<StepFormTransportsOptions> = {}): StepFormTransportsOptions => {
    return {
        loading: false,
        failed: false,
        retry: vi.fn(),
        options: [
            { id: "e-mail", title: "E-mail", description: "Sends an e-mail" },
            { id: "slack", title: "Slack", description: null }
        ],
        ...overrides
    };
};

const renderTransports = (form: ReturnType<typeof createForm>, options: StepFormTransportsOptions) => {
    renderStepFormField({
        form,
        name: "notifications",
        Renderer: TransportCheckboxesRenderer,
        options: createStepFormOptions({ transports: options })
    });
};

describe("TransportCheckboxesRenderer (R272, D151)", () => {
    afterEach(() => {
        cleanup();
    });

    it("lists one checkbox per transport, with the description after the title", () => {
        renderTransports(createForm(["e-mail"]), transports());

        const email = screen.getByRole("checkbox", { name: "E-mail · Sends an e-mail" });
        const slack = screen.getByRole("checkbox", { name: "Slack" });
        expect(email.getAttribute("aria-checked")).toBe("true");
        expect(slack.getAttribute("aria-checked")).toBe("false");
        expect(screen.getByText(HINT)).toBeDefined();
    });

    it("ticks a transport and keeps the ids it does not list", () => {
        const form = createForm(["legacy-sms"]);
        renderTransports(form, transports());

        fireEvent.click(screen.getByRole("checkbox", { name: "Slack" }));

        expect(form.field("notifications").getValue()).toEqual(["legacy-sms", "slack"]);
    });

    it("unticks only the clicked transport", () => {
        const form = createForm(["legacy-sms", "e-mail", "slack"]);
        renderTransports(form, transports());

        fireEvent.click(screen.getByRole("checkbox", { name: "E-mail · Sends an e-mail" }));

        expect(form.field("notifications").getValue()).toEqual(["legacy-sms", "slack"]);
    });

    it("never shows an id the list does not contain", () => {
        renderTransports(createForm(["legacy-sms"]), transports());

        expect(screen.queryByText("legacy-sms")).toBeNull();
        expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    });

    it("says only in-app notifications exist when there are no transports, and keeps the hint", () => {
        renderTransports(createForm([]), transports({ options: [] }));

        expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
        expect(
            screen.getByText(
                "Only in-app notifications are available. No other channels are configured."
            )
        ).toBeDefined();
        expect(screen.getByText(HINT)).toBeDefined();
    });

    it("does not claim there are no transports while the list loads", () => {
        renderTransports(createForm([]), transports({ options: [], loading: true }));

        expect(
            screen.queryByText(
                "Only in-app notifications are available. No other channels are configured."
            )
        ).toBeNull();
        expect(screen.getByText(HINT)).toBeDefined();
    });

    it("shows the options failure with Try again", () => {
        const retry = vi.fn();
        renderTransports(createForm([]), transports({ options: [], failed: true, retry }));

        expect(screen.getByText("Could not load the step options.")).toBeDefined();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(retry).toHaveBeenCalledTimes(1);
    });
});
```

Create `packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx`:

```tsx
import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { WorkflowEditorConfig } from "./WorkflowEditorConfig.js";

interface FieldRendererStubProps {
    name: string;
}

interface PassthroughStubProps {
    children?: React.ReactNode;
}

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    const react = await import("react");
    const FieldRenderer = (props: FieldRendererStubProps) => {
        return react.createElement("div", { "data-testid": "field-renderer", "data-name": props.name });
    };
    const Passthrough = (props: PassthroughStubProps) => {
        return react.createElement(react.Fragment, null, props.children);
    };
    return { ...actual, AdminConfig: Object.assign(Passthrough, { Form: { FieldRenderer } }) };
});

describe("WorkflowEditorConfig", () => {
    afterEach(() => {
        cleanup();
    });

    it("registers the step colour, teams picker and transport renderers", () => {
        render(<WorkflowEditorConfig />);

        const names = screen.getAllByTestId("field-renderer").map(element => {
            return element.getAttribute("data-name");
        });

        expect(names).toEqual(["workflowStepColour", "workflowTeamsPicker", "workflowTransports"]);
    });
});
```

Modify `packages/app-workflows/src/app.test.tsx`. Add `screen` to the RTL imports, replacing

```ts
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
```

with

```ts
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
```

Add this mock below the existing `vi.mock("~/presentation/permissions/index.js", ...)` block:

```ts
vi.mock("~/editor/WorkflowEditorConfig.js", async () => {
    const react = await import("react");
    return {
        WorkflowEditorConfig: () => {
            return react.createElement("div", { "data-testid": "workflow-editor-config" });
        }
    };
});
```

Append at the end of the file:

```tsx
describe("WorkflowsAdminApp editor config", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("mounts the editor config (field renderers) when the flag is on", () => {
        mount(true);

        expect(screen.getByTestId("workflow-editor-config")).toBeDefined();
    });

    it("mounts nothing of it when the flag is off (R211)", () => {
        mount(false);

        expect(screen.queryByTestId("workflow-editor-config")).toBeNull();
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm/isValidStepColour.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/buildCommonFields.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/commonStepData.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/buildPeopleStepForm.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/StepColourRenderer.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/TeamsPickerRenderer.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/TransportCheckboxesRenderer.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
```

Expected: every new test file fails with `Failed to resolve import` for the module it tests (`isValidStepColour.js`, `buildCommonFields.js`, `getCommonFormData.js`, `buildPeopleStepForm.js`, the three renderers, `WorkflowEditorConfig.js`) or for `StepFormOptionsContext.js` through the testing helper; `app.test.tsx` fails because `~/editor/WorkflowEditorConfig.js` does not exist (the mock factory cannot be resolved) or, with the file stubbed, because `workflow-editor-config` is never rendered. Record the RED output.

- [ ] **Step 3: Implement**

Modify `packages/app-workflows/package.json`: add `zod` (the version every other admin package uses) after `react-helmet`:

```json
    "react-helmet": "^6.1.0",
    "zod": "4.4.3"
  },
```

(the `},` closes `dependencies`; keep the other entries as they are).

Create `packages/app-workflows/src/editor/presentation/stepForm/StepFormOptions.ts`:

```ts
import type { PickerOption } from "~/components/picker/PickerOption.js";

// What every list a step form reads has: whether it is loading, whether loading failed, and a retry.
export interface StepFormListState {
    loading: boolean;
    failed: boolean;
    retry: () => void;
}

export interface StepFormTeamsOptions extends StepFormListState {
    // The search results, already limited by the picker (R282).
    options: PickerOption[];
    // The chosen teams with their labels, so a chip keeps its name when a search narrows the list.
    selected: PickerOption[];
    search: (query: string) => void;
}

export interface StepFormTransportOption {
    id: string;
    title: string;
    description: string | null;
}

export interface StepFormTransportsOptions extends StepFormListState {
    options: StepFormTransportOption[];
}

export interface StepFormAutomationOption {
    id: string;
    name: string;
    description: string | null;
}

export interface StepFormAutomationsOptions extends StepFormListState {
    // The definitions covering the workflow's model (R274).
    options: StepFormAutomationOption[];
    // The reason shown instead of the cards when there are none.
    emptyText: string;
    // `The automation “{name}” no longer exists.` or null.
    warning: string | null;
    // `Saved settings no longer validate: {error}` or null (QBZ-13).
    settingsWarning: string | null;
    select: (id: string) => void;
}

export interface StepFormAiModelsOptions extends StepFormListState {
    options: PickerOption[];
    // The stored model, also when it is retired (QBZ-8) or the list failed.
    selected: PickerOption | null;
    // The list loaded and has no model.
    empty: boolean;
    search: (query: string) => void;
}

export interface StepFormAiToolOption {
    name: string;
    title: string;
    description: string;
    // The tool can edit the revision under review (R283): the form tags it `Changes content`.
    changesContent: boolean;
}

export interface StepFormAiToolsOptions extends StepFormListState {
    options: StepFormAiToolOption[];
}

// The one value the drawer provides to every renderer of a step form (R234: the presenter owns the data).
export interface StepFormOptions {
    teams: StepFormTeamsOptions;
    transports: StepFormTransportsOptions;
    automations: StepFormAutomationsOptions;
    aiModels: StepFormAiModelsOptions;
    aiTools: StepFormAiToolsOptions;
}
```

Create `packages/app-workflows/src/editor/presentation/stepForm/StepFormOptionsContext.ts`:

```ts
import { createContext } from "react";
import type { StepFormOptions } from "./StepFormOptions.js";

export const StepFormOptionsContext = createContext<StepFormOptions | null>(null);
```

Create `packages/app-workflows/src/editor/presentation/stepForm/useStepFormOptions.ts`:

```ts
import { useContext } from "react";
import { StepFormOptionsContext } from "./StepFormOptionsContext.js";
import type { StepFormOptions } from "./StepFormOptions.js";

export const useStepFormOptions = (): StepFormOptions => {
    const options = useContext(StepFormOptionsContext);
    if (options === null) {
        throw new Error("useStepFormOptions must be used inside the step drawer.");
    }
    return options;
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/StepFormData.ts`:

```ts
// The values of each step form, as `form.getData()` returns them (an untouched text field is null).

export interface CommonFormValues {
    title: string | null;
    color: string | null;
    description: string | null;
    notifications: string[] | null;
}

export interface PeopleFormValues extends CommonFormValues {
    teams: string[] | null;
}

export interface AutomationFormValues extends CommonFormValues {
    automationId: string | null;
    settings: Record<string, unknown> | null;
}

export interface AiFormValues extends CommonFormValues {
    instructions: string | null;
    model: string | null;
    tools: string[] | null;
}
```

Create `packages/app-workflows/src/editor/presentation/stepForm/stepFormRendererNames.ts`:

```ts
// The names of the step form renderers, registered by `WorkflowEditorConfig` and used by the builders.
export const STEP_FORM_RENDERER = {
    colour: "workflowStepColour",
    teams: "workflowTeamsPicker",
    transports: "workflowTransports",
    automations: "workflowAutomationCards",
    aiModel: "workflowAiModel",
    aiTools: "workflowAiTools"
} as const;

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        workflowStepColour: { fieldType: "text"; settings: undefined };
        workflowTeamsPicker: { fieldType: "text"; settings: undefined };
        workflowTransports: { fieldType: "text"; settings: undefined };
        workflowAutomationCards: { fieldType: "text"; settings: undefined };
        workflowAiModel: { fieldType: "text"; settings: undefined };
        workflowAiTools: { fieldType: "text"; settings: undefined };
    }
}
```

Create `packages/app-workflows/src/editor/presentation/stepForm/stepFormMessages.ts`:

```ts
import { HEX_COLOUR_MESSAGE } from "~/editor/domain/stepColours.js";

// Copy of the common and People step forms (research-spec.md 4, contract-review-1.md string list, Q43).
export const STEP_FORM_MESSAGES = {
    titleRequired: "Enter a title for this step.",
    teamsRequired: "Choose at least one reviewing team.",
    teamsHint: "Members of these teams can review.",
    teamsPlaceholder: "Search teams",
    teamHasNoMembers: "This team has no members",
    hexColour: HEX_COLOUR_MESSAGE,
    notifyHint:
        "In-app notifications are always sent. Who gets notified is set automatically from the step.",
    noTransports: "Only in-app notifications are available. No other channels are configured.",
    optionsFailed: "Could not load the step options.",
    tryAgain: "Try again",
    peopleDescriptionPlaceholder: "What reviewers should look for in this step"
} as const;
```

Create `packages/app-workflows/src/editor/presentation/stepForm/isValidStepColour.ts`:

```ts
import { isHexColour } from "~/editor/domain/isHexColour.js";

/*
 * A colour value is wrong only when it is a hex attempt (starts with `#`) that is not `#RRGGBB`
 * (R273). A preset token string and a loaded value that is neither stay valid and are kept.
 */
export const isValidStepColour = (colour: string): boolean => {
    if (!colour.startsWith("#")) {
        return true;
    }
    return isHexColour(colour);
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/createEmptyStepFormOptions.ts`:

```ts
import type { StepFormOptions } from "./StepFormOptions.js";

const noop = (): void => undefined;

// The options of a closed drawer, and the defaults of the tests: every list loaded and empty.
export const createEmptyStepFormOptions = (): StepFormOptions => {
    return {
        teams: { loading: false, failed: false, retry: noop, options: [], selected: [], search: noop },
        transports: { loading: false, failed: false, retry: noop, options: [] },
        automations: {
            loading: false,
            failed: false,
            retry: noop,
            options: [],
            emptyText: "No automations are available for this model.",
            warning: null,
            settingsWarning: null,
            select: noop
        },
        aiModels: {
            loading: false,
            failed: false,
            retry: noop,
            options: [],
            selected: null,
            empty: false,
            search: noop
        },
        aiTools: { loading: false, failed: false, retry: noop, options: [] }
    };
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/validateAfterChange.ts`:

```ts
import type { AfterChangeCallback } from "@webiny/app-admin";

/*
 * FormModel validates on blur only after a submit, so a field with a client rule validates after
 * each edit instead: its message appears once it was edited (QBZ-13) and the next edit replaces a
 * server error set with `setValidation`.
 */
export const validateAfterChange = (path: string): AfterChangeCallback => {
    return (_value, params) => {
        void params.form.field(path).validate();
    };
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/toTeamPickerOption.ts`:

```ts
import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { WorkflowTeamSummary } from "~/editor/domain/types.js";
import { STEP_FORM_MESSAGES } from "./stepFormMessages.js";

// A team as a picker option; a team with no members carries the chip warning (R282).
export const toTeamPickerOption = (team: WorkflowTeamSummary): PickerOption => {
    let warning: string | null = null;
    if (team.memberCount === 0) {
        warning = STEP_FORM_MESSAGES.teamHasNoMembers;
    }
    return { id: team.id, label: team.name, description: null, warning };
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/buildCommonFields.ts`:

```ts
import { z } from "zod";
import type { FormModelFactory } from "@webiny/app-admin";
import { isValidStepColour } from "./isValidStepColour.js";
import { STEP_FORM_MESSAGES } from "./stepFormMessages.js";
import { STEP_FORM_RENDERER } from "./stepFormRendererNames.js";
import { validateAfterChange } from "./validateAfterChange.js";

const colourSchema = z.string().refine(isValidStepColour, { message: STEP_FORM_MESSAGES.hexColour });

export interface CommonFieldsParams {
    registry: FormModelFactory.FieldBuilderRegistry;
    descriptionPlaceholder: string;
    // The AI step without the licence (R275): every field is disabled.
    readOnly: boolean;
}

export interface CommonFieldBuilders {
    title: FormModelFactory.FieldBuilder;
    color: FormModelFactory.FieldBuilder;
    description: FormModelFactory.FieldBuilder;
    notifications: FormModelFactory.FieldBuilder;
}

// Title, Colour, Description and Notify via: the fields every step has (R270). The type's builder places them.
export const buildCommonFields = (params: CommonFieldsParams): CommonFieldBuilders => {
    const { registry, descriptionPlaceholder, readOnly } = params;

    const title = registry
        .text()
        .label("Title")
        .placeholder("e.g. Legal sign-off")
        .required(STEP_FORM_MESSAGES.titleRequired)
        .afterChange(validateAfterChange("title"))
        .disabled(readOnly);

    const color = registry
        .text()
        .label("Colour")
        .renderer(STEP_FORM_RENDERER.colour)
        .schema(colourSchema)
        .afterChange(validateAfterChange("color"))
        .disabled(readOnly);

    const description = registry
        .text()
        .label("Description")
        .placeholder(descriptionPlaceholder)
        .renderer("textarea", { rows: 3 })
        .disabled(readOnly);

    const notifications = registry
        .text()
        .list()
        .label("Notify via")
        .description(STEP_FORM_MESSAGES.notifyHint)
        .renderer(STEP_FORM_RENDERER.transports)
        .disabled(readOnly);

    return { title, color, description, notifications };
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/getCommonFormData.ts`:

```ts
import type { EditorStep } from "~/editor/domain/types.js";
import type { CommonFormValues } from "./StepFormData.js";

// The common fields of a step as form values; the notification ids keep every stored id, listed or not (D151).
export const getCommonFormData = (step: EditorStep): CommonFormValues => {
    return {
        title: step.title,
        color: step.color,
        description: step.description ?? "",
        notifications: [...step.notificationIds]
    };
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/getCommonStepPatch.ts`:

```ts
import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorStepPatch } from "~/editor/model/EditorStepPatch.js";
import type { CommonFormValues } from "./StepFormData.js";
import { isValidStepColour } from "./isValidStepColour.js";

/*
 * The common part of what Done writes (R270): an unfinished hex or a cleared colour stays in the
 * field and never reaches the draft, so the step keeps its colour (R273).
 */
export const getCommonStepPatch = (step: EditorStep, values: CommonFormValues): EditorStepPatch => {
    let color = step.color;
    if (values.color && isValidStepColour(values.color)) {
        color = values.color;
    }

    let description: string | null = null;
    if (values.description) {
        description = values.description;
    }

    return {
        title: values.title ?? "",
        color,
        description,
        notificationIds: values.notifications ?? []
    };
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/buildPeopleStepForm.ts`:

```ts
import type { FormModelFactory } from "@webiny/app-admin";
import { buildCommonFields } from "./buildCommonFields.js";
import { STEP_FORM_MESSAGES } from "./stepFormMessages.js";
import { STEP_FORM_RENDERER } from "./stepFormRendererNames.js";
import { validateAfterChange } from "./validateAfterChange.js";

/*
 * The People step form (R270): the common fields plus `teams`, one body, no tabs. The Assignment
 * and Test routing tabs arrive with 9b; until then `assignment` is carried unchanged by
 * `getPeopleStepPatch`.
 */
export const buildPeopleStepForm = (): FormModelFactory.Config => {
    return {
        fields: registry => {
            const common = buildCommonFields({
                registry,
                descriptionPlaceholder: STEP_FORM_MESSAGES.peopleDescriptionPlaceholder,
                readOnly: false
            });

            const teams = registry
                .text()
                .list()
                .label("Reviewing teams")
                .description(STEP_FORM_MESSAGES.teamsHint)
                .required(STEP_FORM_MESSAGES.teamsRequired)
                .renderer(STEP_FORM_RENDERER.teams)
                .afterChange(validateAfterChange("teams"));

            return {
                title: common.title,
                color: common.color,
                description: common.description,
                teams,
                notifications: common.notifications
            };
        }
    };
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/getPeopleFormData.ts`:

```ts
import type { EditorStep } from "~/editor/domain/types.js";
import { readReviewConfig } from "~/editor/model/readReviewConfig.js";
import type { PeopleFormValues } from "./StepFormData.js";
import { getCommonFormData } from "./getCommonFormData.js";

// The People step as form values: the common fields and the stored team ids (strings only).
export const getPeopleFormData = (step: EditorStep): PeopleFormValues => {
    const { teams } = readReviewConfig(step.config);
    const common = getCommonFormData(step);

    return { ...common, teams };
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/getPeopleStepPatch.ts`:

```ts
import type { EditorStep } from "~/editor/domain/types.js";
import { createDefaultAssignment } from "~/editor/model/createDefaultAssignment.js";
import type { EditorStepPatch } from "~/editor/model/EditorStepPatch.js";
import { readReviewConfig } from "~/editor/model/readReviewConfig.js";
import type { PeopleFormValues } from "./StepFormData.js";
import { getCommonStepPatch } from "./getCommonStepPatch.js";

/*
 * What Done writes for a People step: the common fields and the config `{ teams, assignment }`
 * (R270, Review Focus 3). The assignment is carried unchanged, 9a does not edit it; a step with
 * none gets the review defaults.
 */
export const getPeopleStepPatch = (step: EditorStep, values: PeopleFormValues): EditorStepPatch => {
    const { assignment } = readReviewConfig(step.config);
    const common = getCommonStepPatch(step, values);

    return {
        ...common,
        config: { teams: values.teams ?? [], assignment: assignment ?? createDefaultAssignment() }
    };
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/StepColourRenderer.tsx`:

```tsx
import React from "react";
import { FormComponentErrorMessage } from "@webiny/admin-ui";
import { FormComponentLabel } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { isHexColour } from "~/editor/domain/isHexColour.js";
import { STEP_COLOURS } from "~/editor/domain/stepColours.js";
import "../stepFormRendererNames.js";

const FALLBACK_PICKER_COLOUR = "#FA5723";

// The hex box always starts with `#`; an empty box stays empty.
const normalizeHexInput = (text: string): string => {
    const trimmed = text.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
        return trimmed;
    }
    return `#${trimmed}`;
};

/*
 * Colour (R273, UI-2): ten preset swatches, a native colour input and a hex box. The field value is
 * the raw text, so an unfinished hex stays in the field and shows its error.
 */
export const StepColourRenderer = createFieldRenderer<"workflowStepColour">(({ field }) => {
    const value = typeof field.value === "string" ? field.value : "";
    const isCustom = value.startsWith("#");
    const invalid = field.validation.isValid === false;
    const pickerValue = isHexColour(value) ? value : FALLBACK_PICKER_COLOUR;

    return (
        <div className={"w-full"}>
            <FormComponentLabel
                text={field.label}
                required
                disabled={field.disabled}
                invalid={invalid}
            />
            <div role={"group"} aria-label={"Colour"} className={"flex flex-wrap items-center gap-sm"}>
                {STEP_COLOURS.map(colour => {
                    const selected = colour.value === value;
                    return (
                        <button
                            key={colour.value}
                            type={"button"}
                            title={colour.label}
                            aria-label={colour.label}
                            aria-pressed={selected}
                            disabled={field.disabled}
                            onClick={() => field.onChange(colour.value)}
                            className={cn(
                                "size-7 shrink-0 cursor-pointer rounded-full border-0 p-0",
                                selected && "ring-2 ring-neutral-xstrong ring-offset-2"
                            )}
                            style={{ background: colour.value }}
                        />
                    );
                })}
                <span aria-hidden={true} className={"mx-xs h-6 w-px bg-neutral-muted"} />
                <input
                    type={"color"}
                    title={"Pick a custom colour"}
                    aria-label={"Custom colour"}
                    value={pickerValue}
                    disabled={field.disabled}
                    onChange={event => {
                        const picked = event.target.value.toUpperCase();
                        field.onChange(picked);
                    }}
                    className={"size-7 shrink-0 cursor-pointer rounded-full border-0 p-0"}
                />
                <input
                    type={"text"}
                    aria-label={"Hex colour"}
                    placeholder={"#3B6FD4"}
                    maxLength={7}
                    value={isCustom ? value : ""}
                    disabled={field.disabled}
                    onChange={event => {
                        const typed = normalizeHexInput(event.target.value);
                        field.onChange(typed);
                    }}
                    className={cn(
                        "w-24 rounded border px-sm py-xs font-mono text-sm",
                        invalid ? "border-destructive-default" : "border-neutral-muted"
                    )}
                />
            </div>
            <FormComponentErrorMessage
                text={field.validation.message}
                invalid={invalid}
                disabled={field.disabled}
            />
        </div>
    );
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/TeamsPickerRenderer.tsx`:

```tsx
import React from "react";
import { Alert } from "@webiny/admin-ui";
import { FormComponentLabel } from "@webiny/admin-ui";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { WorkflowMultiPicker } from "~/components/picker/WorkflowMultiPicker.js";
import { WorkflowPicker } from "~/components/picker/WorkflowPicker.js";
import { STEP_FORM_MESSAGES } from "../stepFormMessages.js";
import { useStepFormOptions } from "../useStepFormOptions.js";
import "../stepFormRendererNames.js";

/*
 * Teams (R282): the chip picker of the People step's `teams` list, and a clearable single picker
 * for a plain text field (the `team` ui hint of an automation setting, R271). Both read the team
 * list the drawer provides; the pickers draw the label, the description and the required marker.
 */
export const TeamsPickerRenderer = createFieldRenderer<"workflowTeamsPicker">(({ field }) => {
    const { teams } = useStepFormOptions();
    const invalid = field.validation.isValid === false;
    const error = invalid ? (field.validation.message ?? null) : null;
    const label = field.label ?? "";

    if (teams.failed) {
        return (
            <div className={"w-full"}>
                <FormComponentLabel
                    text={field.label}
                    required={field.required}
                    disabled={field.disabled}
                    invalid={invalid}
                />
                <Alert
                    type={"danger"}
                    variant={"subtle"}
                    actions={
                        <Alert.Action text={STEP_FORM_MESSAGES.tryAgain} onClick={teams.retry} />
                    }
                >
                    {STEP_FORM_MESSAGES.optionsFailed}
                </Alert>
            </div>
        );
    }

    if (field.isList) {
        const values: string[] = Array.isArray(field.value) ? field.value : [];
        return (
            <WorkflowMultiPicker
                label={label}
                description={field.description}
                required={field.required}
                values={values}
                selected={teams.selected}
                options={teams.options}
                onSearch={teams.search}
                onChange={ids => field.onChange(ids)}
                placeholder={STEP_FORM_MESSAGES.teamsPlaceholder}
                disabled={field.disabled}
                error={error}
            />
        );
    }

    const value = typeof field.value === "string" ? field.value : null;
    const selected =
        teams.selected.find(option => option.id === value) ??
        teams.options.find(option => option.id === value) ??
        null;

    return (
        <WorkflowPicker
            label={label}
            description={field.description}
            required={field.required}
            value={value}
            selected={selected}
            options={teams.options}
            onSearch={teams.search}
            onChange={id => field.onChange(id)}
            placeholder={STEP_FORM_MESSAGES.teamsPlaceholder}
            disabled={field.disabled}
            error={error}
        />
    );
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/TransportCheckboxesRenderer.tsx`:

```tsx
import React from "react";
import { Alert } from "@webiny/admin-ui";
import { CheckboxGroup } from "@webiny/admin-ui";
import { FormComponentDescription } from "@webiny/admin-ui";
import { FormComponentLabel } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { STEP_FORM_MESSAGES } from "../stepFormMessages.js";
import { useStepFormOptions } from "../useStepFormOptions.js";
import "../stepFormRendererNames.js";

/*
 * Notify via (R272, D129, D151): one checkbox per listed transport. Ids on the step that are not
 * listed are kept on every change and never shown.
 */
export const TransportCheckboxesRenderer = createFieldRenderer<"workflowTransports">(({ field }) => {
    const { transports } = useStepFormOptions();
    const stored: string[] = Array.isArray(field.value) ? field.value : [];
    const knownIds = transports.options.map(option => option.id);
    const known = new Set(knownIds);
    const kept = stored.filter(id => !known.has(id));
    const ticked = stored.filter(id => known.has(id));

    const heading = (
        <>
            <FormComponentLabel text={field.label} disabled={field.disabled} />
            <FormComponentDescription text={field.description} disabled={field.disabled} />
        </>
    );

    if (transports.failed) {
        return (
            <div className={"w-full"}>
                {heading}
                <Alert
                    type={"danger"}
                    variant={"subtle"}
                    actions={
                        <Alert.Action
                            text={STEP_FORM_MESSAGES.tryAgain}
                            onClick={transports.retry}
                        />
                    }
                >
                    {STEP_FORM_MESSAGES.optionsFailed}
                </Alert>
            </div>
        );
    }

    if (transports.loading) {
        return <div className={"w-full"}>{heading}</div>;
    }

    if (transports.options.length === 0) {
        return (
            <div className={"w-full"}>
                {heading}
                <Text size={"sm"}>{STEP_FORM_MESSAGES.noTransports}</Text>
            </div>
        );
    }

    const items = transports.options.map(option => {
        let label = option.title;
        if (option.description) {
            label = `${option.title} · ${option.description}`;
        }
        return { label, value: option.id };
    });

    return (
        <CheckboxGroup
            label={field.label}
            description={field.description}
            disabled={field.disabled}
            validation={field.validation}
            items={items}
            value={ticked}
            onChange={values => {
                field.onChange([...kept, ...values]);
                field.onBlur();
            }}
        />
    );
});
```

Create `packages/app-workflows/src/editor/WorkflowEditorConfig.tsx`:

```tsx
import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { STEP_FORM_RENDERER } from "~/editor/presentation/stepForm/stepFormRendererNames.js";
import { StepColourRenderer } from "~/editor/presentation/stepForm/renderers/StepColourRenderer.js";
import { TeamsPickerRenderer } from "~/editor/presentation/stepForm/renderers/TeamsPickerRenderer.js";
import { TransportCheckboxesRenderer } from "~/editor/presentation/stepForm/renderers/TransportCheckboxesRenderer.js";

// The editor's field renderers, registered the way `app-file-manager/src/app.tsx` registers its own.
export const WorkflowEditorConfig = () => {
    return (
        <AdminConfig>
            <AdminConfig.Form.FieldRenderer
                name={STEP_FORM_RENDERER.colour}
                component={StepColourRenderer}
            />
            <AdminConfig.Form.FieldRenderer
                name={STEP_FORM_RENDERER.teams}
                component={TeamsPickerRenderer}
            />
            <AdminConfig.Form.FieldRenderer
                name={STEP_FORM_RENDERER.transports}
                component={TransportCheckboxesRenderer}
            />
        </AdminConfig>
    );
};
```

Modify `packages/app-workflows/src/app.tsx`. Add the import immediately above `export const WorkflowsAdminApp = () => {` (after the last import line as it stands when this task runs):

```tsx
import { WorkflowEditorConfig } from "~/editor/WorkflowEditorConfig.js";
```

and add the element immediately above `<SecurityPermissions />`:

```tsx
            <WorkflowEditorConfig />
            <SecurityPermissions />
```

- [ ] **Step 4: Run the tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm/isValidStepColour.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepForm/buildCommonFields.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepForm/commonStepData.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepForm/buildPeopleStepForm.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/StepColourRenderer.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/TeamsPickerRenderer.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/TransportCheckboxesRenderer.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx 2>&1 | tail -20
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
```

Expected: all pass. If the transport checkbox lookup by role or `aria-checked` differs in the installed admin-ui build, adjust the query in the test, not the renderer.

- [ ] **Step 5: Run the existing tests covering the changed code and type check**

```bash
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: pass; the build type-checks every new test file (admin package, R243). `app.cleanup.test.tsx` is unchanged: it lists the old editor and this task adds no path it forbids (Task 22 updates it).

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
git commit -m "feat(app-workflows): add the common and People step forms" -m "One FormModel form per step type: the common fields (title, colour, description, notify via), the People teams field, the colour, teams picker and transport renderers, the options context the drawer provides, and the renderer config mounted in WorkflowsAdminApp." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. In the commit command, replace the literal `<CURRENT_SESSION_URL>` with the `https://claude.ai/code/session_...` URL of the session that runs the commit. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **Shared pieces come from Tasks 5 and 8, read from their task files:** `EditorStep { ...; notificationIds: string[]; config: unknown }` (the form field is called `notifications`, the step's property `notificationIds`, mapped in `getCommonFormData` and `getCommonStepPatch`), the `EditorStepPatch` type (`Partial<Omit<EditorStep, "id" | "type">>`), `readReviewConfig`, `createDefaultAssignment`, `STEP_COLOURS`, `HEX_COLOUR_MESSAGE`, `isHexColour` and the fixtures `createReviewStep` (titled `Legal sign-off`, People config with team `team-1`, `e-mail` ticked). Nothing of them is repeated here.
- **Picker props:** Task 4 added `label` (required), `description` and `required` to both pickers and says the callers pass `field.label`, `field.description` and `field.required`; the renderer does, and so the Reviewing teams hint is the field's `description`, not `help` (the admin-ui `hint` is only a tooltip icon). The single picker is assumed to show `selected.warning` under the input (A100).
- **One teams renderer for both pickers:** R271 (updated) asks for "a single-team picker renderer" for the `team` ui hint and the multi renderer for the People step's list; `TeamsPickerRenderer` serves both by branching on `field.isList`, so one renderer name (`workflowTeamsPicker`) is registered. If the controller wants two names, only `STEP_FORM_RENDERER`, `WorkflowEditorConfig` and the two uses change.
- **Contract wording kept:** `StepFormOptionsContext` carries the option VMs with `loading`/`failed`/`retry`; the callbacks `search` and `select` are part of that context value, not of any presenter `vm` (R234 concerns the view model).
- **Validation timing:** FormModel only validates on blur after a submit (`validateOnSubmit` is not read anywhere), so the contract's "errors appear once the field was edited" needs `validateAfterChange`, added here.
- **New dependency:** `zod` `4.4.3` in `app-workflows` (the version every admin package uses) for the colour rule; do not add it twice.
- **`createEmptyStepFormOptions`** is source (not testing) because the drawer presenter (Task 14) returns it for a closed drawer; the testing builder wraps it, so no source file imports `testing/` (R243).
- Size: large (forms, three renderers, context types, three testing files, eight test files); one review gate.
