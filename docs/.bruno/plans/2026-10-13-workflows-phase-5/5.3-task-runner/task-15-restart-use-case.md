### Task 15: `RestartReviewStepUseCase`

Spec 5.1, 7.4; D8, D34, D82, D87, D132; R140, R149, R153, R157, R159, R160; Review Focus 3, 4. A failed automation step is restarted by a person; the engine does the transition and the re-reach, and checks nothing about who asks (D132: the per-app wrappers of Tasks 16 and 17 authorize with `canRestartByPermission` plus read access):

- `RestartReviewStepUseCase.execute({ reviewId, stepId, actor })`: load the review, `review.restart({ stepId, actor, now })` (Task 5: only a `failed` current step; the failed attempt moves to `runs`, `comment` and `taskId` are cleared, the step is `pending` again and keeps its owner), re-reach through `ReviewStepReacher` (Task 10: definition lookup, models scope, settings re-validation, a new task triggered as the requester, never the restarter, R149), then one `ReviewSaver.save`. The restart and the new `stepReached` facts are saved together, so the events are `Workflows/Review/StepRestarted`, then `Workflows/Review/StepReached`.
- A re-reach that cannot start a task does not fail the request and never leaves the step `pending` (R153): the reacher records the reach with `taskId: null` and fails the step with the new R146 reason (`The automation "<id>" is not available.`, `The automation settings are not valid: ...`, `The automation could not be started.`), and returns ok. The saved review has the old attempt in `runs`, the step `failed` with the new reason, and can be restarted again.
- Wrong state: a `rejected` step (the review is `rejected`), an `inReview` or `approved` step, or a finished review fails with `Workflows/Review/InvalidState` and `transition: "restart"`; a step that is not the current step fails with `Workflows/Review/StepNotCurrent`; an unknown review with `Workflows/Review/NotFound`. Nothing is triggered and nothing is saved in any of these cases.
- A failed save aborts the task the re-reach triggered (Task 9, R143: the saver aborts the `taskId` of every recorded `stepReached` fact when persisting fails) and returns the persistence error; the review stays `failed`. A save that only failed in the target sync (`ReviewTargetSyncError`) keeps the new task: the review carries it.
- The feature `RestartReviewStepFeature` is registered in `WorkflowsFeature`, next to the other review use-case features. This is where the code registers every use case feature (`ReassignReviewStepFeature`, `CancelReviewFeature`, ...): `ReviewLifecycleFeature` only registers the lifecycle implementations (resolver, reacher, saver), so R160's "registered in `ReviewLifecycleFeature`" is read as "in the `WorkflowsFeature` registration list next to the other review features" (listed as a contract note).

**Files:**
- Create: `packages/api-workflows/src/features/review/RestartReviewStep/abstractions.ts`
- Create: `packages/api-workflows/src/features/review/RestartReviewStep/RestartReviewStepUseCase.ts`
- Create: `packages/api-workflows/src/features/review/RestartReviewStep/feature.ts`
- Create: `packages/api-workflows/src/features/review/RestartReviewStep/index.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/review/RestartReviewStep.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`

**Interfaces:**
- Consumes:
  - Task 5: `Review.restart(params: { stepId: string; actor: Actor; now: string }): Result<void, ReviewInvalidStateError | ReviewStepNotCurrentError>`; `getAutomationActor(requester)`; test helpers `createRunningAutomationReview(taskId)`, `AUTOMATION_STEP_ID`, `automationActor` (`~tests/__helpers/stepRunReviews.js`).
  - Task 10: `ReviewStepReacher.reach({ review, actor, now })` (`~/features/review/ReviewStepReacher/abstractions.js`; `Result<void, ReviewStepReacher.Error>` = `ReviewInvalidStateError | ReviewStepNotCurrentError`, returned unchanged by this use case, R159): an automation step reaches `inReview` with a `taskId`, or `failed` with an R146 reason and `taskId: null`; the trigger runs as `review.createdBy`.
  - Task 2: `registerTestAutomation(container, overrides?)` (`~tests/__helpers/TestAutomationDefinition.js`; id `test-automation`, models `["*"]`; the one registration helper, P1).
  - Task 9: `FakeTaskService` helpers `triggeredTasks`, `abortedTasks`, `fakeTaskFaults`, `resetFakeTasks` (`~tests/__helpers/FakeTaskService.js`), `FailingReviewSave` and `reviewSaveFaults` (`~tests/__helpers/FailingReviewSave.js`).
  - Existing: `ReviewRepository` (`get`, `save`), `ReviewSaver`, `ReviewNotFoundError`, `ReviewPersistenceError`, `ReviewInvalidStateError`, `ReviewStepNotCurrentError`, `ReviewTargetSyncError` (`~/domain/review/errors.js`), `Actor`, `ReviewData` (`~/domain/review/types.js`), `RecordingEventPublisher` / `recordedEvents` / `workflowEventTypes`, `createRequestedReview`, `toSaveData`, `expectOk`, `NOW`, `editor`, `requester` (`~tests/__helpers/fixtures.js`).
