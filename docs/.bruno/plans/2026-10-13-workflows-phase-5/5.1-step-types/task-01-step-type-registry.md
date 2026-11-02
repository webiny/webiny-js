### Task 1: `StepType`, `StepTypeRegistryService`, `review` built-in, validator swap

Spec 4.1, 7.1; D14, D25, D122, D130; R131, R132, R134, R138 (ids only). Today `WorkflowValidator` hard-codes `step.type !== REVIEW_STEP_TYPE` and the review config checks (`validateReviewConfig`). This task adds the public multi-registered `StepType` abstraction and `StepTypeRegistryService`, moves the review config checks behind a `review` built-in, and makes `StoreWorkflowUseCase` validate steps through the registry. Behaviour for `review` steps does not change.

What goes through the registry, and what does not (five importers of `REVIEW_STEP_TYPE`, only two behave differently):

- `WorkflowValidator` (via `StoreWorkflowUseCase`) validates through the registry: this task.
- `ListWorkflowStepTypesUseCase` goes through the registry in Task 3. Here it only changes its import path.
- `StoreWorkflowUseCase` (user-target check), `ListStepCandidatesUseCase` and `canPickReviewer` keep parsing the review config with `parseReviewStepConfig`; they only import `REVIEW_STEP_TYPE` from its new file.

`ReviewStepType.reach` exists after this task (the existing resolver path, unchanged behaviour) but nothing calls it yet: `ReviewStepReacher` still calls the resolver directly until Task 10 dispatches by step type.

**Files:**
- Create: `packages/api-workflows/src/domain/workflow/stepTypes.ts`
- Create: `packages/api-workflows/src/features/stepTypes/StepType/abstractions.ts`
- Create: `packages/api-workflows/src/features/stepTypes/StepType/index.ts`
- Create: `packages/api-workflows/src/features/stepTypes/StepTypeRegistryService/abstractions.ts`
- Create: `packages/api-workflows/src/features/stepTypes/StepTypeRegistryService/StepTypeRegistryService.ts`
- Create: `packages/api-workflows/src/features/stepTypes/StepTypeRegistryService/index.ts`
- Create: `packages/api-workflows/src/features/stepTypes/ReviewStepType/ReviewStepType.ts`
- Create: `packages/api-workflows/src/features/stepTypes/feature.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Modify: `packages/api-workflows/src/domain/workflow/WorkflowValidator.ts`
- Modify: `packages/api-workflows/src/features/workflow/StoreWorkflow/StoreWorkflowUseCase.ts`
- Modify: `packages/api-workflows/src/features/config/ListWorkflowStepTypes/ListWorkflowStepTypesUseCase.ts` (import path only)
- Modify: `packages/api-workflows/src/features/routing/ListStepCandidates/ListStepCandidatesUseCase.ts` (import path only)
- Modify: `packages/api-workflows/src/domain/workflow/canPickReviewer.ts` (import path only)
- Modify: `packages/api-workflows/src/domain/workflow/types.ts` (comment only)
- Modify: `packages/api-workflows/src/domain/workflow/reviewStepConfigSchema.ts` (comment only)
- Create: `packages/api-workflows/__tests__/__helpers/TestStepType.ts` (exports `createTestStepType`, R157)
- Create: `packages/api-workflows/__tests__/stepTypes/StepTypeRegistryService.test.ts`
- Create: `packages/api-workflows/__tests__/stepTypes/ReviewStepType.test.ts`
- Create: `packages/api-workflows/__tests__/workflow/StoreWorkflowStepTypes.test.ts`
- Modify: `packages/api-workflows/__tests__/domain/WorkflowValidator.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`

**Interfaces:**
- Consumes (existing):
  - `WorkflowValidator.validate(values: WorkflowValues): Result<WorkflowValues, WorkflowValidationError>` (changes below), `WorkflowStep`, `WorkflowValues` (`~/domain/workflow/types.js`), `WorkflowValidationError(message)` (`~/domain/workflow/errors.js`), `reviewStepConfigSchema`, `parseReviewStepConfig` (`~/domain/workflow/reviewStepConfigSchema.js`), `findReviewStepConfigProblem(config: ReviewStepConfig): ReviewStepConfigProblem | null`.
  - `StepAssignmentResolver` (`~/features/review/StepAssignmentResolver/index.js`): `resolve({ review: ReviewData, step: ReviewStep, now: Date }): Promise<StepAssignmentResolution>`; `Review` (`~/domain/review/Review.js`): `toData()`, `reach({ resolution, actor, now }): Result<void, ReviewInvalidStateError>`; `Actor`, `ReviewStep` (`~/domain/review/types.js`); `ReviewInvalidStateError` (`~/domain/review/errors.js`).
  - Multi-dependency syntax `[[Abstraction, { multiple: true }]]` (as `ListNotificationTypesRepository`).
- Produces:
  - `domain/workflow/stepTypes.ts`: `REVIEW_STEP_TYPE = "review"`, `AUTOMATION_STEP_TYPE = "automation"`. `REVIEW_STEP_TYPE` is no longer exported from `WorkflowValidator.ts`; `MODEL_NAMESPACE_PATTERN` stays there.
  - `StepType` (`features/stepTypes/StepType/`): `IStepType { type; title; configSchema: ZodType | null; describeAvailability(): Promise<StepTypeAvailability>; validate(params: StepTypeValidateParams): Result<WorkflowStep, WorkflowValidationError>; reach(params: StepTypeReachParams): Promise<Result<void, ReviewInvalidStateError | ReviewStepNotCurrentError>> }` (R159: the error union includes what `review.fail` returns, so the reacher passes it through), namespace types `StepType.Interface`, `.Availability`, `.ValidateParams`, `.ReachParams`. Public (R134): `@webiny/api-workflows/features/stepTypes/StepType/index.js`.
  - `StepTypeRegistryService`: `get(type: string): StepType.Interface | null`, `list(): StepType.Interface[]` (registration order; the last registration per `type` wins).
  - `ReviewStepType` (`features/stepTypes/ReviewStepType/ReviewStepType.ts`, impl class `ReviewStepTypeImpl`): `type: "review"`, `title: "Review"`, `configSchema: reviewStepConfigSchema`, always available, `validate` = the old `validateReviewConfig` (same checks and messages, returns the step with the parsed `config`), `reach` = the existing resolver path.
  - `StepTypesFeature` (`features/stepTypes/feature.ts`): registers the registry service and `ReviewStepType`; Task 2 adds the automation step type to it.
  - `WorkflowValidator.validate(values, validateStep)`: `validateStep: (step: WorkflowStep) => Result<WorkflowStep, WorkflowValidationError>` (exported type `WorkflowStepValidator`).
  - `StoreWorkflowUseCase` dependencies become `[WorkflowRepository, EventPublisher, IdentityContext, ListUsersUseCase, StepTypeRegistryService]`.
  - Test helper `createTestStepType(options)` (`~tests/__helpers/TestStepType.js`) returning `{ implementation, validateCalls }`; register with `container.register(implementation)`.
- Messages (R132, `WorkflowValidationError`): unregistered `ai`: `Step "<title>" uses the step type "ai", which is not available.`; any other unregistered type: `Step "<title>" uses an unknown step type "<type>".`. These replace the old `... is not supported yet. Only "review" steps can be saved.`. Review config messages are unchanged.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/__helpers/TestStepType.ts`:

