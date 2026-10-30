### Task 2: `AutomationDefinition`, registry, scope, `automation` step type

Spec 7.2, 7.4; D14, D35, D37, D86 (without the "Send webhook" part, R155); R133, R134, R136, R137, R154, R155, R157 (`TestAutomationDefinition`). A developer writes an automation in code and registers it: a zod `settingsSchema` for what the workflow author fills in, an optional `maxIterations`, and `run`. This task adds the public `AutomationDefinition` abstraction, its registry service, the pure scope matching and settings parsing, and the `automation` step type with save-time validation. No automation ships (R155); tests use a test-only definition. `AutomationStepType.reach` is a placeholder until Task 10; nothing runs an automation in this sub-phase.

Until Task 10, an `automation` step can be saved but `ReviewStepReacher` does not dispatch by type yet, so such a step is reached like a review step (accepted interim, R160). That is expected inside 5.1; the sub-phase stops for the user before 5.2 and 5.3 completes the path.

**Files:**
- Create: `packages/api-workflows/src/features/automation/AutomationDefinition/abstractions.ts`
- Create: `packages/api-workflows/src/features/automation/AutomationDefinition/index.ts`
- Create: `packages/api-workflows/src/features/automation/AutomationDefinitionRegistryService/abstractions.ts`
- Create: `packages/api-workflows/src/features/automation/AutomationDefinitionRegistryService/AutomationDefinitionRegistryService.ts`
- Create: `packages/api-workflows/src/features/automation/AutomationDefinitionRegistryService/feature.ts`
- Create: `packages/api-workflows/src/features/automation/AutomationDefinitionRegistryService/index.ts`
- Create: `packages/api-workflows/src/domain/automation/matchesAutomationScope.ts`
- Create: `packages/api-workflows/src/domain/automation/automationStepConfigSchema.ts`
- Create: `packages/api-workflows/src/domain/automation/parseAutomationSettings.ts`
- Create: `packages/api-workflows/src/features/stepTypes/AutomationStepType/AutomationStepType.ts`
- Modify: `packages/api-workflows/src/features/stepTypes/feature.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/__helpers/TestAutomationDefinition.ts`
- Create: `packages/api-workflows/__tests__/automation/matchesAutomationScope.test.ts`
- Create: `packages/api-workflows/__tests__/automation/parseAutomationSettings.test.ts`
- Create: `packages/api-workflows/__tests__/automation/AutomationDefinitionRegistryService.test.ts`
- Create: `packages/api-workflows/__tests__/stepTypes/AutomationStepType.test.ts`
- Create: `packages/api-workflows/__tests__/workflow/StoreWorkflowAutomationSteps.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`

**Interfaces:**
- Consumes (Task 1): `StepType` (its `reach` returns `Result<void, ReviewInvalidStateError | ReviewStepNotCurrentError>`, R159) (`~/features/stepTypes/StepType/abstractions.js`: `Interface`, `Availability`, `ValidateParams`, `ReachParams`), `StepTypeRegistryService`, `AUTOMATION_STEP_TYPE` (`~/domain/workflow/stepTypes.js`), `StepTypesFeature`. Existing: `WorkflowValidationError`, `WorkflowStep`, `ReviewData`, `ReviewStep`, `createContextHandler`, `createWorkflowValues`, `createReviewStep`, `expectOk`, `editor` fixtures, `FakeListUsers`, multi-dependency syntax `[[Abstraction, { multiple: true }]]`.
- Produces:
  - `AutomationDefinition` (`features/automation/AutomationDefinition/`): `IAutomationDefinition<TSettings = unknown> { id; name; models: string[]; settingsSchema: ZodType<TSettings>; maxIterations?: number; run(params: AutomationRunParams<TSettings>): Promise<AutomationOutcome> }`, `AutomationOutcome` (R135), `AutomationRunParams<TSettings> { settings; review: ReviewData; step: ReviewStep; iteration: number; state: Record<string, unknown> | null }`; namespace types `AutomationDefinition.Interface`, `.Outcome`, `.RunParams`. Public (R134): `@webiny/api-workflows/features/automation/AutomationDefinition/index.js`.
  - `AutomationDefinitionRegistryService`: `get(id: string): AutomationDefinition.Interface | null`, `list(): AutomationDefinition.Interface[]` (registration order; the last registration per `id` wins). `AutomationDefinitionRegistryFeature` registers it.
  - `matchesAutomationScope(automationModels: string[], workflowModels: string[]): boolean` (R136).
  - `automationStepConfigSchema` and `interface AutomationStepConfig { automationId: string; settings: Record<string, unknown> }`.
  - `parseAutomationSettings(definition: AutomationDefinition.Interface, settings: unknown): Result<unknown, string>`: ok = the zod-parsed value (defaults applied); fail = `"<path>: <message>"` of the first issue (`<path>` dot-joined, `"<path>: "` omitted when empty). Reused by Tasks 10 and 15 for the reach-time reason.
  - `AutomationStepType` (`features/stepTypes/AutomationStepType/AutomationStepType.ts`, impl class `AutomationStepTypeImpl`, exported `AutomationStepType = StepType.createImplementation(...)`): `type: "automation"`, `title: "Automation"`, `configSchema: automationStepConfigSchema`; registered by `StepTypesFeature` (the engine now registers two step types).
  - Test helper `~tests/__helpers/TestAutomationDefinition.js` (R157): `TEST_AUTOMATION_ID = "test-automation"`, `testAutomationSettingsSchema`, `class TestAutomationDefinition` (id `test-automation`, name `Test automation`, models `["*"]`, settings `z.object({ mode: z.enum(["approve", "reject", "wait", "throw"]).default("approve"), comment: z.string().optional() })`; its `run` records the call in `runCalls` and answers by `mode`: `approve` / `reject` the outcome with the comment, `wait` a `continue` with `wait: 1` and `state: { iterations: iteration }`, `throw` throws `Error("The test automation threw.")`), `TestAutomationOverrides`, `registerTestAutomation(container: Container, overrides?: TestAutomationOverrides): TestAutomationDefinition` (R157, P1: the ONE signature every task uses; it registers one definition instance with `container.registerInstance(AutomationDefinition, definition)` and returns it so the test can read `runCalls`; use it inside a `setup: container => { registerTestAutomation(container, ...) }` callback), and `createAutomationStep(params: AutomationStepFixtureParams)` (a workflow `automation` step, a workflow fixture other tasks use).
