### Task 2: `StepRunReachService` and `AutomationStepType.reach` delegating to it

Spec 5.2, 7.4; D6, D7, D57, D87; R143, R146, R149, R159, R161, R164, R168; Review Focus 5. The trigger-as-requester, `reachRun`, abort and fail logic that `AutomationStepType.reach` carries today (phase 5 Task 10) moves, unchanged, into one step-type-neutral DI service, so the AI step type (Task 17) reaches through the same code and cannot drift from it. No behaviour change for automation:

- New abstraction `StepRunReachService` (`features/stepRun/StepRunReachService/`) with one method `reach(params)`. `params`: `review: Review`, `step: ReviewStep`, `actor: Actor` (who caused the reach), `owner: Actor` (the step's owner once reached: `getAutomationActor(requester)` or `getAiActor(requester)`, the caller's choice), `now: string`, `failure: string | null` (a fixed reason when the step cannot be started: no task is triggered) and `startFailure: string` (the fixed reason used when the trigger itself fails or throws). Returns `Result<void, ReviewInvalidStateError | ReviewStepNotCurrentError>`, the same union as `StepType.reach` (R159).
- Behaviour, in this order, byte for byte what `AutomationStepType.reach` does today after its checks:
  1. `reason = params.failure`. With `reason === null` the trigger runs as the requester (`review.createdBy`, R149): `getRequesterIdentity(review.createdBy)` inside `IdentityContext.withIdentity` only, `TaskService.trigger({ definition: STEP_RUN_TASK_DEFINITION_ID, name: "Workflow step: <step title>", input: { reviewId, stepId } })`, so the task's `createdBy` is the requester (R148) and the identity is restored afterwards, also when the trigger throws. The Result pattern and the `try`/`catch` are inline here, the only trigger call site (no wrapper). A failed Result or a throw logs `Logger.error({ error, reviewId, stepId }, "Could not start the automation task.")` and sets `reason = params.startFailure`; the raw message never reaches the step (R146). The log message text is kept byte for byte because the phase 5 test `AutomationReach.test.ts` pins it (Review Focus 5); it is a log line, not a step reason.
  2. `review.reachRun({ actor, owner, taskId, now })` stores the task id on the step in the one save (`taskId` is `null` when no task exists). If `reachRun` fails after a successful trigger, `ReviewTaskAbortService.abort({ taskIds: [taskId], message: "The review could not be saved." })` runs and the `reachRun` error is returned (R143).
  3. `reason === null`: return ok. Otherwise `review.fail({ stepId: step.id, reason, now })` fails the step and whatever it returns is returned, never ignored (R159); a failed step is a normal state of a review, restartable (D8), and the use case saves the review as usual.
- `AutomationStepType.reach` keeps its checks (config parse, definition lookup, model scope, settings parse, with the R146 reasons) and computes `failure`; it then calls `StepRunReachService.reach({ review, step, actor, owner: getAutomationActor(requester), now, failure, startFailure: "The automation could not be started." })` and returns its result. Its dependencies shrink to `[AutomationDefinitionRegistryService, StepRunReachService]`; it drops `TaskService`, `IdentityContext`, `ReviewTaskAbortService` and `Logger`.
- Registered in `WorkflowsFeature` (own feature file, `StepRunReachServiceFeature`). Task 17 injects it from `AiStepType`; Task 3 does not touch it.

**Files:**
- Create: `packages/api-workflows/src/features/stepRun/StepRunReachService/abstractions.ts`
- Create: `packages/api-workflows/src/features/stepRun/StepRunReachService/StepRunReachService.ts`
- Create: `packages/api-workflows/src/features/stepRun/StepRunReachService/feature.ts`
- Create: `packages/api-workflows/src/features/stepRun/StepRunReachService/index.ts`
- Modify: `packages/api-workflows/src/features/stepTypes/AutomationStepType/AutomationStepType.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/stepRun/StepRunReachService.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts` (one added assertion; no existing expectation changes)