```ts
import type { ZodType } from "zod";
import { Result } from "@webiny/feature/api";
import { StepType } from "~/features/stepTypes/StepType/index.js";
import type { WorkflowValidationError } from "~/domain/workflow/errors.js";
import type { WorkflowStep } from "~/domain/workflow/types.js";

export interface TestStepTypeOptions {
    type: string;
    title?: string;
    configSchema?: ZodType | null;
    availability?: StepType.Availability;
    /** Replaces `availability`; use it to make `describeAvailability` throw. */
    describeAvailability?: () => Promise<StepType.Availability>;
    /** Defaults to accepting the step as it is. */
    validate?: (params: StepType.ValidateParams) => Result<WorkflowStep, WorkflowValidationError>;
}

/**
 * A step type for tests. `validateCalls` records every `validate` call, in order. Register the
 * `implementation` after `WorkflowsFeature` (a `setup` callback of `createContextHandler`).
 */
export const createTestStepType = (options: TestStepTypeOptions) => {
    const validateCalls: StepType.ValidateParams[] = [];

    class TestStepTypeImpl implements StepType.Interface {
        public readonly type = options.type;
        public readonly title = options.title ?? options.type;
        public readonly configSchema = options.configSchema ?? null;

        public async describeAvailability(): Promise<StepType.Availability> {
            if (options.describeAvailability) {
                return options.describeAvailability();
            }
            return options.availability ?? { available: true, unavailableReason: null };
        }

        public validate(params: StepType.ValidateParams) {
            validateCalls.push(params);
            return options.validate ? options.validate(params) : Result.ok(params.step);
        }

        public async reach() {
            return Result.ok();
        }
    }

    return {
        validateCalls,
        implementation: StepType.createImplementation({
            implementation: TestStepTypeImpl,
            dependencies: []
        })
    };
};
```

Create `packages/api-workflows/__tests__/stepTypes/StepTypeRegistryService.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { createTestStepType } from "~tests/__helpers/TestStepType.js";
import { StepTypeRegistryService } from "~/features/stepTypes/StepTypeRegistryService/index.js";

describe("StepTypeRegistryService (R131)", () => {
    it("has the review built-in and nothing else registered by the engine yet", async () => {
        const { context } = await createContextHandler();
        const registry = context.container.resolve(StepTypeRegistryService);

        expect(registry.list().map(stepType => stepType.type)).toEqual(["review"]);
        expect(registry.get("review")?.title).toBe("Review");
        expect(registry.get("ai")).toBeNull();
        expect(registry.get("unknown")).toBeNull();
    });

    it("lists registered types in registration order", async () => {
        const custom = createTestStepType({ type: "custom", title: "Custom" });
        const { context } = await createContextHandler({
            setup: container => {
                container.register(custom.implementation);
            }
        });
        const registry = context.container.resolve(StepTypeRegistryService);

        expect(registry.list().map(stepType => stepType.type)).toEqual(["review", "custom"]);
        expect(registry.get("custom")?.title).toBe("Custom");
    });

    it("returns the last registration per type and keeps its place in the list", async () => {
        const replacement = createTestStepType({ type: "review", title: "Custom review" });
        const custom = createTestStepType({ type: "custom" });
        const { context } = await createContextHandler({
            setup: container => {
                container.register(custom.implementation);
                container.register(replacement.implementation);
            }
        });
        const registry = context.container.resolve(StepTypeRegistryService);

        expect(registry.get("review")?.title).toBe("Custom review");
        expect(registry.list().map(stepType => stepType.type)).toEqual(["review", "custom"]);
        expect(registry.list()[0].title).toBe("Custom review");
    });
});
```

Create `packages/api-workflows/__tests__/stepTypes/ReviewStepType.test.ts`. The `validate` cases are the review config tests moved out of `WorkflowValidator.test.ts` (same inputs, same messages):

