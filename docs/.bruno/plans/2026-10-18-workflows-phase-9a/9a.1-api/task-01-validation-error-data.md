### Task 1: Validation errors carry `{ stepId, field, workflowId }`

R267, R87, R237; D165 (recorded by Task 23); Q41; Review Focus 2 (`00-shared.md`). The phase 8a and 8b Global Constraints and Rulings apply unchanged (read: never throw out of a resolver, storage keys frozen, no helper wrappers around dependency calls, one class or one public function per file, one named import per line, namespace types `Foo.Interface`, comments end with a period, targeted tests, the pre-commit chain, the commit trailers). Site map: `.superpowers/sdd/p9a-plan/research2-api.md` A.

The editor of 9a has to put a server validation error on the step card and on the field. Today `WorkflowValidationError` is a message only. This task gives it `data: { stepId, field, workflowId }` and sets it at every site of the editor's save path. Codes and messages do not change (every existing test keeps passing). GraphQL needs no change: `WorkflowsError.data` is `JSON` and `ErrorResponse` passes `data` through.

- **`WorkflowValidationError`** (`[AWF]/domain/workflow/errors.ts`): `extends BaseError<WorkflowValidationErrorData>`. The constructor takes `(message: string, where: Partial<WorkflowValidationErrorData> = {})` and always stores all three keys, each `null` when not given. The other sites outside the editor's save path (list cursors, `Too many user ids.`, the routing inspector) keep calling `new WorkflowValidationError(message)` and get `{ stepId: null, field: null, workflowId: null }`. `isWorkflowValidationError` stays as it is.
- **Field names (R267).** Workflow level (`stepId` null): `name`, `models`, `steps` (also `Every step needs an ID.`). Step level (`stepId` is the step's id): `id` (duplicate step id), `title`, `type`, `notifications` and `color` (reserved, no server check today), `config.teams`, `config.assignment.rules`, `config.automationId`, `config.settings`, `config.settings.<path>`, `config.instructions`, `config.model`, `config.tools`, and `config.<zod issue path>` for a review or AI config issue. The duplicate-model error (same code, same message) sets `field: "models"` and `workflowId` (the id of the other workflow). The CMS and WB before-create and before-update handlers and the two app-mismatch guards set `field: "models"`.
- **`getConfigIssueField(path)`** (`[AWF]/domain/workflow/getConfigIssueField.ts`, pure): `config.<path joined with dots>`, or `config` for an empty path. The review step type and the AI step type both build their zod-issue field with it, so the rule lives once (ai-powerups imports it by deep path).
- **`parseAutomationSettingsIssue(schema, settings)`** (`[AWF]/domain/automation/parseAutomationSettingsIssue.ts`): a sibling of `parseAutomationSettings` that returns `Result<unknown, AutomationSettingsIssue>` with `AutomationSettingsIssue { path: string; message: string }` (the first zod issue, path dot-joined, `""` when empty). `parseAutomationSettings` now delegates to it, so the zod issue handling lives once: its signature, its string result (`path ? "path: message" : message`), its callers (`AutomationStepType.reach`, `AutomationStepRunner.ts`) and its test stay unchanged. `AutomationStepType.validate` is the one that `AutomationStepType.validate` switches to the new function, so it can set `field` to `config.settings.<path>` (or `config.settings` when the path is empty); its message text stays `Step "{title}" settings are not valid: {path}: {message}.`
- **No other behaviour changes**: the fail-fast order of the validators, the messages and the codes stay.

**Files:**
- Create: `packages/api-workflows/src/domain/workflow/getConfigIssueField.ts`
- Create: `packages/api-workflows/src/domain/automation/parseAutomationSettingsIssue.ts`
- Modify: `packages/api-workflows/src/domain/automation/parseAutomationSettings.ts`
- Modify: `packages/api-workflows/src/domain/workflow/errors.ts`
- Modify: `packages/api-workflows/src/domain/workflow/WorkflowValidator.ts`
- Modify: `packages/api-workflows/src/features/workflow/StoreWorkflow/StoreWorkflowUseCase.ts`
- Modify: `packages/api-workflows/src/features/stepTypes/ReviewStepType/ReviewStepType.ts`
- Modify: `packages/api-workflows/src/features/stepTypes/AutomationStepType/AutomationStepType.ts`
- Modify: `packages/ai-powerups/src/api/features/WorkflowReview/AiStepType/AiStepType.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/Workflows/handlers/DisallowUnpublishableModelsOnBeforeCreate.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/Workflows/handlers/DisallowUnpublishableModelsOnBeforeUpdate.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/wrappers/StoreCmsEntryWorkflow/StoreCmsEntryWorkflowUseCase.ts`
- Modify: `packages/api-website-builder-workflows/src/features/wrappers/StoreWebsiteBuilderPageWorkflow/StoreWebsiteBuilderPageWorkflowUseCase.ts`
- Create: `packages/api-workflows/__tests__/workflow/validationErrorData.test.ts`
- Create: `packages/api-workflows/__tests__/domain/getConfigIssueField.test.ts`
- Create: `packages/api-workflows/__tests__/automation/parseAutomationSettingsIssue.test.ts`
- Modify: `packages/api-workflows/__tests__/config/ListWorkflowUsers.test.ts`
- Modify: `packages/ai-powerups/__tests__/features/WorkflowReview/AiStepType.test.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/workflows/disallowUnpublishableModels.test.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/wrappers/workflowWrappers.test.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowValidationData.test.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/wrappers/workflowWrappers.test.ts`
- Create: `packages/api-website-builder-workflows/__tests__/graphql/pageWorkflowValidationData.test.ts`

**Interfaces:**
- Consumes (verified with codegraph and the source): `BaseError<TData>` (`@webiny/feature/api`; `data` is typed by the generic), `Result`, `StoreWorkflowUseCase` (`~/features/workflow/StoreWorkflow/index.js`), `WorkflowValidator` and `WorkflowStepValidator` (`~/domain/workflow/WorkflowValidator.js`), `AutomationDefinition` (`~/features/automation/AutomationDefinition/index.js`, `settingsSchema: ZodType<TSettings>`), `reviewStepConfigSchema`, `findReviewStepConfigProblem`, `ListUsersUseCase` (`@webiny/api-core/features/users/ListUsers/index.js`). Test helpers: `createContextHandler` (`~tests/__helpers/handler.js`), `FakeListUsers` and `FakeUser` (`~tests/__helpers/FakeListUsers.js`), `createAutomationStep`, `registerTestAutomation`, `TEST_AUTOMATION_ID`, `TestAutomationDefinition` (`~tests/__helpers/TestAutomationDefinition.js`), `createReviewStep`, `createWorkflowValues`, `editor`, `expectOk`, `REVIEW_TEAM_ID` (`~tests/__helpers/fixtures.js`); in ai-powerups `setup`, `createAiStep`, `createAiStepConfig`, `paramsFor`, `AI_STEP_ID`; in the CMS package `createUserContext` (`~tests/__helpers/userContext.js`), `createGraphQLClient` (`~tests/__helpers/graphql.js`), `EDITOR` (`~tests/__helpers/identities.js`), `CMS_READER`, `WORKFLOWS_EDITOR` (`~tests/__helpers/permissions.js`), `createWorkflowValues` (`~tests/__workflows/workflow.js`); in the WB package `asGraphQLUser`, `STORE_WORKFLOW` (`~tests/__helpers/graphql.js`), `createWbWorkflowValues` (`~tests/__helpers/engine.js`).
- Produces (matches the contract): `WorkflowValidationErrorData { stepId: string | null; field: string | null; workflowId: string | null }`, `WorkflowValidationError(message, where?)` with `data`, `parseAutomationSettingsIssue(schema, settings): Result<unknown, AutomationSettingsIssue>`, `AutomationSettingsIssue { path: string; message: string }`, `getConfigIssueField(path: readonly PropertyKey[]): string`. Consumed by Tasks 8, 9, 10 and 14 (the presenters map `error.data` onto the step and field; they read the field names above).

**Test runner note:** API packages: each test file runs with `yarn test <path>` and then `yarn test:os <path>` (one `test:os` run at a time). `node_modules/@webiny/api-workflows` links to `packages/api-workflows/dist`, so `ai-powerups`, `api-headless-cms-workflows` and `api-website-builder-workflows` see a change of `api-workflows` only after `yarn build -p @webiny/api-workflows --no-cache`; Step 4 builds it before their tests.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/domain/getConfigIssueField.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getConfigIssueField } from "~/domain/workflow/getConfigIssueField.js";

