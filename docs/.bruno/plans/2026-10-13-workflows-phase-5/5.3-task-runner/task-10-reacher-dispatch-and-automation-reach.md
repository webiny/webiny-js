### Task 10: Reacher dispatch by step type and `AutomationStepType.reach` (inline requester trigger)

Spec 5.2, 7.4; D6, D7, D35, D37, D57, D87, D133 point 4b; R131, R143, R146, R149, R159; A52, A53; Review Focus 3, 4, 5. Step-reached stops being review-only:

- `ReviewStepReacher` keeps its abstraction and its no-op rule (a current step that is not `pending` is left alone). Its implementation now resolves `StepTypeRegistryService.get(step.type)` and calls `stepType.reach({ review, step, actor, now })` (Task 1: the `review` type runs the existing resolver path unchanged). A step whose type is not registered (a workflow saved before its type was removed, A53) is failed with `review.fail` and the reason `The step type "<type>" is not available.`; the reacher returns ok and records no `stepReached` fact. The reacher no longer depends on `StepAssignmentResolver` (the review step type does). No error is swallowed (R159, P2): the reacher's error union is `ReviewInvalidStateError | ReviewStepNotCurrentError` (the same union `StepType.reach` returns), whatever `review.fail` or `review.reachRun` returns is returned, and `RequestReviewUseCase`, the one caller whose error union lacked `ReviewStepNotCurrentError`, gains it (`ApproveReviewStepUseCase` and the restart use case already have it).
- `AutomationStepType.reach` (Task 2 left a placeholder) injects `AutomationDefinitionRegistryService`, `TaskService`, `IdentityContext`, `ReviewTaskAbortService` and `Logger`. It checks, in order, and stops at the first problem with the R146 reason:
  1. config parse (`automationStepConfigSchema.safeParse(step.config)`): a config that no longer parses fails with its own fixed reason `The automation step configuration is not valid.` (R146, P3), never the missing-definition text;
  2. definition lookup: `The automation "<automationId>" is not available.`;
  3. `matchesAutomationScope(definition.models, review.workflow.models)`: `The automation "<automationId>" is not available for this workflow's models.`;
  4. `parseAutomationSettings(definition, config.settings)`: `The automation settings are not valid: <path>: <message>.`;
  5. the trigger (R149): `new AuthenticatedIdentity({ id, displayName, type: identityType ?? "admin", context: { canAccessTenant: true } })` from `review.createdBy` (the requester, never the actor who caused the reach: an approver of the previous step, a restarter, or the task itself), and `TaskService.trigger({ definition: STEP_RUN_TASK_DEFINITION_ID, name: "Workflow step: <step title>", input: { reviewId, stepId } })` inside `IdentityContext.withIdentity` only, so the task's `createdBy` is the requester (R148) and the identity is restored afterwards. The Result pattern and a `try`/`catch` are inline here, the only trigger call site, so there is no wrapper service. A failed or thrown trigger gives the fixed reason `The automation could not be started.` (R146): the raw error message never reaches the step; the full error is logged with `Logger.error` (injected as a fifth dependency).
- On success `review.reachRun({ actor, owner: getAutomationActor(review.createdBy), taskId, now })` stores the task id on the step in the one save. If `reachRun` itself fails after a successful trigger, the task is aborted through `ReviewTaskAbortService` (message `The review could not be saved.`) and the error is returned.
- On any failure before a task exists, `reachRun` with `taskId: null` records the reach, then `review.fail({ stepId, reason, now })` fails the step with the reason. The reach returns ok: a failed step is a normal state of a review, restartable later (D8). The use cases then save the review as usual. No task is started and nothing is aborted.
- The reach is the same code on request, on a later step reached by approve, inside a task and on restart (Task 15): always as the requester (A52, R149).

`registerTestAutomation(container, overrides?)` and `TestAutomationDefinition` (Task 2, R157) are the test automation; `FakeTaskService` (Task 9) records the trigger and the identity in force.