- Messages (R136, R137, `WorkflowValidationError`): malformed shell `Step "<title>" needs an automation.`; unknown definition `Step "<title>" uses the automation "<automationId>", which is not defined.`; uncovered models `Automation "<automationId>" is not available for this workflow's models.`; settings `Step "<title>" settings are not valid: <first issue path>: <message>.` (path omitted when empty). Check order: shell, definition, models, settings. The stored `settings` are the original value the author submitted (not zod's parsed output; a transform schema must save and re-parse): the save check only validates, and every later use parses them again (R137).

- [ ] **Step 1: Write the test helper and the failing tests**

Create `packages/api-workflows/__tests__/__helpers/TestAutomationDefinition.ts`:

```ts
import zod from "zod";
import type { Container } from "@webiny/feature/api";
import { AutomationDefinition } from "~/features/automation/AutomationDefinition/index.js";
import type { WorkflowStep } from "~/domain/workflow/types.js";

export const TEST_AUTOMATION_ID = "test-automation";

export const testAutomationSettingsSchema = zod.object({
    mode: zod.enum(["approve", "reject", "wait", "throw"]).default("approve"),
    comment: zod.string().optional()
});

export type TestAutomationSettings = zod.infer<typeof testAutomationSettingsSchema>;

export interface TestAutomationOverrides {
    id?: string;
    name?: string;
    models?: string[];
    maxIterations?: number;
}

/**
 * The only automation tests use (R157): no definition ships in a source package. `mode` in the
 * step settings picks the outcome; every `run` call is recorded in `runCalls`.
 */
export class TestAutomationDefinition implements AutomationDefinition.Interface<TestAutomationSettings> {
    public readonly id: string;
    public readonly name: string;
    public readonly models: string[];
    public readonly maxIterations?: number;
    public readonly settingsSchema = testAutomationSettingsSchema;
    public readonly runCalls: AutomationDefinition.RunParams<TestAutomationSettings>[] = [];

    public constructor(overrides: TestAutomationOverrides = {}) {
        this.id = overrides.id ?? TEST_AUTOMATION_ID;
        this.name = overrides.name ?? "Test automation";
        this.models = overrides.models ?? ["*"];
        this.maxIterations = overrides.maxIterations;
    }

    public async run(
        params: AutomationDefinition.RunParams<TestAutomationSettings>
    ): Promise<AutomationDefinition.Outcome> {
        this.runCalls.push(params);
        const { mode, comment } = params.settings;
        if (mode === "throw") {
            throw new Error("The test automation threw.");
        }
        if (mode === "wait") {
            return { type: "continue", wait: 1, state: { iterations: params.iteration } };
        }
        return { type: mode === "reject" ? "rejected" : "approved", comment };
    }
}

/**
 * Registers one test definition on `container` (call it from a `setup` callback of
 * `createContextHandler`) and returns the instance, so the test can read `runCalls` (P1: the one
 * signature, `registerTestAutomation(container, overrides?)`, in every task and package).
 */
export const registerTestAutomation = (
    container: Container,
    overrides: TestAutomationOverrides = {}
): TestAutomationDefinition => {
    const definition = new TestAutomationDefinition(overrides);
    container.registerInstance(AutomationDefinition, definition as AutomationDefinition.Interface);
    return definition;
};

export interface AutomationStepFixtureParams {
    id: string;
    title: string;
    automationId?: string;
    settings?: Record<string, unknown>;
}

/** A workflow step of type "automation" whose config selects a definition and its settings. */
export const createAutomationStep = (params: AutomationStepFixtureParams): WorkflowStep => {
    return {
        id: params.id,
        title: params.title,
        color: "#3b82f6",
        type: "automation",
        notifications: [],
        config: {
            automationId: params.automationId ?? TEST_AUTOMATION_ID,
            settings: params.settings ?? {}
        }
    };
};
```

Create `packages/api-workflows/__tests__/automation/matchesAutomationScope.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { matchesAutomationScope } from "~/domain/automation/matchesAutomationScope.js";

describe("matchesAutomationScope (R136)", () => {
    it.each([
        { automation: ["*"], workflow: ["cms.article"], covered: true },
        { automation: ["*"], workflow: ["wb.page"], covered: true },
        { automation: ["cms.*"], workflow: ["cms.article"], covered: true },
        { automation: ["cms.*"], workflow: ["wb.page"], covered: false },
        { automation: ["wb.*"], workflow: ["wb.page"], covered: true },
        { automation: ["cms.article"], workflow: ["cms.article"], covered: true },
        { automation: ["cms.article"], workflow: ["cms.page"], covered: false },
        { automation: ["cms.article", "wb.page"], workflow: ["wb.page"], covered: true },
        { automation: ["cms.*", "wb.page"], workflow: ["wb.page"], covered: true },
        // A prefix is not a namespace: "cms.*" does not cover "cmsx.article".
        { automation: ["cms.*"], workflow: ["cmsx.article"], covered: false },
        // The wildcard needs something after the dot.
        { automation: ["cms.*"], workflow: ["cms."], covered: false }
    ])("automation $automation, workflow $workflow: $covered", ({ automation, workflow, covered }) => {
        expect(matchesAutomationScope(automation, workflow)).toBe(covered);
    });

    it("requires every workflow model to be covered", () => {
        expect(matchesAutomationScope(["cms.article"], ["cms.article", "cms.page"])).toBe(false);
        expect(matchesAutomationScope(["cms.*"], ["cms.article", "cms.page"])).toBe(true);
    });

    it("never covers a workflow without models", () => {
        expect(matchesAutomationScope(["*"], [])).toBe(false);
    });

    it("never covers anything when the automation lists no models", () => {
        expect(matchesAutomationScope([], ["cms.article"])).toBe(false);
    });
});
```

Create `packages/api-workflows/__tests__/automation/parseAutomationSettings.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import zod from "zod";
import { parseAutomationSettings } from "~/domain/automation/parseAutomationSettings.js";
import { TestAutomationDefinition } from "~tests/__helpers/TestAutomationDefinition.js";

describe("parseAutomationSettings (R133, R137)", () => {
    it("returns the parsed settings with defaults applied", () => {
        const result = parseAutomationSettings(new TestAutomationDefinition(), {});

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({ mode: "approve" });
    });

    it("keeps valid values", () => {
        const result = parseAutomationSettings(new TestAutomationDefinition(), {
            mode: "reject",
            comment: "Needs a second look."
        });

        expect(result.value).toEqual({ mode: "reject", comment: "Needs a second look." });
    });

    it("fails with the first issue as '<path>: <message>'", () => {
        const result = parseAutomationSettings(new TestAutomationDefinition(), {
            mode: "explode"
        });

        expect(result.isFail()).toBe(true);
        expect(result.error).toMatch(/^mode: .+/);
    });

    it("dot-joins a nested path", () => {
        const definition = new TestAutomationDefinition();
        const nested = {
            ...definition,
            settingsSchema: zod.object({ target: zod.object({ url: zod.url() }) })
        };

        const result = parseAutomationSettings(nested as never, { target: { url: "nope" } });

        expect(result.error).toMatch(/^target\.url: .+/);
    });

    it("omits the path when the issue has none", () => {
        const definition = new TestAutomationDefinition();
        const text = { ...definition, settingsSchema: zod.string() };

        const result = parseAutomationSettings(text as never, 42);

        expect(result.isFail()).toBe(true);
        expect(result.error).toMatch(/expected string/);
        expect(result.error).not.toMatch(/^: /);
    });
});
```

Create `packages/api-workflows/__tests__/automation/AutomationDefinitionRegistryService.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    registerTestAutomation,
    TEST_AUTOMATION_ID
} from "~tests/__helpers/TestAutomationDefinition.js";
import { AutomationDefinitionRegistryService } from "~/features/automation/AutomationDefinitionRegistryService/index.js";

describe("AutomationDefinitionRegistryService (R133)", () => {
    it("is empty when no automation is registered (R155: none ships)", async () => {
        const { context } = await createContextHandler();
        const registry = context.container.resolve(AutomationDefinitionRegistryService);

        expect(registry.list()).toEqual([]);
        expect(registry.get(TEST_AUTOMATION_ID)).toBeNull();
    });

    it("returns registered definitions by id, in registration order", async () => {
        const { context } = await createContextHandler({
            setup: container => {
                registerTestAutomation(container);
                registerTestAutomation(container, { id: "other-automation", name: "Other" });
            }
        });
        const registry = context.container.resolve(AutomationDefinitionRegistryService);

        expect(registry.list().map(definition => definition.id)).toEqual([
            TEST_AUTOMATION_ID,
            "other-automation"
        ]);
        expect(registry.get("other-automation")?.name).toBe("Other");
        expect(registry.get("unknown")).toBeNull();
    });

    it("returns the last registration per id and keeps its place in the list", async () => {
        const { context } = await createContextHandler({
            setup: container => {
                registerTestAutomation(container, { name: "Original" });
                registerTestAutomation(container, { id: "other-automation" });
                registerTestAutomation(container, { name: "Replacement" });
            }
        });
        const registry = context.container.resolve(AutomationDefinitionRegistryService);

        expect(registry.get(TEST_AUTOMATION_ID)?.name).toBe("Replacement");
        expect(registry.list().map(definition => definition.id)).toEqual([
            TEST_AUTOMATION_ID,
            "other-automation"
        ]);
    });
});
```

Create `packages/api-workflows/__tests__/stepTypes/AutomationStepType.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Container } from "@webiny/feature/api";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    createAutomationStep,
    registerTestAutomation,
    TEST_AUTOMATION_ID
} from "~tests/__helpers/TestAutomationDefinition.js";
import { createWorkflowValues } from "~tests/__helpers/fixtures.js";
import { automationStepConfigSchema } from "~/domain/automation/automationStepConfigSchema.js";
import type { WorkflowStep, WorkflowValues } from "~/domain/workflow/types.js";
import { StepTypeRegistryService } from "~/features/stepTypes/StepTypeRegistryService/index.js";

const setup = async (register: (container: Container) => void = () => {}) => {
    const { context } = await createContextHandler({ setup: register });
    const stepType = context.container.resolve(StepTypeRegistryService).get("automation");
    if (!stepType) {
        throw new Error("The automation step type is not registered.");
    }
    return stepType;
};

const workflowWith = (step: WorkflowStep, models = ["cms.article"]): WorkflowValues => {
    return createWorkflowValues({ models, steps: [step] });
};

describe("AutomationStepType (R133, R137, R138)", () => {
    it("is registered next to review and describes itself", async () => {
        const stepType = await setup();

        expect(stepType.type).toBe("automation");
        expect(stepType.title).toBe("Automation");
        expect(stepType.configSchema).toBe(automationStepConfigSchema);
    });

    describe("describeAvailability", () => {
        it("is unavailable while no automation is defined", async () => {
            const stepType = await setup();

            expect(await stepType.describeAvailability()).toEqual({
                available: false,
                unavailableReason: "No automation is defined."
            });
        });

        it("is available once an automation is defined", async () => {
            const stepType = await setup(container => registerTestAutomation(container));

            expect(await stepType.describeAvailability()).toEqual({
                available: true,
                unavailableReason: null
            });
        });
    });

    describe("validate", () => {
        it("returns the step with the settings as the author entered them, after checking they parse", async () => {
            const stepType = await setup(container => registerTestAutomation(container));
            const step = createAutomationStep({ id: "notify", title: "Notify", settings: {} });

            const result = stepType.validate({ step, workflow: workflowWith(step) });

            expect(result.isOk()).toBe(true);
            // Stored as entered (R137): the defaults are applied again on every use.
            expect(result.value?.config).toEqual({
                automationId: TEST_AUTOMATION_ID,
                settings: {}
            });
            expect(result.value?.id).toBe("notify");
        });

        it.each([
            { name: "no config", config: undefined },
            { name: "no automation id", config: { settings: {} } },
            { name: "an empty automation id", config: { automationId: "", settings: {} } },
            { name: "settings that are not an object", config: { automationId: "a", settings: 1 } },
            { name: "no settings", config: { automationId: TEST_AUTOMATION_ID } }
        ])("refuses a malformed config: $name", async ({ config }) => {
            const stepType = await setup(container => registerTestAutomation(container));
            const step = { ...createAutomationStep({ id: "notify", title: "Notify" }), config };

            const result = stepType.validate({ step, workflow: workflowWith(step) });

            expect(result.error?.code).toBe("Workflows/Workflow/Validation");
            expect(result.error?.message).toBe('Step "Notify" needs an automation.');
        });

        it("refuses an automation that is not defined", async () => {
            const stepType = await setup(container => registerTestAutomation(container));
            const step = createAutomationStep({
                id: "notify",
                title: "Notify",
                automationId: "gone-automation"
            });

            const result = stepType.validate({ step, workflow: workflowWith(step) });

            expect(result.error?.message).toBe(
                'Step "Notify" uses the automation "gone-automation", which is not defined.'
            );
        });

        it("refuses an automation that does not cover the workflow's models", async () => {
            const stepType = await setup(container => registerTestAutomation(container, { models: ["cms.page"] }));
            const step = createAutomationStep({ id: "notify", title: "Notify" });

            const result = stepType.validate({
                step,
                workflow: workflowWith(step, ["cms.article"])
            });

            expect(result.error?.message).toBe(
                `Automation "${TEST_AUTOMATION_ID}" is not available for this workflow's models.`
            );
        });

        it("accepts an automation scoped with a namespace wildcard", async () => {
            const stepType = await setup(container => registerTestAutomation(container, { models: ["cms.*"] }));
            const step = createAutomationStep({ id: "notify", title: "Notify" });

            const result = stepType.validate({ step, workflow: workflowWith(step) });

            expect(result.isOk()).toBe(true);
        });

        it("refuses settings that fail the definition's schema, naming the first issue", async () => {
            const stepType = await setup(container => registerTestAutomation(container));
            const step = createAutomationStep({
                id: "notify",
                title: "Notify",
                settings: { mode: "explode" }
            });

            const result = stepType.validate({ step, workflow: workflowWith(step) });

            expect(result.error?.code).toBe("Workflows/Workflow/Validation");
            expect(result.error?.message).toMatch(/^Step "Notify" settings are not valid: mode: .+\.$/);
        });
    });

    it("reach is a placeholder that succeeds without changing the review (Task 10 fills it)", async () => {
        const stepType = await setup(container => registerTestAutomation(container));

        const result = await stepType.reach({} as never);

        expect(result.isOk()).toBe(true);
    });
});
```

Create `packages/api-workflows/__tests__/workflow/StoreWorkflowAutomationSteps.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import zod from "zod";
import type { Container } from "@webiny/feature/api";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { GetWorkflowUseCase } from "~/features/workflow/GetWorkflow/index.js";
import type { WorkflowStep } from "~/domain/workflow/types.js";
import { AutomationDefinition } from "~/features/automation/AutomationDefinition/index.js";
import { parseAutomationSettings } from "~/domain/automation/parseAutomationSettings.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { FakeListUsers } from "~tests/__helpers/FakeListUsers.js";
import {
    createAutomationStep,
    registerTestAutomation,
    TEST_AUTOMATION_ID
} from "~tests/__helpers/TestAutomationDefinition.js";
import { createReviewStep, createWorkflowValues, editor } from "~tests/__helpers/fixtures.js";