describe("getConfigIssueField (R267)", () => {
    it("joins the zod issue path under config", () => {
        expect(getConfigIssueField(["teams"])).toBe("config.teams");
        expect(getConfigIssueField(["assignment", "strategy"])).toBe("config.assignment.strategy");
    });

    it("writes array indexes as path parts", () => {
        expect(getConfigIssueField(["teams", 0])).toBe("config.teams.0");
        expect(getConfigIssueField(["assignment", "rules", 2, "target", "id"])).toBe(
            "config.assignment.rules.2.target.id"
        );
    });

    it("is just config for an issue with no path", () => {
        expect(getConfigIssueField([])).toBe("config");
    });
});
```

Create `packages/api-workflows/__tests__/automation/parseAutomationSettingsIssue.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import zod from "zod";
import { parseAutomationSettingsIssue } from "~/domain/automation/parseAutomationSettingsIssue.js";
import { TestAutomationDefinition } from "~tests/__helpers/TestAutomationDefinition.js";

describe("parseAutomationSettingsIssue (R267)", () => {
    it("returns the parsed settings with defaults applied", () => {
        const { settingsSchema } = new TestAutomationDefinition();

        const result = parseAutomationSettingsIssue(settingsSchema, {});

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({ mode: "approve" });
    });

    it("keeps valid values", () => {
        const { settingsSchema } = new TestAutomationDefinition();

        const result = parseAutomationSettingsIssue(settingsSchema, {
            mode: "reject",
            comment: "Needs a second look."
        });

        expect(result.value).toEqual({ mode: "reject", comment: "Needs a second look." });
    });

    it("fails with the first issue as a path and a message", () => {
        const { settingsSchema } = new TestAutomationDefinition();

        const result = parseAutomationSettingsIssue(settingsSchema, { mode: "explode" });

        expect(result.isFail()).toBe(true);
        expect(result.error.path).toBe("mode");
        expect(result.error.message).toMatch(/.+/);
        expect(Object.keys(result.error).sort()).toEqual(["message", "path"]);
    });

    it("dot-joins a nested path", () => {
        const schema = zod.object({ target: zod.object({ url: zod.url() }) });

        const result = parseAutomationSettingsIssue(schema, { target: { url: "nope" } });

        expect(result.error.path).toBe("target.url");
    });

    it("gives an empty path when the issue has none", () => {
        const result = parseAutomationSettingsIssue(zod.string(), 42);

        expect(result.isFail()).toBe(true);
        expect(result.error.path).toBe("");
        expect(result.error.message).toMatch(/expected string/);
    });
});
```

Create `packages/api-workflows/__tests__/workflow/validationErrorData.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import zod from "zod";
import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/feature/api";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { WorkflowValidationError } from "~/domain/workflow/errors.js";
import type { WorkflowValidationErrorData } from "~/domain/workflow/errors.js";
import { WorkflowValidator } from "~/domain/workflow/WorkflowValidator.js";
import type { WorkflowStep, WorkflowValues } from "~/domain/workflow/types.js";
import { AutomationDefinition } from "~/features/automation/AutomationDefinition/index.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { FakeListUsers, type FakeUser } from "~tests/__helpers/FakeListUsers.js";
import {
    createAutomationStep,
    registerTestAutomation,
    TEST_AUTOMATION_ID
} from "~tests/__helpers/TestAutomationDefinition.js";
import {
    createReviewStep,
    createWorkflowValues,
    editor,
    expectOk,
    REVIEW_TEAM_ID
} from "~tests/__helpers/fixtures.js";

const MEMBER_ID = "user-member";
const OUTSIDER_ID = "user-outsider";

const USERS: FakeUser[] = [
    { id: MEMBER_ID, displayName: "Mia Member", teams: [REVIEW_TEAM_ID] },
    { id: OUTSIDER_ID, displayName: "Otto Outsider", teams: ["team-x"] }
];

/** Settings with a nested path. */
class NestedSettingsAutomation implements AutomationDefinition.Interface {
    public readonly id = "nested-automation";
    public readonly name = "Nested automation";
    public readonly models = ["*"];
    public readonly settingsSchema = zod.object({ target: zod.object({ url: zod.url() }) });

    public async run(): Promise<AutomationDefinition.Outcome> {
        return { type: "approved" };
    }
}

/** Settings whose issue has no path: an unknown key on the root object. */
class StrictSettingsAutomation implements AutomationDefinition.Interface {
    public readonly id = "strict-automation";
    public readonly name = "Strict automation";
    public readonly models = ["*"];
    public readonly settingsSchema = zod.strictObject({});

    public async run(): Promise<AutomationDefinition.Outcome> {
        return { type: "approved" };
    }
}

const workflowLevel = (field: string): WorkflowValidationErrorData => {
    return { stepId: null, field, workflowId: null };
};

const stepLevel = (stepId: string, field: string): WorkflowValidationErrorData => {
    return { stepId, field, workflowId: null };
};

const customStep = (type: string, title: string): WorkflowStep => {
    return {
        id: `step-${type}`,
        title,
        color: "",
        type,
        notifications: [],
        config: { anything: true }
    };
};

const reviewStepWithConfig = (config: unknown): WorkflowStep => {
    return { ...createReviewStep({ id: "legal", title: "Legal review" }), config };
};

const setup = async (register: (container: Container) => void = () => {}) => {
    const { context } = await createContextHandler({
        setup: container => {
            container.registerInstance(ListUsersUseCase, new FakeListUsers(USERS));
            register(container);
        }
    });
    const store = context.container.resolve(StoreWorkflowUseCase);
    return {
        store: (workflow: WorkflowValues) => {
            return store.execute({ workflow, actor: editor });
        }
    };
};

describe("WorkflowValidationError data (R267)", () => {
    it("defaults every key to null", () => {
        const error = new WorkflowValidationError("Nope.");

        expect(error.code).toBe("Workflows/Workflow/Validation");
        expect(error.data).toEqual({ stepId: null, field: null, workflowId: null });
    });

    it("keeps the keys it is given and nulls the rest", () => {
        const error = new WorkflowValidationError("Nope.", { stepId: "legal", field: "title" });

        expect(error.data).toEqual({ stepId: "legal", field: "title", workflowId: null });
    });

    it("has no field for the workflow id, which the editor generates", () => {
        const result = WorkflowValidator.validate(createWorkflowValues({ id: "" }), step => {
            return Result.ok(step);
        });

        expect(result.error.message).toBe("Workflow ID is required.");
        expect(result.error.data).toEqual({ stepId: null, field: null, workflowId: null });
    });
});