```ts
import { describe, expect, it } from "vitest";
import type { WorkflowStep } from "~/domain/workflow/types.js";
import { Review } from "~/domain/review/Review.js";
import { StepAssignmentResolver } from "~/features/review/StepAssignmentResolver/index.js";
import { StepTypeRegistryService } from "~/features/stepTypes/StepTypeRegistryService/index.js";
import { reviewStepConfigSchema } from "~/domain/workflow/reviewStepConfigSchema.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    ARTICLE_MODEL,
    createReviewStep,
    createWorkflow,
    createWorkflowValues,
    expectOk,
    NOW,
    OTHER_TEAM_ID,
    poolResolution,
    REVIEW_TEAM_ID,
    requester,
    targetContext
} from "~tests/__helpers/fixtures.js";

/** Records resolver calls and puts every step in the pool. */
class RecordingStepAssignmentResolver implements StepAssignmentResolver.Interface {
    public readonly calls: StepAssignmentResolver.Params[] = [];

    public async resolve(params: StepAssignmentResolver.Params) {
        this.calls.push(params);
        return poolResolution();
    }
}

const setup = async (resolver: StepAssignmentResolver.Interface | null = null) => {
    const { context } = await createContextHandler({
        setup: container => {
            if (resolver) {
                container.registerInstance(StepAssignmentResolver, resolver);
            }
        }
    });
    const stepType = context.container.resolve(StepTypeRegistryService).get("review");
    if (!stepType) {
        throw new Error("The review step type is not registered.");
    }
    return stepType;
};

const validationMessage = async (step: WorkflowStep): Promise<string> => {
    const stepType = await setup();
    const result = stepType.validate({ step, workflow: createWorkflowValues({ steps: [step] }) });
    if (result.isOk()) {
        throw new Error("Expected the step to be invalid.");
    }
    expect(result.error.code).toBe("Workflows/Workflow/Validation");
    return result.error.message;
};

describe("ReviewStepType (R131)", () => {
    it("describes itself", async () => {
        const stepType = await setup();

        expect(stepType.type).toBe("review");
        expect(stepType.title).toBe("Review");
        expect(stepType.configSchema).toBe(reviewStepConfigSchema);
        expect(await stepType.describeAvailability()).toEqual({
            available: true,
            unavailableReason: null
        });
    });

    describe("validate", () => {
        it("returns the step with its parsed config", async () => {
            const stepType = await setup();
            const step = createReviewStep({ id: "legal", title: "Legal review" });

            const result = stepType.validate({
                step,
                workflow: createWorkflowValues({ steps: [step] })
            });

            expect(result.isOk()).toBe(true);
            expect(result.value).toEqual(step);
        });

        it("requires at least one team", async () => {
            const step = createReviewStep({ id: "legal", title: "Legal review", teams: [] });

            expect(await validationMessage(step)).toBe(
                'Step "Legal review" needs at least one team.'
            );
        });

        it("requires a target on every routing rule", async () => {
            const step = createReviewStep({
                id: "legal",
                title: "Legal review",
                rules: [{ id: "rule-1", conditions: {} }]
            });

            expect(await validationMessage(step)).toBe(
                'Every routing rule in step "Legal review" needs a target.'
            );
        });

        it("requires a team target to be one of the step's teams", async () => {
            const step = createReviewStep({
                id: "legal",
                title: "Legal review",
                teams: [REVIEW_TEAM_ID],
                rules: [
                    {
                        id: "rule-1",
                        conditions: {},
                        target: { type: "team", id: OTHER_TEAM_ID }
                    }
                ]
            });

            expect(await validationMessage(step)).toBe(
                'Routing rule "rule-1" in step "Legal review" targets a team that is not one of the step\'s teams.'
            );
        });

        it("accepts a team target that is one of the step's teams and any user target", async () => {
            const stepType = await setup();
            const step = createReviewStep({
                id: "legal",
                title: "Legal review",
                teams: [REVIEW_TEAM_ID],
                rules: [
                    { id: "rule-1", conditions: {}, target: { type: "team", id: REVIEW_TEAM_ID } },
                    { id: "rule-2", conditions: {}, target: { type: "user", id: "user-anyone" } }
                ]
            });

            const result = stepType.validate({
                step,
                workflow: createWorkflowValues({ steps: [step] })
            });

            expect(result.isOk()).toBe(true);
        });

        it("rejects an invalid review config", async () => {
            const step: WorkflowStep = {
                ...createReviewStep({ id: "legal", title: "Legal review" }),
                config: {
                    teams: ["team-a"],
                    assignment: { strategy: "random", allowManualPick: false, rules: [] }
                }
            };

            expect(await validationMessage(step)).toMatch(
                /^Step "Legal review" has an invalid configuration: /
            );
        });
    });

    describe("reach", () => {
        it("resolves the step's assignment and reaches it on the review", async () => {
            const resolver = new RecordingStepAssignmentResolver();
            const stepType = await setup(resolver);
            const review = expectOk(
                Review.request({
                    id: "review-1",
                    workflow: createWorkflow(),
                    model: ARTICLE_MODEL,
                    targetId: "article-1",
                    targetRevisionId: "article-1#0001",
                    title: "Article 1",
                    targetContext,
                    picks: [],
                    requester,
                    now: NOW
                })
            );
            const step = review.getStepToReach();
            if (!step) {
                throw new Error("Expected a pending step.");
            }

            const result = await stepType.reach({ review, step, actor: requester, now: NOW });

            expect(result.isOk()).toBe(true);
            expect(resolver.calls).toHaveLength(1);
            expect(resolver.calls[0].step.id).toBe("legal");
            expect(resolver.calls[0].review.id).toBe("review-1");
            expect(resolver.calls[0].now).toEqual(new Date(NOW));
            const data = review.toData();
            expect(data.currentStepState).toBe("awaiting");
            expect(data.steps[0].reachedOn).toBe(NOW);
        });

        it("fails with the invalid state error when the current step is not pending", async () => {
            const resolver = new RecordingStepAssignmentResolver();
            const stepType = await setup(resolver);
            const review = expectOk(
                Review.request({
                    id: "review-1",
                    workflow: createWorkflow(),
                    model: ARTICLE_MODEL,
                    targetId: "article-1",
                    targetRevisionId: "article-1#0001",
                    title: "Article 1",
                    targetContext,
                    picks: [],
                    requester,
                    now: NOW
                })
            );
            const step = review.getStepToReach();
            if (!step) {
                throw new Error("Expected a pending step.");
            }
            expectOk(await stepType.reach({ review, step, actor: requester, now: NOW }));

            const again = await stepType.reach({ review, step, actor: requester, now: NOW });

            expect(again.error.code).toBe("Workflows/Review/InvalidState");
        });
    });
});
```