**Files:**
- Modify: `packages/api-workflows/src/features/review/ReviewStepReacher/ReviewStepReacher.ts`
- Modify: `packages/api-workflows/src/features/review/ReviewStepReacher/abstractions.ts`
- Modify: `packages/api-workflows/src/features/review/RequestReview/abstractions.ts`
- Modify: `packages/api-workflows/src/features/stepTypes/AutomationStepType/AutomationStepType.ts`
- Create: `packages/api-workflows/__tests__/stepTypes/AutomationReach.test.ts`
- Create: `packages/api-workflows/__tests__/review/ReviewStepReacher.test.ts`
- Modify (only if a test fails on the new dispatch, see Step 6): the existing test files named there

**Interfaces:**
- Consumes:
  - Task 1: `StepType` (`reach(params: StepTypeReachParams): Promise<Result<void, ReviewInvalidStateError | ReviewStepNotCurrentError>>`, `StepType.ReachParams { review: Review; step: ReviewStep; actor: Actor; now: string }`), `StepTypeRegistryService` (`get(type): StepType.Interface | null`) (`~/features/stepTypes/StepTypeRegistryService/index.js`), `ReviewStepType` (the resolver path).
  - Task 2: `AutomationDefinitionRegistryService` (`~/features/automation/AutomationDefinitionRegistryService/index.js`, `get(id): AutomationDefinition.Interface | null`), `matchesAutomationScope(automationModels, workflowModels): boolean` (`~/domain/automation/matchesAutomationScope.js`), `automationStepConfigSchema` (`~/domain/automation/automationStepConfigSchema.js`), `parseAutomationSettings(definition, settings): Result<unknown, string>` (`~/domain/automation/parseAutomationSettings.js`, fail message `"<path>: <message>"`), `registerTestAutomation(container, overrides?)` (`~tests/__helpers/TestAutomationDefinition.js`; id `test-automation`, models `["*"]`, `settingsSchema` `z.object({ mode: z.enum(["approve", "reject", "wait", "throw"]).default("approve"), comment: z.string().optional() })`).
  - Task 5: `Review.reachRun({ actor, owner, taskId, now })`, `Review.fail({ stepId, reason, now })` (`Result<void, ReviewFailError>`, `ReviewFailError = ReviewInvalidStateError | ReviewStepNotCurrentError`), `getAutomationActor(requester: Actor): Actor` (`~/domain/automation/getAutomationActor.js`), `AUTOMATION_STEP_ID`, `createRunningAutomationReview` (`~tests/__helpers/stepRunReviews.js`, reused, never redefined here, P1).
  - Task 9: constants `STEP_RUN_TASK_DEFINITION_ID` (`~/features/stepRun/constants.js`) and `StepRunTaskInput` (`~/features/stepRun/types.js`), `ReviewTaskAbortService`; `FakeTaskService` helpers `triggeredTasks`, `abortedTasks`, `fakeTaskFaults`, `resetFakeTasks` (`~tests/__helpers/FakeTaskService.js`).
  - Existing: `AuthenticatedIdentity`, `IdentityContext` (`@webiny/api-core/features/security/IdentityContext/index.js`; `withIdentity<T>(identity, cb)`, `getIdentity()`), `TaskService`.