describe("StoreWorkflowUseCase: workflow-level validation errors point at name, models or steps", () => {
    it("marks a blank name", async () => {
        const { store } = await setup();

        const result = await store(createWorkflowValues({ name: "  " }));

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.data).toEqual(workflowLevel("name"));
    });

    it("marks a model count other than one", async () => {
        const { store } = await setup();

        const none = await store(createWorkflowValues({ models: [] }));
        const two = await store(createWorkflowValues({ models: ["cms.a", "cms.b"] }));

        expect(none.error.data).toEqual(workflowLevel("models"));
        expect(two.error.data).toEqual(workflowLevel("models"));
    });

    it("marks a model id that is not a namespace id", async () => {
        const { store } = await setup();

        const result = await store(createWorkflowValues({ models: ["foo"] }));

        expect(result.error.data).toEqual(workflowLevel("models"));
    });

    it("marks a workflow with no steps", async () => {
        const { store } = await setup();

        const result = await store(createWorkflowValues({ steps: [] }));

        expect(result.error.message).toBe("Add at least one step.");
        expect(result.error.data).toEqual(workflowLevel("steps"));
    });

    it("marks a step with no id as a steps problem, with no step", async () => {
        const { store } = await setup();
        const step = { ...createReviewStep({ id: "legal", title: "Legal review" }), id: "" };

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.message).toBe("Every step needs an ID.");
        expect(result.error.data).toEqual(workflowLevel("steps"));
    });

    it("names the other workflow when the model already has one, with the same code and message", async () => {
        const { store } = await setup();
        expectOk(await store(createWorkflowValues()));

        const result = await store(createWorkflowValues({ id: "workflow-2", name: "Second" }));

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            'The model "cms.article" already has a workflow: "Article review".'
        );
        expect(result.error.data).toEqual({
            stepId: null,
            field: "models",
            workflowId: "workflow-1"
        });
    });
});

describe("StoreWorkflowUseCase: step-level validation errors point at the step and field", () => {
    it("marks a step id used twice with the id field", async () => {
        const { store } = await setup();
        const steps = [
            createReviewStep({ id: "legal", title: "Legal review" }),
            createReviewStep({ id: "legal", title: "Second review" })
        ];

        const result = await store(createWorkflowValues({ steps }));

        expect(result.error.data).toEqual(stepLevel("legal", "id"));
    });

    it("marks a blank title", async () => {
        const { store } = await setup();
        const steps = [
            createReviewStep({ id: "legal", title: "Legal review" }),
            createReviewStep({ id: "editorial", title: "  " })
        ];

        const result = await store(createWorkflowValues({ steps }));

        expect(result.error.data).toEqual(stepLevel("editorial", "title"));
    });

    it("marks an unknown step type and an unavailable ai type with the type field", async () => {
        const { store } = await setup();

        const unknown = await store(
            createWorkflowValues({ steps: [customStep("webhook", "Notify")] })
        );
        const ai = await store(createWorkflowValues({ steps: [customStep("ai", "AI check")] }));

        expect(unknown.error.data).toEqual(stepLevel("step-webhook", "type"));
        expect(ai.error.data).toEqual(stepLevel("step-ai", "type"));
    });
});

describe("StoreWorkflowUseCase: review step errors", () => {
    it("marks a routing rule with no target", async () => {
        const { store } = await setup();
        const step = createReviewStep({
            id: "legal",
            title: "Legal review",
            rules: [{ id: "rule-1", conditions: {} }]
        });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.data).toEqual(stepLevel("legal", "config.assignment.rules"));
    });

    it("marks a step with no team", async () => {
        const { store } = await setup();
        const step = createReviewStep({ id: "legal", title: "Legal review", teams: [] });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.data).toEqual(stepLevel("legal", "config.teams"));
    });

    it("marks a team target outside the step's teams", async () => {
        const { store } = await setup();
        const step = createReviewStep({
            id: "legal",
            title: "Legal review",
            rules: [
                {
                    id: "rule-1",
                    conditions: {},
                    target: { type: "team", id: "team-elsewhere" }
                }
            ]
        });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.data).toEqual(stepLevel("legal", "config.assignment.rules"));
    });

    it("marks a user target who is not a member of the step's teams", async () => {
        const { store } = await setup();
        const step = createReviewStep({
            id: "legal",
            title: "Legal review",
            rules: [
                { id: "rule-1", conditions: {}, target: { type: "user", id: OUTSIDER_ID } }
            ]
        });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.message).toBe(
            "Rule rule-1 targets a user who is not a member of the step's teams."
        );
        expect(result.error.data).toEqual(stepLevel("legal", "config.assignment.rules"));
    });

    it("marks a config issue with the zod issue path", async () => {
        const { store } = await setup();
        const step = reviewStepWithConfig({
            teams: [REVIEW_TEAM_ID],
            assignment: { strategy: "bogus", allowManualPick: false, rules: [] }
        });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.data).toEqual(stepLevel("legal", "config.assignment.strategy"));
    });

    it("marks a config that is not an object with config", async () => {
        const { store } = await setup();
        const step = reviewStepWithConfig("nope");

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.data).toEqual(stepLevel("legal", "config"));
    });
});

describe("StoreWorkflowUseCase: automation step errors", () => {
    it("marks a config with no settings as an automation problem", async () => {
        const { store } = await setup(container => registerTestAutomation(container));
        const step = {
            ...createAutomationStep({ id: "notify", title: "Notify" }),
            config: { automationId: TEST_AUTOMATION_ID }
        };

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.message).toBe('Step "Notify" needs an automation.');
        expect(result.error.data).toEqual(stepLevel("notify", "config.automationId"));
    });

    it("marks an automation that is not defined", async () => {
        const { store } = await setup();
        const step = createAutomationStep({ id: "notify", title: "Notify" });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.data).toEqual(stepLevel("notify", "config.automationId"));
    });

    it("marks an automation that does not cover the workflow's model", async () => {
        const { store } = await setup(container => {
            registerTestAutomation(container, { models: ["wb.page"] });
        });
        const step = createAutomationStep({ id: "notify", title: "Notify" });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.data).toEqual(stepLevel("notify", "config.automationId"));
    });

    it("marks invalid settings with the settings path", async () => {
        const { store } = await setup(container => registerTestAutomation(container));
        const step = createAutomationStep({
            id: "notify",
            title: "Notify",
            settings: { mode: "explode" }
        });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.message).toMatch(/^Step "Notify" settings are not valid: mode: .+\.$/);
        expect(result.error.data).toEqual(stepLevel("notify", "config.settings.mode"));
    });

    it("marks a nested settings issue with the dotted path", async () => {
        const { store } = await setup(container => {
            container.registerInstance(
                AutomationDefinition,
                new NestedSettingsAutomation() as AutomationDefinition.Interface
            );
        });
        const step = createAutomationStep({
            id: "notify",
            title: "Notify",
            automationId: "nested-automation",
            settings: { target: { url: "nope" } }
        });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.data).toEqual(stepLevel("notify", "config.settings.target.url"));
    });

    it("marks a settings issue with no path with config.settings and keeps the message", async () => {
        const { store } = await setup(container => {
            container.registerInstance(
                AutomationDefinition,
                new StrictSettingsAutomation() as AutomationDefinition.Interface
            );
        });
        const step = createAutomationStep({
            id: "notify",
            title: "Notify",
            automationId: "strict-automation",
            settings: { extra: 1 }
        });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.message).toMatch(/^Step "Notify" settings are not valid: .+\.$/);
        expect(result.error.data).toEqual(stepLevel("notify", "config.settings"));
    });
});
```

Modify `packages/api-workflows/__tests__/config/ListWorkflowUsers.test.ts`: a site outside the editor's save path keeps the null data.

Before:

```ts
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe("Too many user ids.");
```

After:

```ts
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe("Too many user ids.");
        expect(result.error.data).toEqual({ stepId: null, field: null, workflowId: null });