Create `packages/api-workflows/__tests__/workflow/StoreWorkflowStepTypes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { WorkflowValidationError } from "~/domain/workflow/errors.js";
import type { WorkflowStep, WorkflowValues } from "~/domain/workflow/types.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { GetWorkflowUseCase } from "~/features/workflow/GetWorkflow/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { createTestStepType, type TestStepTypeOptions } from "~tests/__helpers/TestStepType.js";
import { FakeListUsers } from "~tests/__helpers/FakeListUsers.js";
import { createReviewStep, createWorkflowValues, editor } from "~tests/__helpers/fixtures.js";

const customStep = (type: string, title = "Custom step"): WorkflowStep => {
    return {
        id: `step-${type}`,
        title,
        color: "",
        type,
        notifications: [],
        config: { anything: true }
    };
};

const setup = async (stepTypes: TestStepTypeOptions[] = []) => {
    const created = stepTypes.map(options => createTestStepType(options));
    const { context } = await createContextHandler({
        setup: container => {
            container.registerInstance(ListUsersUseCase, new FakeListUsers([]));
            for (const stepType of created) {
                container.register(stepType.implementation);
            }
        }
    });
    return {
        calls: created.map(stepType => stepType.validateCalls),
        store: (workflow: WorkflowValues) => {
            return context.container
                .resolve(StoreWorkflowUseCase)
                .execute({ workflow, actor: editor });
        },
        getWorkflow: context.container.resolve(GetWorkflowUseCase)
    };
};

describe("StoreWorkflowUseCase: step types through the registry (R131, R132)", () => {
    it("refuses an ai step while no ai type is registered", async () => {
        const { store, getWorkflow } = await setup();

        const result = await store(
            createWorkflowValues({ steps: [customStep("ai", "AI check")] })
        );

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            'Step "AI check" uses the step type "ai", which is not available.'
        );
        const read = await getWorkflow.execute({ id: "workflow-1" });
        expect(read.error.code).toBe("Workflows/Workflow/NotFound");
    });

    it("refuses any other unregistered step type as unknown", async () => {
        const { store } = await setup();

        const result = await store(
            createWorkflowValues({ steps: [customStep("webhook", "Notify")] })
        );

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe('Step "Notify" uses an unknown step type "webhook".');
    });

    it("validates a step through its registered type, with the workflow", async () => {
        const { store, calls } = await setup([{ type: "custom" }]);
        const workflow = createWorkflowValues({
            steps: [createReviewStep({ id: "legal", title: "Legal review" }), customStep("custom")]
        });

        const result = await store(workflow);

        expect(result.isOk()).toBe(true);
        expect(calls[0]).toHaveLength(1);
        expect(calls[0][0].step.id).toBe("step-custom");
        expect(calls[0][0].workflow.models).toEqual(workflow.models);
        expect(result.value?.steps[1].type).toBe("custom");
    });

    it("returns the registered type's validation error and stores nothing", async () => {
        const { store, getWorkflow } = await setup([
            {
                type: "custom",
                validate: ({ step }) => {
                    return Result.fail(new WorkflowValidationError(`Step "${step.title}" is odd.`));
                }
            }
        ]);

        const result = await store(
            createWorkflowValues({ steps: [customStep("custom", "Odd step")] })
        );

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe('Step "Odd step" is odd.');
        const read = await getWorkflow.execute({ id: "workflow-1" });
        expect(read.error.code).toBe("Workflows/Workflow/NotFound");
    });

    it("lets a registered ai type replace the not-available refusal", async () => {
        const { store } = await setup([{ type: "ai" }]);

        const result = await store(
            createWorkflowValues({ steps: [customStep("ai", "AI check")] })
        );

        expect(result.isOk()).toBe(true);
    });
});
```

Replace the whole of `packages/api-workflows/__tests__/domain/WorkflowValidator.test.ts` (the review config tests moved to `ReviewStepType.test.ts`; the validator now takes the step validator as its second argument):