/** Settings are `{ count: "5" }` as entered; the schema turns the string into a number. */
class TransformAutomation implements AutomationDefinition.Interface {
    public readonly id = "transform-automation";
    public readonly name = "Transform automation";
    public readonly models = ["*"];
    public readonly settingsSchema = zod.object({ count: zod.string().transform(Number) });

    public async run(): Promise<AutomationDefinition.Outcome> {
        return { type: "approved" };
    }
}

const setup = async (register: (container: Container) => void = () => {}) => {
    const { context } = await createContextHandler({
        setup: container => {
            container.registerInstance(ListUsersUseCase, new FakeListUsers([]));
            register(container);
        }
    });
    return {
        store: (steps: WorkflowStep[]) => {
            return context.container
                .resolve(StoreWorkflowUseCase)
                .execute({ workflow: createWorkflowValues({ steps }), actor: editor });
        },
        getWorkflow: context.container.resolve(GetWorkflowUseCase)
    };
};

describe("StoreWorkflowUseCase: automation steps (D35, D37, R137)", () => {
    it("stores a workflow with an automation step and keeps the settings as entered", async () => {
        const { store, getWorkflow } = await setup(container => registerTestAutomation(container));

        const stored = await store([
            createReviewStep({ id: "legal", title: "Legal review" }),
            createAutomationStep({ id: "notify", title: "Notify", settings: {} })
        ]);

        expect(stored.isOk()).toBe(true);
        const read = await getWorkflow.execute({ id: "workflow-1" });
        expect(read.value?.steps[1].type).toBe("automation");
        expect(read.value?.steps[1].config).toEqual({
            automationId: TEST_AUTOMATION_ID,
            settings: {}
        });
    });

    it("stores the submitted settings, not the parsed output, so a transform schema saves and re-parses", async () => {
        const { store, getWorkflow } = await setup(container => {
            container.registerInstance(
                AutomationDefinition,
                new TransformAutomation() as AutomationDefinition.Interface
            );
        });

        const stored = await store([
            createAutomationStep({
                id: "notify",
                title: "Notify",
                automationId: "transform-automation",
                settings: { count: "5" }
            })
        ]);

        expect(stored.isOk()).toBe(true);
        const read = await getWorkflow.execute({ id: "workflow-1" });
        const config = read.value?.steps[0].config as { settings: Record<string, unknown> };
        // The string the author submitted, not the number the transform produces (R137).
        expect(config.settings).toEqual({ count: "5" });
        // A second save of the stored workflow validates the same value again, and every use
        // (reach, run) parses it again.
        const definition = new TransformAutomation();
        const parsed = parseAutomationSettings(definition, config.settings);
        expect(parsed.value).toEqual({ count: 5 });
        const again = await store([
            createAutomationStep({
                id: "notify",
                title: "Notify",
                automationId: "transform-automation",
                settings: config.settings
            })
        ]);
        expect(again.isOk()).toBe(true);
    });

    it("refuses an automation step when no automation is defined and stores nothing", async () => {
        const { store, getWorkflow } = await setup();

        const result = await store([createAutomationStep({ id: "notify", title: "Notify" })]);

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            `Step "Notify" uses the automation "${TEST_AUTOMATION_ID}", which is not defined.`
        );
        const read = await getWorkflow.execute({ id: "workflow-1" });
        expect(read.error.code).toBe("Workflows/Workflow/NotFound");
    });

    it("refuses an automation that does not cover the workflow's model", async () => {
        const { store } = await setup(container => registerTestAutomation(container, { models: ["wb.page"] }));

        const result = await store([createAutomationStep({ id: "notify", title: "Notify" })]);

        expect(result.error.message).toBe(
            `Automation "${TEST_AUTOMATION_ID}" is not available for this workflow's models.`
        );
    });

    it("refuses invalid settings", async () => {
        const { store } = await setup(container => registerTestAutomation(container));

        const result = await store([
            createAutomationStep({ id: "notify", title: "Notify", settings: { mode: "explode" } })
        ]);

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toMatch(/^Step "Notify" settings are not valid: mode: /);
    });

    it("checks the automation again on update", async () => {
        const { store } = await setup(container => registerTestAutomation(container));
        const created = await store([createAutomationStep({ id: "notify", title: "Notify" })]);

        const updated = await store([
            createAutomationStep({ id: "notify", title: "Notify", automationId: "gone" })
        ]);

        expect(created.isOk()).toBe(true);
        expect(updated.error.message).toBe(
            'Step "Notify" uses the automation "gone", which is not defined.'
        );
    });
});
```

Update `packages/api-workflows/__tests__/registration.test.ts`: add the imports

```ts
import { AutomationDefinition } from "~/features/automation/AutomationDefinition/index.js";
import { AutomationDefinitionRegistryService } from "~/features/automation/AutomationDefinitionRegistryService/index.js";
```

and replace the lines Task 1 added with:

```ts
        expect(container.resolveAll(StepTypeRegistryService)).toHaveLength(1);
        // `review` and `automation` (the `ai` type is registered by phase 6).
        expect(container.resolveAll(StepType)).toHaveLength(2);
        expect(container.resolveAll(AutomationDefinitionRegistryService)).toHaveLength(1);
        // No built-in automation (R155): developers register definitions.
        expect(container.resolveAll(AutomationDefinition)).toHaveLength(0);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/automation packages/api-workflows/__tests__/stepTypes/AutomationStepType.test.ts packages/api-workflows/__tests__/workflow/StoreWorkflowAutomationSteps.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL. Every new file fails to import (`AutomationDefinition`, the `domain/automation` files do not exist); `registration.test.ts` fails on the missing imports. Record the RED output.