```

Modify `packages/ai-powerups/__tests__/features/WorkflowReview/AiStepType.test.ts`: a block of data cases before the `reach` block.

Before:

```ts
    describe("reach (R170)", () => {
        const reachStep = (review: ReturnType<typeof createAiReview>) => review.toData().steps[0];
```

After:

```ts
    describe("error data (R267)", () => {
        const where = (field: string) => {
            return { stepId: AI_STEP_ID, field, workflowId: null };
        };

        it("marks missing instructions with config.instructions", () => {
            const { stepType } = setup();
            const step = { ...createAiStep(), config: { instructions: " ", model: AI_MODEL } };

            const result = stepType.validate(paramsFor(step));

            expect(result.error?.data).toEqual(where("config.instructions"));
        });

        it("marks a missing model with config.model", () => {
            const { stepType } = setup();
            const step = { ...createAiStep(), config: { instructions: "Check." } };

            const result = stepType.validate(paramsFor(step));

            expect(result.error?.data).toEqual(where("config.model"));
        });

        it("marks tools that are not a list of names, and a tool that is not defined, with config.tools", () => {
            const { stepType } = setup();
            const invalid = createAiStep({ config: createAiStepConfig({ tools: "readTarget" }) });
            const unknown = createAiStep({ config: createAiStepConfig({ tools: ["ghostTool"] }) });

            const invalidResult = stepType.validate(paramsFor(invalid));
            const unknownResult = stepType.validate(paramsFor(unknown));

            expect(invalidResult.error?.data).toEqual(where("config.tools"));
            expect(unknownResult.error?.data).toEqual(where("config.tools"));
        });

        it("marks a model that is not available with config.model", async () => {
            const { stepType } = setup();
            const step = createAiStep({
                config: createAiStepConfig({ model: "anthropic/claude-gone" })
            });

            const result = await stepType.checkConfig?.(paramsFor(step));

            expect(result?.error?.data).toEqual(where("config.model"));
        });

        it("marks a model list that could not be loaded with config.model", async () => {
            const { stepType } = setup({ settings: new Error("settings table is down") });

            const result = await stepType.checkConfig?.(paramsFor(createAiStep()));

            expect(result?.error?.data).toEqual(where("config.model"));
        });

        it("marks a config that no longer parses with the zod issue path", async () => {
            const { stepType } = setup();
            const step = { ...createAiStep(), config: { instructions: 5, model: AI_MODEL } };

            const result = await stepType.checkConfig?.(paramsFor(step));

            expect(result?.error?.data).toEqual(where("config.instructions"));
        });
    });

    describe("reach (R170)", () => {
        const reachStep = (review: ReturnType<typeof createAiReview>) => review.toData().steps[0];
```

Modify `packages/api-headless-cms-workflows/__tests__/workflows/disallowUnpublishableModels.test.ts`: every throw of the handlers sets `field: "models"`.

Before:

```ts
    it("rejects creating a workflow for an unpublishable model", async () => {
        const context = await createUnpublishableContext();

        const result = await storeWorkflow(context);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(expectedMessage);
    });
```

After:

```ts
    it("rejects creating a workflow for an unpublishable model", async () => {
        const context = await createUnpublishableContext();

        const result = await storeWorkflow(context);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(expectedMessage);
        expect(result.error.data).toEqual(MODELS_ERROR_DATA);
    });
```

Before:

```ts
        const result = await storeWorkflow(context, createWorkflowValues(), created.value.savedOn);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(expectedMessage);
    });
```

After:

```ts
        const result = await storeWorkflow(context, createWorkflowValues(), created.value.savedOn);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(expectedMessage);
        expect(result.error.data).toEqual(MODELS_ERROR_DATA);
    });
```

Before:

```ts
        expect(result.error.message).toBe('The model "doesNotExist" does not exist.');
    });
```

After:

```ts
        expect(result.error.message).toBe('The model "doesNotExist" does not exist.');
        expect(result.error.data).toEqual(MODELS_ERROR_DATA);
    });
```

Before:

```ts
            `Cannot bind a workflow to the model "${modelDefinition.modelId}" because it is a private model.`
        );
    });
```

After:

```ts
            `Cannot bind a workflow to the model "${modelDefinition.modelId}" because it is a private model.`
        );
        expect(result.error.data).toEqual(MODELS_ERROR_DATA);
    });
```

Before:

```ts
        expect(result.error.message).toBe(`The model "${modelDefinition.modelId}" does not exist.`);
    });
```

After:

```ts
        expect(result.error.message).toBe(`The model "${modelDefinition.modelId}" does not exist.`);
        expect(result.error.data).toEqual(MODELS_ERROR_DATA);
    });
```

Before:

```ts
        await expect(handler.handle(event)).rejects.toMatchObject({
            code: "Workflows/Workflow/Validation",
            message: `You don't have access to the model "author".`
        });
```

After:

```ts
        await expect(handler.handle(event)).rejects.toMatchObject({
            code: "Workflows/Workflow/Validation",
            message: `You don't have access to the model "author".`,
            data: MODELS_ERROR_DATA
        });
```

Before:

```ts
const expectedMessage = `Cannot bind a workflow to the model "${modelDefinition.modelId}" because it is marked as unpublishable.`;
```

After:

```ts
const expectedMessage = `Cannot bind a workflow to the model "${modelDefinition.modelId}" because it is marked as unpublishable.`;

/** Every model problem of the handlers marks the models field (R267). */
const MODELS_ERROR_DATA = { stepId: null, field: "models", workflowId: null };
```

Modify `packages/api-headless-cms-workflows/__tests__/wrappers/workflowWrappers.test.ts`: the app-mismatch guard.

Before:

```ts
        expect(result.error.message).toBe(
            'A Headless CMS workflow can only be bound to Headless CMS models ("cms.<modelId>").'
        );
```

After:

```ts
        expect(result.error.message).toBe(
            'A Headless CMS workflow can only be bound to Headless CMS models ("cms.<modelId>").'
        );
        expect(result.error.data).toEqual({ stepId: null, field: "models", workflowId: null });
```

Create `packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowValidationData.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createWorkflowValues } from "~tests/__workflows/workflow.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { EDITOR } from "~tests/__helpers/identities.js";
import { CMS_READER, WORKFLOWS_EDITOR } from "~tests/__helpers/permissions.js";
import { createGraphQLClient } from "~tests/__helpers/graphql.js";

const STORE_WORKFLOW = /* GraphQL */ `
    mutation StoreWorkflow($data: WorkflowsWorkflowInput!, $savedOn: String) {
        cms {
            storeCmsEntryWorkflow(data: $data, savedOn: $savedOn) {
                data {
                    id
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

const EDITOR_PERMISSIONS = [WORKFLOWS_EDITOR, ...CMS_READER];

const createEditorClient = async () => {
    await createUserContext();
    return createGraphQLClient({ identity: EDITOR, permissions: EDITOR_PERMISSIONS });
};

describe("CMS workflow validation errors carry their data (R267)", () => {
    it("marks the models field when the workflow is bound to a model of another app", async () => {
        const editor = await createEditorClient();

        const body = await editor(STORE_WORKFLOW, { data: createWorkflowValues(["wb.page"]) });

        expect(body.errors).toBeUndefined();
        const result = body.data.cms.storeCmsEntryWorkflow;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.data).toEqual({ stepId: null, field: "models", workflowId: null });
    });

    it("marks the step and the title field of a step with a blank title", async () => {
        const editor = await createEditorClient();
        const values = createWorkflowValues();
        const data = { ...values, steps: [{ ...values.steps[0], title: " " }] };

        const body = await editor(STORE_WORKFLOW, { data });

        expect(body.errors).toBeUndefined();
        const result = body.data.cms.storeCmsEntryWorkflow;
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.data).toEqual({ stepId: "step-1", field: "title", workflowId: null });
    });

    it("names the other workflow when the model already has one", async () => {
        const editor = await createEditorClient();
        const stored = await editor(STORE_WORKFLOW, { data: createWorkflowValues() });
        expect(stored.data.cms.storeCmsEntryWorkflow.error).toBeNull();

        const body = await editor(STORE_WORKFLOW, {
            data: { ...createWorkflowValues(), id: "workflow-2", name: "Second workflow" }
        });

        expect(body.errors).toBeUndefined();
        const result = body.data.cms.storeCmsEntryWorkflow;
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.data).toEqual({
            stepId: null,
            field: "models",
            workflowId: "workflow-1"
        });
    });
});
```