- Produces (matches the contract):
  - `ReviewStepReacher`: abstraction unchanged except the error union, now `ReviewStepReacherError = ReviewInvalidStateError | ReviewStepNotCurrentError` (exported type and `ReviewStepReacher.Error`); implementation dispatches through `StepTypeRegistryService` and fails an unregistered type's step with `The step type "<type>" is not available.`. Dependencies `[StepTypeRegistryService]`.
  - `IRequestReviewUseCaseErrors` gains `stepNotCurrent: ReviewStepNotCurrentError` (so `RequestReviewUseCase.Error` and the app wrappers that reuse it carry the reacher's whole union).
  - `AutomationStepType.reach`: an automation step reaches `inReview` with a `taskId`, or `failed` with an R146 reason (Tasks 12, 15). Dependencies `[AutomationDefinitionRegistryService, TaskService, IdentityContext, ReviewTaskAbortService, Logger]`.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/stepTypes/AutomationReach.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { registerTestAutomation } from "~tests/__helpers/TestAutomationDefinition.js";
import {
    abortedTasks,
    fakeTaskFaults,
    resetFakeTasks,
    triggeredTasks
} from "~tests/__helpers/FakeTaskService.js";
import { AUTOMATION_STEP_ID, createRunningAutomationReview } from "~tests/__helpers/stepRunReviews.js";
import {
    ARTICLE_MODEL,
    createReviewStep,
    createWorkflow,
    expectOk,
    NOW,
    otherReviewer,
    requester,
    targetContext
} from "~tests/__helpers/fixtures.js";
import type { Actor } from "~/domain/review/types.js";
import { Review } from "~/domain/review/Review.js";
import { getAutomationActor } from "~/domain/automation/getAutomationActor.js";
import { ReviewStepReacher } from "~/features/review/ReviewStepReacher/abstractions.js";
import { StepTypeRegistryService } from "~/features/stepTypes/StepTypeRegistryService/index.js";

interface CreateReviewOptions {
    config?: unknown;
    requester?: Actor;
}

/** The automation step "Check links" followed by the review step "Editorial review". */
const createReview = (options: CreateReviewOptions = {}): Review => {
    const workflow = createWorkflow({
        steps: [
            {
                ...createReviewStep({ id: AUTOMATION_STEP_ID, title: "Check links" }),
                type: "automation",
                config: options.config ?? { automationId: "test-automation", settings: {} }
            },
            createReviewStep({ id: "editorial", title: "Editorial review" })
        ]
    });
    return expectOk(
        Review.request({
            id: "review-1",
            workflow,
            model: ARTICLE_MODEL,
            targetId: "article-1",
            targetRevisionId: "article-1#0001",
            title: "Article 1",
            targetContext,
            picks: [],
            requester: options.requester ?? requester,
            now: NOW
        })
    );
};

const createContext = async (overrides: Parameters<typeof registerTestAutomation>[1] = {}) => {
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            registerTestAutomation(container, overrides);
        }
    });
    return context;
};

const AUTOMATION_ACTOR = getAutomationActor(requester);