```ts
import { describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import { WorkflowValidationError } from "~/domain/workflow/errors.js";
import {
    WorkflowValidator,
    type WorkflowStepValidator
} from "~/domain/workflow/WorkflowValidator.js";
import type { WorkflowStep, WorkflowValues } from "~/domain/workflow/types.js";
import { createReviewStep, createWorkflowValues } from "~tests/__helpers/fixtures.js";

/** Accepts every step as it is; the step type checks are tested with the step types. */
const acceptStep: WorkflowStepValidator = step => {
    return Result.ok(step);
};

const validationMessage = (
    values: WorkflowValues,
    validateStep: WorkflowStepValidator = acceptStep
): string => {
    const result = WorkflowValidator.validate(values, validateStep);
    if (result.isOk()) {
        throw new Error("Expected the workflow to be invalid.");
    }
    expect(result.error.code).toBe("Workflows/Workflow/Validation");
    return result.error.message;
};

describe("WorkflowValidator", () => {
    it("accepts a workflow whose steps the step validator accepts", () => {
        const values = createWorkflowValues();

        const result = WorkflowValidator.validate(values, acceptStep);

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual(values);
    });

    it("requires a name", () => {
        expect(validationMessage(createWorkflowValues({ name: "  " }))).toBe(
            "Workflow name is required."
        );
    });

    it("requires exactly one model", () => {
        const expected = "A workflow must be bound to exactly one model.";
        expect(validationMessage(createWorkflowValues({ models: [] }))).toBe(expected);
        expect(validationMessage(createWorkflowValues({ models: ["cms.a", "cms.b"] }))).toBe(
            expected
        );
    });

    it("accepts only cms.<modelId> and wb.page namespace ids", () => {
        expect(validationMessage(createWorkflowValues({ models: ["foo"] }))).toBe(
            'Model "foo" is not a valid model ID. Use "cms.<modelId>" or "wb.page".'
        );
        expect(validationMessage(createWorkflowValues({ models: ["cms."] }))).toBe(
            'Model "cms." is not a valid model ID. Use "cms.<modelId>" or "wb.page".'
        );
        expect(validationMessage(createWorkflowValues({ models: ["wb.block"] }))).toBe(
            'Model "wb.block" is not a valid model ID. Use "cms.<modelId>" or "wb.page".'
        );
        expect(
            WorkflowValidator.validate(
                createWorkflowValues({ models: ["wb.page"] }),
                acceptStep
            ).isOk()
        ).toBe(true);
    });

    it("requires at least one step", () => {
        expect(validationMessage(createWorkflowValues({ steps: [] }))).toBe(
            "Add at least one step."
        );
    });

    it("requires a step id and a title", () => {
        const withoutId = [{ ...createReviewStep({ id: "legal", title: "Legal" }), id: "" }];
        const withoutTitle = [createReviewStep({ id: "legal", title: " " })];

        expect(validationMessage(createWorkflowValues({ steps: withoutId }))).toBe(
            "Every step needs an ID."
        );
        expect(validationMessage(createWorkflowValues({ steps: withoutTitle }))).toBe(
            'Step "legal" needs a title.'
        );
    });

    it("requires unique step ids", () => {
        const steps = [
            createReviewStep({ id: "legal", title: "Legal review" }),
            createReviewStep({ id: "legal", title: "Second legal review" })
        ];

        expect(validationMessage(createWorkflowValues({ steps }))).toBe(
            'Step ID "legal" is used more than once.'
        );
    });

    it("calls the step validator once per step, in order, after the structural checks", () => {
        const seen: string[] = [];
        const validateStep: WorkflowStepValidator = step => {
            seen.push(step.id);
            return Result.ok(step);
        };
        const steps = [
            createReviewStep({ id: "legal", title: "Legal review" }),
            createReviewStep({ id: "editorial", title: "Editorial review" })
        ];

        WorkflowValidator.validate(createWorkflowValues({ steps }), validateStep);
        expect(seen).toEqual(["legal", "editorial"]);

        seen.length = 0;
        const duplicate = [steps[0], { ...steps[1], id: "legal" }];
        validationMessage(createWorkflowValues({ steps: duplicate }), validateStep);
        expect(seen).toEqual(["legal"]);
    });

    it("returns the step validator's error", () => {
        const validateStep: WorkflowStepValidator = step => {
            return Result.fail(new WorkflowValidationError(`Step "${step.title}" is not valid.`));
        };

        expect(validationMessage(createWorkflowValues(), validateStep)).toBe(
            'Step "Legal review" is not valid.'
        );
    });

    it("normalises the returned step: color, trimmed description, notifications, config", () => {
        const validateStep: WorkflowStepValidator = step => {
            return Result.ok({ ...step, config: { normalised: true } });
        };
        const [first, second] = [
            {
                ...createReviewStep({ id: "legal", title: "Legal review" }),
                description: "  Check the legal side  ",
                notifications: undefined as unknown as WorkflowStep["notifications"]
            },
            {
                ...createReviewStep({ id: "editorial", title: "Editorial review" }),
                description: "   ",
                color: undefined as unknown as string
            }
        ];

        const result = WorkflowValidator.validate(
            createWorkflowValues({ steps: [first, second] }),
            validateStep
        );

        expect(result.value?.steps[0].description).toBe("Check the legal side");
        expect(result.value?.steps[0].notifications).toEqual([]);
        expect(result.value?.steps[0].config).toEqual({ normalised: true });
        expect(result.value?.steps[1]).not.toHaveProperty("description");
        expect(result.value?.steps[1].color).toBe("");
    });
});
```

Add to the registration test (`packages/api-workflows/__tests__/registration.test.ts`): import

```ts
import { StepType } from "~/features/stepTypes/StepType/index.js";
import { StepTypeRegistryService } from "~/features/stepTypes/StepTypeRegistryService/index.js";
```

and, after the `ReviewStepReacher` line in the "registers every workflows abstraction once" test:

```ts
        expect(container.resolveAll(StepTypeRegistryService)).toHaveLength(1);
        // `review` (the `automation` type is added in Task 2, the `ai` type by phase 6).
        expect(container.resolveAll(StepType)).toHaveLength(1);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/stepTypes packages/api-workflows/__tests__/workflow/StoreWorkflowStepTypes.test.ts packages/api-workflows/__tests__/domain/WorkflowValidator.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL. The step type tests and `StoreWorkflowStepTypes` fail to import (`StepType`, `StepTypeRegistryService` do not exist), `WorkflowValidator.test.ts` fails on the missing `WorkflowStepValidator` export and the second argument. Record the RED output.

- [ ] **Step 3: Constants and the `StepType` abstraction**

Create `packages/api-workflows/src/domain/workflow/stepTypes.ts`:

```ts
/** The built-in step type ids (R131). `ai` is registered by phase 6 and has no constant here. */
export const REVIEW_STEP_TYPE = "review";
export const AUTOMATION_STEP_TYPE = "automation";
```

Create `packages/api-workflows/src/features/stepTypes/StepType/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ZodType } from "zod";
import type { Review } from "~/domain/review/Review.js";
import type { Actor, ReviewStep } from "~/domain/review/types.js";
import type { ReviewInvalidStateError, ReviewStepNotCurrentError } from "~/domain/review/errors.js";
import type { WorkflowValidationError } from "~/domain/workflow/errors.js";
import type { WorkflowStep, WorkflowValues } from "~/domain/workflow/types.js";

export interface StepTypeAvailability {
    available: boolean;
    /** Why the type cannot be added now; `null` when available. */
    unavailableReason: string | null;
}

export interface StepTypeValidateParams {
    /** The step as the editor saved it; its `id` and `title` are already checked. */
    step: WorkflowStep;
    /** The workflow being saved (its models are already checked). */
    workflow: WorkflowValues;
}

export interface StepTypeReachParams {
    review: Review;
    /** The pending step being reached. */
    step: ReviewStep;
    /** Who caused the step to be reached. */
    actor: Actor;
    now: string;
}

export interface IStepType {
    /** Stored on `WorkflowStep.type`, e.g. "review". */
    readonly type: string;
    readonly title: string;
    /** Validates the step's `config`; `null` when the type has no editable config. */
    readonly configSchema: ZodType | null;
    describeAvailability(): Promise<StepTypeAvailability>;
    /**
     * Save-time validation of one step. Pure of I/O: a type that needs a registry gets it
     * injected. Returns the step with its normalised `config`.
     */
    validate(params: StepTypeValidateParams): Result<WorkflowStep, WorkflowValidationError>;
    /**
     * Puts the pending step of the review into its next state (spec 5.2). Returns the review's
     * transition errors as they are (R159); never swallows one.
     */
    reach(
        params: StepTypeReachParams
    ): Promise<Result<void, ReviewInvalidStateError | ReviewStepNotCurrentError>>;
}

/**
 * A kind of workflow step (spec 4.1, 7.1, R131). Multi-registered: the engine registers `review`
 * and `automation`; phase 6 registers `ai`. `StepTypeRegistryService` returns the last
 * registration per `type`. The save-time validation, `listStepTypes` and (from Task 10) the step
 * reach go through it.
 */
export const StepType = createAbstraction<IStepType>("StepType");

export namespace StepType {
    export type Interface = IStepType;
    export type Availability = StepTypeAvailability;
    export type ValidateParams = StepTypeValidateParams;
    export type ReachParams = StepTypeReachParams;
}
```

Create `packages/api-workflows/src/features/stepTypes/StepType/index.ts`:

```ts
export { StepType } from "./abstractions.js";
```

- [ ] **Step 4: The registry service**

Create `packages/api-workflows/src/features/stepTypes/StepTypeRegistryService/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { StepType } from "~/features/stepTypes/StepType/abstractions.js";

export interface IStepTypeRegistryService {
    /** The step type for `type`; `null` when none is registered. */
    get(type: string): StepType.Interface | null;
    /** Registration order; the last registration per `type` wins and keeps the first one's place. */
    list(): StepType.Interface[];
}

/** The registered step types (R131). */
export const StepTypeRegistryService =
    createAbstraction<IStepTypeRegistryService>("StepTypeRegistryService");

export namespace StepTypeRegistryService {
    export type Interface = IStepTypeRegistryService;
}
```

Create `packages/api-workflows/src/features/stepTypes/StepTypeRegistryService/StepTypeRegistryService.ts`:

```ts
import { StepType } from "~/features/stepTypes/StepType/abstractions.js";
import { StepTypeRegistryService as Abstraction } from "./abstractions.js";

class StepTypeRegistryServiceImpl implements Abstraction.Interface {
    private readonly stepTypes = new Map<string, StepType.Interface>();

    public constructor(stepTypes: StepType.Interface[]) {
        for (const stepType of stepTypes) {
            this.stepTypes.set(stepType.type, stepType);
        }
    }

    public get(type: string): StepType.Interface | null {
        return this.stepTypes.get(type) ?? null;
    }

    public list(): StepType.Interface[] {
        return [...this.stepTypes.values()];
    }
}

export const StepTypeRegistryService = Abstraction.createImplementation({
    implementation: StepTypeRegistryServiceImpl,
    dependencies: [[StepType, { multiple: true }]]
});
```

Create `packages/api-workflows/src/features/stepTypes/StepTypeRegistryService/index.ts`:

```ts
export { StepTypeRegistryService } from "./abstractions.js";
```

- [ ] **Step 5: The `review` step type**

Create `packages/api-workflows/src/features/stepTypes/ReviewStepType/ReviewStepType.ts`. `validate` is `WorkflowValidator.validateReviewConfig` moved unchanged (same checks, same order, same messages); it returns the step with the parsed config so the validator can normalise it:

```ts
import { Result } from "@webiny/feature/api";
import { WorkflowValidationError } from "~/domain/workflow/errors.js";
import { findReviewStepConfigProblem } from "~/domain/workflow/findReviewStepConfigProblem.js";
import { reviewStepConfigSchema } from "~/domain/workflow/reviewStepConfigSchema.js";
import { REVIEW_STEP_TYPE } from "~/domain/workflow/stepTypes.js";
import { StepAssignmentResolver } from "~/features/review/StepAssignmentResolver/abstractions.js";
import { StepType } from "~/features/stepTypes/StepType/abstractions.js";

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