- Produces (matches the contract):
  - `RestartReviewStepUseCase` (`~/features/review/RestartReviewStep/index.js`): `execute(input: RestartReviewStepInput): Promise<Result<ReviewData, UseCaseError>>`, `RestartReviewStepInput { reviewId: string; stepId: string; actor: Actor }`, `UseCaseError = ReviewNotFoundError | ReviewPersistenceError | ReviewInvalidStateError | ReviewStepNotCurrentError | ReviewTargetSyncError` (namespace types `Interface`, `Input`, `Error`, `Return`); feature `RestartReviewStepFeature`. Consumed by Tasks 16 and 17 (`@webiny/api-workflows/features/review/RestartReviewStep/index.js`).

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/review/RestartReviewStep.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { registerTestAutomation } from "~tests/__helpers/TestAutomationDefinition.js";
import {
    abortedTasks,
    fakeTaskFaults,
    resetFakeTasks,
    triggeredTasks
} from "~tests/__helpers/FakeTaskService.js";
import { FailingReviewSave, reviewSaveFaults } from "~tests/__helpers/FailingReviewSave.js";
import {
    RecordingEventPublisher,
    recordedEvents,
    workflowEventTypes
} from "~tests/__helpers/RecordingEventPublisher.js";
import {
    AUTOMATION_STEP_ID,
    automationActor,
    createRunningAutomationReview
} from "~tests/__helpers/stepRunReviews.js";
import {
    createRequestedReview,
    editor,
    expectOk,
    NOW,
    requester,
    toSaveData
} from "~tests/__helpers/fixtures.js";
import type { Review } from "~/domain/review/Review.js";
import type { ReviewData } from "~/domain/review/types.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { RestartReviewStepUseCase } from "~/features/review/RestartReviewStep/index.js";

const LATER = "2026-10-09T11:00:00.000Z";
const FAILURE = "The automation failed: boom.";

/** The automation step failed at `LATER`; its first attempt ran as "task-old". */
const createFailedReview = (): Review => {
    const review = createRunningAutomationReview("task-old");
    expectOk(review.fail({ stepId: AUTOMATION_STEP_ID, reason: FAILURE, now: LATER }));
    return review;
};

interface SetupParams {
    seed?: ReviewData;
    /** Register the test automation; without it the definition is missing. */
    defined?: boolean;
}

const setup = async (params: SetupParams = {}) => {
    const { context } = await createContextHandler({
        setup: container => {
            container.registerDecorator(FailingReviewSave);
            container.registerDecorator(RecordingEventPublisher);
            if (params.defined !== false) {
                registerTestAutomation(container);
            }
        }
    });
    const reviews = context.container.resolve(ReviewRepository);
    expectOk(await reviews.save(params.seed ?? toSaveData(createFailedReview())));
    recordedEvents.length = 0;

    return {
        reviews,
        restart: context.container.resolve(RestartReviewStepUseCase)
    };
};