Modify `packages/api-website-builder-workflows/__tests__/wrappers/workflowWrappers.test.ts`: the app-mismatch guard.

Before:

```ts
        expect(result.error.message).toBe(
            'A Website Builder workflow can only be bound to pages ("wb.page").'
        );
```

After:

```ts
        expect(result.error.message).toBe(
            'A Website Builder workflow can only be bound to pages ("wb.page").'
        );
        expect(result.error.data).toEqual({ stepId: null, field: "models", workflowId: null });
```

Create `packages/api-website-builder-workflows/__tests__/graphql/pageWorkflowValidationData.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createWbWorkflowValues } from "~tests/__helpers/engine.js";
import { asGraphQLUser, STORE_WORKFLOW } from "~tests/__helpers/graphql.js";

describe("WB workflow validation errors carry their data (R267)", () => {
    it("marks the models field when the workflow is bound to a model of another app", async () => {
        const admin = asGraphQLUser();

        const body = await admin.run(STORE_WORKFLOW, {
            data: { ...createWbWorkflowValues(), models: ["cms.article"] }
        });

        const result = body.data.websiteBuilder.storeWebsiteBuilderPageWorkflow;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.data).toEqual({ stepId: null, field: "models", workflowId: null });
    });

    it("marks the step and the title field of a step with a blank title", async () => {
        const admin = asGraphQLUser();
        const values = createWbWorkflowValues();
        const data = { ...values, steps: [{ ...values.steps[0], title: " " }] };

        const body = await admin.run(STORE_WORKFLOW, { data });

        const result = body.data.websiteBuilder.storeWebsiteBuilderPageWorkflow;
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.data).toEqual({ stepId: "step-1", field: "title", workflowId: null });
    });

    it("names the other workflow when pages already have one", async () => {
        const admin = asGraphQLUser();
        const stored = await admin.run(STORE_WORKFLOW, { data: createWbWorkflowValues() });
        expect(stored.data.websiteBuilder.storeWebsiteBuilderPageWorkflow.error).toBeNull();

        const body = await admin.run(STORE_WORKFLOW, {
            data: { ...createWbWorkflowValues(), id: "wb-workflow-2", name: "Second workflow" }
        });

        const result = body.data.websiteBuilder.storeWebsiteBuilderPageWorkflow;
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.data).toEqual({
            stepId: null,
            field: "models",
            workflowId: "wb-workflow"
        });
    });
});
```

(Checked by the consistency pass: the WB `STEP_ID` is `"step-1"`, as the existing `pageWorkflows.test.ts` asserts `id: "step-1"`, and the CMS test helper `STEP_ID` in `__tests__/__helpers/engine.ts` is `"step-1"` too. In `cmsWorkflowsSchema.test.ts` the `createUserContext()` call before `createGraphQLClient` is what prepares the shared data (A32); the new CMS file does the same.)

- [ ] **Step 2: Run the tests to see them fail**

Run each file on its own:
`yarn test packages/api-workflows/__tests__/domain/getConfigIssueField.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/automation/parseAutomationSettingsIssue.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/workflow/validationErrorData.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/config/ListWorkflowUsers.test.ts 2>&1 | tail -50`
`yarn test packages/ai-powerups/__tests__/features/WorkflowReview/AiStepType.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/workflows/disallowUnpublishableModels.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/wrappers/workflowWrappers.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowValidationData.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/wrappers/workflowWrappers.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/graphql/pageWorkflowValidationData.test.ts 2>&1 | tail -50`
Expected: FAIL. The first two fail to load their imports (`getConfigIssueField.js` and `parseAutomationSettingsIssue.js` do not exist). `validationErrorData.test.ts` fails on every `data` assertion (`expected undefined to deeply equal { stepId: null, ... }`). The other files fail on their new `data` assertions with the same `undefined` mismatch; every old assertion in them still passes.

- [ ] **Step 3: Implement**

Create `packages/api-workflows/src/domain/workflow/getConfigIssueField.ts`:

```ts
/**
 * The error field of a step config problem that a schema found (R267): `config.<path>` with the
 * zod issue path joined by dots (array indexes are path parts), or `config` when the issue has no
 * path.
 */
export const getConfigIssueField = (path: readonly PropertyKey[]): string => {
    if (path.length === 0) {
        return "config";
    }
    return `config.${path.map(String).join(".")}`;
};
```

Create `packages/api-workflows/src/domain/automation/parseAutomationSettingsIssue.ts`:

```ts
import { Result } from "@webiny/feature/api";
import type { ZodType } from "zod";

/** The first problem of a step's automation settings (R267): where it is and what is wrong. */
export interface AutomationSettingsIssue {
    /** The zod issue path joined by dots; empty when the issue has no path. */
    path: string;
    message: string;
}

/**
 * Parses a step's settings with the definition's `settingsSchema`, like `parseAutomationSettings`,
 * but fails with the first issue split into its path and message, so the save-time validation can
 * name the settings field (R267). Ok is the parsed value (defaults applied).
 */
export const parseAutomationSettingsIssue = (
    schema: ZodType,
    settings: unknown
): Result<unknown, AutomationSettingsIssue> => {
    const parsed = schema.safeParse(settings);
    if (parsed.success) {
        return Result.ok(parsed.data);
    }
    const [issue] = parsed.error.issues;
    const path = issue?.path.map(String).join(".") ?? "";
    const message = issue?.message ?? "unknown error";
    return Result.fail({ path, message });
};
```

Modify `packages/api-workflows/src/domain/automation/parseAutomationSettings.ts`: delegate to the new function.

Before:

```ts
import { Result } from "@webiny/feature/api";
import type { AutomationDefinition } from "~/features/automation/AutomationDefinition/abstractions.js";
```

After:

```ts
import { Result } from "@webiny/feature/api";
import type { AutomationDefinition } from "~/features/automation/AutomationDefinition/abstractions.js";
import { parseAutomationSettingsIssue } from "./parseAutomationSettingsIssue.js";
```

Before:

```ts
    const parsed = definition.settingsSchema.safeParse(settings);
    if (parsed.success) {
        return Result.ok(parsed.data);
    }
    const [issue] = parsed.error.issues;
    const path = issue?.path.map(String).join(".") ?? "";
    const message = issue?.message ?? "unknown error";
    return Result.fail(path ? `${path}: ${message}` : message);
```

After:

```ts
    const parsed = parseAutomationSettingsIssue(definition.settingsSchema, settings);
    if (parsed.isOk()) {
        return Result.ok(parsed.value);
    }
    const { path, message } = parsed.error;
    return Result.fail(path ? `${path}: ${message}` : message);
```

Modify `packages/api-workflows/src/domain/workflow/errors.ts`.

Before:

```ts
export class WorkflowValidationError extends BaseError {
    override readonly code = "Workflows/Workflow/Validation" as const;

    constructor(message: string) {
        super({
            message
        });
    }
}
```

After:

```ts
/**
 * Where a validation problem is (R267). `stepId` is null for a problem of the whole workflow;
 * `field` is null when no field can be named; `workflowId` is the other workflow of the
 * duplicate-model error.
 */
export interface WorkflowValidationErrorData {
    stepId: string | null;
    field: string | null;
    workflowId: string | null;
}

export class WorkflowValidationError extends BaseError<WorkflowValidationErrorData> {
    override readonly code = "Workflows/Workflow/Validation" as const;

    constructor(message: string, where: Partial<WorkflowValidationErrorData> = {}) {
        super({
            message,
            data: {
                stepId: where.stepId ?? null,
                field: where.field ?? null,
                workflowId: where.workflowId ?? null
            }
        });
    }
}
```

Modify `packages/api-workflows/src/domain/workflow/WorkflowValidator.ts`.

Before:

```ts
import { WorkflowValidationError } from "./errors.js";
import type { WorkflowStep, WorkflowValues } from "./types.js";
```

After:

```ts
import { WorkflowValidationError } from "./errors.js";
import type { WorkflowValidationErrorData } from "./errors.js";
import type { WorkflowStep, WorkflowValues } from "./types.js";
```

Before:

```ts
const fail = (message: string) => {
    return Result.fail(new WorkflowValidationError(message));
};
```

After:

```ts
const fail = (message: string, where: Partial<WorkflowValidationErrorData> = {}) => {
    return Result.fail(new WorkflowValidationError(message, where));
};
```

Before:

```ts
        if (!values.name || !values.name.trim()) {
            return fail("Workflow name is required.");
        }
        if (values.models.length !== 1 || !values.models[0]) {
            return fail("A workflow must be bound to exactly one model.");
        }
        const [model] = values.models;
        if (!MODEL_NAMESPACE_PATTERN.test(model)) {
            return fail(
                `Model "${model}" is not a valid model ID. Use "cms.<modelId>" or "wb.page".`
            );
        }
        if (values.steps.length === 0) {
            return fail("Add at least one step.");
        }
```

After:

```ts
        if (!values.name || !values.name.trim()) {
            return fail("Workflow name is required.", { field: "name" });
        }
        if (values.models.length !== 1 || !values.models[0]) {
            return fail("A workflow must be bound to exactly one model.", { field: "models" });
        }
        const [model] = values.models;
        if (!MODEL_NAMESPACE_PATTERN.test(model)) {
            return fail(
                `Model "${model}" is not a valid model ID. Use "cms.<modelId>" or "wb.page".`,
                { field: "models" }
            );
        }
        if (values.steps.length === 0) {
            return fail("Add at least one step.", { field: "steps" });
        }
```

Before:

```ts
        if (!step.id) {
            return fail("Every step needs an ID.");
        }
        if (stepIds.has(step.id)) {
            return fail(`Step ID "${step.id}" is used more than once.`);
        }
        stepIds.add(step.id);

        if (!step.title || !step.title.trim()) {
            return fail(`Step "${step.id}" needs a title.`);
        }
```

After:

```ts
        if (!step.id) {
            return fail("Every step needs an ID.", { field: "steps" });
        }
        if (stepIds.has(step.id)) {
            return fail(`Step ID "${step.id}" is used more than once.`, {
                stepId: step.id,
                field: "id"
            });
        }
        stepIds.add(step.id);

        if (!step.title || !step.title.trim()) {
            return fail(`Step "${step.id}" needs a title.`, { stepId: step.id, field: "title" });
        }
```

(The `Workflow ID is required.` site keeps `fail("Workflow ID is required.")`: the editor generates the id, so there is no field to mark.)

Modify `packages/api-workflows/src/features/workflow/StoreWorkflow/StoreWorkflowUseCase.ts`.

Before:

```ts
            if (!stepType) {
                return Result.fail(
                    new WorkflowValidationError(
                        step.type === AI_STEP_TYPE
                            ? `Step "${step.title}" uses the step type "ai", which is not available.`
                            : `Step "${step.title}" uses an unknown step type "${step.type}".`
                    )
                );
            }
```

After:

```ts
            if (!stepType) {
                let message = `Step "${step.title}" uses an unknown step type "${step.type}".`;
                if (step.type === AI_STEP_TYPE) {
                    message = `Step "${step.title}" uses the step type "ai", which is not available.`;
                }
                return Result.fail(
                    new WorkflowValidationError(message, { stepId: step.id, field: "type" })
                );
            }
```

Before:

```ts
                return Result.fail(
                    new WorkflowValidationError(
                        `Rule ${invalid.id} targets a user who is not a member of the step's teams.`
                    )
                );
```

After:

```ts
                return Result.fail(
                    new WorkflowValidationError(
                        `Rule ${invalid.id} targets a user who is not a member of the step's teams.`,
                        { stepId: step.id, field: "config.assignment.rules" }
                    )
                );
```

Before:

```ts
            return Result.fail(
                new WorkflowValidationError(
                    `The model "${model}" already has a workflow: "${other.name}".`
                )
            );
```

After:

```ts
            return Result.fail(
                new WorkflowValidationError(
                    `The model "${model}" already has a workflow: "${other.name}".`,
                    { field: "models", workflowId: other.id }
                )
            );
```

Modify `packages/api-workflows/src/features/stepTypes/ReviewStepType/ReviewStepType.ts`.

Before:

```ts
import { findReviewStepConfigProblem } from "~/domain/workflow/findReviewStepConfigProblem.js";
```

After:

```ts
import { findReviewStepConfigProblem } from "~/domain/workflow/findReviewStepConfigProblem.js";
import { getConfigIssueField } from "~/domain/workflow/getConfigIssueField.js";
```

Before:

```ts
const fail = (message: string) => {
    return Result.fail(new WorkflowValidationError(message));
};
```

After:

```ts
const fail = (message: string, stepId: string, field: string) => {
    return Result.fail(new WorkflowValidationError(message, { stepId, field }));
};
```

Before:

```ts
            if (!isRecord(rule) || !isRecord(rule.target)) {
                return fail(`Every routing rule in step "${step.title}" needs a target.`);
            }
        }

        const parsed = reviewStepConfigSchema.safeParse(step.config);
        if (!parsed.success) {
            const [issue] = parsed.error.issues;
            return fail(
                `Step "${step.title}" has an invalid configuration: ${issue?.message ?? "unknown error"}`
            );
        }
```

After:

```ts
            if (!isRecord(rule) || !isRecord(rule.target)) {
                return fail(
                    `Every routing rule in step "${step.title}" needs a target.`,
                    step.id,
                    "config.assignment.rules"
                );
            }
        }

        const parsed = reviewStepConfigSchema.safeParse(step.config);
        if (!parsed.success) {
            const [issue] = parsed.error.issues;
            const field = getConfigIssueField(issue?.path ?? []);
            return fail(
                `Step "${step.title}" has an invalid configuration: ${issue?.message ?? "unknown error"}`,
                step.id,
                field
            );
        }
```

Before:

```ts
        if (problem?.type === "noTeams") {
            return fail(`Step "${step.title}" needs at least one team.`);
        }
        if (problem?.type === "teamTargetOutsideTeams") {
            return fail(
                `Routing rule "${problem.ruleId}" in step "${step.title}" targets a team that is not one of the step's teams.`
            );
        }
```

After:

```ts
        if (problem?.type === "noTeams") {
            return fail(`Step "${step.title}" needs at least one team.`, step.id, "config.teams");
        }
        if (problem?.type === "teamTargetOutsideTeams") {
            return fail(
                `Routing rule "${problem.ruleId}" in step "${step.title}" targets a team that is not one of the step's teams.`,
                step.id,
                "config.assignment.rules"
            );
        }