const fail = (message: string) => {
    return Result.fail(new WorkflowValidationError(message));
};

/**
 * The built-in review step (spec 4.1, R131): a person reviews, the step is routed to a team
 * (spec 6). Reaching a step resolves its assignment (`StepAssignmentResolver`) and applies it.
 */
class ReviewStepTypeImpl implements StepType.Interface {
    public readonly type = REVIEW_STEP_TYPE;
    public readonly title = "Review";
    public readonly configSchema = reviewStepConfigSchema;

    public constructor(private resolver: StepAssignmentResolver.Interface) {}

    public async describeAvailability(): Promise<StepType.Availability> {
        return { available: true, unavailableReason: null };
    }

    public validate({ step }: StepType.ValidateParams) {
        const config: UnknownRecord = isRecord(step.config) ? step.config : {};
        const assignment: UnknownRecord = isRecord(config.assignment) ? config.assignment : {};
        const rules = Array.isArray(assignment.rules) ? assignment.rules : [];
        for (const rule of rules) {
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

        // At least one team, and team targets among the step's teams (spec 4.1, 6). User targets
        // need a user lookup, so `StoreWorkflowUseCase` checks them after this validation (R122).
        const problem = findReviewStepConfigProblem(parsed.data);
        if (problem?.type === "noTeams") {
            return fail(`Step "${step.title}" needs at least one team.`);
        }
        if (problem?.type === "teamTargetOutsideTeams") {
            return fail(
                `Routing rule "${problem.ruleId}" in step "${step.title}" targets a team that is not one of the step's teams.`
            );
        }

        return Result.ok({ ...step, config: parsed.data });
    }

    public async reach({ review, step, actor, now }: StepType.ReachParams) {
        const resolution = await this.resolver.resolve({
            review: review.toData(),
            step,
            now: new Date(now)
        });
        return review.reach({ resolution, actor, now });
    }
}

export const ReviewStepType = StepType.createImplementation({
    implementation: ReviewStepTypeImpl,
    dependencies: [StepAssignmentResolver]
});
```

Create `packages/api-workflows/src/features/stepTypes/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { StepTypeRegistryService } from "./StepTypeRegistryService/StepTypeRegistryService.js";
import { ReviewStepType } from "./ReviewStepType/ReviewStepType.js";

/** The step type registry and the built-in step types (R131). */
export const StepTypesFeature = createFeature({
    name: "Workflows/StepTypes",
    register(container) {
        container.register(StepTypeRegistryService);
        container.register(ReviewStepType);
    }
});
```

In `packages/api-workflows/src/WorkflowsFeature.ts` add the import

```ts
import { StepTypesFeature } from "~/features/stepTypes/feature.js";
```

and register it before the workflows (the validator needs it), directly after the `container.register(WorkflowSettingsModel);` block's notifications lines, i.e. immediately before `// Workflows`:

```ts
        // Step types (R131): the registry and the built-in review type
        StepTypesFeature.register(container);

        // Workflows
```

- [ ] **Step 6: Swap the validator**

Replace the top of `packages/api-workflows/src/domain/workflow/WorkflowValidator.ts` (imports, the removed `REVIEW_STEP_TYPE`, helpers) and the class so it reads:

```ts
import { Result } from "@webiny/feature/api";
import { WorkflowValidationError } from "./errors.js";
import type { WorkflowStep, WorkflowValues } from "./types.js";

/**
 * Valid namespace ids in v1: `cms.<modelId>` and `wb.page` (spec 3). Whether a `cms.*` model exists
 * and is publishable is checked by the CMS workflows package on `WorkflowBeforeCreate|Update`.
 */
export const MODEL_NAMESPACE_PATTERN = /^(cms\.[A-Za-z0-9_-]+|wb\.page)$/;

/**
 * Validates one step's type and config: the step type registry's `validate` (R131). Returns the
 * step with its normalised `config`.
 */
export type WorkflowStepValidator = (
    step: WorkflowStep
) => Result<WorkflowStep, WorkflowValidationError>;

const fail = (message: string) => {
    return Result.fail(new WorkflowValidationError(message));
};

/**
 * Validates a workflow on create and update (one path, spec 4.1, D41, D108). It checks the
 * structure (id, name, one model, steps, step ids and titles) and normalises each step; the step
 * type and its config are checked by `validateStep`, which `StoreWorkflowUseCase` builds from the
 * step type registry. Checks that need storage (model already bound to another workflow) live in
 * `StoreWorkflowUseCase`; the "model is publishable" check is a `WorkflowBeforeCreate` /
 * `WorkflowBeforeUpdate` handler in the CMS workflows package.
 */
export class WorkflowValidator {
    public static validate(
        values: WorkflowValues,
        validateStep: WorkflowStepValidator
    ): Result<WorkflowValues, WorkflowValidationError> {
        if (!values.id) {
            return fail("Workflow ID is required.");
        }
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

        const stepIds = new Set<string>();
        const steps: WorkflowStep[] = [];
        for (const step of values.steps) {
            const result = WorkflowValidator.validateStep(step, stepIds, validateStep);
            if (result.isFail()) {
                return Result.fail(result.error);
            }
            steps.push(result.value);
        }

        return Result.ok({
            id: values.id,
            name: values.name.trim(),
            models: [...values.models],
            steps
        });
    }

    private static validateStep(
        step: WorkflowStep,
        stepIds: Set<string>,
        validateStep: WorkflowStepValidator
    ): Result<WorkflowStep, WorkflowValidationError> {
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

        const validated = validateStep(step);
        if (validated.isFail()) {
            return Result.fail(validated.error);
        }

        // Normalise to what the mapper returns on read, so stored values equal returned values.
        const { description, ...rest } = validated.value;
        const trimmedDescription = description?.trim();
        return Result.ok({
            ...rest,
            color: validated.value.color ?? "",
            ...(trimmedDescription ? { description: trimmedDescription } : {}),
            notifications: validated.value.notifications ?? []
        });
    }
}
```

(The private `validateStep` wraps no dependency: it receives the validator as a plain function parameter, and everything else in it is pure.)

In `packages/api-workflows/src/features/workflow/StoreWorkflow/StoreWorkflowUseCase.ts`:

1. Replace the two imports

```ts
import { REVIEW_STEP_TYPE, WorkflowValidator } from "~/domain/workflow/WorkflowValidator.js";
```

with

```ts
import { WorkflowValidator } from "~/domain/workflow/WorkflowValidator.js";
import { REVIEW_STEP_TYPE } from "~/domain/workflow/stepTypes.js";
import { StepTypeRegistryService } from "~/features/stepTypes/StepTypeRegistryService/index.js";
```

2. Replace the constructor with:

```ts
    constructor(
        private repository: WorkflowRepository.Interface,
        private eventPublisher: EventPublisher.Interface,
        private identityContext: IdentityContext.Interface,
        private listUsers: ListUsersUseCase.Interface,
        private stepTypes: StepTypeRegistryService.Interface
    ) {}
```

3. Replace

```ts
        const validation = WorkflowValidator.validate(input.workflow);
```

with

```ts
        // Each step is validated by its registered step type (R131). While no `ai` type is
        // registered (phase 6 registers it) an `ai` step gets its own message (R132).
        const validation = WorkflowValidator.validate(input.workflow, step => {
            const stepType = this.stepTypes.get(step.type);
            if (!stepType) {
                return Result.fail(
                    new WorkflowValidationError(
                        step.type === "ai"
                            ? `Step "${step.title}" uses the step type "ai", which is not available.`
                            : `Step "${step.title}" uses an unknown step type "${step.type}".`
                    )
                );
            }
            return stepType.validate({ step, workflow: input.workflow });
        });
```

4. Replace the registration at the bottom with:

```ts
export const StoreWorkflowUseCase = UseCase.createImplementation({
    implementation: StoreWorkflowUseCaseImpl,
    dependencies: [
        WorkflowRepository,
        EventPublisher,
        IdentityContext,
        ListUsersUseCase,
        StepTypeRegistryService
    ]
});
```

- [ ] **Step 7: Move the other importers of `REVIEW_STEP_TYPE`**

Import path only, no other change:

- `packages/api-workflows/src/features/config/ListWorkflowStepTypes/ListWorkflowStepTypesUseCase.ts`: `import { REVIEW_STEP_TYPE } from "~/domain/workflow/WorkflowValidator.js";` becomes `... from "~/domain/workflow/stepTypes.js";`.
- `packages/api-workflows/src/features/routing/ListStepCandidates/ListStepCandidatesUseCase.ts`: same replacement.
- `packages/api-workflows/src/domain/workflow/canPickReviewer.ts`: `import { REVIEW_STEP_TYPE } from "./WorkflowValidator.js";` becomes `import { REVIEW_STEP_TYPE } from "./stepTypes.js";`.

Update the stale comments:

- `packages/api-workflows/src/domain/workflow/types.ts`: replace `/** Step type id. Phase 1a accepts only "review" (R7). */` with `/** Step type id; a registered `StepType` (R131), e.g. "review" or "automation". */`.
- `packages/api-workflows/src/domain/workflow/reviewStepConfigSchema.ts`: replace the JSDoc of `reviewStepConfigSchema` with:

```ts
/**
 * Config of a "review" step (spec 4.1): the `configSchema` of the built-in `ReviewStepType`
 * (R131). Stored as JSON on the workflow and review models.
 */
```

- [ ] **Step 8: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/stepTypes packages/api-workflows/__tests__/workflow/StoreWorkflowStepTypes.test.ts packages/api-workflows/__tests__/domain/WorkflowValidator.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

If "returns the last registration per type and keeps its place" fails on order, `resolveAll` does not return registration order: stop and report, do not change the test to match.

Run the validator swap's neighbours, by path, on both storages, one `test:os` run at a time:

```
packages/api-workflows/__tests__/workflow/StoreWorkflowRuleTargets.test.ts
packages/api-workflows/__tests__/workflow/WorkflowUseCases.test.ts
packages/api-workflows/__tests__/workflow/WorkflowEventActor.test.ts
packages/api-workflows/__tests__/workflow/WorkflowPersistenceError.test.ts
packages/api-workflows/__tests__/domain/canPickReviewer.test.ts
packages/api-workflows/__tests__/config/ListWorkflowStepTypes.test.ts
packages/api-workflows/__tests__/routing/ListStepCandidates.test.ts
packages/api-workflows/__tests__/review/RequestReview.test.ts
packages/api-headless-cms-workflows/__tests__/wrappers/workflowWrappers.test.ts
packages/api-website-builder-workflows/__tests__/wrappers/workflowWrappers.test.ts
```

Run: `yarn test <those paths> 2>&1 | tail -50`, then `yarn test:os <those paths> 2>&1 | tail -50` (the same list, `test:os` one run at a time).
Expected: PASS. `ListWorkflowStepTypes.test.ts` is unchanged by this task (Task 3 updates it). A failure with the old text `which is not supported yet` in a test outside the files above means that test stores a non-review step: change its expectation to the R132 message.

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|headless-cms-workflows|website-builder-workflows|background-tasks" | head`
Expected: no output.

- [ ] **Step 9: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
feat(api-workflows): add the StepType abstraction and registry and validate workflow steps through it

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