describe("RestartReviewStepUseCase (D8, D34, D82, R153)", () => {
    beforeEach(() => {
        resetFakeTasks();
        recordedEvents.length = 0;
        reviewSaveFaults.failNext = false;
    });

    it("restarts the failed step with a new task and keeps the old attempt in runs", async () => {
        const { restart, reviews } = await setup();

        const review = expectOk(
            await restart.execute({ reviewId: "review-1", stepId: AUTOMATION_STEP_ID, actor: editor })
        );

        expect(review).toMatchObject({
            state: "inProgress",
            currentStepId: AUTOMATION_STEP_ID,
            currentStepState: "inReview"
        });
        expect(review.steps[0]).toMatchObject({
            state: "inReview",
            owner: automationActor,
            taskId: "task-1",
            comment: null,
            finishedOn: null,
            runs: [
                {
                    taskId: "task-old",
                    startedOn: NOW,
                    finishedOn: LATER,
                    outcome: "failed",
                    reason: FAILURE
                }
            ]
        });
        expect(expectOk(await reviews.get("review-1")).steps[0]).toMatchObject({
            state: "inReview",
            taskId: "task-1"
        });
        expect(workflowEventTypes()).toEqual([
            "Workflows/Review/StepRestarted",
            "Workflows/Review/StepReached"
        ]);
    });

    it("starts the new task as the requester, never as the person who restarts", async () => {
        const { restart } = await setup();

        expectOk(
            await restart.execute({ reviewId: "review-1", stepId: AUTOMATION_STEP_ID, actor: editor })
        );

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
        expect(triggeredTasks[0].identityId).not.toBe(editor.id);
    });

    it("records the restart with the restarting actor and the previous task id", async () => {
        const { restart } = await setup();

        expectOk(
            await restart.execute({ reviewId: "review-1", stepId: AUTOMATION_STEP_ID, actor: editor })
        );

        const restarted = recordedEvents.find(
            event => event.eventType === "Workflows/Review/StepRestarted"
        );
        expect(restarted?.payload.fact).toMatchObject({
            type: "stepRestarted",
            actor: editor,
            change: { stepId: AUTOMATION_STEP_ID, fromState: "failed", toState: "pending" },
            previousTaskId: "task-old"
        });
        const reached = recordedEvents.find(
            event => event.eventType === "Workflows/Review/StepReached"
        );
        expect(reached?.payload.fact).toMatchObject({ actor: editor, taskId: "task-1" });
    });

    it("fails the step again, never leaves it pending, when the automation is gone", async () => {
        const { restart, reviews } = await setup({ defined: false });

        const result = await restart.execute({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            actor: editor
        });

        expect(result.isOk()).toBe(true);
        expect(result.value.steps[0]).toMatchObject({
            state: "failed",
            comment: 'The automation "test-automation" is not available.',
            taskId: null,
            runs: [{ taskId: "task-old", outcome: "failed", reason: FAILURE }]
        });
        expect(triggeredTasks).toEqual([]);
        expect(expectOk(await reviews.get("review-1")).steps[0].state).toBe("failed");
    });

    it("fails the step again with the reason when the new task cannot be started", async () => {
        const { restart } = await setup();
        fakeTaskFaults.trigger = "fail";

        const result = await restart.execute({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            actor: editor
        });

        expect(result.isOk()).toBe(true);
        expect(result.value.steps[0]).toMatchObject({
            state: "failed",
            comment: "The automation could not be started.",
            taskId: null
        });
        expect(abortedTasks).toEqual([]);
    });

    it("fails the step again when the stored settings are no longer valid", async () => {
        const failed = toSaveData(createFailedReview());
        failed.steps[0].config = {
            automationId: "test-automation",
            settings: { mode: "nonsense" }
        };
        const { restart } = await setup({ seed: failed });

        const result = await restart.execute({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            actor: editor
        });

        expect(result.isOk()).toBe(true);
        expect(result.value.steps[0].state).toBe("failed");
        expect(result.value.steps[0].comment).toMatch(
            /^The automation settings are not valid: mode: /
        );
        expect(triggeredTasks).toEqual([]);
    });

    it("refuses a step in review and starts nothing (D34)", async () => {
        const { restart } = await setup({ seed: toSaveData(createRunningAutomationReview("task-1")) });

        const result = await restart.execute({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            actor: editor
        });

        expect(result.error?.code).toBe("Workflows/Review/InvalidState");
        expect(result.error?.data).toMatchObject({ transition: "restart", stepState: "inReview" });
        expect(triggeredTasks).toEqual([]);
        expect(workflowEventTypes()).toEqual([]);
    });

    it("refuses a rejected step: reject is final (D10, D34)", async () => {
        const rejectedReview = createRunningAutomationReview("task-1");
        expectOk(
            rejectedReview.reject({
                stepId: AUTOMATION_STEP_ID,
                actor: automationActor,
                actorTeamIds: [],
                comment: "Rejected with a good reason.",
                now: LATER
            })
        );
        const { restart, reviews } = await setup({ seed: toSaveData(rejectedReview) });

        const result = await restart.execute({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            actor: editor
        });

        expect(result.error?.code).toBe("Workflows/Review/InvalidState");
        expect(result.error?.data).toMatchObject({
            transition: "restart",
            reviewState: "rejected",
            stepState: "rejected"
        });
        expect(triggeredTasks).toEqual([]);
        expect(workflowEventTypes()).toEqual([]);
        expect(expectOk(await reviews.get("review-1")).steps[0].state).toBe("rejected");
    });

    it("refuses a step that is not the current step and an unknown review", async () => {
        const { restart } = await setup();

        const otherStep = await restart.execute({
            reviewId: "review-1",
            stepId: "editorial",
            actor: editor
        });
        const unknown = await restart.execute({
            reviewId: "review-missing",
            stepId: AUTOMATION_STEP_ID,
            actor: editor
        });

        expect(otherStep.error?.code).toBe("Workflows/Review/StepNotCurrent");
        expect(unknown.error?.code).toBe("Workflows/Review/NotFound");
        expect(triggeredTasks).toEqual([]);
    });

    it("refuses a review step", async () => {
        const { restart } = await setup({ seed: toSaveData(createRequestedReview()) });

        const result = await restart.execute({
            reviewId: "review-1",
            stepId: "legal",
            actor: editor
        });

        expect(result.error?.code).toBe("Workflows/Review/InvalidState");
        expect(triggeredTasks).toEqual([]);
    });

    it("refuses a cancelled review", async () => {
        const cancelledReview = createFailedReview();
        expectOk(cancelledReview.cancel({ actor: requester, now: LATER }));
        const { restart } = await setup({ seed: toSaveData(cancelledReview) });

        const result = await restart.execute({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            actor: editor
        });

        expect(result.error?.code).toBe("Workflows/Review/InvalidState");
        expect(triggeredTasks).toEqual([]);
    });

    it("aborts the new task and keeps the step failed when the save fails (R143)", async () => {
        const { restart, reviews } = await setup();
        reviewSaveFaults.failNext = true;

        const result = await restart.execute({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            actor: editor
        });

        expect(result.error?.code).toBe("Workflows/Review/Persistence");
        expect(triggeredTasks.map(task => task.id)).toEqual(["task-1"]);
        expect(abortedTasks).toEqual([
            { id: "task-1", message: "The review could not be saved." }
        ]);
        const stored = expectOk(await reviews.get("review-1"));
        expect(stored.steps[0]).toMatchObject({ state: "failed", comment: FAILURE });
        expect(stored.steps[0].runs).toEqual([]);
    });
});
```

In `packages/api-workflows/__tests__/registration.test.ts` add the import next to the `ReassignReviewStepUseCase` import:

```ts
import { RestartReviewStepUseCase } from "~/features/review/RestartReviewStep/index.js";
```

and after `expect(container.resolveAll(ReassignReviewStepUseCase)).toHaveLength(1);`:

```ts
        expect(container.resolveAll(RestartReviewStepUseCase)).toHaveLength(1);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/review/RestartReviewStep.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL. Both files cannot resolve `~/features/review/RestartReviewStep/index.js`.