- [ ] **Step 3: The `AutomationDefinition` abstraction**

Create `packages/api-workflows/src/features/automation/AutomationDefinition/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { ZodType } from "zod";
import type { ReviewData, ReviewStep } from "~/domain/review/types.js";

/**
 * What an automation answers (R135). `approved` and `rejected` end the step; a `rejected` outcome
 * needs a comment of 10 or more characters (D100). `continue` runs the automation again: `wait`
 * seconds later (the task's continue delay), with `state` handed back on the next call.
 */
export type AutomationOutcome =
    | { type: "approved" | "rejected"; comment?: string }
    | { type: "continue"; wait?: number; state?: Record<string, unknown> };

export interface AutomationRunParams<TSettings = unknown> {
    /** The step's stored settings, parsed with `settingsSchema` on this run (defaults applied). */
    settings: TSettings;
    /** The review as stored; read-only for the automation. */
    review: ReviewData;
    /** The step being run. */
    step: ReviewStep;
    /** The automation's own run count: 1 on the first call, +1 for every `continue`; waits for the task id are not counted (R163). */
    iteration: number;
    /** The `state` of the previous `continue` outcome; `null` on the first call. */
    state: Record<string, unknown> | null;
}

export interface IAutomationDefinition<TSettings = unknown> {
    /** Stored on the step as `config.automationId`; stable, a rename breaks stored workflows. */
    readonly id: string;
    /** Shown to workflow authors. */
    readonly name: string;
    /**
     * Where the automation may be used (D35): `["*"]` for every model, `["cms.*"]` for every
     * Headless CMS model, or exact namespace ids such as `["cms.article", "wb.page"]`.
     */
    readonly models: string[];
    /**
     * What the workflow author fills in when adding the automation as a step. Use an object schema:
     * the editor renders its JSON schema as a form, and the stored settings are what the author entered, parsed again on every use.
     * Credentials do not belong here: keep them in the definition's own code or configuration, so
     * workflow authors never set or see them (R154).
     */
    readonly settingsSchema: ZodType<TSettings>;
    /** How many times `run` may be called for one step (default 50); past it the step fails. */
    readonly maxIterations?: number;
    run(params: AutomationRunParams<TSettings>): Promise<AutomationOutcome>;
}

/**
 * An automation written in code (spec 7.2, R133, R134): register an implementation and it can be
 * added as a workflow step of type "automation". Multi-registered; the registry returns the last
 * registration per `id`. The engine runs it in a background task as the requester and applies
 * its outcome with the `automation` actor.
 */
export const AutomationDefinition =
    createAbstraction<IAutomationDefinition>("AutomationDefinition");

export namespace AutomationDefinition {
    export type Interface<TSettings = unknown> = IAutomationDefinition<TSettings>;
    export type Outcome = AutomationOutcome;
    export type RunParams<TSettings = unknown> = AutomationRunParams<TSettings>;
}
```