describe("AutomationStepType.reach (R146, R149)", () => {
    beforeEach(() => {
        resetFakeTasks();
        loggedErrors.length = 0;
    });

    it("triggers as the requester, not as the actor who caused the reach", async () => {
        const context = await createContext();
        const identityContext = context.container.resolve(IdentityContext);
        const identityBefore = identityContext.getIdentity().id;
        const review = createReview();

        const result = await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: otherReviewer, now: NOW });

        expect(result.isOk()).toBe(true);
        expect(triggeredTasks).toEqual([
            {
                id: "task-1",
                definition: "workflowsStepRun",
                name: "Workflow step: Check links",
                input: { reviewId: "review-1", stepId: AUTOMATION_STEP_ID },
                identityId: requester.id,
                identityType: "admin"
            }
        ]);
        expect(triggeredTasks[0].identityId).not.toBe(otherReviewer.id);
        expect(identityContext.getIdentity().id).toBe(identityBefore);
        expect(identityBefore).not.toBe(requester.id);
    });

    it("triggers as an admin identity when the requester has no identity type", async () => {
        const context = await createContext();
        const review = createReview({
            requester: { type: "user", id: "user-plain", displayName: "Plain Requester" }
        });

        await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        expect(triggeredTasks).toHaveLength(1);
        expect(triggeredTasks[0]).toMatchObject({ identityId: "user-plain", identityType: "admin" });
    });

    it("reaches the step in review with the task id, owned by the automation actor", async () => {
        const context = await createContext();
        const review = createReview();

        await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        expect(review.toData().steps[0]).toMatchObject({
            id: AUTOMATION_STEP_ID,
            state: "inReview",
            owner: AUTOMATION_ACTOR,
            taskId: "task-1",
            assignment: null,
            assignmentSource: null,
            candidateTeamIds: [],
            reachedOn: NOW,
            startedOn: NOW
        });
        const reached = review.pullFacts().filter(fact => fact.type === "stepReached");
        expect(reached).toHaveLength(1);
        expect(reached[0]).toMatchObject({ taskId: "task-1", assignment: null, records: [] });
        expect(abortedTasks).toEqual([]);
    });

    it("fails the step when the automation is missing", async () => {
        const context = await createContext();
        const review = createReview({
            config: { automationId: "removed-automation", settings: {} }
        });

        const result = await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        expect(result.isOk()).toBe(true);
        expect(triggeredTasks).toEqual([]);
        expect(review.toData().steps[0]).toMatchObject({
            state: "failed",
            comment: 'The automation "removed-automation" is not available.',
            taskId: null,
            owner: AUTOMATION_ACTOR,
            finishedOn: NOW
        });
        expect(review.pullFacts().map(fact => fact.type)).toEqual([
            "requested",
            "stepReached",
            "stepFailed"
        ]);
    });

    it("fails the step with its own reason when the step config no longer parses (P3)", async () => {
        const context = await createContext();
        const review = createReview({ config: { settings: {} } });

        const result = await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        expect(result.isOk()).toBe(true);
        expect(triggeredTasks).toEqual([]);
        expect(review.toData().steps[0]).toMatchObject({
            state: "failed",
            comment: "The automation step configuration is not valid.",
            taskId: null
        });
    });

    it("fails the step when the automation does not cover the workflow's models", async () => {
        const context = await createContext({ models: ["cms.page"] });
        const review = createReview();

        await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        expect(triggeredTasks).toEqual([]);
        expect(review.toData().steps[0]).toMatchObject({
            state: "failed",
            comment: 'The automation "test-automation" is not available for this workflow\'s models.'
        });
    });

    it("fails the step when its settings are invalid", async () => {
        const context = await createContext();
        const review = createReview({
            config: { automationId: "test-automation", settings: { mode: "explode" } }
        });

        const result = await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        expect(result.isOk()).toBe(true);
        expect(triggeredTasks).toEqual([]);
        const [step] = review.toData().steps;
        expect(step.state).toBe("failed");
        expect(step.comment).toMatch(/^The automation settings are not valid: mode: .+\.$/);
        expect(step.taskId).toBeNull();
    });

    it("fails the step with a fixed reason when the trigger fails, and logs the error", async () => {
        const context = await createContext();
        fakeTaskFaults.trigger = "fail";
        fakeTaskFaults.triggerMessage = "The queue is full";
        const review = createReview();

        const result = await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "failed",
            comment: "The automation could not be started.",
            taskId: null
        });
        expect(abortedTasks).toEqual([]);
        expect(loggedErrors.map(logged => logged.message)).toEqual([
            "Could not start the automation task."
        ]);
        expect((loggedErrors[0].fields.error as Error).message).toBe("The queue is full");
    });

    it("fails the step with the same fixed reason when the trigger throws, and logs the error", async () => {
        const context = await createContext();
        fakeTaskFaults.trigger = "throw";
        const review = createReview();

        const result = await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "failed",
            comment: "The automation could not be started."
        });
        expect(loggedErrors.map(logged => logged.message)).toEqual([
            "Could not start the automation task."
        ]);
        expect((loggedErrors[0].fields.error as Error).message).toBe("The task service is down");
    });

    it("never puts a raw trigger message into the step, however long", async () => {
        const context = await createContext();
        fakeTaskFaults.trigger = "fail";
        fakeTaskFaults.triggerMessage = "x".repeat(900);
        const review = createReview();

        await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        const [step] = review.toData().steps;
        expect(step.comment).toBe("The automation could not be started.");
        expect(JSON.stringify(step)).not.toContain("xxxxx");
    });

    it("aborts the triggered task when the step cannot be reached after it", async () => {
        const context = await createContext();
        // The step is already in review, so `reachRun` refuses it after the trigger succeeded.
        const review = createRunningAutomationReview("task-0");
        const step = review.toData().steps[0];
        const automation = context.container.resolve(StepTypeRegistryService).get("automation")!;

        const result = await automation.reach({ review, step, actor: requester, now: NOW });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/InvalidState");
        expect(triggeredTasks.map(task => task.id)).toEqual(["task-1"]);
        expect(abortedTasks).toEqual([{ id: "task-1", message: "The review could not be saved." }]);
        expect(review.toData().steps[0]).toMatchObject({ state: "inReview", taskId: "task-0" });
    });
});
```

Create `packages/api-workflows/__tests__/review/ReviewStepReacher.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { resetFakeTasks, triggeredTasks } from "~tests/__helpers/FakeTaskService.js";
import {
    ARTICLE_MODEL,
    createReviewStep,
    createWorkflow,
    expectOk,
    NOW,
    requester,
    REVIEW_TEAM_ID,
    targetContext
} from "~tests/__helpers/fixtures.js";
import { Result } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import { ReviewStepNotCurrentError } from "~/domain/review/errors.js";
import { getAutomationActor } from "~/domain/automation/getAutomationActor.js";
import { ReviewStepReacher } from "~/features/review/ReviewStepReacher/abstractions.js";
import { StepType } from "~/features/stepTypes/StepType/index.js";
import { createTestStepType } from "~tests/__helpers/TestStepType.js";