Run the same with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/review/RestartReviewStep.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL, same reason.

- [ ] **Step 3: The use case**

Create `packages/api-workflows/src/features/review/RestartReviewStep/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import type {
    ReviewInvalidStateError,
    ReviewNotFoundError,
    ReviewPersistenceError,
    ReviewStepNotCurrentError,
    ReviewTargetSyncError
} from "~/domain/review/errors.js";

export interface RestartReviewStepInput {
    reviewId: string;
    /** The failed step the caller acted on; fails with `StepNotCurrent` when it is not current (R17). */
    stepId: string;
    /** Who restarts; the wrapper checked `canRestartByPermission` and read access (D132). */
    actor: Actor;
}

export interface IRestartReviewStepUseCaseErrors {
    notFound: ReviewNotFoundError;
    persistence: ReviewPersistenceError;
    invalidState: ReviewInvalidStateError;
    stepNotCurrent: ReviewStepNotCurrentError;
    targetSync: ReviewTargetSyncError;
}

type UseCaseError = IRestartReviewStepUseCaseErrors[keyof IRestartReviewStepUseCaseErrors];

export interface IRestartReviewStepUseCase {
    execute(input: RestartReviewStepInput): Promise<Result<ReviewData, UseCaseError>>;
}

/**
 * Restarts a failed step (spec 5.1, D8, D34, D82, R153): the failed attempt moves to `runs`, the
 * step is reached again through the step-reached path (a new task as the requester, never as the
 * restarter, R149) and the review is saved once. A re-reach that cannot start a task leaves the
 * step `failed` with the new reason, never `pending`. Internal (D132): the app wrapper checks
 * `canRestartByPermission` and read access.
 */
export const RestartReviewStepUseCase = createAbstraction<IRestartReviewStepUseCase>(
    "RestartReviewStepUseCase"
);

export namespace RestartReviewStepUseCase {
    export type Interface = IRestartReviewStepUseCase;
    export type Input = RestartReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/review/RestartReviewStep/RestartReviewStepUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewStepReacher } from "../ReviewStepReacher/abstractions.js";
import { ReviewSaver } from "../ReviewSaver/abstractions.js";
import { RestartReviewStepUseCase as UseCase } from "./abstractions.js";

class RestartReviewStepUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private stepReacher: ReviewStepReacher.Interface,
        private saver: ReviewSaver.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const loaded = await this.repository.get(input.reviewId);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        const review = Review.fromData(loaded.value);
        const now = new Date().toISOString();

        // Only a failed current step restarts; the failed attempt moves to `runs` (R140).
        const restarted = review.restart({ stepId: input.stepId, actor: input.actor, now });
        if (restarted.isFail()) {
            return Result.fail(restarted.error);
        }

        // The step is reached again as for a first run (D6): definition lookup, settings
        // re-validation and a new task as the requester (R149). When no task can be started the
        // reacher fails the step with the new reason and returns ok, so the step is never left
        // `pending` (R153). The restarter is only the actor of the facts.
        const reached = await this.stepReacher.reach({ review, actor: input.actor, now });
        if (reached.isFail()) {
            return Result.fail(reached.error);
        }

        return this.saver.save(review);
    }
}

export const RestartReviewStepUseCase = UseCase.createImplementation({
    implementation: RestartReviewStepUseCaseImpl,
    dependencies: [ReviewRepository, ReviewStepReacher, ReviewSaver]
});
```