**Interfaces:**
- Consumes:
  - Phase 5: `TaskService` (`@webiny/api-core/features/task/TaskService/index.js`, `trigger({ definition, name, input })`), `IdentityContext` (`@webiny/api-core/features/security/IdentityContext/index.js`, `withIdentity<T>(identity, cb)`), `Logger` (`@webiny/api-core/features/logger/index.js`), `ReviewTaskAbortService` (`~/features/stepRun/ReviewTaskAbortService/index.js`, `abort({ taskIds, message })`), `STEP_RUN_TASK_DEFINITION_ID` (`~/features/stepRun/constants.js`), `StepRunTaskInput` (`~/features/stepRun/types.js`), `getRequesterIdentity(requester: Actor): AuthenticatedIdentity` (`~/domain/automation/getRequesterIdentity.js`), `getAutomationActor` (`~/domain/automation/getAutomationActor.js`), `Review.reachRun({ actor, owner, taskId, now })` and `Review.fail({ stepId, reason, now })` (`~/domain/review/Review.js`), `ReviewInvalidStateError`, `ReviewStepNotCurrentError` (`~/domain/review/errors.js`).
  - Task 1: `getAiActor`, `AI_STEP_TYPE` (tests only).
  - Test helpers (reused, never redefined): `createContextHandler` (`~tests/__helpers/handler.js`), `captureLoggedErrors`, `loggedErrors` (`~tests/__helpers/CapturingLogger.js`), `abortedTasks`, `fakeTaskFaults`, `resetFakeTasks`, `triggeredTasks` (`~tests/__helpers/FakeTaskService.js`), `AUTOMATION_STEP_ID`, `createRunningAutomationReview`, `createPendingAutomationReview` (`~tests/__helpers/stepRunReviews.js`), `createReviewStep`, `createWorkflow`, `expectOk`, `ARTICLE_MODEL`, `NOW`, `requester`, `otherReviewer`, `targetContext` (`~tests/__helpers/fixtures.js`).
- Produces (matches the contract):
  - `StepRunReachService` (`~/features/stepRun/StepRunReachService/index.js`), namespace types `Interface`, `Params`, `Error`; `reach(params: StepRunReachParams): Promise<Result<void, ReviewInvalidStateError | ReviewStepNotCurrentError>>`. Consumed by Tasks 3 and 17.
  - `AutomationStepType` with dependencies `[AutomationDefinitionRegistryService, StepRunReachService]`; reach behaviour unchanged.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/stepRun/StepRunReachService.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import {
    abortedTasks,
    fakeTaskFaults,
    resetFakeTasks,
    triggeredTasks
} from "~tests/__helpers/FakeTaskService.js";
import {
    AUTOMATION_STEP_ID,
    createRunningAutomationReview
} from "~tests/__helpers/stepRunReviews.js";
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
import { Review } from "~/domain/review/Review.js";
import { getAiActor } from "~/domain/ai/getAiActor.js";
import { getAutomationActor } from "~/domain/automation/getAutomationActor.js";
import { AI_STEP_TYPE } from "~/domain/workflow/stepTypes.js";
import { StepRunReachService } from "~/features/stepRun/StepRunReachService/index.js";

const AI_STEP_ID = "ai-check";
const AI_ACTOR = getAiActor(requester);
const AUTOMATION_ACTOR = getAutomationActor(requester);
const AI_START_FAILURE = "The AI review could not be started.";
const AUTOMATION_START_FAILURE = "The automation could not be started.";

/** A pending `ai` step "AI check" followed by the review step "Editorial review". */
const createAiReview = (): Review => {
    const workflow = createWorkflow({
        steps: [
            {
                ...createReviewStep({ id: AI_STEP_ID, title: "AI check" }),
                type: AI_STEP_TYPE,
                config: { instructions: "Check the tone.", model: "openai/gpt-5", tools: [] }
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
            requester,
            now: NOW
        })
    );
};

const createContext = async () => {
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
        }
    });
    return context;
};