Create `packages/api-workflows/src/features/automation/AutomationDefinition/index.ts`:

```ts
export { AutomationDefinition } from "./abstractions.js";
```

- [ ] **Step 4: The registry service and its feature**

Create `packages/api-workflows/src/features/automation/AutomationDefinitionRegistryService/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { AutomationDefinition } from "~/features/automation/AutomationDefinition/abstractions.js";

export interface IAutomationDefinitionRegistryService {
    /** The definition with this id; `null` when none is registered. */
    get(id: string): AutomationDefinition.Interface | null;
    /** Registration order; the last registration per `id` wins and keeps the first one's place. */
    list(): AutomationDefinition.Interface[];
}

/** The registered automation definitions (R133). */
export const AutomationDefinitionRegistryService =
    createAbstraction<IAutomationDefinitionRegistryService>("AutomationDefinitionRegistryService");

export namespace AutomationDefinitionRegistryService {
    export type Interface = IAutomationDefinitionRegistryService;
}
```

Create `packages/api-workflows/src/features/automation/AutomationDefinitionRegistryService/AutomationDefinitionRegistryService.ts`:

```ts
import { AutomationDefinition } from "~/features/automation/AutomationDefinition/abstractions.js";
import { AutomationDefinitionRegistryService as Abstraction } from "./abstractions.js";

class AutomationDefinitionRegistryServiceImpl implements Abstraction.Interface {
    private readonly definitions = new Map<string, AutomationDefinition.Interface>();

    public constructor(definitions: AutomationDefinition.Interface[]) {
        for (const definition of definitions) {
            this.definitions.set(definition.id, definition);
        }
    }

    public get(id: string): AutomationDefinition.Interface | null {
        return this.definitions.get(id) ?? null;
    }

    public list(): AutomationDefinition.Interface[] {
        return [...this.definitions.values()];
    }
}

export const AutomationDefinitionRegistryService = Abstraction.createImplementation({
    implementation: AutomationDefinitionRegistryServiceImpl,
    dependencies: [[AutomationDefinition, { multiple: true }]]
});
```