```

Modify `packages/api-workflows/src/features/stepTypes/AutomationStepType/AutomationStepType.ts`.

Before:

```ts
import { parseAutomationSettings } from "~/domain/automation/parseAutomationSettings.js";
```

After:

```ts
import { parseAutomationSettings } from "~/domain/automation/parseAutomationSettings.js";
import { parseAutomationSettingsIssue } from "~/domain/automation/parseAutomationSettingsIssue.js";
```

Before:

```ts
const fail = (message: string) => {
    return Result.fail(new WorkflowValidationError(message));
};
```

After:

```ts
const fail = (message: string, stepId: string, field: string) => {
    return Result.fail(new WorkflowValidationError(message, { stepId, field }));
};
```

Before:

```ts
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
```

After:

```ts
        if (!shell.success) {
            return fail(`Step "${step.title}" needs an automation.`, step.id, "config.automationId");
        }
        const { automationId, settings } = shell.data;

        const definition = this.definitions.get(automationId);
        if (!definition) {
            return fail(
                `Step "${step.title}" uses the automation "${automationId}", which is not defined.`,
                step.id,
                "config.automationId"
            );
        }
        if (!matchesAutomationScope(definition.models, workflow.models)) {
            return fail(
                `Automation "${automationId}" is not available for this workflow's models.`,
                step.id,
                "config.automationId"
            );
        }

        const parsed = parseAutomationSettingsIssue(definition.settingsSchema, settings);
        if (parsed.isFail()) {
            const { path, message } = parsed.error;
            const detail = path ? `${path}: ${message}` : message;
            const field = path ? `config.settings.${path}` : "config.settings";
            return fail(`Step "${step.title}" settings are not valid: ${detail}.`, step.id, field);
        }
```

(`parseAutomationSettings` stays imported: `reach` uses it.)

Modify `packages/ai-powerups/src/api/features/WorkflowReview/AiStepType/AiStepType.ts`.

Before:

```ts
import { WorkflowValidationError } from "@webiny/api-workflows/domain/workflow/errors.js";
```

After:

```ts
import { WorkflowValidationError } from "@webiny/api-workflows/domain/workflow/errors.js";
import { getConfigIssueField } from "@webiny/api-workflows/domain/workflow/getConfigIssueField.js";
```

Before:

```ts
const fail = (message: string) => {
    return Result.fail(new WorkflowValidationError(message));
};
```

After:

```ts
const fail = (message: string, stepId: string, field: string) => {
    return Result.fail(new WorkflowValidationError(message, { stepId, field }));
};
```

Before:

```ts
        if (typeof instructions !== "string" || instructions.trim() === "") {
            return fail(`Step "${step.title}" needs instructions.`);
        }

        const model = typeof raw.model === "string" ? raw.model.trim() : "";
        if (model === "") {
            return fail(`Step "${step.title}" needs a model.`);
        }

        const given = raw.tools ?? [];
        if (!Array.isArray(given) || given.some(name => typeof name !== "string")) {
            return fail(`Step "${step.title}" has an invalid AI configuration.`);
        }
        // A duplicate is not an error: first-seen order, one entry each.
        const tools: string[] = [...new Set<string>(given)];
        for (const name of tools) {
            if (this.tools.get(name) === null) {
                return fail(
                    `Step "${step.title}" uses the AI tool "${name}", which is not defined.`
                );
            }
        }
```

After:

```ts
        if (typeof instructions !== "string" || instructions.trim() === "") {
            return fail(`Step "${step.title}" needs instructions.`, step.id, "config.instructions");
        }

        const model = typeof raw.model === "string" ? raw.model.trim() : "";
        if (model === "") {
            return fail(`Step "${step.title}" needs a model.`, step.id, "config.model");
        }

        const given = raw.tools ?? [];
        if (!Array.isArray(given) || given.some(name => typeof name !== "string")) {
            return fail(
                `Step "${step.title}" has an invalid AI configuration.`,
                step.id,
                "config.tools"
            );
        }
        // A duplicate is not an error: first-seen order, one entry each.
        const tools: string[] = [...new Set<string>(given)];
        for (const name of tools) {
            if (this.tools.get(name) === null) {
                return fail(
                    `Step "${step.title}" uses the AI tool "${name}", which is not defined.`,
                    step.id,
                    "config.tools"
                );
            }
        }
```

Before:

```ts
        if (!config.success) {
            return fail(`Step "${step.title}" has an invalid AI configuration.`);
        }

        // `list()` logs its own failure once, with the raw error, and returns a failed Result with
        // a fixed text. This check shows its own fixed text and does not log it again.
        const listed = await this.models.list();
        if (listed.isFail()) {
            return fail(
                `Step "${step.title}" could not be checked: the configured AI models could not be loaded.`
            );
        }
        if (!listed.value.some(model => model.id === config.data.model)) {
            return fail(
                `Step "${step.title}" uses the model "${config.data.model}", which is not available.`
            );
        }
```

After:

```ts
        if (!config.success) {
            const [issue] = config.error.issues;
            const field = getConfigIssueField(issue?.path ?? []);
            return fail(`Step "${step.title}" has an invalid AI configuration.`, step.id, field);
        }

        // `list()` logs its own failure once, with the raw error, and returns a failed Result with
        // a fixed text. This check shows its own fixed text and does not log it again.
        const listed = await this.models.list();
        if (listed.isFail()) {
            return fail(
                `Step "${step.title}" could not be checked: the configured AI models could not be loaded.`,
                step.id,
                "config.model"
            );
        }
        if (!listed.value.some(model => model.id === config.data.model)) {
            return fail(
                `Step "${step.title}" uses the model "${config.data.model}", which is not available.`,
                step.id,
                "config.model"
            );
        }
```

Modify the CMS handlers. The same hunk applies to both files `DisallowUnpublishableModelsOnBeforeCreate.ts` and `DisallowUnpublishableModelsOnBeforeUpdate.ts` (the bodies are identical).

Before:

```ts
                if (model.error.code === MODEL_NOT_FOUND) {
                    throw new WorkflowValidationError(`The model "${modelId}" does not exist.`);
                }
                if (model.error.code === MODEL_NOT_AUTHORIZED) {
                    throw new WorkflowValidationError(
                        `You don't have access to the model "${modelId}".`
                    );
                }
                throw model.error;
            }
            if (model.value.isPrivate) {
                throw new WorkflowValidationError(
                    `Cannot bind a workflow to the model "${modelId}" because it is a private model.`
                );
            }
            const tags = model.value.tags || [];
            if (!tags.includes(UNPUBLISHABLE_MODEL_TAG)) {
                continue;
            }
            throw new WorkflowValidationError(
                `Cannot bind a workflow to the model "${modelId}" because it is marked as unpublishable.`
            );
```

After:

```ts
                if (model.error.code === MODEL_NOT_FOUND) {
                    throw new WorkflowValidationError(`The model "${modelId}" does not exist.`, {
                        field: "models"
                    });
                }
                if (model.error.code === MODEL_NOT_AUTHORIZED) {
                    throw new WorkflowValidationError(
                        `You don't have access to the model "${modelId}".`,
                        { field: "models" }
                    );
                }
                throw model.error;
            }
            if (model.value.isPrivate) {
                throw new WorkflowValidationError(
                    `Cannot bind a workflow to the model "${modelId}" because it is a private model.`,
                    { field: "models" }
                );
            }
            const tags = model.value.tags || [];
            if (!tags.includes(UNPUBLISHABLE_MODEL_TAG)) {
                continue;
            }
            throw new WorkflowValidationError(
                `Cannot bind a workflow to the model "${modelId}" because it is marked as unpublishable.`,
                { field: "models" }
            );