describe("StepRunReachService (R143, R149, R159, R164, R168)", () => {
    beforeEach(() => {
        resetFakeTasks();
        loggedErrors.length = 0;
    });

    it("is registered once, with the engine", async () => {
        const context = await createContext();

        expect(context.container.resolveAll(StepRunReachService)).toHaveLength(1);
    });

    it("triggers the step run task as the requester, not as the actor who caused the reach", async () => {
        const context = await createContext();
        const identityContext = context.container.resolve(IdentityContext);
        const identityBefore = identityContext.getIdentity().id;
        const review = createAiReview();
        const [step] = review.toData().steps;

        const result = await context.container.resolve(StepRunReachService).reach({
            review,
            step,
            actor: otherReviewer,
            owner: AI_ACTOR,
            now: NOW,
            failure: null,
            startFailure: AI_START_FAILURE
        });

        expect(result.isOk()).toBe(true);
        expect(triggeredTasks).toEqual([
            {
                id: "task-1",
                definition: "workflowsStepRun",
                name: "Workflow step: AI check",
                input: { reviewId: "review-1", stepId: AI_STEP_ID },
                identityId: requester.id,
                identityType: "admin"
            }
        ]);
        expect(triggeredTasks[0].identityId).not.toBe(otherReviewer.id);
        expect(identityContext.getIdentity().id).toBe(identityBefore);
        expect(identityBefore).not.toBe(requester.id);
    });

    it("reaches the step in review with the task id, owned by the given owner", async () => {
        const context = await createContext();
        const review = createAiReview();
        const [step] = review.toData().steps;

        await context.container.resolve(StepRunReachService).reach({
            review,
            step,
            actor: requester,
            owner: AI_ACTOR,
            now: NOW,
            failure: null,
            startFailure: AI_START_FAILURE
        });

        expect(review.toData().steps[0]).toMatchObject({
            id: AI_STEP_ID,
            state: "inReview",
            owner: AI_ACTOR,
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

    it("uses the owner the caller gives, whatever the step type", async () => {
        const context = await createContext();
        const review = createAiReview();
        const [step] = review.toData().steps;

        await context.container.resolve(StepRunReachService).reach({
            review,
            step,
            actor: requester,
            owner: AUTOMATION_ACTOR,
            now: NOW,
            failure: null,
            startFailure: AUTOMATION_START_FAILURE
        });

        expect(review.toData().steps[0].owner).toEqual(AUTOMATION_ACTOR);
    });

    it("fails the step with the given reason and triggers nothing when `failure` is set", async () => {
        const context = await createContext();
        const review = createAiReview();
        const [step] = review.toData().steps;

        const result = await context.container.resolve(StepRunReachService).reach({
            review,
            step,
            actor: requester,
            owner: AI_ACTOR,
            now: NOW,
            failure: 'The AI tool "readTarget" is not available.',
            startFailure: AI_START_FAILURE
        });

        expect(result.isOk()).toBe(true);
        expect(triggeredTasks).toEqual([]);
        expect(abortedTasks).toEqual([]);
        expect(review.toData().steps[0]).toMatchObject({
            state: "failed",
            comment: 'The AI tool "readTarget" is not available.',
            taskId: null,
            owner: AI_ACTOR,
            finishedOn: NOW
        });
        expect(review.pullFacts().map(fact => fact.type)).toEqual([
            "requested",
            "stepReached",
            "stepFailed"
        ]);
    });

    it("fails the step with `startFailure` when the trigger fails, and logs the raw error", async () => {
        const context = await createContext();
        fakeTaskFaults.trigger = "fail";
        fakeTaskFaults.triggerMessage = "The queue is full";
        const review = createAiReview();
        const [step] = review.toData().steps;

        const result = await context.container.resolve(StepRunReachService).reach({
            review,
            step,
            actor: requester,
            owner: AI_ACTOR,
            now: NOW,
            failure: null,
            startFailure: AI_START_FAILURE
        });

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "failed",
            comment: AI_START_FAILURE,
            taskId: null
        });
        expect(abortedTasks).toEqual([]);
        expect(loggedErrors.map(logged => logged.message)).toEqual([
            "Could not start the automation task."
        ]);
        expect((loggedErrors[0].fields.error as Error).message).toBe("The queue is full");
        expect(loggedErrors[0].fields).toMatchObject({ reviewId: "review-1", stepId: AI_STEP_ID });
    });

    it("fails the step with `startFailure` when the trigger throws, and restores the identity", async () => {
        const context = await createContext();
        fakeTaskFaults.trigger = "throw";
        const identityContext = context.container.resolve(IdentityContext);
        const identityBefore = identityContext.getIdentity().id;
        const review = createAiReview();
        const [step] = review.toData().steps;

        const result = await context.container.resolve(StepRunReachService).reach({
            review,
            step,
            actor: requester,
            owner: AI_ACTOR,
            now: NOW,
            failure: null,
            startFailure: AI_START_FAILURE
        });

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "failed",
            comment: AI_START_FAILURE
        });
        expect(loggedErrors.map(logged => logged.message)).toEqual([
            "Could not start the automation task."
        ]);
        expect((loggedErrors[0].fields.error as Error).message).toBe("The task service is down");
        expect(identityContext.getIdentity().id).toBe(identityBefore);
    });

    it("never puts a raw trigger message into the step, however long", async () => {
        const context = await createContext();
        fakeTaskFaults.trigger = "fail";
        fakeTaskFaults.triggerMessage = "x".repeat(900);
        const review = createAiReview();
        const [step] = review.toData().steps;

        await context.container.resolve(StepRunReachService).reach({
            review,
            step,
            actor: requester,
            owner: AI_ACTOR,
            now: NOW,
            failure: null,
            startFailure: AI_START_FAILURE
        });

        const [failedStep] = review.toData().steps;
        expect(failedStep.comment).toBe(AI_START_FAILURE);
        expect(JSON.stringify(failedStep)).not.toContain("xxxxx");
    });

    it("aborts the triggered task and returns the error when the step cannot be reached after it", async () => {
        const context = await createContext();
        // The step is already in review, so `reachRun` refuses it after the trigger succeeded.
        const review = createRunningAutomationReview("task-0");
        const [step] = review.toData().steps;

        const result = await context.container.resolve(StepRunReachService).reach({
            review,
            step,
            actor: requester,
            owner: AUTOMATION_ACTOR,
            now: NOW,
            failure: null,
            startFailure: AUTOMATION_START_FAILURE
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/InvalidState");
        expect(triggeredTasks.map(task => task.id)).toEqual(["task-1"]);
        expect(abortedTasks).toEqual([{ id: "task-1", message: "The review could not be saved." }]);
        expect(review.toData().steps[0]).toMatchObject({
            id: AUTOMATION_STEP_ID,
            state: "inReview",
            taskId: "task-0"
        });
    });

    it("returns the error and aborts nothing when the step cannot be reached and no task exists", async () => {
        const context = await createContext();
        const review = createRunningAutomationReview("task-0");
        const [step] = review.toData().steps;

        const result = await context.container.resolve(StepRunReachService).reach({
            review,
            step,
            actor: requester,
            owner: AUTOMATION_ACTOR,
            now: NOW,
            failure: "The automation is not available.",
            startFailure: AUTOMATION_START_FAILURE
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/InvalidState");
        expect(triggeredTasks).toEqual([]);
        expect(abortedTasks).toEqual([]);
    });
});
```

Add one assertion to the existing `registration.test.ts` (it already imports the abstractions it lists): add the import `import { StepRunReachService } from "~/features/stepRun/StepRunReachService/index.js";` next to the `ReviewTaskAbortService` import (line 62) and, right after the line `expect(container.resolveAll(ReviewTaskAbortService)).toHaveLength(1);`:

```ts
        expect(container.resolveAll(StepRunReachService)).toHaveLength(1);
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
yarn test packages/api-workflows/__tests__/stepRun/StepRunReachService.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/stepRun/StepRunReachService.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50
```

Expected: FAIL. `StepRunReachService.test.ts` cannot load `~/features/stepRun/StepRunReachService/index.js` ("Failed to resolve import"); `registration.test.ts` fails the same way on its new import.

- [ ] **Step 3: Write the implementation**

Create `packages/api-workflows/src/features/stepRun/StepRunReachService/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { Review } from "~/domain/review/Review.js";
import type { Actor, ReviewStep } from "~/domain/review/types.js";
import type { ReviewInvalidStateError, ReviewStepNotCurrentError } from "~/domain/review/errors.js";

export interface StepRunReachParams {
    review: Review;
    /** The pending step being reached. */
    step: ReviewStep;
    /** Who caused the step to be reached (the approver of the previous step, the restarter, ...). */
    actor: Actor;
    /** The step's owner once reached: the automation actor or the AI actor of the requester. */
    owner: Actor;
    now: string;
    /** A fixed reason when the step cannot be started: no task is triggered and the step fails with it. */
    failure: string | null;
    /** The fixed reason used when the trigger itself fails or throws (the raw error is only logged). */
    startFailure: string;
}

export type StepRunReachError = ReviewInvalidStateError | ReviewStepNotCurrentError;

export interface IStepRunReachService {
    /**
     * The one reach path of every step that runs as a `workflowsStepRun` task (R168): triggers the
     * task as the requester (R149), stores its id on the step through `review.reachRun`, aborts
     * the task when that fails (R143) and fails the step with a fixed reason when there is
     * nothing to run (R146). Returns the review's transition errors as they are (R159).
     */
    reach(params: StepRunReachParams): Promise<Result<void, StepRunReachError>>;
}

/**
 * Shared by `AutomationStepType.reach` and the AI step type's reach (R164, R168). Internal (D132):
 * no permission checks; the caller has already decided what can run.
 */
export const StepRunReachService = createAbstraction<IStepRunReachService>("StepRunReachService");

export namespace StepRunReachService {
    export type Interface = IStepRunReachService;
    export type Params = StepRunReachParams;
    export type Error = StepRunReachError;
}
```

Create `packages/api-workflows/src/features/stepRun/StepRunReachService/StepRunReachService.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { getRequesterIdentity } from "~/domain/automation/getRequesterIdentity.js";
import { STEP_RUN_TASK_DEFINITION_ID } from "~/features/stepRun/constants.js";
import type { StepRunTaskInput } from "~/features/stepRun/types.js";
import { ReviewTaskAbortService } from "~/features/stepRun/ReviewTaskAbortService/index.js";
import { StepRunReachService as Abstraction } from "./abstractions.js";

class StepRunReachServiceImpl implements Abstraction.Interface {
    public constructor(
        private taskService: TaskService.Interface,
        private identityContext: IdentityContext.Interface,
        private taskAbort: ReviewTaskAbortService.Interface,
        private logger: Logger.Interface
    ) {}

    public async reach({
        review,
        step,
        actor,
        owner,
        now,
        failure,
        startFailure
    }: Abstraction.Params) {
        const data = review.toData();
        const requester = data.createdBy;

        // The trigger runs as the requester, never as `actor` (the approver of the previous step,
        // the restarter or the task itself): the task's `createdBy` must be the requester, which
        // the run handler checks (R148, R149). `TaskService.trigger` is unchanged; the identity
        // is switched for this call only and restored by `withIdentity`.
        let reason = failure;
        let taskId: string | null = null;
        if (reason === null) {
            const input: StepRunTaskInput = { reviewId: data.id, stepId: step.id };
            const identity = getRequesterIdentity(requester);
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
                    reason = startFailure;
                } else {
                    taskId = triggered.value.id;
                }
            } catch (error) {
                this.logger.error(
                    { error, reviewId: data.id, stepId: step.id },
                    "Could not start the automation task."
                );
                reason = startFailure;
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
}

export const StepRunReachService = Abstraction.createImplementation({
    implementation: StepRunReachServiceImpl,
    dependencies: [TaskService, IdentityContext, ReviewTaskAbortService, Logger]
});
```

Create `packages/api-workflows/src/features/stepRun/StepRunReachService/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { StepRunReachService } from "./StepRunReachService.js";

export const StepRunReachServiceFeature = createFeature({
    name: "Workflows/StepRunReachService",
    register(container) {
        container.register(StepRunReachService);
    }
});
```

Create `packages/api-workflows/src/features/stepRun/StepRunReachService/index.ts`:

```ts
export { StepRunReachService } from "./abstractions.js";
export type { StepRunReachParams, StepRunReachError } from "./abstractions.js";
```

Modify `packages/api-workflows/src/WorkflowsFeature.ts`: add the import next to the `ReviewTaskAbortServiceFeature` import (line 51)

```ts
import { StepRunReachServiceFeature } from "~/features/stepRun/StepRunReachService/feature.js";
```

and register it next to the `ReviewTaskAbortServiceFeature.register(container);` call (find it with `grep -n "ReviewTaskAbortServiceFeature.register" packages/api-workflows/src/WorkflowsFeature.ts`), on the line right after it:

```ts
        StepRunReachServiceFeature.register(container);
```

Replace `packages/api-workflows/src/features/stepTypes/AutomationStepType/AutomationStepType.ts` with the following (validation, `describeAvailability` and the check order and reasons are unchanged; only the trigger, `reachRun`, abort and fail code moved out):

```ts
import { Result } from "@webiny/feature/api";
import { getAutomationActor } from "~/domain/automation/getAutomationActor.js";
import { StepRunReachService } from "~/features/stepRun/StepRunReachService/index.js";
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
 * workflow's models and accepts the settings (D35, D37, R137). `reach` checks the same things
 * again and hands the trigger to `StepRunReachService` (R149, R168).
 */
class AutomationStepTypeImpl implements StepType.Interface {
    public readonly type = AUTOMATION_STEP_TYPE;
    public readonly title = "Automation";
    public readonly configSchema = automationStepConfigSchema;

    public constructor(
        private definitions: AutomationDefinitionRegistryService.Interface,
        private stepRunReach: StepRunReachService.Interface
    ) {}

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

    public async reach({ review, step, actor, now }: StepType.ReachParams) {
        const data = review.toData();

        // Everything that can stop the step from running is checked here, in this order, and ends
        // in a fixed reason (R146). The same checks run again before every run (R148).
        let failure: string | null = null;
        const config = automationStepConfigSchema.safeParse(step.config);
        if (!config.success) {
            // A config that no longer parses has its own reason (P3), not the missing-definition one.
            failure = "The automation step configuration is not valid.";
        } else {
            const automationId = config.data.automationId;
            const definition = this.definitions.get(automationId);
            if (!definition) {
                failure = `The automation "${automationId}" is not available.`;
            } else if (!matchesAutomationScope(definition.models, data.workflow.models)) {
                failure = `The automation "${automationId}" is not available for this workflow's models.`;
            } else {
                const settings = parseAutomationSettings(definition, config.data.settings);
                if (settings.isFail()) {
                    failure = `The automation settings are not valid: ${settings.error}.`;
                }
            }
        }

        // Trigger as the requester, reach, abort and fail are the shared reach path (R168).
        return this.stepRunReach.reach({
            review,
            step,
            actor,
            owner: getAutomationActor(data.createdBy),
            now,
            failure,
            startFailure: "The automation could not be started."
        });
    }
}

export const AutomationStepType = StepType.createImplementation({
    implementation: AutomationStepTypeImpl,
    dependencies: [AutomationDefinitionRegistryService, StepRunReachService]
});
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
yarn test packages/api-workflows/__tests__/stepRun/StepRunReachService.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/stepRun/StepRunReachService.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50
```

Expected: PASS (10 tests in the new file, `registration.test.ts` green).

- [ ] **Step 5: Run the existing tests covering the changed code (Review Focus 5)**

These phase 5 files must stay green with no edit; a failure is a regression in the move, never a reason to change an expectation. Run each under both storages, `test:os` one at a time:

```bash
yarn test packages/api-workflows/__tests__/stepTypes/AutomationReach.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/stepTypes/AutomationStepType.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/review/ReviewStepReacher.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/review/RestartReviewStep.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/review/ReviewSaverTaskAbort.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/review/CancelDeleteAbortTask.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskRun.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/stepRun/ReviewTaskAbortService.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/stepRun/StuckStepService.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/stepTypes/AutomationReach.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/review/ReviewStepReacher.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskRun.test.ts 2>&1 | tail -50
yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40
```

Expected: all green, no type errors. `AutomationReach.test.ts` is the pin for the move: its assertions on the trigger identity, the `reachRun` owner, the fixed fail reasons, the logged message `Could not start the automation task.` and the abort after a failed `reachRun` run through `AutomationStepType.reach` into the new service and must pass untouched. `WorkflowStepRunTaskRun.test.ts` and `ReviewStepReacher.test.ts` exercise the reach and the run end to end and must also pass untouched.

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
yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30
git checkout -- .gitleaks.toml
git add .
git commit -m "refactor(api-workflows): move the step run reach into StepRunReachService" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn"
```