Create `packages/api-workflows/src/features/automation/AutomationDefinitionRegistryService/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { AutomationDefinitionRegistryService } from "./AutomationDefinitionRegistryService.js";

export const AutomationDefinitionRegistryFeature = createFeature({
    name: "Workflows/AutomationDefinitionRegistry",
    register(container) {
        container.register(AutomationDefinitionRegistryService);
    }
});
```

Create `packages/api-workflows/src/features/automation/AutomationDefinitionRegistryService/index.ts`:

```ts
export { AutomationDefinitionRegistryService } from "./abstractions.js";
```

- [ ] **Step 5: Pure domain functions**

Create `packages/api-workflows/src/domain/automation/matchesAutomationScope.ts`:

```ts
const WILDCARD_SUFFIX = ".*";

const coversModel = (automationModel: string, workflowModel: string): boolean => {
    if (automationModel === "*") {
        return true;
    }
    if (automationModel.endsWith(WILDCARD_SUFFIX) && automationModel.length > WILDCARD_SUFFIX.length) {
        // "cms.*" covers "cms.article": the namespace prefix up to and including the dot.
        const prefix = automationModel.slice(0, -1);
        return workflowModel.startsWith(prefix) && workflowModel.length > prefix.length;
    }
    return automationModel === workflowModel;
};

/**
 * Whether an automation's `models` cover every model of a workflow (D35, R136): `"*"` covers all,
 * `"<app>.*"` covers the namespace ids starting with `"<app>."`, anything else is an exact
 * namespace id. A workflow without models is never covered.
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

Create `packages/api-workflows/src/domain/automation/automationStepConfigSchema.ts`:

```ts
import zod from "zod";