/**
 * A step type whose `reach` fails with `ReviewStepNotCurrentError`. Local to this test: the shared
 * `createTestStepType` always reaches ok.
 */
class NotCurrentStepTypeImpl implements StepType.Interface {
    public readonly type = "not-current";
    public readonly title = "Not current";
    public readonly configSchema = null;

    public async describeAvailability(): Promise<StepType.Availability> {
        return { available: true, unavailableReason: null };
    }

    public validate(params: StepType.ValidateParams) {
        return Result.ok(params.step);
    }

    public async reach(params: StepType.ReachParams) {
        return Result.fail(
            new ReviewStepNotCurrentError({
                reviewId: params.review.toData().id,
                stepId: params.step.id,
                currentStepId: null
            })
        );
    }
}

const NotCurrentStepType = StepType.createImplementation({
    implementation: NotCurrentStepTypeImpl,
    dependencies: []
});

const createReview = (stepType: string): Review => {
    const workflow = createWorkflow({
        steps: [
            { ...createReviewStep({ id: "first", title: "First step" }), type: stepType },
            createReviewStep({ id: "second", title: "Second step" })
        ]
    });
    return expectOk(
        Review.request({
            id: "review-1",
            workflow,
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
};

describe("ReviewStepReacher dispatches by step type (R131)", () => {
    beforeEach(() => {
        resetFakeTasks();
    });

    it("reaches a review step through the review step type", async () => {
        const { context } = await createContextHandler();
        const review = createReview("review");

        const result = await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "awaiting",
            candidateTeamIds: [REVIEW_TEAM_ID],
            taskId: null
        });
        expect(triggeredTasks).toEqual([]);
    });

    it("leaves a step of a registered custom type to that type's reach", async () => {
        const { implementation } = createTestStepType({ type: "custom" });
        const { context } = await createContextHandler({
            setup: container => {
                container.register(implementation);
            }
        });
        const review = createReview("custom");

        const result = await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        // The test step type's `reach` returns ok and changes nothing: the step is neither failed
        // as unavailable nor assigned by the review resolver.
        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({ state: "pending", taskId: null });
        expect(review.pullFacts().map(fact => fact.type)).toEqual(["requested"]);
    });

    it("fails the step of a type that is not registered", async () => {
        const { context } = await createContextHandler();
        const review = createReview("mystery");

        const result = await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "failed",
            comment: 'The step type "mystery" is not available.',
            finishedOn: NOW,
            taskId: null
        });
        expect(review.pullFacts().map(fact => fact.type)).toEqual(["requested", "stepFailed"]);
        expect(triggeredTasks).toEqual([]);
    });

    it("fails the step as the requester when it has no owner", async () => {
        const { context } = await createContextHandler();
        const review = createReview("mystery");

        await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        const failed = review.pullFacts().find(fact => fact.type === "stepFailed");
        expect(failed).toMatchObject({ actor: requester });
        expect(getAutomationActor(requester).type).toBe("automation");
    });

    it("returns the error of a step type's reach instead of swallowing it (R159)", async () => {
        const { context } = await createContextHandler({
            setup: container => {
                container.register(NotCurrentStepType);
            }
        });
        const review = createReview("not-current");

        const result = await context.container
            .resolve(ReviewStepReacher)
            .reach({ review, actor: requester, now: NOW });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/StepNotCurrent");
    });

    it("is a no-op when the current step is not pending", async () => {
        const { context } = await createContextHandler();
        const review = createReview("review");
        const reacher = context.container.resolve(ReviewStepReacher);

        await reacher.reach({ review, actor: requester, now: NOW });
        const again = await reacher.reach({ review, actor: requester, now: NOW });

        expect(again.isOk()).toBe(true);
        expect(review.pullFacts().filter(fact => fact.type === "stepReached")).toHaveLength(1);
    });
});
```


- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/stepTypes/AutomationReach.test.ts packages/api-workflows/__tests__/review/ReviewStepReacher.test.ts 2>&1 | tail -50`
Expected: FAIL. `AutomationReach.test.ts`: every case that expects a trigger or a failed step fails (the placeholder `reach` returns ok and changes nothing, the reacher still calls the resolver for every step type, so an automation step is "reached" into the pool as a review step). `ReviewStepReacher.test.ts`: "fails the step of a type that is not registered", "leaves a step of a registered custom type to that type's reach" and "returns the error of a step type's reach" fail (the resolver is called for every type, so the step goes to `awaiting`). Record the RED output.

