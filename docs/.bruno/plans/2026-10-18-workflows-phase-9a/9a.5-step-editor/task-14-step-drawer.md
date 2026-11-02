### Task 14: Step drawer

R269, R270, R272, R274, R275, R276, R281; D56, D66, D91, D92; QBZ-11, QBZ-13, QBZ-14, QBZ-47; Q41, Q43; design README 4 (drawer 560px, header, footer), `research-spec.md` 4.1-4.3, `research2-admin.md` 5; Review Focus 2, 3. The drawer presenter ties Tasks 11-13 to the editor presenter (Task 9): it opens for one step of the draft, reads that step and the option lists through the editor presenter's accessors, builds the form of the step's type (FormModel, one body, no tabs), provides the lists to the renderers, shows the step's client and server errors on their fields or at the top, asks before an automation switch, and applies the form to the draft on Done. `StepDrawer` is the 560px view over it.

- **Source (R284, R234 accessor precedent):** the drawer presenter does not load anything. `open(source, stepId)` takes the editor presenter as `StepDrawerSource`, the structural subset of its non-VM accessors: `getStep(stepId)`, `updateStep(stepId, patch)`, `getStepFieldErrors(stepId)`, `isStepReadOnly(stepId)`, `getOptions()` (`WorkflowEditorOptions`: `stepTypes`, `automations`, `transports`, `aiModels`, `aiTools`, each an `OptionList { status: "loading" | "ready" | "failed"; items }`), `getTeamOptions()` (`results`, `known`, `loading`, `failed`), `searchTeams(search)`, `retryTeams()`, `retryOptions()`, `closeStep()` and `getNamespace(): string | null` (null: no model open, so no automation covers it). The presenter reads them inside its computed getters, so a list that arrives after the drawer opened shows up.
- **Header and footer (design README 4):** a neutral 36px tile with the type icon, then the sub line `{Type} step · the type can't be changed` (12px, muted; `getStepTypeLabel` of Task 8: `People`, `Automation`, `AI`, an unknown type by the server `title`, else its id) above the title (16px, 600: the step's title live from the form, `Untitled step` when blank or cleared), footer `Edits stay in this workflow until you save it.` and the primary `Done`. The type cannot be changed (D91): there is no type control.
- **Open (R270):** snapshot the step, pick its kind from `step.type` (`review` People, `automation`, `ai`, anything else `unknown`), ask for the first team results for a People step (`searchTeams("")`, an empty search runs at once), build the form, load the step into it without making it dirty, mark the fields named by `getStepFieldErrors(stepId)` and start watching. An unknown type has no form (read-only, title and type in the header).
- **Done and closing (D92, R273, R284):** `done()` applies the form to the draft with `source.updateStep(stepId, patch)` (Task 9 clears that step's errors), then calls `source.closeStep()`. Nothing is written when the form was not edited or the step is read-only. A colour that is an unfinished hex blocks Done only: the Colour field shows `HEX_COLOUR_MESSAGE` and focuses; clearing the box lets Done through. The X, Escape and the scrim call `dismiss()`, which applies the edits the same way without that block (an unfinished hex keeps the step's old colour, `getCommonStepPatch`) and calls `source.closeStep()`. `close()` closes without applying and without telling the source; the view uses it when its `stepId` becomes null. When the step disappears from the source while open (deleted, workflow replaced) the drawer closes and calls `source.closeStep()`. Other fields are not validated by Done (QBZ-13).
- **Errors (Q41, R267, R276, QBZ-11, QBZ-13):** each `StepFieldError { field, message }` of the step (the client validation errors of a failed Save and the mapped server error alike, field paths as R267) lands on the form field `getFormFieldPath` names (`title`, `color`, `notifications`, `config.teams`, `config.automationId`, `config.instructions`, `config.model`, `config.tools`, `config.settings.<path>`): that field is marked with the message and the first one is focused. An error with no form field in 9a (`id`, `type`, `config.assignment.rules`, `config.settings` itself, a zod path, an empty `field`) shows its message at the top of the drawer. The first edit clears the top message; a field's own error is replaced by its next validation (`validateAfterChange`). Fields validate live after their first edit (QBZ-13).
- **Lists to the renderers:** `formOptions` (not part of the VM, it carries callbacks) maps the source's lists to `StepFormOptions`: transports, automations, AI models and AI tools take `loading` and `failed` from their own list's `status` (an empty list is never a failure, R284); the cards come from `getAutomationCards` and the warnings from `getAutomationWarnings` (only once the automations are `ready`); the AI models from `getAiModelOptions` with `loaded` only when the list is `ready` and the step is not read-only, so a licence-less AI step shows neither the retired warning nor the empty-models message (QBZ-47); the teams from `getTeamOptions()`: `selected` is every known team any team field holds (the People `teams` list or a `ui: "team"` setting), the search results are the options.
- **Automation (R274, QBZ-14):** `automations.select(id)` switches at once when no settings were entered (none stored and none changed since the form was built) and otherwise opens `switchConfirmation` (`Switch to “{automation}”?`...); `confirmSwitch` rebuilds the form for the new definition (title, colour, description and Notify via kept, settings empty), `cancelSwitch` keeps everything. When the definitions arrive after the drawer opened the form is rebuilt with the settings, keeping what was typed, and the step's errors are applied again. A definition whose schema has a `ui: "team"` setting makes the drawer ask for the first team results (`hasTeamSetting`), like a People step does, so that setting's picker has options (R284; Task 9 resolves the stored team ids of such settings into `known`).
- **AI (R275, QBZ-47, QBZ-89):** read-only is `source.isStepReadOnly(stepId)` (Task 8: an unknown type, or an AI step while the AI editor does not exist): the form is built `readOnly`, the alert `AI Power-Ups licence missing` / `This step is read-only. Reviews that reach it fail; they can be restarted once the licence is back.` shows for an AI step, and Done only closes. When the read-only state changes while open (the step types arrive) the form is rebuilt.
- **State (code-style):** the presenter is a singleton (the view's `StepDrawer` resolves it with `useFeature`), `dispose()` resets everything (the component calls it on unmount), the non-rendered machinery is excluded from the observable map. `StepDrawer` takes `{ source, stepId }` (R284): an effect opens the presenter when `stepId` is set and closes it when null.

**Files:** (all under `packages/app-workflows/src/editor` unless a full path is given)
- Create: `presentation/stepDrawer/abstractions.ts`
- Create: `presentation/stepDrawer/stepDrawerMessages.ts`
- Create: `presentation/stepDrawer/getStepKind.ts`
- Create: `presentation/stepDrawer/getFormFieldPath.ts`
- Create: `presentation/stepDrawer/StepDrawerPresenter.ts`
- Create: `presentation/stepDrawer/feature.ts`
- Create: `presentation/stepDrawer/StepDrawer.tsx`
- Create: `testing/createEditorOptions.ts`
- Create: `testing/createTeamOptions.ts`
- Create: `testing/fakeStepDrawerSource.ts`
- Create: `testing/findFormFieldVm.ts`
- Create: `presentation/stepDrawer/stepDrawerPure.test.ts`
- Create: `presentation/stepDrawer/StepDrawerPresenter.test.ts`
- Create: `presentation/stepDrawer/StepDrawer.test.tsx`
- Modify: `packages/app-workflows/src/app.tsx`
- Modify: `packages/app-workflows/src/app.test.tsx`

**Interfaces:**
- Consumes: Task 11 (`StepFormOptions`, `StepFormOptionsContext`, `buildPeopleStepForm`, `getPeopleFormData`, `getPeopleStepPatch`, `toTeamPickerOption`, `createEmptyStepFormOptions`, `PeopleFormValues`, `CommonFormValues`, `createTestFormModelFactory`), Task 8 (`getAutomationWarnings`, `AutomationWarnings` and `isNonEmptySettings` from `~/editor/model/`), Task 12 (`hasTeamSetting`, `buildAutomationStepForm`, `getAutomationFormData`, `getAutomationStepPatch`, `getAutomationCards`, `getAutomationEmptyText`, `buildSwitchConfirmation`, `SwitchAutomationDialog`, `SwitchAutomationConfirmationVm`, `AutomationFormValues`), Task 13 (`buildAiStepForm`, `getAiFormData`, `getAiStepPatch`, `getAiModelOptions`, `AI_FORM_MESSAGES`, `AiFormValues`), Task 9 and 9b (`WorkflowEditorOptions`, `OptionList`, `WorkflowTeamOptions` from `~/editor/presentation/editor/abstractions.js`; the accessors listed above), Task 8 (`EditorStepPatch` from `~/editor/model/EditorStepPatch.js`, `StepFieldError` from `~/editor/model/StepFieldError.js`, `getStepTypeLabel`, `readAutomationConfig`, `StepTypeId`, `FALLBACK_STEP_COLOUR` and `HEX_COLOUR_MESSAGE` from `~/editor/domain/stepColours.js`, the fixtures `createStepTypes`, `createWebhookAutomation`, `createReviewStep`, `createAutomationStep`, `createAiStep` from `~/editor/testing/draftFixtures.js`), Task 5 (`EditorStep`, `AiTool.changesContent` and the fixtures `createEditorStepType`, `createAutomationDefinition`, `createNotificationTransport`, `createWorkflowTeamSummary`, `createAiModel`, `createAiTool` from `~/editor/testing/editorFixtures.js`), `app-admin` (`FormModelFactory`, `FormModel`, `FormView`, `createReactiveComponent`, `jsonSchemaValueToFormData`). Existing (verified): admin-ui `Drawer` (`ConfirmButton`, `info`, `description`, `icon`, `width`, `onClose`), `Alert`, `Text`; `@webiny/icons/{auto_awesome,bolt,rate_review}.svg` (used in `app-workflows`) and `group.svg` (material icon, verify it resolves); `useFeature` from `@webiny/app`; `renderWithContainer`.
- Produces: `StepDrawerPresenter` (token, singleton; `open(source, stepId)`, `done()`, `dismiss()`, `close()`, `confirmSwitch()`, `cancelSwitch()`, `dispose()`, `vm: IStepDrawerViewModel`, `formOptions: StepFormOptions`), `StepDrawerSource`, `StepKind`, `StepDrawerPresenterFeature`, `StepDrawer` (props `{ source, stepId }`, reads the feature), `getStepKind`, `getFormFieldPath`; in `[AWET]`: `createEditorOptions`, `createTeamOptions`, `FakeStepDrawerSource`, `findFormFieldVm` (Tasks 15 and 16 may reuse them).

**Test runner note:** admin package, `yarn test <path>` only. The presenter tests run the real FormModel and the real adapter (Task 3) against a fake source (a MobX class, so the presenter's reactions fire). The view test stubs `FormView` (the real one needs the admin config to find renderers) and checks the options context through the stub.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/testing/findFormFieldVm.ts` (pure, types only):

```ts
import type { FormModel } from "@webiny/app-admin";

/*
 * Finds a field VM by dotted path (`title`, `settings.url`) in a form VM's layout, as a renderer
 * would reach it; null when the field is not in the layout.
 */
export const findFormFieldVm = (
    form: FormModel.FormVM | null,
    path: string
): FormModel.FieldVM | null => {
    if (form === null) {
        return null;
    }
    const [head, ...rest] = path.split(".");
    const top: FormModel.FieldVM[] = [];
    for (const node of form.layout) {
        if (node.type === "row") {
            top.push(...node.fields);
        }
    }

    let found = top.find(field => field.name === head);
    for (const part of rest) {
        if (!found || found.type !== "object") {
            return null;
        }
        const objectField: FormModel.ObjectFieldVM = found as FormModel.ObjectFieldVM;
        found = objectField.fields.find(field => field.name === part);
    }

    return found ?? null;
};
```

Create `packages/app-workflows/src/editor/testing/createEditorOptions.ts` (pure):

```ts
import type { WorkflowEditorOptions } from "~/editor/presentation/editor/abstractions.js";
import { createStepTypes } from "~/editor/testing/draftFixtures.js";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createAiModel } from "~/editor/testing/editorFixtures.js";
import { createAiTool } from "~/editor/testing/editorFixtures.js";
import { createAutomationDefinition } from "~/editor/testing/editorFixtures.js";
import { createNotificationTransport } from "~/editor/testing/editorFixtures.js";

// The lists the editor presenter holds once everything loaded (each `ready`): the three step types
// (the AI editor exists), the Send webhook and Post to Slack automations, one transport, two models,
// two tools of which one changes content.
export const createEditorOptions = (
    overrides: Partial<WorkflowEditorOptions> = {}
): WorkflowEditorOptions => {
    return {
        stepTypes: { status: "ready", items: createStepTypes() },
        automations: {
            status: "ready",
            items: [
                createWebhookAutomation(),
                createAutomationDefinition({
                    id: "post-to-slack",
                    name: "Post to Slack",
                    models: ["cms.*"],
                    settingsSchema: null
                })
            ]
        },
        transports: {
            status: "ready",
            items: [
                createNotificationTransport({
                    id: "e-mail",
                    title: "E-mail",
                    description: "Sends an e-mail"
                })
            ]
        },
        aiModels: {
            status: "ready",
            items: [
                createAiModel({
                    id: "anthropic/claude-balanced",
                    name: "Claude Balanced",
                    providerId: "anthropic",
                    providerName: "Anthropic"
                }),
                createAiModel({
                    id: "openai/gpt-fast",
                    name: "GPT Fast",
                    providerId: "openai",
                    providerName: "OpenAI"
                })
            ]
        },
        aiTools: {
            status: "ready",
            items: [
                createAiTool({
                    name: "read-fields",
                    title: "Read fields",
                    description: "Reads every field of the revision.",
                    changesContent: false
                }),
                createAiTool({
                    name: "update-fields",
                    title: "Update fields",
                    description: "Edits field values in the revision.",
                    changesContent: true
                })
            ]
        },
        ...overrides
    };
};
```

Create `packages/app-workflows/src/editor/testing/createTeamOptions.ts` (pure):

```ts
import type { WorkflowTeamOptions } from "~/editor/presentation/editor/abstractions.js";
import { createWorkflowTeamSummary } from "~/editor/testing/editorFixtures.js";

// Two teams, one with members and one without, as `known` and as the last search results.
export const createTeamOptions = (
    overrides: Partial<WorkflowTeamOptions> = {}
): WorkflowTeamOptions => {
    const teams = [
        createWorkflowTeamSummary({ id: "team-1", name: "Legal", memberCount: 3 }),
        createWorkflowTeamSummary({ id: "team-2", name: "Editors", memberCount: 0 })
    ];
    return { results: teams, known: teams, loading: false, failed: false, ...overrides };
};
```

Create `packages/app-workflows/src/editor/testing/fakeStepDrawerSource.ts` (vitest and MobX, a separate file from the pure builders, R243):

```ts
import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorStepPatch } from "~/editor/model/EditorStepPatch.js";
import type { StepFieldError } from "~/editor/model/StepFieldError.js";
import type { WorkflowEditorOptions } from "~/editor/presentation/editor/abstractions.js";
import type { WorkflowTeamOptions } from "~/editor/presentation/editor/abstractions.js";
import type { StepDrawerSource } from "~/editor/presentation/stepDrawer/abstractions.js";
import { createEditorOptions } from "./createEditorOptions.js";
import { createTeamOptions } from "./createTeamOptions.js";

/*
 * The accessors of the editor presenter the drawer reads, over plain MobX state, so the drawer's
 * reactions fire when a list or the read-only state changes. The commands are mocks.
 */
export class FakeStepDrawerSource implements StepDrawerSource {
    steps: EditorStep[];
    options: WorkflowEditorOptions = createEditorOptions();
    teams: WorkflowTeamOptions = createTeamOptions();
    readOnly = false;
    errors: StepFieldError[] = [];
    namespace: string | null = "cms.article";
    updateStep: Mock<(stepId: string, patch: EditorStepPatch) => void> = vi.fn();
    closeStep: Mock<() => void> = vi.fn();
    searchTeams: Mock<(search: string) => void> = vi.fn();
    retryTeams: Mock<() => Promise<void>> = vi.fn().mockResolvedValue(undefined);
    retryOptions: Mock<() => Promise<void>> = vi.fn().mockResolvedValue(undefined);

    constructor(steps: EditorStep[]) {
        this.steps = steps;
        makeAutoObservable(this, {
            steps: observableRef,
            options: observableRef,
            teams: observableRef,
            errors: observableRef,
            updateStep: false,
            closeStep: false,
            searchTeams: false,
            retryTeams: false,
            retryOptions: false
        });
    }

    getStep(stepId: string): EditorStep | null {
        return this.steps.find(step => step.id === stepId) ?? null;
    }

    getStepFieldErrors(): StepFieldError[] {
        return this.errors;
    }

    isStepReadOnly(): boolean {
        return this.readOnly;
    }

    getOptions(): WorkflowEditorOptions {
        return this.options;
    }

    getTeamOptions(): WorkflowTeamOptions {
        return this.teams;
    }

    getNamespace(): string | null {
        return this.namespace;
    }

    setSteps(steps: EditorStep[]): void {
        this.steps = steps;
    }

    setOptions(options: WorkflowEditorOptions): void {
        this.options = options;
    }

    setTeams(teams: WorkflowTeamOptions): void {
        this.teams = teams;
    }

    setReadOnly(readOnly: boolean): void {
        this.readOnly = readOnly;
    }
}
```

Create `packages/app-workflows/src/editor/presentation/stepDrawer/stepDrawerPure.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getFormFieldPath } from "./getFormFieldPath.js";
import { getStepKind } from "./getStepKind.js";

describe("getStepKind (R270)", () => {
    it("maps the three built-in types and treats anything else as unknown", () => {
        expect(getStepKind("review")).toBe("review");
        expect(getStepKind("automation")).toBe("automation");
        expect(getStepKind("ai")).toBe("ai");
        expect(getStepKind("custom-check")).toBe("unknown");
    });
});

describe("getFormFieldPath (R267, R276)", () => {
    it("maps the step fields and the config fields of the three forms", () => {
        expect(getFormFieldPath("title")).toBe("title");
        expect(getFormFieldPath("color")).toBe("color");
        expect(getFormFieldPath("notifications")).toBe("notifications");
        expect(getFormFieldPath("config.teams")).toBe("teams");
        expect(getFormFieldPath("config.automationId")).toBe("automationId");
        expect(getFormFieldPath("config.instructions")).toBe("instructions");
        expect(getFormFieldPath("config.model")).toBe("model");
        expect(getFormFieldPath("config.tools")).toBe("tools");
    });

    it("maps a setting path under settings", () => {
        expect(getFormFieldPath("config.settings.url")).toBe("settings.url");
        expect(getFormFieldPath("config.settings.headers.0.name")).toBe("settings.headers.0.name");
    });

    it("maps a zod path under config.teams to the teams field", () => {
        expect(getFormFieldPath("config.teams.0")).toBe("teams");
    });

    it("is null for a field with no form field in 9a", () => {
        expect(getFormFieldPath(null)).toBeNull();
        expect(getFormFieldPath("")).toBeNull();
        expect(getFormFieldPath("id")).toBeNull();
        expect(getFormFieldPath("type")).toBeNull();
        expect(getFormFieldPath("config.settings")).toBeNull();
        expect(getFormFieldPath("config.assignment.rules")).toBeNull();
        expect(getFormFieldPath("config.somethingElse")).toBeNull();
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { FormModelFeature } from "@webiny/app-admin/features/formModel/feature.js";
import { IdentityContextFeature } from "@webiny/app-admin/features/security/IdentityContext/feature.js";
import type { EditorStep } from "~/editor/domain/types.js";
import { createEditorOptions } from "~/editor/testing/createEditorOptions.js";
import { createTeamOptions } from "~/editor/testing/createTeamOptions.js";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createStepTypes } from "~/editor/testing/draftFixtures.js";
import { createAutomationDefinition } from "~/editor/testing/editorFixtures.js";
import { createEditorStepType } from "~/editor/testing/editorFixtures.js";
import { FakeStepDrawerSource } from "~/editor/testing/fakeStepDrawerSource.js";
import { findFormFieldVm } from "~/editor/testing/findFormFieldVm.js";
import { StepDrawerPresenterFeature } from "./feature.js";

const createSetup = (step: EditorStep, configure?: (source: FakeStepDrawerSource) => void) => {
    const container = new Container();
    IdentityContextFeature.register(container);
    FormModelFeature.register(container);
    StepDrawerPresenterFeature.register(container);
    const presenter = StepDrawerPresenterFeature.resolve(container).presenter;
    const source = new FakeStepDrawerSource([step]);
    if (configure) {
        configure(source);
    }
    return { presenter, source };
};

// Task 8's People step is titled `Legal sign-off`, team `team-1`, `e-mail` ticked, id `step-1`.
const peopleStep = (overrides: Partial<EditorStep> = {}) => {
    return createReviewStep(overrides);
};

const automationStep = (settings: unknown = { url: "https://x.test", timeout: 30 }) => {
    return createAutomationStep({
        id: "step-1",
        title: "Legal sign-off",
        notificationIds: ["e-mail"],
        config: { automationId: "send-webhook", settings }
    });
};

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

describe("StepDrawerPresenter: opening (R270)", () => {
    it("is closed until a step is opened", () => {
        const { presenter } = createSetup(peopleStep());

        expect(presenter.vm.open).toBe(false);
        expect(presenter.vm.form).toBeNull();
    });

    it("opens a People step with the form loaded and not dirty", () => {
        const { presenter, source } = createSetup(peopleStep());

        presenter.open(source, "step-1");

        expect(presenter.vm.open).toBe(true);
        expect(presenter.vm.form?.isDirty).toBe(false);
        expect(presenter.vm.form?.getData()).toEqual({
            title: "Legal sign-off",
            color: "var(--color-primary-500)",
            description: "",
            teams: ["team-1"],
            notifications: ["e-mail"]
        });
    });

    it("names the step type and says it cannot be changed (D91)", () => {
        const { presenter, source } = createSetup(peopleStep());

        presenter.open(source, "step-1");

        expect(presenter.vm.kind).toBe("review");
        expect(presenter.vm.typeLabel).toBe("People");
        expect(presenter.vm.subtitle).toBe("People step · the type can't be changed");
        expect(presenter.vm.title).toBe("Legal sign-off");
        expect(presenter.vm.footerText).toBe("Edits stay in this workflow until you save it.");
        expect(presenter.vm.doneLabel).toBe("Done");
        expect(presenter.vm.readOnly).toBe(false);
        expect(presenter.vm.topError).toBeNull();
        expect(presenter.vm.licenceAlert).toBeNull();
    });

    it("shows Untitled step for a blank title, live from the form", () => {
        const { presenter, source } = createSetup(peopleStep({ title: "" }));

        presenter.open(source, "step-1");
        expect(presenter.vm.title).toBe("Untitled step");

        findFormFieldVm(presenter.vm.form, "title")?.onChange("Fact check");

        expect(presenter.vm.title).toBe("Fact check");
    });

    it("shows Untitled step when the title is cleared, not the stored title", () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");

        findFormFieldVm(presenter.vm.form, "title")?.onChange("");

        expect(presenter.vm.title).toBe("Untitled step");
    });

    it("stays closed for a step the draft does not have", () => {
        const { presenter, source } = createSetup(peopleStep());

        presenter.open(source, "missing");

        expect(presenter.vm.open).toBe(false);
    });

    it("asks for the first team results for a People step only", () => {
        const people = createSetup(peopleStep());
        const automation = createSetup(automationStep());
        const ai = createSetup(aiStep());

        people.presenter.open(people.source, "step-1");
        automation.presenter.open(automation.source, "step-1");
        ai.presenter.open(ai.source, "step-1");

        expect(people.source.searchTeams).toHaveBeenCalledWith("");
        expect(automation.source.searchTeams).not.toHaveBeenCalled();
        expect(ai.source.searchTeams).not.toHaveBeenCalled();
    });

    it("dispose resets everything", () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");

        presenter.dispose();

        expect(presenter.vm.open).toBe(false);
        expect(presenter.vm.form).toBeNull();
        expect(presenter.vm.topError).toBeNull();
    });

    it("a later open replaces the earlier one", () => {
        const { presenter, source } = createSetup(peopleStep({ title: "First" }));
        source.setSteps([
            peopleStep({ title: "First" }),
            peopleStep({ id: "step-2", title: "Second" })
        ]);

        presenter.open(source, "step-1");
        presenter.open(source, "step-2");

        expect(presenter.vm.title).toBe("Second");
    });

    it("provides empty options while closed", () => {
        const { presenter } = createSetup(peopleStep());

        expect(presenter.formOptions.teams.options).toEqual([]);
        expect(presenter.formOptions.transports.options).toEqual([]);
    });
});

describe("StepDrawerPresenter: People step", () => {
    it("maps the editor's team lists: the chosen teams from `known`, the results as options (R282)", () => {
        const { presenter, source } = createSetup(
            peopleStep({ config: { teams: ["team-1", "team-2", "team-9"] } })
        );

        presenter.open(source, "step-1");

        const { teams } = presenter.formOptions;
        expect(teams.selected).toEqual([
            { id: "team-1", label: "Legal", description: null, warning: null },
            {
                id: "team-2",
                label: "Editors",
                description: null,
                warning: "This team has no members"
            }
        ]);
        expect(teams.options.map(option => option.id)).toEqual(["team-1", "team-2"]);
        expect(teams.loading).toBe(false);
        expect(teams.failed).toBe(false);
    });

    it("keeps a picked team's label and warning in selected", () => {
        const { presenter, source } = createSetup(peopleStep({ config: { teams: [] } }));
        presenter.open(source, "step-1");

        findFormFieldVm(presenter.vm.form, "teams")?.onChange(["team-2"]);

        expect(presenter.formOptions.teams.selected).toEqual([
            {
                id: "team-2",
                label: "Editors",
                description: null,
                warning: "This team has no members"
            }
        ]);
    });

    it("forwards a search and a retry to the editor, and shows its loading and failure", () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");

        presenter.formOptions.teams.search("leg");
        presenter.formOptions.teams.retry();
        source.setTeams(createTeamOptions({ loading: true, failed: true }));

        expect(source.searchTeams).toHaveBeenCalledWith("leg");
        expect(source.retryTeams).toHaveBeenCalledTimes(1);
        expect(presenter.formOptions.teams.loading).toBe(true);
        expect(presenter.formOptions.teams.failed).toBe(true);
    });

    it("provides the transports", () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");

        expect(presenter.formOptions.transports).toMatchObject({
            loading: false,
            failed: false,
            options: [{ id: "e-mail", title: "E-mail", description: "Sends an e-mail" }]
        });
    });

    it("shows a failed list as failed and an empty ready list as empty, and retries through the editor (R281, R284)", () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");

        source.setOptions(createEditorOptions({ transports: { status: "failed", items: [] } }));
        expect(presenter.formOptions.transports.failed).toBe(true);

        presenter.formOptions.transports.retry();
        expect(source.retryOptions).toHaveBeenCalledTimes(1);

        source.setOptions(createEditorOptions({ transports: { status: "ready", items: [] } }));
        expect(presenter.formOptions.transports.failed).toBe(false);
        expect(presenter.formOptions.transports.options).toEqual([]);
    });

    it("shows the transports as loading while that list loads", () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");

        source.setOptions(createEditorOptions({ transports: { status: "loading", items: [] } }));

        expect(presenter.formOptions.transports.loading).toBe(true);
    });

    it("Done writes the edited step to the editor with the People config keys and closes (R270)", async () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");

        findFormFieldVm(presenter.vm.form, "title")?.onChange("Legal review");
        findFormFieldVm(presenter.vm.form, "teams")?.onChange(["team-2"]);
        await presenter.done();

        expect(source.updateStep).toHaveBeenCalledTimes(1);
        expect(source.updateStep).toHaveBeenCalledWith("step-1", {
            title: "Legal review",
            color: "var(--color-primary-500)",
            description: null,
            notificationIds: ["e-mail"],
            config: {
                teams: ["team-2"],
                assignment: { strategy: "none", allowManualPick: false, rules: [] }
            }
        });
        expect(presenter.vm.open).toBe(false);
        expect(source.closeStep).toHaveBeenCalledTimes(1);
    });

    it("Done writes nothing when the form was not edited, and closes through the editor", async () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");

        await presenter.done();

        expect(source.updateStep).not.toHaveBeenCalled();
        expect(presenter.vm.open).toBe(false);
        expect(source.closeStep).toHaveBeenCalledTimes(1);
    });

    it("an unfinished hex blocks Done and shows the colour error; clearing it lets Done through (R273)", async () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");

        findFormFieldVm(presenter.vm.form, "color")?.onChange("#3B6");
        await presenter.done();

        expect(presenter.vm.open).toBe(true);
        expect(source.updateStep).not.toHaveBeenCalled();
        expect(source.closeStep).not.toHaveBeenCalled();
        expect(findFormFieldVm(presenter.vm.form, "color")?.validation.message).toBe(
            "Enter a hex colour, e.g. #3B6FD4."
        );

        findFormFieldVm(presenter.vm.form, "color")?.onChange("");
        await presenter.done();

        expect(presenter.vm.open).toBe(false);
        expect(source.updateStep).toHaveBeenCalledWith(
            "step-1",
            expect.objectContaining({ color: "var(--color-primary-500)" })
        );
    });

    it("a finished custom hex reaches the draft", async () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");

        findFormFieldVm(presenter.vm.form, "color")?.onChange("#3B6FD4");
        await presenter.done();

        expect(source.updateStep).toHaveBeenCalledWith(
            "step-1",
            expect.objectContaining({ color: "#3B6FD4" })
        );
    });

    it("dismiss (the X, Escape, the scrim) applies the edits like Done and closes through the editor", () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");
        findFormFieldVm(presenter.vm.form, "title")?.onChange("Legal review");

        presenter.dismiss();

        expect(source.updateStep).toHaveBeenCalledWith(
            "step-1",
            expect.objectContaining({ title: "Legal review" })
        );
        expect(source.closeStep).toHaveBeenCalledTimes(1);
        expect(presenter.vm.open).toBe(false);
    });

    it("dismiss with an unfinished hex closes and keeps the old colour (only Done is blocked)", () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");
        findFormFieldVm(presenter.vm.form, "title")?.onChange("Legal review");
        findFormFieldVm(presenter.vm.form, "color")?.onChange("#3B6");

        presenter.dismiss();

        expect(source.updateStep).toHaveBeenCalledWith(
            "step-1",
            expect.objectContaining({ title: "Legal review", color: "var(--color-primary-500)" })
        );
        expect(source.closeStep).toHaveBeenCalledTimes(1);
        expect(presenter.vm.open).toBe(false);
    });

    it("dismiss writes nothing when the form was not edited", () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");

        presenter.dismiss();

        expect(source.updateStep).not.toHaveBeenCalled();
        expect(source.closeStep).toHaveBeenCalledTimes(1);
    });

    it("close discards the edits and does not tell the editor", () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");
        findFormFieldVm(presenter.vm.form, "title")?.onChange("Changed");

        presenter.close();

        expect(source.updateStep).not.toHaveBeenCalled();
        expect(source.closeStep).not.toHaveBeenCalled();
        expect(presenter.vm.open).toBe(false);
    });

    it("closes and tells the editor when the step disappears while open (deleted, workflow replaced)", () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");

        source.setSteps([]);

        expect(presenter.vm.open).toBe(false);
        expect(source.closeStep).toHaveBeenCalledTimes(1);
    });

    it("opens the same step again after it closed itself", async () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");
        await presenter.done();

        presenter.open(source, "step-1");

        expect(presenter.vm.open).toBe(true);
    });
});

describe("StepDrawerPresenter: Automation step (R274, QBZ-13, QBZ-14)", () => {
    it("builds the settings form from the definition and lists the cards", () => {
        const { presenter, source } = createSetup(automationStep());

        presenter.open(source, "step-1");

        expect(presenter.vm.typeLabel).toBe("Automation");
        expect(presenter.vm.form?.getData().automationId).toBe("send-webhook");
        expect(findFormFieldVm(presenter.vm.form, "settings.url")?.value).toBe("https://x.test");
        expect(presenter.formOptions.automations.options.map(card => card.id)).toEqual([
            "send-webhook",
            "post-to-slack"
        ]);
        expect(presenter.formOptions.automations.warning).toBeNull();
        expect(presenter.formOptions.automations.emptyText).toBe(
            "No automations are available for this model."
        );
    });

    it("lists only the automations covering the workflow's model, and words the empty text for pages (D35, R269)", () => {
        const { presenter, source } = createSetup(automationStep(), configured => {
            configured.namespace = "wb.page";
        });

        presenter.open(source, "step-1");

        expect(presenter.formOptions.automations.options.map(card => card.id)).toEqual([
            "send-webhook"
        ]);
        expect(presenter.formOptions.automations.emptyText).toBe(
            "No automations are available for pages."
        );
    });

    it("warns that the stored automation no longer exists and builds no settings form", () => {
        const { presenter, source } = createSetup(automationStep(), configured => {
            configured.options = createEditorOptions({ automations: { status: "ready", items: [] } });
        });

        presenter.open(source, "step-1");

        expect(presenter.formOptions.automations.warning).toBe(
            "The automation “send-webhook” no longer exists."
        );
        expect(findFormFieldVm(presenter.vm.form, "settings")).toBeNull();
    });

    it("warns that saved settings no longer validate, only until they are edited (QBZ-13)", () => {
        const { presenter, source } = createSetup(automationStep({ timeout: 500 }));
        presenter.open(source, "step-1");

        expect(
            presenter.formOptions.automations.settingsWarning?.startsWith(
                "Saved settings no longer validate: "
            )
        ).toBe(true);

        findFormFieldVm(presenter.vm.form, "settings.url")?.onChange("https://x.test");

        expect(presenter.formOptions.automations.settingsWarning).toBeNull();
    });

    it("shows the cards as loading, and as failed when the automations failed", () => {
        const { presenter, source } = createSetup(automationStep(), configured => {
            configured.options = createEditorOptions({ automations: { status: "loading", items: [] } });
        });
        presenter.open(source, "step-1");

        expect(presenter.formOptions.automations.loading).toBe(true);
        expect(presenter.formOptions.automations.warning).toBeNull();

        source.setOptions(createEditorOptions({ automations: { status: "failed", items: [] } }));

        expect(presenter.formOptions.automations.failed).toBe(true);

        presenter.formOptions.automations.retry();
        expect(source.retryOptions).toHaveBeenCalledTimes(1);
    });

    it("rebuilds the form with the settings when the definitions arrive after it opened", () => {
        const { presenter, source } = createSetup(automationStep(), configured => {
            configured.options = createEditorOptions({ automations: { status: "loading", items: [] } });
        });
        presenter.open(source, "step-1");
        expect(findFormFieldVm(presenter.vm.form, "settings")).toBeNull();
        findFormFieldVm(presenter.vm.form, "title")?.onChange("Notify");

        source.setOptions(createEditorOptions());

        expect(findFormFieldVm(presenter.vm.form, "settings.url")?.value).toBe("https://x.test");
        expect(findFormFieldVm(presenter.vm.form, "title")?.value).toBe("Notify");
    });

    it("switches at once when no settings were entered", () => {
        const { presenter, source } = createSetup(automationStep({}));
        presenter.open(source, "step-1");

        presenter.formOptions.automations.select("post-to-slack");

        expect(presenter.vm.switchConfirmation).toBeNull();
        expect(presenter.vm.form?.getData().automationId).toBe("post-to-slack");
        expect(findFormFieldVm(presenter.vm.form, "settings")).toBeNull();
    });

    it("asks before switching away from entered settings (QBZ-14)", () => {
        const { presenter, source } = createSetup(automationStep());
        presenter.open(source, "step-1");

        presenter.formOptions.automations.select("post-to-slack");

        expect(presenter.vm.switchConfirmation).toEqual({
            title: "Switch to “Post to Slack”?",
            body: "The settings for Send webhook are cleared. The change applies when you save the workflow.",
            cancelLabel: "Cancel",
            confirmLabel: "Switch automation"
        });
        expect(presenter.vm.form?.getData().automationId).toBe("send-webhook");
    });

    it("also asks after settings were typed into a step that had none", () => {
        const { presenter, source } = createSetup(automationStep({}));
        presenter.open(source, "step-1");
        findFormFieldVm(presenter.vm.form, "settings.url")?.onChange("https://x.test");

        presenter.formOptions.automations.select("post-to-slack");

        expect(presenter.vm.switchConfirmation).not.toBeNull();
    });

    it("selecting the current automation does nothing", () => {
        const { presenter, source } = createSetup(automationStep());
        presenter.open(source, "step-1");

        presenter.formOptions.automations.select("send-webhook");

        expect(presenter.vm.switchConfirmation).toBeNull();
    });

    it("cancel keeps the automation and its settings", () => {
        const { presenter, source } = createSetup(automationStep());
        presenter.open(source, "step-1");
        presenter.formOptions.automations.select("post-to-slack");

        presenter.cancelSwitch();

        expect(presenter.vm.switchConfirmation).toBeNull();
        expect(presenter.vm.form?.getData().automationId).toBe("send-webhook");
        expect(findFormFieldVm(presenter.vm.form, "settings.url")?.value).toBe("https://x.test");
    });

    it("confirm switches, clears the settings and keeps the common fields", async () => {
        const { presenter, source } = createSetup(automationStep());
        presenter.open(source, "step-1");
        findFormFieldVm(presenter.vm.form, "title")?.onChange("Notify");
        presenter.formOptions.automations.select("post-to-slack");

        presenter.confirmSwitch();

        expect(presenter.vm.switchConfirmation).toBeNull();
        expect(presenter.vm.form?.getData().automationId).toBe("post-to-slack");
        expect(findFormFieldVm(presenter.vm.form, "title")?.value).toBe("Notify");

        await presenter.done();

        expect(source.updateStep).toHaveBeenCalledWith(
            "step-1",
            expect.objectContaining({
                title: "Notify",
                config: { automationId: "post-to-slack", settings: {} }
            })
        );
    });

    it("Done writes the Automation config with the edited settings (Review Focus 3)", async () => {
        const { presenter, source } = createSetup(automationStep({ url: "https://x.test" }));
        presenter.open(source, "step-1");

        findFormFieldVm(presenter.vm.form, "settings.url")?.onChange("https://y.test");
        await presenter.done();

        expect(source.updateStep).toHaveBeenCalledWith(
            "step-1",
            expect.objectContaining({
                config: { automationId: "send-webhook", settings: { url: "https://y.test" } }
            })
        );
    });
});

describe("StepDrawerPresenter: namespace and team settings (R284)", () => {
    it("lists no automation but the stored one when no model is open, and words the empty text for the model", () => {
        const { presenter, source } = createSetup(automationStep(), configured => {
            configured.namespace = null;
        });

        presenter.open(source, "step-1");

        expect(presenter.formOptions.automations.options.map(card => card.id)).toEqual([
            "send-webhook"
        ]);
        expect(presenter.formOptions.automations.emptyText).toBe(
            "No automations are available for this model."
        );
    });

    const teamAutomation = () => {
        return createAutomationDefinition({
            id: "notify-team",
            name: "Notify team",
            models: ["*"],
            settingsSchema: {
                type: "object",
                properties: { owner: { type: "string", title: "Owner", ui: "team" } }
            }
        });
    };

    it("asks for the first team results for an automation with a team setting, and selects the stored team", () => {
        const { presenter, source } = createSetup(
            createAutomationStep({
                id: "step-1",
                config: { automationId: "notify-team", settings: { owner: "team-2" } }
            }),
            configured => {
                configured.options = createEditorOptions({
                    automations: { status: "ready", items: [teamAutomation()] }
                });
            }
        );

        presenter.open(source, "step-1");

        expect(source.searchTeams).toHaveBeenCalledWith("");
        expect(presenter.formOptions.teams.selected.map(team => team.id)).toEqual(["team-2"]);
        expect(presenter.formOptions.teams.options.map(team => team.id)).toEqual([
            "team-1",
            "team-2"
        ]);
    });

    it("does not ask for teams for an automation without a team setting", () => {
        const { presenter, source } = createSetup(automationStep());

        presenter.open(source, "step-1");

        expect(source.searchTeams).not.toHaveBeenCalled();
    });
});

describe("StepDrawerPresenter: AI step (R275, QBZ-8, QBZ-47, QBZ-89)", () => {
    it("provides the models and tools the editor loaded, with the stored model selected", () => {
        const { presenter, source } = createSetup(aiStep());

        presenter.open(source, "step-1");

        expect(presenter.vm.typeLabel).toBe("AI");
        expect(presenter.vm.readOnly).toBe(false);
        expect(presenter.vm.licenceAlert).toBeNull();
        expect(presenter.formOptions.aiModels.options.map(option => option.id)).toEqual([
            "anthropic/claude-balanced",
            "openai/gpt-fast"
        ]);
        expect(presenter.formOptions.aiModels.selected?.label).toBe("Claude Balanced");
        expect(presenter.formOptions.aiTools.options).toEqual([
            {
                name: "read-fields",
                title: "Read fields",
                description: "Reads every field of the revision.",
                changesContent: false
            },
            {
                name: "update-fields",
                title: "Update fields",
                description: "Edits field values in the revision.",
                changesContent: true
            }
        ]);
    });

    it("searches the models locally", () => {
        const { presenter, source } = createSetup(aiStep());
        presenter.open(source, "step-1");

        presenter.formOptions.aiModels.search("gpt");

        expect(presenter.formOptions.aiModels.options.map(option => option.id)).toEqual([
            "openai/gpt-fast"
        ]);
    });

    it("shows a model the list no longer offers as retired, not as an error (QBZ-8)", () => {
        const { presenter, source } = createSetup(
            aiStep({ instructions: "x", model: "anthropic/gone", tools: [] })
        );

        presenter.open(source, "step-1");

        expect(presenter.formOptions.aiModels.selected?.label).toBe(
            "anthropic/gone (no longer offered)"
        );
        expect(presenter.formOptions.aiModels.selected?.warning).toContain("is no longer offered");
        expect(presenter.formOptions.aiModels.failed).toBe(false);
    });

    it("shows an empty model list (QBZ-89)", () => {
        const { presenter, source } = createSetup(
            aiStep({ instructions: "", tools: [] }),
            configured => {
                configured.options = createEditorOptions({ aiModels: { status: "ready", items: [] } });
            }
        );

        presenter.open(source, "step-1");

        expect(presenter.formOptions.aiModels.empty).toBe(true);
    });

    it("shows a failed model list with the stored model, and retries through the editor (QBZ-89)", () => {
        const { presenter, source } = createSetup(aiStep(), configured => {
            configured.options = createEditorOptions({
                aiModels: { status: "failed", items: [] },
                aiTools: { status: "failed", items: [] }
            });
        });
        presenter.open(source, "step-1");

        expect(presenter.formOptions.aiModels.failed).toBe(true);
        expect(presenter.formOptions.aiTools.failed).toBe(true);
        expect(presenter.formOptions.aiModels.selected).toEqual({
            id: "anthropic/claude-balanced",
            label: "anthropic/claude-balanced",
            description: null,
            warning: null
        });

        presenter.formOptions.aiModels.retry();

        expect(source.retryOptions).toHaveBeenCalledTimes(1);
    });

    it("is read-only without the licence: the alert shows, the fields are disabled (QBZ-47)", () => {
        const { presenter, source } = createSetup(aiStep(), configured => {
            configured.readOnly = true;
            configured.options = createEditorOptions({
                aiModels: { status: "ready", items: [] },
                aiTools: { status: "ready", items: [] }
            });
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.readOnly).toBe(true);
        expect(presenter.vm.licenceAlert).toEqual({
            title: "AI Power-Ups licence missing",
            text: "This step is read-only. Reviews that reach it fail; they can be restarted once the licence is back."
        });
        expect(findFormFieldVm(presenter.vm.form, "title")?.disabled).toBe(true);
        expect(findFormFieldVm(presenter.vm.form, "instructions")?.disabled).toBe(true);
        expect(presenter.formOptions.aiModels.failed).toBe(false);
        expect(presenter.formOptions.aiModels.empty).toBe(false);
        expect(presenter.formOptions.aiModels.selected?.warning).toBeNull();
    });

    it("Done on a read-only step closes without writing", async () => {
        const { presenter, source } = createSetup(aiStep(), configured => {
            configured.readOnly = true;
        });
        presenter.open(source, "step-1");
        findFormFieldVm(presenter.vm.form, "title")?.onChange("Changed");

        await presenter.done();

        expect(source.updateStep).not.toHaveBeenCalled();
        expect(presenter.vm.open).toBe(false);
        expect(source.closeStep).toHaveBeenCalledTimes(1);
    });

    it("rebuilds the form read-only when the step types arrive and the licence is missing", () => {
        const { presenter, source } = createSetup(aiStep());
        presenter.open(source, "step-1");
        expect(findFormFieldVm(presenter.vm.form, "instructions")?.disabled).toBe(false);

        source.setReadOnly(true);

        expect(presenter.vm.readOnly).toBe(true);
        expect(findFormFieldVm(presenter.vm.form, "instructions")?.disabled).toBe(true);
    });

    it("Done writes exactly instructions, model and tools, keeping tool names the list does not offer (Review Focus 3)", async () => {
        const { presenter, source } = createSetup(
            aiStep({
                instructions: "Check tone",
                model: "anthropic/claude-balanced",
                tools: ["gone"]
            })
        );
        presenter.open(source, "step-1");

        findFormFieldVm(presenter.vm.form, "instructions")?.onChange("Check tone and links");
        findFormFieldVm(presenter.vm.form, "model")?.onChange("openai/gpt-fast");
        await presenter.done();

        expect(source.updateStep).toHaveBeenCalledWith(
            "step-1",
            expect.objectContaining({
                config: {
                    instructions: "Check tone and links",
                    model: "openai/gpt-fast",
                    tools: ["gone"]
                }
            })
        );
        expect(presenter.vm.open).toBe(false);
    });
});

describe("StepDrawerPresenter: unknown step type (R269, R270)", () => {
    const customStep = () => {
        return createReviewStep({ type: "custom-check", config: { anything: 1 } });
    };

    it("shows the type by the server title, builds no form and closes on Done without writing", async () => {
        const { presenter, source } = createSetup(customStep(), configured => {
            configured.readOnly = true;
            configured.options = createEditorOptions({
                stepTypes: {
                    status: "ready",
                    items: [
                        ...createStepTypes(),
                        createEditorStepType({ type: "custom-check", title: "Custom check" })
                    ]
                }
            });
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.kind).toBe("unknown");
        expect(presenter.vm.typeLabel).toBe("Custom check");
        expect(presenter.vm.subtitle).toBe("Custom check step · the type can't be changed");
        expect(presenter.vm.form).toBeNull();
        expect(presenter.vm.readOnly).toBe(true);
        expect(presenter.vm.licenceAlert).toBeNull();

        await presenter.done();

        expect(source.updateStep).not.toHaveBeenCalled();
        expect(presenter.vm.open).toBe(false);
    });

    it("falls back to the type id when the server does not list it", () => {
        const { presenter, source } = createSetup(customStep(), configured => {
            configured.readOnly = true;
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.typeLabel).toBe("custom-check");
    });
});

describe("StepDrawerPresenter: step errors and edits (Q41, QBZ-11, QBZ-13)", () => {
    it("marks and focuses the form field the error names", () => {
        const { presenter, source } = createSetup(peopleStep(), configured => {
            configured.errors = [{ field: "title", message: "The title is not allowed." }];
        });

        presenter.open(source, "step-1");

        const title = findFormFieldVm(presenter.vm.form, "title");
        expect(title?.validation).toEqual({ isValid: false, message: "The title is not allowed." });
        expect(title?.focusRequested).toBe(true);
        expect(presenter.vm.topError).toBeNull();
    });

    it("marks the teams field for config.teams, a client-side message alike", () => {
        const { presenter, source } = createSetup(
            peopleStep({ config: { teams: [] } }),
            configured => {
                configured.errors = [
                    { field: "config.teams", message: "Choose at least one reviewing team." }
                ];
            }
        );

        presenter.open(source, "step-1");

        expect(findFormFieldVm(presenter.vm.form, "teams")?.validation.message).toBe(
            "Choose at least one reviewing team."
        );
    });

    it("marks a setting for config.settings.<path>", () => {
        const { presenter, source } = createSetup(automationStep(), configured => {
            configured.errors = [{ field: "config.settings.url", message: "URL must use https." }];
        });

        presenter.open(source, "step-1");

        expect(findFormFieldVm(presenter.vm.form, "settings.url")?.validation.message).toBe(
            "URL must use https."
        );
    });

    it("shows the message at the top for a field with no form field", () => {
        const { presenter, source } = createSetup(peopleStep(), configured => {
            configured.errors = [
                { field: "config.assignment.rules", message: "Rule 1: the user was deleted." }
            ];
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.topError).toBe("Rule 1: the user was deleted.");
    });

    it("shows the message at the top for an empty field, for config.settings and for a form field that is missing", () => {
        for (const field of ["", "config.settings", "config.model"]) {
            const { presenter, source } = createSetup(peopleStep(), configured => {
                configured.errors = [{ field, message: "Something is wrong." }];
            });

            presenter.open(source, "step-1");

            expect(presenter.vm.topError).toBe("Something is wrong.");
        }
    });

    it("marks every field it can and shows the first message with no field at the top", () => {
        const { presenter, source } = createSetup(
            peopleStep({ title: "", config: { teams: [] } }),
            configured => {
                configured.errors = [
                    { field: "title", message: "Enter a title for this step." },
                    { field: "config.assignment.rules", message: "Rule 1 is wrong." },
                    { field: "config.teams", message: "Choose at least one reviewing team." },
                    { field: "id", message: "Duplicate id." }
                ];
            }
        );

        presenter.open(source, "step-1");

        expect(findFormFieldVm(presenter.vm.form, "title")?.validation.message).toBe(
            "Enter a title for this step."
        );
        expect(findFormFieldVm(presenter.vm.form, "teams")?.validation.message).toBe(
            "Choose at least one reviewing team."
        );
        expect(presenter.vm.topError).toBe("Rule 1 is wrong.");
    });

    it("marks the teams field for a zod path under config.teams (R267)", () => {
        const { presenter, source } = createSetup(peopleStep(), configured => {
            configured.errors = [{ field: "config.teams.0", message: "Team is not valid." }];
        });

        presenter.open(source, "step-1");

        expect(findFormFieldVm(presenter.vm.form, "teams")?.validation.message).toBe(
            "Team is not valid."
        );
    });

    it("shows no error on open when the step has none (QBZ-13)", () => {
        const { presenter, source } = createSetup(peopleStep({ title: "", config: { teams: [] } }));

        presenter.open(source, "step-1");

        expect(findFormFieldVm(presenter.vm.form, "title")?.validation.isValid).not.toBe(false);
        expect(presenter.vm.topError).toBeNull();
    });

    it("the first edit clears the top message", () => {
        const { presenter, source } = createSetup(peopleStep(), configured => {
            configured.errors = [{ field: "", message: "Something is wrong." }];
        });
        presenter.open(source, "step-1");

        findFormFieldVm(presenter.vm.form, "title")?.onChange("A");

        expect(presenter.vm.topError).toBeNull();
    });

    it("editing a field replaces its error with the next validation", async () => {
        const { presenter, source } = createSetup(peopleStep(), configured => {
            configured.errors = [{ field: "title", message: "The title is not allowed." }];
        });
        presenter.open(source, "step-1");

        findFormFieldVm(presenter.vm.form, "title")?.onChange("Legal review");

        await vi.waitFor(() => {
            expect(findFormFieldVm(presenter.vm.form, "title")?.validation.isValid).toBe(true);
        });
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawer.test.tsx`:

```tsx
import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { act } from "@testing-library/react";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { Container } from "@webiny/di";
import { AdminUiProvider } from "@webiny/admin-ui";
import { DiContainerProvider } from "@webiny/app";
import { FormModelFeature } from "@webiny/app-admin/features/formModel/feature.js";
import { IdentityContextFeature } from "@webiny/app-admin/features/security/IdentityContext/feature.js";
import type { EditorStep } from "~/editor/domain/types.js";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { FakeStepDrawerSource } from "~/editor/testing/fakeStepDrawerSource.js";
import { findFormFieldVm } from "~/editor/testing/findFormFieldVm.js";
import { StepDrawerPresenterFeature } from "./feature.js";
import { StepDrawer } from "./StepDrawer.js";

interface FormViewStubFieldVm {
    name: string;
}

interface FormViewStubNodeVm {
    type: string;
    fields?: FormViewStubFieldVm[];
}

interface FormViewStubProps {
    form: { layout: FormViewStubNodeVm[] };
}

// The real FormView needs the admin config to find renderers; the stub lists the fields it was given
// and proves the options context reaches the form.
vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    const react = await import("react");
    const { useStepFormOptions } = await import(
        "~/editor/presentation/stepForm/useStepFormOptions.js"
    );
    const FormView = (props: FormViewStubProps) => {
        const options = useStepFormOptions();
        const names: string[] = [];
        for (const node of props.form.layout) {
            for (const field of node.fields ?? []) {
                names.push(field.name);
            }
        }
        return react.createElement("div", {
            "data-testid": "form-view",
            "data-fields": names.join(","),
            "data-transports": String(options.transports.options.length)
        });
    };
    return { ...actual, FormView };
});

const createSetup = (step: EditorStep, configure?: (source: FakeStepDrawerSource) => void) => {
    const container = new Container();
    IdentityContextFeature.register(container);
    FormModelFeature.register(container);
    StepDrawerPresenterFeature.register(container);
    const presenter = StepDrawerPresenterFeature.resolve(container).presenter;
    const source = new FakeStepDrawerSource([step]);
    if (configure) {
        configure(source);
    }
    const wrap = (stepId: string | null) => {
        return (
            <AdminUiProvider>
                <DiContainerProvider container={container}>
                    <StepDrawer source={source} stepId={stepId} />
                </DiContainerProvider>
            </AdminUiProvider>
        );
    };
    const view = render(wrap(null));
    const open = (stepId: string | null) => {
        view.rerender(wrap(stepId));
    };
    return { presenter, source, open, container };
};

const automationStep = () => {
    return createAutomationStep({
        id: "step-1",
        config: { automationId: "send-webhook", settings: { url: "https://x.test" } }
    });
};

describe("StepDrawer (README 4, R284)", () => {
    afterEach(() => {
        cleanup();
    });

    it("renders nothing while stepId is null", () => {
        createSetup(createReviewStep());

        expect(screen.queryByRole("button", { name: "Done" })).toBeNull();
    });

    it("opens for the stepId, with the sub line above the title, the footer text and Done", () => {
        const { open } = createSetup(createReviewStep());

        act(() => {
            open("step-1");
        });

        expect(screen.getByText("Legal sign-off")).toBeDefined();
        expect(screen.getByText("People step · the type can't be changed")).toBeDefined();
        expect(screen.getByText("Edits stay in this workflow until you save it.")).toBeDefined();
        expect(screen.getByRole("button", { name: "Done" })).toBeDefined();
    });

    it("closes without telling the editor when stepId turns null", () => {
        const { open, source } = createSetup(createReviewStep());
        act(() => {
            open("step-1");
        });

        act(() => {
            open(null);
        });

        expect(screen.queryByRole("button", { name: "Done" })).toBeNull();
        expect(source.closeStep).not.toHaveBeenCalled();
    });

    it("renders the form and provides the options context to it", () => {
        const { open } = createSetup(createReviewStep());

        act(() => {
            open("step-1");
        });

        const form = screen.getByTestId("form-view");
        expect(form.getAttribute("data-fields")).toBe(
            "title,color,description,teams,notifications"
        );
        expect(form.getAttribute("data-transports")).toBe("1");
    });

    it("applies the edits and calls closeStep on Done", async () => {
        const { open, presenter, source } = createSetup(createReviewStep());
        act(() => {
            open("step-1");
        });
        act(() => {
            findFormFieldVm(presenter.vm.form, "title")?.onChange("Legal review");
        });

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Done" }));
        });

        expect(source.updateStep).toHaveBeenCalledWith(
            "step-1",
            expect.objectContaining({ title: "Legal review" })
        );
        expect(source.closeStep).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole("button", { name: "Done" })).toBeNull();
    });

    it("Escape applies the edits like Done and calls closeStep", async () => {
        const { open, presenter, source } = createSetup(createReviewStep());
        act(() => {
            open("step-1");
        });
        act(() => {
            findFormFieldVm(presenter.vm.form, "title")?.onChange("Legal review");
        });

        await act(async () => {
            fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
        });

        expect(source.updateStep).toHaveBeenCalledTimes(1);
        expect(source.closeStep).toHaveBeenCalledTimes(1);
    });

    it("reopens the same step after the editor cleared and set the id again", () => {
        const { open } = createSetup(createReviewStep());
        act(() => {
            open("step-1");
        });
        act(() => {
            open(null);
        });

        act(() => {
            open("step-1");
        });

        expect(screen.getByRole("button", { name: "Done" })).toBeDefined();
    });

    it("shows an error with no form field at the top of the drawer", () => {
        const { open } = createSetup(createReviewStep(), configured => {
            configured.errors = [
                { field: "config.assignment.rules", message: "Rule 1: the user was deleted." }
            ];
        });

        act(() => {
            open("step-1");
        });

        expect(screen.getByText("Rule 1: the user was deleted.")).toBeDefined();
    });

    it("shows the licence alert for an AI step without the licence (QBZ-47)", () => {
        const { open } = createSetup(createAiStep({ id: "step-1" }), configured => {
            configured.readOnly = true;
        });

        act(() => {
            open("step-1");
        });

        expect(screen.getByText("AI Power-Ups licence missing")).toBeDefined();
        expect(
            screen.getByText(
                "This step is read-only. Reviews that reach it fail; they can be restarted once the licence is back.",
                { exact: false }
            )
        ).toBeDefined();
    });

    it("asks before switching an automation that has settings, and switches on confirm (QBZ-14)", async () => {
        const { open, presenter } = createSetup(automationStep());
        act(() => {
            open("step-1");
        });
        expect(screen.getByTestId("form-view").getAttribute("data-fields")).toContain("settings");

        act(() => {
            presenter.formOptions.automations.select("post-to-slack");
        });

        expect(screen.getByText("Switch to “Post to Slack”?")).toBeDefined();

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Switch automation" }));
        });

        expect(screen.queryByText("Switch to “Post to Slack”?")).toBeNull();
        expect(screen.getByTestId("form-view").getAttribute("data-fields")).not.toContain(
            "settings"
        );
    });

    it("keeps the automation when the switch is cancelled", async () => {
        const { open, presenter } = createSetup(automationStep());
        act(() => {
            open("step-1");
        });
        act(() => {
            presenter.formOptions.automations.select("post-to-slack");
        });

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        });

        expect(screen.queryByText("Switch to “Post to Slack”?")).toBeNull();
        expect(presenter.vm.form?.getData().automationId).toBe("send-webhook");
    });

    it("resets the presenter when the drawer unmounts", () => {
        const { open, presenter } = createSetup(createReviewStep());
        act(() => {
            open("step-1");
        });

        cleanup();

        expect(presenter.vm.open).toBe(false);
    });
});
```

Modify `packages/app-workflows/src/app.test.tsx`. Add the imports next to the other presenter imports:

```ts
import { FormModelFactory } from "@webiny/app-admin";
import { StepDrawerPresenter } from "~/editor/presentation/stepDrawer/abstractions.js";
```

In `mount`, add the FormModel factory (the drawer presenter depends on it; the admin registers it in the real app) immediately after the `container.registerInstance(IdentityContext, {...});` call:

```ts
    container.registerInstance(FormModelFactory, { create: vi.fn() });
```

Append at the end of the file:

```tsx
describe("WorkflowsAdminApp step drawer", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the step drawer presenter as a singleton when the flag is on", () => {
        const container = mount(true);

        const first = container.resolve(StepDrawerPresenter);
        expect(first).toBeDefined();
        expect(first).toBe(container.resolve(StepDrawerPresenter));
    });

    it("registers nothing of it when the flag is off (R211)", () => {
        const container = mount(false);

        expect(() => container.resolve(StepDrawerPresenter)).toThrow();
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/stepDrawerPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawer.test.tsx 2>&1 | tail -40
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
```

Expected: the first three fail with `Failed to resolve import` for `getFormFieldPath.js`, `feature.js` and `StepDrawer.js` (the testing files import `stepDrawer/abstractions.js`, which does not exist either); `app.test.tsx` fails because `~/editor/presentation/stepDrawer/abstractions.js` does not exist. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/presentation/stepDrawer/stepDrawerMessages.ts`:

```ts
// Copy of the step drawer (design README 4, R269, R270).
export const STEP_DRAWER_MESSAGES = {
    untitledStep: "Untitled step",
    footerText: "Edits stay in this workflow until you save it.",
    done: "Done"
} as const;
```

Create `packages/app-workflows/src/editor/presentation/stepDrawer/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { FormModel } from "@webiny/app-admin";
import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorStepPatch } from "~/editor/model/EditorStepPatch.js";
import type { StepFieldError } from "~/editor/model/StepFieldError.js";
import type { WorkflowEditorOptions } from "~/editor/presentation/editor/abstractions.js";
import type { WorkflowTeamOptions } from "~/editor/presentation/editor/abstractions.js";
import type { SwitchAutomationConfirmationVm } from "~/editor/presentation/stepForm/buildSwitchConfirmation.js";
import type { StepFormOptions } from "~/editor/presentation/stepForm/StepFormOptions.js";

// `review` is the People type (D98); any other type id is unknown and shown read-only (R270).
export type StepKind = "review" | "automation" | "ai" | "unknown";

/*
 * What the drawer reads from the editor presenter (Task 9's non-VM accessors, the R234 precedent):
 * the editor presenter satisfies it structurally and is passed to `open`.
 */
export interface StepDrawerSource {
    getStep(stepId: string): EditorStep | null;
    // The drawer's Done; also clears that step's errors.
    updateStep(stepId: string, patch: EditorStepPatch): void;
    // The client validation errors of a failed Save and the mapped server error of the step.
    getStepFieldErrors(stepId: string): StepFieldError[];
    isStepReadOnly(stepId: string): boolean;
    getOptions(): WorkflowEditorOptions;
    getTeamOptions(): WorkflowTeamOptions;
    searchTeams(search: string): void;
    retryTeams(): Promise<void>;
    retryOptions(): Promise<void>;
    // The open workflow's model namespace (`cms.article`, `wb.page`); null with no model open.
    getNamespace(): string | null;
    // Tells the editor the drawer closed itself (Done, X, Escape, scrim, a vanished step): `vm.openStepId` becomes null.
    closeStep(): void;
}

export interface StepDrawerAlertVm {
    title: string;
    text: string;
}

// Render-ready (R234).
export interface IStepDrawerViewModel {
    open: boolean;
    kind: StepKind;
    typeLabel: string;
    title: string;
    subtitle: string;
    footerText: string;
    doneLabel: string;
    readOnly: boolean;
    licenceAlert: StepDrawerAlertVm | null;
    topError: string | null;
    form: FormModel.FormVM | null;
    switchConfirmation: SwitchAutomationConfirmationVm | null;
}

export interface IStepDrawerPresenter {
    readonly vm: IStepDrawerViewModel;
    // The lists the renderers read through `StepFormOptionsContext`; not part of the view model, it carries callbacks.
    readonly formOptions: StepFormOptions;
    open(source: StepDrawerSource, stepId: string): void;
    // Applies the form to the draft and closes through `source.closeStep()`; stays open on an unfinished hex colour.
    done(): Promise<void>;
    // The X, Escape and the scrim: the same, without the hex block (an unfinished hex keeps the old colour).
    dismiss(): void;
    // Closes without applying and without telling the source; the view uses it when its `stepId` is null.
    close(): void;
    confirmSwitch(): void;
    cancelSwitch(): void;
    dispose(): void;
}

export const StepDrawerPresenter = createAbstraction<IStepDrawerPresenter>(
    "Workflows/Editor/StepDrawerPresenter"
);

export namespace StepDrawerPresenter {
    export type Interface = IStepDrawerPresenter;
    export type ViewModel = IStepDrawerViewModel;
    export type Source = StepDrawerSource;
}
```

Create `packages/app-workflows/src/editor/presentation/stepDrawer/getStepKind.ts`:

```ts
import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { StepKind } from "./abstractions.js";

export const getStepKind = (type: string): StepKind => {
    if (type === StepTypeId.Review) {
        return "review";
    }
    if (type === StepTypeId.Automation) {
        return "automation";
    }
    if (type === StepTypeId.Ai) {
        return "ai";
    }
    return "unknown";
};
```

Create `packages/app-workflows/src/editor/presentation/stepDrawer/getFormFieldPath.ts`:

```ts
const SETTINGS_PREFIX = "config.settings.";
const TEAMS_PREFIX = "config.teams.";

const CONFIG_FIELDS: Record<string, string> = {
    "config.teams": "teams",
    "config.automationId": "automationId",
    "config.instructions": "instructions",
    "config.model": "model",
    "config.tools": "tools"
};

const STEP_FIELDS = new Set(["title", "color", "notifications"]);

/*
 * The form field a step error's `field` (R267) belongs to, or null when 9a's forms have none
 * (`id`, `type`, `config.assignment.rules`, `config.settings` itself, another zod path, an empty field):
 * the drawer then shows the message at the top.
 */
export const getFormFieldPath = (field: string | null): string | null => {
    if (field === null) {
        return null;
    }
    if (STEP_FIELDS.has(field)) {
        return field;
    }
    // A zod issue of a review config path, e.g. `config.teams.0` (R267).
    if (field.startsWith(TEAMS_PREFIX)) {
        return "teams";
    }
    if (field.startsWith(SETTINGS_PREFIX)) {
        return `settings.${field.slice(SETTINGS_PREFIX.length)}`;
    }
    return CONFIG_FIELDS[field] ?? null;
};
```

Create `packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.ts`:

```ts
import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import { reaction } from "mobx";
import { toJS } from "mobx";
import { FormModelFactory } from "@webiny/app-admin";
import type { FormModel } from "@webiny/app-admin";
import { jsonSchemaValueToFormData } from "@webiny/app-admin";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorStepPatch } from "~/editor/model/EditorStepPatch.js";
import { getStepTypeLabel } from "~/editor/model/getStepTypeLabel.js";
import { readAutomationConfig } from "~/editor/model/readAutomationConfig.js";
import type { StepFieldError } from "~/editor/model/StepFieldError.js";
import { AI_FORM_MESSAGES } from "~/editor/presentation/stepForm/aiFormMessages.js";
import { buildAiStepForm } from "~/editor/presentation/stepForm/buildAiStepForm.js";
import { buildAutomationStepForm } from "~/editor/presentation/stepForm/buildAutomationStepForm.js";
import { buildPeopleStepForm } from "~/editor/presentation/stepForm/buildPeopleStepForm.js";
import { buildSwitchConfirmation } from "~/editor/presentation/stepForm/buildSwitchConfirmation.js";
import type { SwitchAutomationConfirmationVm } from "~/editor/presentation/stepForm/buildSwitchConfirmation.js";
import { createEmptyStepFormOptions } from "~/editor/presentation/stepForm/createEmptyStepFormOptions.js";
import { getAiFormData } from "~/editor/presentation/stepForm/getAiFormData.js";
import { getAiModelOptions } from "~/editor/presentation/stepForm/getAiModelOptions.js";
import { getAiStepPatch } from "~/editor/presentation/stepForm/getAiStepPatch.js";
import { getAutomationCards } from "~/editor/presentation/stepForm/getAutomationCards.js";
import { getAutomationEmptyText } from "~/editor/presentation/stepForm/getAutomationEmptyText.js";
import { getAutomationFormData } from "~/editor/presentation/stepForm/getAutomationFormData.js";
import { getAutomationStepPatch } from "~/editor/presentation/stepForm/getAutomationStepPatch.js";
import { getAutomationWarnings } from "~/editor/model/getAutomationWarnings.js";
import type { AutomationWarnings } from "~/editor/model/getAutomationWarnings.js";
import { getPeopleFormData } from "~/editor/presentation/stepForm/getPeopleFormData.js";
import { hasTeamSetting } from "~/editor/presentation/stepForm/hasTeamSetting.js";
import { getPeopleStepPatch } from "~/editor/presentation/stepForm/getPeopleStepPatch.js";
import { isNonEmptySettings } from "~/editor/model/isNonEmptySettings.js";
import { toTeamPickerOption } from "~/editor/presentation/stepForm/toTeamPickerOption.js";
import type { AiFormValues } from "~/editor/presentation/stepForm/StepFormData.js";
import type { AutomationFormValues } from "~/editor/presentation/stepForm/StepFormData.js";
import type { CommonFormValues } from "~/editor/presentation/stepForm/StepFormData.js";
import type { PeopleFormValues } from "~/editor/presentation/stepForm/StepFormData.js";
import type { StepFormOptions } from "~/editor/presentation/stepForm/StepFormOptions.js";
import { StepDrawerPresenter as Abstraction } from "./abstractions.js";
import type { StepDrawerSource } from "./abstractions.js";
import type { StepKind } from "./abstractions.js";
import { getFormFieldPath } from "./getFormFieldPath.js";
import { getStepKind } from "./getStepKind.js";
import { STEP_DRAWER_MESSAGES } from "./stepDrawerMessages.js";

class StepDrawerPresenterImpl implements Abstraction.Interface {
    private source: StepDrawerSource | null = null;
    private stepId = "";
    private step: EditorStep | null = null;
    private kind: StepKind = "unknown";
    private form: FormModel.Interface | null = null;
    private topError: string | null = null;
    private pendingAutomationId: string | null = null;
    private storedSettings: unknown = undefined;
    private settingsBaseline = "null";
    private aiQuery = "";
    private stopWatching: Array<() => void> = [];

    constructor(private formModelFactory: FormModelFactory.Interface) {
        makeAutoObservable<
            StepDrawerPresenterImpl,
            "formModelFactory" | "source" | "step" | "form" | "storedSettings" | "stopWatching"
        >(this, {
            formModelFactory: false,
            source: observableRef,
            step: observableRef,
            form: observableRef,
            storedSettings: observableRef,
            stopWatching: false
        });
    }

    get vm(): Abstraction.ViewModel {
        const source = this.source;
        const step = this.step;
        const open = source !== null && step !== null;

        let title = step ? step.title : "";
        const formTitle = this.getFieldText("title");
        if (formTitle !== null) {
            title = formTitle;
        }
        if (title.trim() === "") {
            title = STEP_DRAWER_MESSAGES.untitledStep;
        }

        let typeLabel = "";
        if (source !== null && step !== null) {
            typeLabel = getStepTypeLabel(step.type, source.getOptions().stepTypes.items);
        }

        const readOnly = this.isReadOnly();
        let licenceAlert: Abstraction.ViewModel["licenceAlert"] = null;
        if (this.kind === "ai" && readOnly) {
            licenceAlert = {
                title: AI_FORM_MESSAGES.licenceTitle,
                text: AI_FORM_MESSAGES.licenceText
            };
        }

        let switchConfirmation: Abstraction.ViewModel["switchConfirmation"] = null;
        if (this.pendingAutomationId !== null) {
            switchConfirmation = this.getSwitchConfirmation(this.pendingAutomationId);
        }

        return {
            open,
            kind: this.kind,
            typeLabel,
            title,
            subtitle: `${typeLabel} step · the type can't be changed`,
            footerText: STEP_DRAWER_MESSAGES.footerText,
            doneLabel: STEP_DRAWER_MESSAGES.done,
            readOnly,
            licenceAlert,
            topError: this.topError,
            form: this.form ? this.form.vm : null,
            switchConfirmation
        };
    }

    get formOptions(): StepFormOptions {
        const source = this.source;
        if (source === null) {
            return createEmptyStepFormOptions();
        }

        const options = source.getOptions();
        const teamOptions = source.getTeamOptions();
        const namespace = source.getNamespace();
        const automationId = this.getFieldString("automationId");
        const readOnly = this.isReadOnly();

        let warnings: AutomationWarnings = { warning: null, settingsWarning: null };
        if (options.automations.status === "ready") {
            warnings = getAutomationWarnings({
                definitions: options.automations.items,
                selectedId: automationId,
                storedSettings: this.storedSettings,
                settingsPristine: this.getSettingsJson() === this.settingsBaseline
            });
        }

        const models = getAiModelOptions({
            models: options.aiModels.items,
            loaded: options.aiModels.status === "ready" && !readOnly,
            query: this.aiQuery,
            selectedId: this.getFieldString("model")
        });

        // Every known team a team field holds: the People list, or a `ui: "team"` setting (R284).
        const heldIds = [...this.getSelectedTeamIds(), ...this.getSettingTeamIds()];
        const selectedTeams = teamOptions.known.filter(team => heldIds.includes(team.id));

        return {
            teams: {
                loading: teamOptions.loading,
                failed: teamOptions.failed,
                retry: () => {
                    void source.retryTeams();
                },
                options: teamOptions.results.map(toTeamPickerOption),
                selected: selectedTeams.map(toTeamPickerOption),
                search: query => source.searchTeams(query)
            },
            transports: {
                loading: options.transports.status === "loading",
                failed: options.transports.status === "failed",
                retry: () => {
                    void source.retryOptions();
                },
                options: options.transports.items.map(transport => {
                    return {
                        id: transport.id,
                        title: transport.title,
                        description: transport.description
                    };
                })
            },
            automations: {
                loading: options.automations.status === "loading",
                failed: options.automations.status === "failed",
                retry: () => {
                    void source.retryOptions();
                },
                options: getAutomationCards({
                    definitions: options.automations.items,
                    namespace,
                    selectedId: automationId
                }),
                emptyText: getAutomationEmptyText(namespace),
                warning: warnings.warning,
                settingsWarning: warnings.settingsWarning,
                select: id => this.requestAutomation(id)
            },
            aiModels: {
                loading: options.aiModels.status === "loading",
                failed: options.aiModels.status === "failed",
                retry: () => {
                    void source.retryOptions();
                },
                options: models.options,
                selected: models.selected,
                empty: models.empty,
                search: query => this.searchAiModels(query)
            },
            aiTools: {
                loading: options.aiTools.status === "loading",
                failed: options.aiTools.status === "failed",
                retry: () => {
                    void source.retryOptions();
                },
                options: options.aiTools.items.map(tool => {
                    return {
                        name: tool.name,
                        title: tool.title,
                        description: tool.description,
                        changesContent: tool.changesContent
                    };
                })
            }
        };
    }

    open(source: StepDrawerSource, stepId: string): void {
        this.reset();
        const step = source.getStep(stepId);
        if (step === null) {
            return;
        }

        this.source = source;
        this.stepId = stepId;
        this.step = toJS(step);
        this.kind = getStepKind(step.type);
        if (this.kind === "review") {
            source.searchTeams("");
        }

        this.buildForm();
        this.applyStepErrors(source.getStepFieldErrors(stepId));
        this.watch();
    }

    async done(): Promise<void> {
        const source = this.source;
        const form = this.form;
        if (source === null) {
            return;
        }
        if (form === null || this.isReadOnly()) {
            this.finish();
            return;
        }

        // An unfinished hex stays in the field and never reaches the draft (R273): keep the drawer open.
        const colourValid = await form.field("color").validate({ force: true });
        if (this.source !== source) {
            return;
        }
        if (!colourValid) {
            form.focusField("color");
            return;
        }

        this.apply();
        this.finish();
    }

    dismiss(): void {
        this.apply();
        this.finish();
    }

    close(): void {
        this.reset();
    }

    confirmSwitch(): void {
        const id = this.pendingAutomationId;
        this.setPendingAutomation(null);
        if (id !== null) {
            this.replaceAutomationForm(id, undefined, true);
        }
    }

    cancelSwitch(): void {
        this.setPendingAutomation(null);
    }

    dispose(): void {
        this.reset();
    }

    // Writes the edited form to the editor; nothing when it was not edited or the step is read-only.
    private apply(): void {
        const source = this.source;
        const step = this.step;
        const form = this.form;
        if (source === null || step === null || form === null || this.isReadOnly()) {
            return;
        }
        if (!form.isDirty) {
            return;
        }
        const patch = this.getPatch(step, form);
        source.updateStep(this.stepId, patch);
    }

    // Closes and tells the editor, so `vm.openStepId` becomes null (R284).
    private finish(): void {
        const source = this.source;
        this.reset();
        if (source !== null) {
            source.closeStep();
        }
    }

    private reset(): void {
        for (const stop of this.stopWatching) {
            stop();
        }
        this.stopWatching = [];
        this.source = null;
        this.stepId = "";
        this.step = null;
        this.kind = "unknown";
        this.form = null;
        this.topError = null;
        this.pendingAutomationId = null;
        this.storedSettings = undefined;
        this.settingsBaseline = "null";
        this.aiQuery = "";
    }

    private isReadOnly(): boolean {
        if (this.source === null || this.step === null) {
            return false;
        }
        return this.source.isStepReadOnly(this.stepId);
    }

    private watch(): void {
        const source = this.source;
        if (source === null) {
            return;
        }

        // The first edit clears the message at the top (QBZ-11).
        const stopDirty = reaction(
            () => (this.form ? this.form.isDirty : false),
            dirty => {
                if (dirty) {
                    this.clearTopError();
                }
            }
        );
        // Definitions that arrive after the drawer opened: rebuild the automation form with its settings.
        const stopDefinitions = reaction(
            () => source.getOptions().automations.items,
            () => {
                if (this.kind === "automation") {
                    this.rebuildAutomationForm();
                    this.applyStepErrors(source.getStepFieldErrors(this.stepId));
                }
            }
        );
        // The step types arrive and the AI editor turns out to be missing (or present): rebuild the form.
        const stopReadOnly = reaction(
            () => source.isStepReadOnly(this.stepId),
            () => this.buildForm()
        );

        // The step is gone (deleted, workflow replaced): close and tell the editor.
        const stopStep = reaction(
            () => source.getStep(this.stepId) === null,
            gone => {
                if (gone) {
                    this.finish();
                }
            }
        );

        this.stopWatching = [stopDirty, stopDefinitions, stopReadOnly, stopStep];
    }

    private clearTopError(): void {
        this.topError = null;
    }

    private applyStepErrors(errors: StepFieldError[]): void {
        const form = this.form;
        let focused = false;

        for (const error of errors) {
            const path = getFormFieldPath(error.field);
            if (path === null || form === null) {
                this.showTopError(error.message);
                continue;
            }
            try {
                form.field(path).setValidation({ isValid: false, message: error.message });
                if (!focused) {
                    form.focusField(path);
                    focused = true;
                }
            } catch {
                this.showTopError(error.message);
            }
        }
    }

    private showTopError(message: string): void {
        if (this.topError === null) {
            this.topError = message;
        }
    }

    private buildForm(): void {
        const step = this.step;
        if (step === null) {
            return;
        }

        if (this.kind === "automation") {
            const config = readAutomationConfig(step.config);
            let automationId: string | null = null;
            if (config.automationId !== "") {
                automationId = config.automationId;
            }
            this.replaceAutomationForm(automationId, config.settings, false);
            return;
        }

        let values: CommonFormValues | null = null;
        let form: FormModel.Interface | null = null;
        if (this.kind === "review") {
            values = getPeopleFormData(step);
            form = this.formModelFactory.create(buildPeopleStepForm());
        }
        if (this.kind === "ai") {
            values = getAiFormData(step);
            form = this.formModelFactory.create(buildAiStepForm({ readOnly: this.isReadOnly() }));
        }
        if (values === null || form === null) {
            this.form = null;
            return;
        }

        form.setData(values, { dirty: false });
        this.form = form;
    }

    private replaceAutomationForm(
        automationId: string | null,
        settingsValue: unknown,
        dirty: boolean
    ): void {
        const step = this.step;
        if (step === null) {
            return;
        }

        const definition = this.findDefinition(automationId);
        const form = this.formModelFactory.create(buildAutomationStepForm({ definition }));
        const values: AutomationFormValues = getAutomationFormData(step, definition);
        if (this.form !== null) {
            const previous: AutomationFormValues = this.form.getData();
            values.title = previous.title;
            values.color = previous.color;
            values.description = previous.description;
            values.notifications = previous.notifications;
        }
        values.automationId = automationId;
        values.settings = null;
        if (definition !== null && definition.settingsSchema !== null) {
            values.settings = jsonSchemaValueToFormData(definition.settingsSchema, settingsValue);
        }

        form.setData(values, { dirty });
        if (definition !== null && hasTeamSetting(definition.settingsSchema) && this.source !== null) {
            this.source.searchTeams("");
        }
        this.storedSettings = settingsValue;
        this.form = form;
        this.settingsBaseline = this.getSettingsJson();
        if (dirty) {
            this.clearTopError();
        }
    }

    private rebuildAutomationForm(): void {
        const wasDirty = this.form ? this.form.isDirty : false;
        this.replaceAutomationForm(
            this.getFieldString("automationId"),
            this.storedSettings,
            wasDirty
        );
    }

    private findDefinition(id: string | null): AutomationDefinition | null {
        if (id === null || this.source === null) {
            return null;
        }
        const definitions = this.source.getOptions().automations.items;
        return definitions.find(definition => definition.id === id) ?? null;
    }

    private getPatch(step: EditorStep, form: FormModel.Interface): EditorStepPatch {
        if (this.kind === "automation") {
            const values: AutomationFormValues = form.getData();
            const definition = this.findDefinition(values.automationId);
            return getAutomationStepPatch(step, values, definition);
        }
        if (this.kind === "ai") {
            const values: AiFormValues = form.getData();
            return getAiStepPatch(step, values);
        }
        const values: PeopleFormValues = form.getData();
        return getPeopleStepPatch(step, values);
    }

    private getFieldString(name: string): string | null {
        if (this.form === null) {
            return null;
        }
        const data = this.form.getData();
        const value = data[name];
        if (typeof value === "string" && value !== "") {
            return value;
        }
        return null;
    }

    // The raw text of a form field, "" included (the title shows `Untitled step` when cleared).
    private getFieldText(name: string): string | null {
        if (this.form === null) {
            return null;
        }
        const data = this.form.getData();
        const value = data[name];
        if (typeof value === "string") {
            return value;
        }
        return null;
    }

    // The team ids held by `ui: "team"` settings of the open automation form.
    private getSettingTeamIds(): string[] {
        if (this.form === null || this.kind !== "automation") {
            return [];
        }
        const data = this.form.getData();
        const settings = data.settings;
        if (typeof settings !== "object" || settings === null) {
            return [];
        }
        return Object.values(settings).filter((value): value is string => {
            return typeof value === "string" && value !== "";
        });
    }

    private getSettingsJson(): string {
        if (this.form === null) {
            return "null";
        }
        const data = this.form.getData();
        return JSON.stringify(data.settings ?? null);
    }

    private getSelectedTeamIds(): string[] {
        if (this.form === null || this.kind !== "review") {
            return [];
        }
        const data = this.form.getData();
        if (Array.isArray(data.teams)) {
            return data.teams;
        }
        return [];
    }

    private getSwitchConfirmation(nextId: string): SwitchAutomationConfirmationVm {
        const next = this.findDefinition(nextId);
        const currentId = this.getFieldString("automationId");
        const current = this.findDefinition(currentId);

        const nextName = next ? next.name : nextId;
        let currentName = currentId ?? "";
        if (current) {
            currentName = current.name;
        }
        return buildSwitchConfirmation({ nextName, currentName });
    }

    private requestAutomation(id: string): void {
        if (id === this.getFieldString("automationId")) {
            return;
        }
        const hadSettings = isNonEmptySettings(this.storedSettings);
        const changed = this.getSettingsJson() !== this.settingsBaseline;
        if (hadSettings || changed) {
            this.setPendingAutomation(id);
            return;
        }
        this.replaceAutomationForm(id, undefined, true);
    }

    private setPendingAutomation(id: string | null): void {
        this.pendingAutomationId = id;
    }

    private searchAiModels(query: string): void {
        this.aiQuery = query;
    }
}

export const StepDrawerPresenter = Abstraction.createImplementation({
    implementation: StepDrawerPresenterImpl,
    dependencies: [FormModelFactory]
});
```

Create `packages/app-workflows/src/editor/presentation/stepDrawer/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { StepDrawerPresenter as Abstraction } from "./abstractions.js";
import { StepDrawerPresenter } from "./StepDrawerPresenter.js";

export const StepDrawerPresenterFeature = createFeature({
    name: "Workflows/Editor/StepDrawerPresenter",
    register(container) {
        // A singleton, so the container keeps one drawer state; `dispose` resets it (`StepDrawer` calls it on unmount).
        container.register(StepDrawerPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
```

Create `packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawer.tsx`:

```tsx
import React from "react";
import { useEffect } from "react";
import { Alert } from "@webiny/admin-ui";
import { Drawer } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { FormView } from "@webiny/app-admin";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { ReactComponent as AutoAwesomeIcon } from "@webiny/icons/auto_awesome.svg";
import { ReactComponent as BoltIcon } from "@webiny/icons/bolt.svg";
import { ReactComponent as GroupIcon } from "@webiny/icons/group.svg";
import { ReactComponent as RateReviewIcon } from "@webiny/icons/rate_review.svg";
import { StepFormOptionsContext } from "~/editor/presentation/stepForm/StepFormOptionsContext.js";
import { SwitchAutomationDialog } from "~/editor/presentation/stepForm/components/SwitchAutomationDialog.js";
import type { StepDrawerSource } from "./abstractions.js";
import type { StepKind } from "./abstractions.js";
import { StepDrawerPresenterFeature } from "./feature.js";

export interface StepDrawerProps {
    // The editor presenter (R284).
    source: StepDrawerSource;
    // `vm.openStepId` of the editor: the drawer opens for it and closes when it is null.
    stepId: string | null;
}

interface StepTypeTileProps {
    kind: StepKind;
}

const KIND_ICONS = {
    review: <GroupIcon />,
    automation: <BoltIcon />,
    ai: <AutoAwesomeIcon />,
    unknown: <RateReviewIcon />
};

// The neutral 36px tile of the header (design README 4): the type's icon.
const StepTypeTile = ({ kind }: StepTypeTileProps) => {
    return (
        <span
            className={
                "flex size-9 shrink-0 items-center justify-center rounded bg-neutral-dimmed text-neutral-strong"
            }
        >
            {KIND_ICONS[kind]}
        </span>
    );
};

/*
 * The step drawer (design README 4, R284): 560px, over the editor. An effect opens it for the
 * editor's `openStepId` and closes it when that is null. Closing it itself (Done, the X, Escape, the
 * scrim) applies the edits to the unsaved workflow and tells the editor through `source.closeStep()`;
 * only the page-level Save persists anything (D92).
 */
export const StepDrawer = createReactiveComponent(function StepDrawer(props: StepDrawerProps) {
    const { source, stepId } = props;
    const { presenter } = useFeature(StepDrawerPresenterFeature);

    useEffect(() => {
        if (stepId === null) {
            presenter.close();
            return;
        }
        presenter.open(source, stepId);
    }, [presenter, source, stepId]);

    useEffect(() => {
        return () => {
            presenter.dispose();
        };
    }, [presenter]);

    const { vm } = presenter;

    if (!vm.open) {
        return null;
    }

    return (
        <StepFormOptionsContext.Provider value={presenter.formOptions}>
            <Drawer
                open
                modal
                width={"560px"}
                title={
                    <div className={"flex flex-col"}>
                        <Text size={"sm"} className={"font-normal text-neutral-strong"}>
                            {vm.subtitle}
                        </Text>
                        <span>{vm.title}</span>
                    </div>
                }
                icon={<StepTypeTile kind={vm.kind} />}
                bodyPadding
                headerSeparator
                footerSeparator
                onClose={() => presenter.dismiss()}
                info={<Text size={"sm"}>{vm.footerText}</Text>}
                actions={
                    <Drawer.ConfirmButton
                        text={vm.doneLabel}
                        onClick={() => {
                            void presenter.done();
                        }}
                    />
                }
            >
                <div className={"flex flex-col gap-md"}>
                    {vm.licenceAlert && (
                        <Alert type={"warning"} variant={"subtle"}>
                            <strong>{vm.licenceAlert.title}</strong> {vm.licenceAlert.text}
                        </Alert>
                    )}
                    {vm.topError && (
                        <Alert type={"danger"} variant={"subtle"}>
                            {vm.topError}
                        </Alert>
                    )}
                    {vm.form && <FormView name={"Workflow step"} form={vm.form} />}
                </div>
                {vm.switchConfirmation && (
                    <SwitchAutomationDialog
                        confirmation={vm.switchConfirmation}
                        onConfirm={() => presenter.confirmSwitch()}
                        onCancel={() => presenter.cancelSwitch()}
                    />
                )}
            </Drawer>
        </StepFormOptionsContext.Provider>
    );
});
```

Modify `packages/app-workflows/src/app.tsx`. Add the import immediately above `export const WorkflowsAdminApp = () => {` (after the imports added by earlier tasks):

```tsx
import { StepDrawerPresenterFeature } from "~/editor/presentation/stepDrawer/feature.js";
```

and register the feature immediately above `<WorkflowEditorConfig />` (Task 11):

```tsx
            <RegisterFeature feature={StepDrawerPresenterFeature} />
            <WorkflowEditorConfig />
```

- [ ] **Step 4: Run the tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/stepDrawerPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawer.test.tsx 2>&1 | tail -40
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
```

Expected: all pass. Two spots depend on installed library behaviour and are fixed in the test, not the source: the Escape key reaching the Radix dialog (`fireEvent.keyDown` on the `dialog` role; if the drawer renders no `dialog` role, dispatch on `document.body`), and the stub `FormView` receiving `form.layout` (the real `FormView` takes the same `IFormVM`).

- [ ] **Step 5: Run the existing tests covering the changed code and type check**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm/buildCommonFields.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepForm/buildPeopleStepForm.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepForm/buildAutomationStepForm.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepForm/buildAiStepForm.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: Tasks 11-13 tests still pass; the build type-checks every new file, including that `WorkflowEditorPresenter.Interface` (Task 9) satisfies `StepDrawerSource` where the view passes it (Task 16) and that the editor's `updateStep` takes the same `EditorStepPatch`.

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
git commit -m "feat(app-workflows): add the workflow step drawer" -m "A presenter that opens one step of the draft through the editor presenter's accessors, builds the People, Automation or AI form on FormModel, shows the step's errors on their fields or at the top, confirms an automation switch, and applies the form to the draft on Done; the 560px drawer view over it, registered in WorkflowsAdminApp." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. In the commit command, replace the literal `<CURRENT_SESSION_URL>` with the `https://claude.ai/code/session_...` URL of the session that runs the commit. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **Wiring is R284.** `StepDrawerPresenter.open(source, stepId)` takes the editor presenter as `StepDrawerSource` (`getStep`, `updateStep`, `getStepFieldErrors`, `isStepReadOnly`, `getOptions`, `getTeamOptions`, `searchTeams`, `retryTeams`, `retryOptions`, `closeStep`, `getNamespace(): string | null`); `StepDrawer` (`presentation/stepDrawer/StepDrawer.tsx`) takes `{ source, stepId }` and the view renders `<StepDrawer source={presenter} stepId={vm.openStepId} />`. R284's accessor list names seven of these; `isStepReadOnly`, `retryTeams` and `retryOptions` exist on Task 9 and the drawer needs them (retry has no other source), so the contract text should list all eleven. Tasks 16 and 19 import `StepDrawer` from `~/editor/presentation/stepDrawer/StepDrawer.js` (not `components/`) and no longer call `drawerPresenter.open(...)` from the view.
- **Closing:** `done()` and `dismiss()` (the X, Escape, the scrim) apply the edits and call `source.closeStep()`, so `vm.openStepId` becomes null and the same step can be opened again; `close()` is the view's discard when `stepId` is null and does not call it. The drawer also closes itself and calls `closeStep()` when `getStep(stepId)` turns null. Only Done is blocked by an unfinished hex (R284); `dismiss()` keeps the old colour.
- **Options per list (R284):** each list reports its own `status`, so an empty `ready` list is never shown as a failure. The AI lists of a step that is read-only are `ready` with no items; the drawer then reports no retired warning and no empty-models message (`loaded` needs `ready` and a step that is not read-only).
- **Team settings:** a `ui: "team"` setting is fed like People teams: the drawer asks for the first team results for such an automation (`hasTeamSetting`) and `teams.selected` is every known team any team field holds. Task 9's `collectTeamIds(steps, automations)` also resolves the team ids held by `ui: "team"` settings of automation steps into `known`, so a stored setting team does not show as `Unknown item`.
- **Errors** come from the editor (`getStepFieldErrors`: the client validation of a failed Save and the mapped server error, R267 vocabulary, `""` for a message with no field, `config.teams.<i>` mapped to the teams field); Task 9's `updateStep` clears them on Done. The drawer applies them on open and again after a definitions rebuild.
- **Header:** a neutral tile, the sub line above the title (design README 4); the step colour is not shown in the drawer.
- **Read-only is the editor's decision** (`isStepReadOnly`, Task 8); the form is rebuilt when the flag changes after the step types arrive (an edit made before that is lost, accepted).
- **The switch confirmation is `vm.switchConfirmation` of the drawer**, not Task 18's `vm.dialog`; `StepDrawer` renders `SwitchAutomationDialog` itself.
- **No toasts from the drawer:** the contract lists Task 14 among the callers of `IWorkflowEditorToasts`, but nothing in the drawer toasts.
- **`app.test.tsx` `mount()`** gets a `FormModelFactory` stub because the drawer presenter depends on it; it needs no config use cases.
- **Icons:** `group.svg` is a material icon not yet imported in `app-workflows`; `bolt`, `auto_awesome` and `rate_review` are (`@webiny/icons/group.svg` exists in the icons package, `packages/icons/dist/group.svg`, checked by the consistency pass).
- Size: large (presenter, view, two pure helpers, four testing files, three test files, `app.tsx` and `app.test.tsx` hunks); one review gate, kept whole because the presenter and the view are proved together.