/** The stored config of an "automation" step (R133). */
export interface AutomationStepConfig {
    automationId: string;
    /** Validated against the definition's `settingsSchema`; stored as the author entered them and parsed again on every use. */
    settings: Record<string, unknown>;
}

/**
 * The shell of an automation step's config: which automation, and its settings. The settings
 * themselves are validated against the chosen definition's `settingsSchema`, not here. This is
 * the step type's `configSchema` (what `listStepTypes` returns); the editor gets the settings
 * schema per automation from `listAutomationDefinitions`.
 */
export const automationStepConfigSchema = zod.object({
    automationId: zod.string().min(1),
    settings: zod.record(zod.string(), zod.unknown())
});
```

Create `packages/api-workflows/src/domain/automation/parseAutomationSettings.ts`:

```ts
import { Result } from "@webiny/feature/api";
import type { AutomationDefinition } from "~/features/automation/AutomationDefinition/abstractions.js";

/**
 * Parses a step's settings with the definition's `settingsSchema` (R133, R137, R148). Ok is the
 * parsed value (defaults applied); fail is the first issue as `"<path>: <message>"`, the path
 * dot-joined and omitted when empty. Save, reach and restart word their own reasons around it.
 */
export const parseAutomationSettings = (
    definition: AutomationDefinition.Interface,
    settings: unknown
): Result<unknown, string> => {
    const parsed = definition.settingsSchema.safeParse(settings);
    if (parsed.success) {
        return Result.ok(parsed.data);
    }
    const [issue] = parsed.error.issues;
    const path = issue?.path.map(String).join(".") ?? "";
    const message = issue?.message ?? "unknown error";
    return Result.fail(path ? `${path}: ${message}` : message);
};
```

- [ ] **Step 6: The `automation` step type**

Create `packages/api-workflows/src/features/stepTypes/AutomationStepType/AutomationStepType.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { WorkflowValidationError } from "~/domain/workflow/errors.js";
import { AUTOMATION_STEP_TYPE } from "~/domain/workflow/stepTypes.js";
import { automationStepConfigSchema } from "~/domain/automation/automationStepConfigSchema.js";
import { matchesAutomationScope } from "~/domain/automation/matchesAutomationScope.js";
import { parseAutomationSettings } from "~/domain/automation/parseAutomationSettings.js";
import { AutomationDefinitionRegistryService } from "~/features/automation/AutomationDefinitionRegistryService/abstractions.js";
import { StepType } from "~/features/stepTypes/StepType/abstractions.js";