Run the same files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/stepTypes/AutomationReach.test.ts packages/api-workflows/__tests__/review/ReviewStepReacher.test.ts 2>&1 | tail -50`
Expected: FAIL, same reasons.

- [ ] **Step 3: Dispatch in the reacher**

Replace `packages/api-workflows/src/features/review/ReviewStepReacher/ReviewStepReacher.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { StepTypeRegistryService } from "~/features/stepTypes/StepTypeRegistryService/index.js";
import { ReviewStepReacher as Abstraction } from "./abstractions.js";

class ReviewStepReacherImpl implements Abstraction.Interface {
    constructor(private stepTypes: StepTypeRegistryService.Interface) {}

    async reach(params: Abstraction.Params): Promise<Result<void, Abstraction.Error>> {
        const step = params.review.getStepToReach();
        if (!step) {
            return Result.ok();
        }

        const stepType = this.stepTypes.get(step.type);
        if (!stepType) {
            // A workflow saved before its step type was removed keeps running from its snapshot
            // (A53), so an unregistered type fails the step instead of leaving it pending.
            const failed = params.review.fail({
                stepId: step.id,
                reason: `The step type "${step.type}" is not available.`,
                now: params.now
            });
            // Whatever `fail` returns is returned, never ignored (R159).
            if (failed.isFail()) {
                return Result.fail(failed.error);
            }
            return Result.ok();
        }

        return stepType.reach({
            review: params.review,
            step,
            actor: params.actor,
            now: params.now
        });
    }
}

export const ReviewStepReacher = Abstraction.createImplementation({
    implementation: ReviewStepReacherImpl,
    dependencies: [StepTypeRegistryService]
});
```

In `packages/api-workflows/src/features/review/ReviewStepReacher/abstractions.ts`, change the imports, the interface and the namespace and replace the doc comment above `export const ReviewStepReacher`:

```ts
import type { ReviewInvalidStateError, ReviewStepNotCurrentError } from "~/domain/review/errors.js";

/** What `StepType.reach` and `Review.fail` / `Review.reachRun` can return (R159). */
export type ReviewStepReacherError = ReviewInvalidStateError | ReviewStepNotCurrentError;

export interface IReviewStepReacher {
    reach(params: ReviewStepReacherParams): Promise<Result<void, ReviewStepReacherError>>;
}

/**
 * The one code path for "step reached" (spec 5.2, D2, D6). No-op when the current step is not
 * pending. Dispatches by step type through `StepTypeRegistryService` (R131): the `review` type
 * resolves an assignment, the `automation` type triggers its background task (R149); a step whose
 * type is not registered is failed with a reason. A failed step is not an error of the reach; an
 * error of `reach`, `reachRun` or `fail` is returned as it is (R159).
 */