```

Modify `packages/api-headless-cms-workflows/src/features/wrappers/StoreCmsEntryWorkflow/StoreCmsEntryWorkflowUseCase.ts`.

Before:

```ts
            return Result.fail(new WorkflowValidationError(CMS_MODELS_ONLY));
```

After:

```ts
            return Result.fail(new WorkflowValidationError(CMS_MODELS_ONLY, { field: "models" }));
```

Modify `packages/api-website-builder-workflows/src/features/wrappers/StoreWebsiteBuilderPageWorkflow/StoreWebsiteBuilderPageWorkflowUseCase.ts`.

Before:

```ts
            return Result.fail(new WorkflowValidationError(WB_PAGES_ONLY));
```

After:

```ts
            return Result.fail(new WorkflowValidationError(WB_PAGES_ONLY, { field: "models" }));
```

- [ ] **Step 4: Run the tests to see them pass**

First the `api-workflows` files, each on its own:
`yarn test packages/api-workflows/__tests__/domain/getConfigIssueField.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/automation/parseAutomationSettingsIssue.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/workflow/validationErrorData.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/config/ListWorkflowUsers.test.ts 2>&1 | tail -50`
Expected: PASS.

Then build the package the others consume, and run theirs:
`yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30`
`yarn test packages/ai-powerups/__tests__/features/WorkflowReview/AiStepType.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/workflows/disallowUnpublishableModels.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/wrappers/workflowWrappers.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowValidationData.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/wrappers/workflowWrappers.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/graphql/pageWorkflowValidationData.test.ts 2>&1 | tail -50`
Expected: PASS for each.

Run all ten with `yarn test:os` (one at a time).
Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

The validation sites feed these suites (they assert code and message, never `data`), so each must still pass unchanged. Run each file on its own with `yarn test <path> 2>&1 | tail -50`, then again with `yarn test:os`:
`packages/api-workflows/__tests__/automation/parseAutomationSettings.test.ts`
`packages/api-workflows/__tests__/domain/WorkflowValidator.test.ts`
`packages/api-workflows/__tests__/stepTypes/ReviewStepType.test.ts`
`packages/api-workflows/__tests__/stepTypes/AutomationStepType.test.ts`
`packages/api-workflows/__tests__/workflow/WorkflowUseCases.test.ts`
`packages/api-workflows/__tests__/workflow/StoreWorkflowStepTypes.test.ts`
`packages/api-workflows/__tests__/workflow/StoreWorkflowRuleTargets.test.ts`
`packages/api-workflows/__tests__/workflow/StoreWorkflowCheckConfig.test.ts`
`packages/api-workflows/__tests__/workflow/StoreWorkflowAutomationSteps.test.ts`
`packages/api-workflows/__tests__/routing/InspectRouting.test.ts`
`packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`
`packages/api-headless-cms-workflows/__tests__/wrappers/routingWrappers.test.ts`
`packages/api-headless-cms-workflows/__tests__/wrappers/listWorkflowModels.test.ts`
`packages/api-headless-cms-workflows/__tests__/workflows/bindableDbModel.test.ts`
`packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchema.test.ts`
`packages/api-headless-cms-workflows/__tests__/graphql/cmsRoutingSchema.test.ts`
`packages/api-website-builder-workflows/__tests__/wrappers/routingWrappers.test.ts`
`packages/api-website-builder-workflows/__tests__/graphql/pageWorkflows.test.ts`
`packages/api-website-builder-workflows/__tests__/graphql/pageRouting.test.ts`
Expected: PASS. (If one of them compares a whole Validation `error` object with `toEqual` and now sees `data`, update that assertion to include `data: { stepId: null, field: null, workflowId: null }` or the field the site sets; the research found none.)

Type-check the four packages (the tests of each are type-checked with the package):
`yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40`
`yarn check:test:types -p ai-powerups --report cli 2>&1 | tail -40`
`yarn check:test:types -p api-headless-cms-workflows --report cli 2>&1 | tail -40`
`yarn check:test:types -p api-website-builder-workflows --report cli 2>&1 | tail -40`
Expected: no errors. (If `result.error.data` in the new tests does not type-check because `error` is a union of error classes whose `data` types differ, read it through `const data: unknown = result.error.data;`; if `result.error` is possibly undefined in the ai-powerups tests, they already use `result.error?.`.)

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain of phase 8a (`docs/.bruno/plans/2026-10-16-workflows-phase-8a/00-shared.md`) in full: `git add .`, `yarn > /dev/null 2>&1`, `node scripts/generateTsConfigsInPackages.js`, `yarn adio`, `yarn check-ts-configs`, `yarn format:fix > /dev/null 2>&1`, `yarn lint:fix`, `yarn webiny sync-dependencies`, then `yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30`, `yarn build -p @webiny/ai-powerups --no-cache 2>&1 | tail -30`, `yarn build -p @webiny/api-headless-cms-workflows --no-cache 2>&1 | tail -30`, `yarn build -p @webiny/api-website-builder-workflows --no-cache 2>&1 | tail -30` (the admin tasks of 9a read the new data from the built packages), `git add .`. Restore `.gitleaks.toml` (`git checkout -- .gitleaks.toml`); never commit it, `docs/.reports` or `.superpowers`. If any step fails and you fix something, rerun the chain from the start. Then commit (replace `<CURRENT_SESSION_URL>` with the `https://claude.ai/code/session_...` URL of the session that runs the commit):

```
git commit -m "feat(api-workflows): add step and field to workflow validation errors" -m "WorkflowValidationError carries { stepId, field, workflowId } (null when not given) so the workflow editor can mark the step and the field. Every validation site of the save path sets it, the duplicate-model error names the other workflow, and parseAutomationSettingsIssue gives the settings path. Codes and messages are unchanged." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

## Contract notes

- The contract's file list for Task 1 does not name `getConfigIssueField.ts`. The review step type and the AI step type (another package) both build `config.<zod issue path>`; one pure function in `api-workflows` keeps the rule in one place (ai-powerups imports it by deep path, as it already does for `errors.js`). It is not exported from any barrel.
- The `Workflow ID is required.` site (`WorkflowValidator.ts`) sets no field: R267's workflow-level list is `name`, `models`, `steps`, the editor generates the id client side, and a Validation error with no field takes the Q43 "other Validation" banner path. Research round 2 proposed `id` for it; the contract list wins.
- R267 gives `WorkflowValidationErrorData` three non-optional nullable keys; the constructor's second argument is `Partial<WorkflowValidationErrorData>` so a caller names only what it knows. `data` is therefore always an object with all three keys (never `undefined`) for every Validation error, including the sites outside the editor (their GraphQL `error.data` changes from `null` to `{ stepId: null, field: null, workflowId: null }`; no existing test asserts the old value).
- `parseAutomationSettingsIssue` takes the zod schema (`definition.settingsSchema`), as R267 writes it, not the definition. Per review, `parseAutomationSettings` delegates to it (one place owns the first-issue and path handling); its signature, string result, callers and test are unchanged, so the contract's "stay as they are" holds for everything a caller sees.
- AI `checkConfig` zod failure: R267 lists no field for it; the plan uses `getConfigIssueField(issue.path)` (e.g. `config.model` for a missing model), the same rule as the review step type. `AutomationStepRunner.ts` is not changed (it calls the old function).
- Fields `notifications` and `color` are reserved by R267 and not set by any site: there is no server validation of them today (research round 1 gap 8).
- Verified against the code and not stated by the contract: the CMS before-create and before-update handlers have identical bodies, so one hunk covers both files; the contract's AI path (`.../AiStepType.ts`) is `packages/ai-powerups/src/api/features/WorkflowReview/AiStepType/AiStepType.ts` (contract review 1 I1).