const fail = (message: string) => {
    return Result.fail(new WorkflowValidationError(message));
};

/**
 * The built-in automation step (spec 7.2, R133): runs a developer-written `AutomationDefinition`
 * chosen by `config.automationId`. Save-time validation checks the definition exists, covers the
 * workflow's models and accepts the settings (D35, D37, R137). `reach` is filled in Task 10.
 */
class AutomationStepTypeImpl implements StepType.Interface {
    public readonly type = AUTOMATION_STEP_TYPE;
    public readonly title = "Automation";
    public readonly configSchema = automationStepConfigSchema;

    public constructor(private definitions: AutomationDefinitionRegistryService.Interface) {}

    public async describeAvailability(): Promise<StepType.Availability> {
        if (this.definitions.list().length === 0) {
            return { available: false, unavailableReason: "No automation is defined." };
        }
        return { available: true, unavailableReason: null };
    }

    public validate({ step, workflow }: StepType.ValidateParams) {
        const shell = automationStepConfigSchema.safeParse(step.config);
        if (!shell.success) {
            return fail(`Step "${step.title}" needs an automation.`);
        }
        const { automationId, settings } = shell.data;

        const definition = this.definitions.get(automationId);
        if (!definition) {
            return fail(
                `Step "${step.title}" uses the automation "${automationId}", which is not defined.`
            );
        }
        if (!matchesAutomationScope(definition.models, workflow.models)) {
            return fail(
                `Automation "${automationId}" is not available for this workflow's models.`
            );
        }

        const parsed = parseAutomationSettings(definition, settings);
        if (parsed.isFail()) {
            return fail(`Step "${step.title}" settings are not valid: ${parsed.error}.`);
        }

        // Stored as the author entered them (R137): the parse above only validates. Every use
        // (reach, run) parses the stored settings again, so a transform schema keeps working.
        return Result.ok({ ...step, config: { automationId, settings } });
    }

    public async reach() {
        // Task 10: look the definition up, trigger the run task as the requester, `reachRun`.
        return Result.ok();
    }
}

export const AutomationStepType = StepType.createImplementation({
    implementation: AutomationStepTypeImpl,
    dependencies: [AutomationDefinitionRegistryService]
});
```

In `packages/api-workflows/src/features/stepTypes/feature.ts` import `AutomationStepType` and register it:

```ts
import { AutomationStepType } from "./AutomationStepType/AutomationStepType.js";
```

```ts
        container.register(ReviewStepType);
        container.register(AutomationStepType);
```

In `packages/api-workflows/src/WorkflowsFeature.ts` add

```ts
import { AutomationDefinitionRegistryFeature } from "~/features/automation/AutomationDefinitionRegistryService/feature.js";
```

and register it next to the step types:

```ts
        // Step types (R131): the registry and the built-in review and automation types
        StepTypesFeature.register(container);
        // Automation definitions written by developers (R133); none ships (R155)
        AutomationDefinitionRegistryFeature.register(container);
```

(replacing the Task 1 comment and line).

- [ ] **Step 7: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/automation packages/api-workflows/__tests__/stepTypes packages/api-workflows/__tests__/workflow/StoreWorkflowAutomationSteps.test.ts packages/api-workflows/__tests__/workflow/StoreWorkflowStepTypes.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same files with `yarn test:os` (one run at a time).
Expected: PASS.

Also re-run the Task 1 neighbour list (workflow use cases, `ListWorkflowStepTypes.test.ts`, `ListStepCandidates.test.ts`, `RequestReview.test.ts`, the CMS and WB `workflowWrappers.test.ts`) with `yarn test` by path.
Expected: PASS. `ListWorkflowStepTypes.test.ts` still passes unchanged: `listStepTypes` stays the static list until Task 3.

The helper registers the instance with one cast (`as AutomationDefinition.Interface`), because `TestAutomationDefinition` is typed with its own settings while the abstraction is `unknown`-settings; do not loosen the abstraction.

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|headless-cms-workflows|website-builder-workflows|background-tasks" | head`
Expected: no output.

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
feat(api-workflows): add the AutomationDefinition abstraction, scope matching and the automation step type

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