Create `packages/api-workflows/src/features/review/RestartReviewStep/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { RestartReviewStepUseCase } from "./RestartReviewStepUseCase.js";

export const RestartReviewStepFeature = createFeature({
    name: "Workflows/RestartReviewStep",
    register(container) {
        container.register(RestartReviewStepUseCase);
    }
});
```

Create `packages/api-workflows/src/features/review/RestartReviewStep/index.ts`:

```ts
export { RestartReviewStepUseCase } from "./abstractions.js";
export type { RestartReviewStepInput } from "./abstractions.js";
```

- [ ] **Step 4: Register**

In `packages/api-workflows/src/WorkflowsFeature.ts`, add after the `ReassignReviewStepFeature` import:

```ts
import { RestartReviewStepFeature } from "~/features/review/RestartReviewStep/feature.js";
```

and after `ReassignReviewStepFeature.register(container);`:

```ts
        RestartReviewStepFeature.register(container);
```

- [ ] **Step 5: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/review/RestartReviewStep.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/review/RestartReviewStep.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|headless-cms-workflows|website-builder-workflows|background-tasks" | head`
Expected: no output.

- [ ] **Step 6: Run the existing tests covering the changed code**

`WorkflowsFeature.ts` is the only existing source file changed. Run the files that exercise the feature wiring and the reacher this use case relies on:

Run: `yarn test packages/api-workflows/__tests__/stepTypes/AutomationReach.test.ts packages/api-workflows/__tests__/review/ReviewStepReacher.test.ts packages/api-workflows/__tests__/review/ReviewSaverTaskAbort.test.ts packages/api-workflows/__tests__/domain/Review.stepRun.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/stepTypes/AutomationReach.test.ts packages/api-workflows/__tests__/review/ReviewStepReacher.test.ts packages/api-workflows/__tests__/review/ReviewSaverTaskAbort.test.ts packages/api-workflows/__tests__/domain/Review.stepRun.test.ts 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 7: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
feat(api-workflows): add the engine restart use case for failed steps

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