```

and the namespace:

```ts
export namespace ReviewStepReacher {
    export type Interface = IReviewStepReacher;
    export type Params = ReviewStepReacherParams;
    export type Error = ReviewStepReacherError;
}
```

(remove the `ReviewInvalidStateError` import line that was there before; the one above replaces it.)

In `packages/api-workflows/src/features/review/RequestReview/abstractions.ts`, add `ReviewStepNotCurrentError` to the error type import (keep the list alphabetical, after `ReviewPersistenceError`) and the entry to the error map:

```ts
export interface IRequestReviewUseCaseErrors {
    workflowNotFound: ReviewWorkflowNotFoundError;
    alreadyActive: ReviewAlreadyActiveError;
    targetNotFound: ReviewTargetNotFoundError;
    validation: ReviewValidationError;
    invalidState: ReviewInvalidStateError;
    stepNotCurrent: ReviewStepNotCurrentError;
    persistence: ReviewPersistenceError;
    targetSync: ReviewTargetSyncError;
}
```

- [ ] **Step 4: The automation reach**

In `packages/api-workflows/src/features/stepTypes/AutomationStepType/AutomationStepType.ts` (created in Task 2 with `type`, `title`, `configSchema`, `validate` and `describeAvailability`, which stay exactly as they are), add the imports:

```ts
import { Result } from "@webiny/feature/api";
import {
    AuthenticatedIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { automationStepConfigSchema } from "~/domain/automation/automationStepConfigSchema.js";
import { getAutomationActor } from "~/domain/automation/getAutomationActor.js";
import { matchesAutomationScope } from "~/domain/automation/matchesAutomationScope.js";
import { parseAutomationSettings } from "~/domain/automation/parseAutomationSettings.js";
import { AutomationDefinitionRegistryService } from "~/features/automation/AutomationDefinitionRegistryService/index.js";
import { STEP_RUN_TASK_DEFINITION_ID } from "~/features/stepRun/constants.js";
import type { StepRunTaskInput } from "~/features/stepRun/types.js";
import { ReviewTaskAbortService } from "~/features/stepRun/ReviewTaskAbortService/index.js";
```

(`Result` may already be imported; keep one import.) Change the constructor to:

```ts
    public constructor(
        private definitions: AutomationDefinitionRegistryService.Interface,
        private taskService: TaskService.Interface,
        private identityContext: IdentityContext.Interface,
        private taskAbort: ReviewTaskAbortService.Interface,
        private logger: Logger.Interface
    ) {}
```

Replace the placeholder `reach` with:

```ts
    public async reach({ review, step, actor, now }: StepType.ReachParams) {
        const data = review.toData();
        const requester = data.createdBy;
        const owner = getAutomationActor(requester);

        // Everything that can stop the step from running is checked here, in this order, and ends
        // in a fixed reason (R146). The same checks run again before every run (R148).
        let reason: string | null = null;
        const config = automationStepConfigSchema.safeParse(step.config);
        if (!config.success) {
            // A config that no longer parses has its own reason (P3), not the missing-definition one.
            reason = "The automation step configuration is not valid.";
        } else {
            const automationId = config.data.automationId;
            const definition = this.definitions.get(automationId);
            if (!definition) {
                reason = `The automation "${automationId}" is not available.`;
            } else if (!matchesAutomationScope(definition.models, data.workflow.models)) {
                reason = `The automation "${automationId}" is not available for this workflow's models.`;
            } else {
                const settings = parseAutomationSettings(definition, config.data.settings);
                if (settings.isFail()) {
                    reason = `The automation settings are not valid: ${settings.error}.`;
                }
            }
        }

        // The trigger runs as the requester, never as `actor` (the approver of the previous step,
        // the restarter or the task itself): the task's `createdBy` must be the requester, which
        // the run handler checks (R148, R149). `TaskService.trigger` is unchanged; the identity
        // is switched for this call only and restored by `withIdentity`.
        let taskId: string | null = null;
        if (reason === null) {
            const input: StepRunTaskInput = { reviewId: data.id, stepId: step.id };
            const identity = new AuthenticatedIdentity({
                id: requester.id,
                displayName: requester.displayName,
                type: requester.identityType ?? "admin",
                context: { canAccessTenant: true }
            });
            try {
                const triggered = await this.identityContext.withIdentity(identity, () => {
                    return this.taskService.trigger({
                        definition: STEP_RUN_TASK_DEFINITION_ID,
                        name: `Workflow step: ${step.title}`,
                        input
                    });
                });
                if (triggered.isFail()) {
                    // The raw message can carry internals: logged, never stored (R146).
                    this.logger.error(
                        { error: triggered.error, reviewId: data.id, stepId: step.id },
                        "Could not start the automation task."
                    );
                    reason = "The automation could not be started.";
                } else {
                    taskId = triggered.value.id;
                }
            } catch (error) {
                this.logger.error(
                    { error, reviewId: data.id, stepId: step.id },
                    "Could not start the automation task."
                );
                reason = "The automation could not be started.";
            }
        }

        // The task id is stored by the one save. If the step cannot be reached after a successful
        // trigger, nothing will ever carry that id, so the task is aborted here.
        const reached = review.reachRun({ actor, owner, taskId, now });
        if (reached.isFail()) {
            if (taskId !== null) {
                await this.taskAbort.abort({
                    taskIds: [taskId],
                    message: "The review could not be saved."
                });
            }
            return Result.fail(reached.error);
        }
        if (reason === null) {
            return Result.ok();
        }

        // No task exists: record the reach without one, then fail the step with the reason. The
        // step stays restartable (D8); the use case saves the failed review as usual.
        const failed = review.fail({ stepId: step.id, reason, now });
        // Whatever `fail` returns is returned, never ignored (R159).
        if (failed.isFail()) {
            return Result.fail(failed.error);
        }
        return Result.ok();
    }
```

and the registration dependencies:

```ts
export const AutomationStepType = StepType.createImplementation({
    implementation: AutomationStepTypeImpl,
    dependencies: [
        AutomationDefinitionRegistryService,
        TaskService,
        IdentityContext,
        ReviewTaskAbortService,
        Logger
    ]
});
```

(Keep any dependency Task 2 already declared before these, in the same constructor order; Task 2's `validate` uses `AutomationDefinitionRegistryService`.)

- [ ] **Step 5: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/stepTypes/AutomationReach.test.ts packages/api-workflows/__tests__/review/ReviewStepReacher.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/stepTypes/AutomationReach.test.ts packages/api-workflows/__tests__/review/ReviewStepReacher.test.ts 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 6: Run the existing tests covering the changed code**

The reacher is the one step-reached path of request and approve, and the review step type now sits behind the registry:

Run: `yarn test packages/api-workflows/__tests__/review/ReviewSaver.test.ts packages/api-workflows/__tests__/review/RequestReview.test.ts packages/api-workflows/__tests__/review/ReviewTransitions.test.ts packages/api-workflows/__tests__/review/CurrentStepType.test.ts packages/api-workflows/__tests__/stepTypes/ReviewStepType.test.ts packages/api-workflows/__tests__/stepTypes/AutomationStepType.test.ts packages/api-workflows/__tests__/routing/RoutingStepAssignmentResolver.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS. If a test builds its own container and no longer resolves `ReviewStepReacher` because `StepTypeRegistryService` is not registered there, register `StepTypesFeature` in that test's setup (it is registered by `WorkflowsFeature` in every `createContextHandler` context, so none is expected).

Run the same files with `yarn test:os` (one run at a time).
Expected: PASS.

Run the CMS and WB tests that request and approve reviews (they go through the reacher, and their wrappers reuse the widened `RequestReviewUseCase.Error`): `yarn test packages/api-headless-cms-workflows/__tests__/hooks/revisionAndSaveBlock.test.ts packages/api-website-builder-workflows/__tests__/target/WbPageAdapter.test.ts 2>&1 | tail -50` and the same with `yarn test:os`.
Expected: PASS.

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|headless-cms-workflows|website-builder-workflows" | head`
Expected: no output.

- [ ] **Step 7: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
feat(api-workflows): dispatch step reached by step type and trigger the automation task as the requester

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
