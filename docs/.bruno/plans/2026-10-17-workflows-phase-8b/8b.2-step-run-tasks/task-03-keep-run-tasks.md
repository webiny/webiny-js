### Task 3: Keep run tasks, clean them with the review

R256, R146, R87; A93; D161; Review Focus 4 (`00-shared.md`). The phase 8a Global Constraints and Rulings R202-R252 apply unchanged (read: R87/D132 never throw out of a dependency, no helper wrappers around dependency calls, R238 DI file conventions, R243 fixtures, targeted tests, pre-commit chain).

`WorkflowStepRunTaskDefinition` stops cleaning itself up, so the background task of a step attempt stays after the step ends. `DeleteTargetReviewsUseCase`, the one engine path that deletes reviews, then removes the tasks with the review:

- The definition drops `selfCleanup = "always"` (`undefined` is "never" in `normalizeSelfCleanup`). Its `databaseLogs` stays unset (false). Its R179 doc comment says the task is kept and who deletes it. Nothing else in the definition changes.
- `DeleteTargetReviewsUseCase` gains two dependencies: `CleanupTaskSubtreeUseCase` (`@webiny/background-tasks/api/features/CleanupTaskSubtree/index.js`; verified: the file exists, the package `exports` has `"./*"`, and the same abstraction is exported from `@webiny/background-tasks/api`) and `Logger` (`@webiny/api-core/features/logger/index.js`).
- After its existing abort (abort first: a just-aborted task may still run its `onAbort`, and the cleanup is best effort and idempotent), it calls `CleanupTaskSubtreeUseCase.execute(taskId)` for every non-null `taskId` of the deleted review: for each step the `runs[].taskId` values (oldest first) and then the step's own `taskId`. Null ids are skipped. Every call has its own inline `try`/`catch`: `CleanupTaskSubtreeUseCase` documents that it never throws, but a decorator may. A catch logs `Could not clean up the background task of a deleted review.` with `{ error, reviewId, taskId }` and the delete still succeeds (a cleanup that fails is never retried, the review is already gone: accepted). The cleanup runs only after `reviewRepository.delete` succeeded; a review whose delete failed keeps its tasks and the failed Result is returned as before.
- Cancel keeps aborting only (`CancelReviewUseCase`, `CancelTargetReviewsUseCase`): an aborted task now stays until the review is deleted. `StuckStepService` needs no change (verified in `StuckStepService.ts`: pending and running tasks are alive, failed and aborted ones get the `STEP_RUN_STUCK_GRACE_MS` grace, a success task with the step still in review is stuck at once).
- A93 (without `selfCleanup` the run task writes no log rows except one on abort, and `CleanupTaskSubtreeUseCase` removes the task, its children and its logs): the existing unit tests of `createCleanupTaskSubtree` in `packages/background-tasks/__tests__/crud/cleanupTaskSubtree.test.ts` ("deletes a task's logs even when databaseLogs=false", "deletes descendant tree bottom-up", "is idempotent on missing root id") prove the cleanup side; Step 5 runs them. The definition side (no `databaseLogs`, no `selfCleanup`) is pinned by the definition test of this task.
- Test containers: no API test container has the background-tasks feature, so a `CleanupTaskSubtreeUseCase` the new dependency can resolve is registered in `api-workflows`' `createContextHandler` (a recording instance), in the CMS workflows context (a no-op) and in the ai-powerups AI step context (a no-op). The Website Builder workflows context registers the real `BackgroundTasksFeature` already and needs nothing.

**Files:**
- Modify: `packages/api-workflows/src/features/stepRun/WorkflowStepRunTask/WorkflowStepRunTaskDefinition.ts`
- Modify: `packages/api-workflows/src/features/review/DeleteTargetReviews/DeleteTargetReviewsUseCase.ts`
- Create: `packages/api-workflows/__tests__/__helpers/RecordingCleanupTaskSubtree.ts`
- Modify: `packages/api-workflows/__tests__/__helpers/handler.ts`
- Modify: `packages/api-workflows/__tests__/review/DeleteTargetReviews.test.ts`
- Modify: `packages/api-workflows/__tests__/review/CancelDeleteAbortTask.test.ts`
- Modify: `packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/NoopCleanupTaskSubtree.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/__handler/context.ts`
- Modify: `packages/ai-powerups/__tests__/__helpers/createAiStepContext.ts`

**Interfaces:**
- Consumes (verified with codegraph and the source): `CleanupTaskSubtreeUseCase` (`execute(taskId: string): Promise<void>`, `@webiny/background-tasks/api/features/CleanupTaskSubtree/index.js`), `Logger` (`@webiny/api-core/features/logger/index.js`, `error(objOrMsg, ...args)`), `ReviewRepository.listByTarget`, `delete`; `ReviewStep.taskId: string | null`, `ReviewStep.runs: ReviewStepRun[]` with `taskId: string | null` (`~/domain/review/types.js`); test helpers `createContextHandler` (`~tests/__helpers/handler.js`), `captureLoggedErrors`, `loggedErrors` (`~tests/__helpers/CapturingLogger.js`), `abortedTasks`, `resetFakeTasks` (`~tests/__helpers/FakeTaskService.js`), `createRunningAutomationReview` (`~tests/__helpers/stepRunReviews.js`), `ARTICLE_MODEL`, `expectOk`, `toSaveData` (`~tests/__helpers/fixtures.js`).
- Produces: R256 behaviour, no new production names. Test helper `RecordingCleanupTaskSubtree` and its shared instance `recordingCleanup` (`calls: { taskId, abortsSoFar }[]`, `failFor: Set<string>`, `reset()`), and `NoopCleanupTaskSubtree` in the CMS workflows tests.

**Test runner note:** API package: each test file runs with `yarn test <path>` and then `yarn test:os <path>` (one `test:os` run at a time).

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/__helpers/RecordingCleanupTaskSubtree.ts`:

```ts
import { CleanupTaskSubtreeUseCase } from "@webiny/background-tasks/api/features/CleanupTaskSubtree/index.js";
import { abortedTasks } from "./FakeTaskService.js";

export interface CleanupCall {
    taskId: string;
    /** How many tasks had been aborted when the cleanup was called (abort comes first, R256). */
    abortsSoFar: number;
}

/**
 * Stands in for the background-tasks cleanup, which the test containers do not register: records
 * every task id it is asked to clean up, and rejects for the ids in `failFor`, which the real
 * use case never does, to prove a throwing decorator cannot fail a review delete. Reset it with
 * `reset()` in `beforeEach`.
 */
export class RecordingCleanupTaskSubtree implements CleanupTaskSubtreeUseCase.Interface {
    public readonly calls: CleanupCall[] = [];
    public readonly failFor = new Set<string>();

    public async execute(taskId: string): Promise<void> {
        this.calls.push({ taskId, abortsSoFar: abortedTasks.length });
        if (this.failFor.has(taskId)) {
            throw new Error("The task store is down.");
        }
    }

    public reset(): void {
        this.calls.length = 0;
        this.failFor.clear();
    }
}

export const recordingCleanup = new RecordingCleanupTaskSubtree();
```

Modify `packages/api-workflows/__tests__/__helpers/handler.ts` (register the recording instance next to the task read; a test's own `registerInstance` in `params.setup` wins because it runs after).

Before:

```ts
import { GetTaskUseCase } from "@webiny/background-tasks/api/features/GetTask/index.js";
import { FakeTaskService } from "./FakeTaskService.js";
import { fakeGetTask } from "./FakeGetTask.js";
```

After:

```ts
import { GetTaskUseCase } from "@webiny/background-tasks/api/features/GetTask/index.js";
import { CleanupTaskSubtreeUseCase } from "@webiny/background-tasks/api/features/CleanupTaskSubtree/index.js";
import { FakeTaskService } from "./FakeTaskService.js";
import { fakeGetTask } from "./FakeGetTask.js";
import { recordingCleanup } from "./RecordingCleanupTaskSubtree.js";
```

Before:

```ts
            container.registerInstance(GetTaskUseCase, fakeGetTask);
```

After:

```ts
            container.registerInstance(GetTaskUseCase, fakeGetTask);
            // Deleting a review cleans up the tasks of its step attempts (R256); recorded here.
            container.registerInstance(CleanupTaskSubtreeUseCase, recordingCleanup);
```

Modify `packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts` (the definition test: no self cleanup any more).

Before:

```ts
    it("is one private definition with a high iteration ceiling that cleans itself up", async () => {
```

After:

```ts
    it("is one private definition with a high iteration ceiling that keeps its task (R256)", async () => {
```

Before:

```ts
            isPrivate: true,
            selfCleanup: "always",
            maxIterations: 10000
        });
        expect(definitions[0].description).toEqual(expect.any(String));
```

After:

```ts
            isPrivate: true,
            maxIterations: 10000
        });
        // No self cleanup and no database logs: the task stays until its review is deleted.
        expect(definitions[0].selfCleanup).toBeUndefined();
        expect(definitions[0].databaseLogs).toBeUndefined();
        expect(definitions[0].description).toEqual(expect.any(String));
```

Modify `packages/api-workflows/__tests__/review/CancelDeleteAbortTask.test.ts` (a review whose delete failed keeps its tasks, so nothing is cleaned up either).

Before:

```ts
import { abortedTasks, fakeTaskFaults, resetFakeTasks } from "~tests/__helpers/FakeTaskService.js";
```

After:

```ts
import { abortedTasks, fakeTaskFaults, resetFakeTasks } from "~tests/__helpers/FakeTaskService.js";
import { recordingCleanup } from "~tests/__helpers/RecordingCleanupTaskSubtree.js";
```

In the second `describe` ("DeleteTargetReviewsUseCase aborts the steps' tasks (R151)"), its `beforeEach`:

Before:

```ts
describe("DeleteTargetReviewsUseCase aborts the steps' tasks (R151)", () => {
    beforeEach(() => {
        resetFakeTasks();
        loggedErrors.length = 0;
    });
```

After:

```ts
describe("DeleteTargetReviewsUseCase aborts the steps' tasks (R151)", () => {
    beforeEach(() => {
        resetFakeTasks();
        recordingCleanup.reset();
        loggedErrors.length = 0;
    });
```

In its test "aborts nothing for a review whose delete failed":

Before:

```ts
        expect(failed.error?.code).toBe("Workflows/Review/Persistence");
        expect(expectOk(await reviews.get("review-1")).id).toBe("review-1");
        expect(abortedTasks).toEqual([]);
    });
```

After:

```ts
        expect(failed.error?.code).toBe("Workflows/Review/Persistence");
        expect(expectOk(await reviews.get("review-1")).id).toBe("review-1");
        expect(abortedTasks).toEqual([]);
        // The review is still there, so its task is too (R256).
        expect(recordingCleanup.calls).toEqual([]);
    });
```

Modify `packages/api-workflows/__tests__/review/DeleteTargetReviews.test.ts`. Imports:

Before:

```ts
import { describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    ARTICLE_MODEL,
    createRequestedReview,
    expectOk,
    reviewer,
    toSaveData
} from "~tests/__helpers/fixtures.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
```

After:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { abortedTasks, resetFakeTasks } from "~tests/__helpers/FakeTaskService.js";
import { recordingCleanup } from "~tests/__helpers/RecordingCleanupTaskSubtree.js";
import { createRunningAutomationReview } from "~tests/__helpers/stepRunReviews.js";
import {
    ARTICLE_MODEL,
    createRequestedReview,
    expectOk,
    reviewer,
    toSaveData
} from "~tests/__helpers/fixtures.js";
import type { ReviewData, ReviewStepRun } from "~/domain/review/types.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
```

Append at the end of the file:

```ts
const CLEANUP_FAILED = "Could not clean up the background task of a deleted review.";

const earlierRun = (taskId: string | null): ReviewStepRun => {
    return {
        taskId,
        startedOn: "2026-10-09T09:00:00.000Z",
        finishedOn: "2026-10-09T09:05:00.000Z",
        outcome: "failed",
        reason: "The automation failed."
    };
};

/**
 * review-1 on article-1#0001: the automation step is in review as `task-3` after two earlier
 * attempts (`task-1`, `task-2`); the second step carries `task-4` (a stored review may hold task
 * ids on any step).
 */
const createReviewWithTasks = (): ReviewData => {
    const base = toSaveData(createRunningAutomationReview("task-3"));
    const steps = base.steps.map((step, index) => {
        if (index === 0) {
            return { ...step, runs: [earlierRun("task-1"), earlierRun("task-2")] };
        }
        return { ...step, taskId: "task-4" };
    });
    return { ...base, steps };
};

describe("DeleteTargetReviewsUseCase cleans up the run tasks (R256, A93)", () => {
    beforeEach(() => {
        resetFakeTasks();
        recordingCleanup.reset();
        loggedErrors.length = 0;
    });

    const setup = async () => {
        const { context } = await createContextHandler({ setup: captureLoggedErrors });
        return {
            reviews: context.container.resolve(ReviewRepository),
            deleteTargetReviews: context.container.resolve(DeleteTargetReviewsUseCase)
        };
    };

    it("cleans up every task id of every step, after the abort", async () => {
        const { reviews, deleteTargetReviews } = await setup();
        expectOk(await reviews.save(createReviewWithTasks()));

        const result = expectOk(
            await deleteTargetReviews.execute({ model: ARTICLE_MODEL, targetId: "article-1" })
        );

        expect(result.deletedReviewIds).toEqual(["review-1"]);
        expect(recordingCleanup.calls.map(call => call.taskId)).toEqual([
            "task-1",
            "task-2",
            "task-3",
            "task-4"
        ]);
        // The in-review task is aborted first, then every cleanup runs.
        expect(abortedTasks).toEqual([{ id: "task-3", message: "The review was deleted." }]);
        expect(recordingCleanup.calls.map(call => call.abortsSoFar)).toEqual([1, 1, 1, 1]);
        expect(loggedErrors).toEqual([]);
    });

    it("cleans up the tasks of every deleted review and only of the deleted revision", async () => {
        const { reviews, deleteTargetReviews } = await setup();
        expectOk(await reviews.save(createReviewWithTasks()));
        expectOk(
            await reviews.save({
                ...toSaveData(createRunningAutomationReview("task-5")),
                id: "review-2",
                targetRevisionId: "article-1#0002"
            })
        );

        expectOk(
            await deleteTargetReviews.execute({
                model: ARTICLE_MODEL,
                targetId: "article-1",
                targetRevisionId: "article-1#0002"
            })
        );

        expect(recordingCleanup.calls.map(call => call.taskId)).toEqual(["task-5"]);

        recordingCleanup.reset();
        expectOk(
            await deleteTargetReviews.execute({ model: ARTICLE_MODEL, targetId: "article-1" })
        );

        // review-2 is gone already; review-1 is deleted now, with all of its tasks.
        expect(recordingCleanup.calls.map(call => call.taskId)).toEqual([
            "task-1",
            "task-2",
            "task-3",
            "task-4"
        ]);
    });

    it("skips null task ids and cleans up nothing for a review step", async () => {
        const { reviews, deleteTargetReviews } = await setup();
        const noTask = toSaveData(createRunningAutomationReview(null));
        expectOk(
            await reviews.save({
                ...noTask,
                steps: noTask.steps.map(step => ({ ...step, runs: [earlierRun(null)] }))
            })
        );
        expectOk(
            await reviews.save(
                toSaveData(
                    createRequestedReview({ id: "review-9", targetRevisionId: "article-9#0001" })
                )
            )
        );

        expectOk(
            await deleteTargetReviews.execute({ model: ARTICLE_MODEL, targetId: "article-1" })
        );
        expectOk(
            await deleteTargetReviews.execute({ model: ARTICLE_MODEL, targetId: "article-9" })
        );

        expect(recordingCleanup.calls).toEqual([]);
        expect(loggedErrors).toEqual([]);
    });

    it("logs a cleanup that throws, still cleans the other tasks and still deletes the review", async () => {
        const { reviews, deleteTargetReviews } = await setup();
        expectOk(await reviews.save(createReviewWithTasks()));
        recordingCleanup.failFor.add("task-2");

        const result = await deleteTargetReviews.execute({
            model: ARTICLE_MODEL,
            targetId: "article-1"
        });

        expect(expectOk(result).deletedReviewIds).toEqual(["review-1"]);
        expect((await reviews.get("review-1")).error?.code).toBe("Workflows/Review/NotFound");
        // task-2 was tried; the calls after it still ran.
        expect(recordingCleanup.calls.map(call => call.taskId)).toEqual([
            "task-1",
            "task-2",
            "task-3",
            "task-4"
        ]);
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe(CLEANUP_FAILED);
        expect(loggedErrors[0].fields).toMatchObject({ reviewId: "review-1", taskId: "task-2" });
    });
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run each file on its own:
`yarn test packages/api-workflows/__tests__/review/DeleteTargetReviews.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/review/CancelDeleteAbortTask.test.ts 2>&1 | tail -50`
Expected: FAIL. `DeleteTargetReviews.test.ts`: three of the four cleanup cases (every id, deleted revision only, throwing cleanup) fail because `recordingCleanup.calls` is `[]` where the task ids are expected (the use case does not clean up yet); the null-id case passes both before and after. `WorkflowStepRunTask.test.ts`: the definition test fails (`expected "always" to be undefined`). `CancelDeleteAbortTask.test.ts` passes (it pins that nothing is cleaned up for a failed delete, which holds before and after).

- [ ] **Step 3: Implement**

Modify `packages/api-workflows/src/features/stepRun/WorkflowStepRunTask/WorkflowStepRunTaskDefinition.ts`. The doc comment now says the task is kept, and `selfCleanup` goes.

Before:

```ts
 * The task cleans itself up (R179). Every outcome is already on the step: success through the
 * runner, failure and abort through the fixed-text `onError` / `onAbort` hooks (raw errors live
 * only in the logs). Background tasks run the definition's own hook first and delete the task
 * after it, so the step is written before the task is gone, and turn the task's database logs
 * off (an abort still writes one log row, which the cleanup now deletes). A step whose task is
 * gone is handled by `StuckStepService` (grace from the step start).
 */
```

After:

```ts
 * The task is kept (R256). Every outcome is already on the step: success through the runner,
 * failure and abort through the fixed-text `onError` / `onAbort` hooks (raw errors live only in
 * the logs). No self cleanup is set, so the task stays after the step ends: workflows reads it
 * for the details drawer (`GetReviewStepRunUseCase`), and `DeleteTargetReviewsUseCase` cleans up
 * the task of every attempt when its review is deleted. The definition sets no `databaseLogs`
 * (an abort still writes one log row, which that cleanup deletes with the task). A step whose
 * task is gone is handled by `StuckStepService` (grace from the step start).
 */
```

Before:

```ts
    public readonly maxIterations = STEP_RUN_MAX_ITERATIONS;
    public readonly selfCleanup = "always" as const;
```

After:

```ts
    public readonly maxIterations = STEP_RUN_MAX_ITERATIONS;
```

Modify `packages/api-workflows/src/features/review/DeleteTargetReviews/DeleteTargetReviewsUseCase.ts`.

Before:

```ts
import { Result } from "@webiny/feature/api";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
```

After:

```ts
import { Result } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { CleanupTaskSubtreeUseCase } from "@webiny/background-tasks/api/features/CleanupTaskSubtree/index.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
```

Before:

```ts
        private assignmentPageSize: AssignmentPageSize.Interface,
        private taskAbort: ReviewTaskAbortService.Interface
    ) {}
```

After:

```ts
        private assignmentPageSize: AssignmentPageSize.Interface,
        private taskAbort: ReviewTaskAbortService.Interface,
        private cleanupTask: CleanupTaskSubtreeUseCase.Interface,
        private logger: Logger.Interface
    ) {}
```

Before:

```ts
            await this.taskAbort.abort({ taskIds, message: "The review was deleted." });
        }

        return Result.ok({ deletedReviewIds });
```

After:

```ts
            await this.taskAbort.abort({ taskIds, message: "The review was deleted." });

            // The run tasks are kept until their review goes (R256): clean up the task of every
            // attempt, earlier attempts oldest first and then the current one. The cleanup
            // documents that it never throws, but a decorator may, so each call has its own
            // `try`: a failure is logged and never fails the delete (the review is already gone,
            // so nothing retries it).
            const taskIdsToClean: string[] = [];
            for (const step of review.steps) {
                for (const run of step.runs) {
                    if (run.taskId) {
                        taskIdsToClean.push(run.taskId);
                    }
                }
                if (step.taskId) {
                    taskIdsToClean.push(step.taskId);
                }
            }
            for (const taskId of taskIdsToClean) {
                try {
                    await this.cleanupTask.execute(taskId);
                } catch (error) {
                    this.logger.error(
                        { error, reviewId: review.id, taskId },
                        "Could not clean up the background task of a deleted review."
                    );
                }
            }
        }

        return Result.ok({ deletedReviewIds });
```

Before:

```ts
    dependencies: [
        ReviewRepository,
        AssignmentRepository,
        AssignmentPageSize,
        ReviewTaskAbortService
    ]
```

After:

```ts
    dependencies: [
        ReviewRepository,
        AssignmentRepository,
        AssignmentPageSize,
        ReviewTaskAbortService,
        CleanupTaskSubtreeUseCase,
        Logger
    ]
```

Update the doc comment of the abstraction in `packages/api-workflows/src/features/review/DeleteTargetReviews/abstractions.ts` (one added paragraph, no signature change).

Before:

```ts
 * left behind by a deleted workflow are removed too.
 */
```

After:

```ts
 * left behind by a deleted workflow are removed too.
 *
 * Also cleans up the background task of every step attempt (`taskId` and `runs[].taskId`), which
 * workflows keeps until the review is deleted (R256). A cleanup that fails is logged, never fails
 * the delete.
 */
```

Register a `CleanupTaskSubtreeUseCase` for the other test containers that register `WorkflowsFeature` without the background-tasks feature (the use case now depends on it).

Create `packages/api-headless-cms-workflows/__tests__/__helpers/NoopCleanupTaskSubtree.ts`:

```ts
import { CleanupTaskSubtreeUseCase } from "@webiny/background-tasks/api/features/CleanupTaskSubtree/index.js";

/**
 * `CleanupTaskSubtreeUseCase` for contexts that register the workflows feature but no
 * background-tasks feature: deleting a review cleans up the tasks of its step attempts (R256).
 * There is no task store here, so it does nothing.
 */
export const NoopCleanupTaskSubtree: CleanupTaskSubtreeUseCase.Interface = {
    execute: async () => undefined
};
```

Modify `packages/api-headless-cms-workflows/__tests__/__handler/context.ts`.

Before:

```ts
import { GetTaskUseCase } from "@webiny/background-tasks/api/features/GetTask/index.js";
import { NoopGetTask } from "../__helpers/NoopGetTask.js";
```

After:

```ts
import { GetTaskUseCase } from "@webiny/background-tasks/api/features/GetTask/index.js";
import { CleanupTaskSubtreeUseCase } from "@webiny/background-tasks/api/features/CleanupTaskSubtree/index.js";
import { NoopGetTask } from "../__helpers/NoopGetTask.js";
import { NoopCleanupTaskSubtree } from "../__helpers/NoopCleanupTaskSubtree.js";
```

Before:

```ts
            container.registerInstance(GetTaskUseCase, NoopGetTask);
```

After:

```ts
            container.registerInstance(GetTaskUseCase, NoopGetTask);
            // Deleting a review cleans up its step tasks (R256); no background tasks here.
            container.registerInstance(CleanupTaskSubtreeUseCase, NoopCleanupTaskSubtree);
```

Modify `packages/ai-powerups/__tests__/__helpers/createAiStepContext.ts`.

Before:

```ts
import { GetTaskUseCase } from "@webiny/background-tasks/api/features/GetTask/index.js";
```

After:

```ts
import { GetTaskUseCase } from "@webiny/background-tasks/api/features/GetTask/index.js";
import { CleanupTaskSubtreeUseCase } from "@webiny/background-tasks/api/features/CleanupTaskSubtree/index.js";
```

Before:

```ts
            container.registerInstance(GetTaskUseCase, { execute: async () => null });
```

After:

```ts
            container.registerInstance(GetTaskUseCase, { execute: async () => null });
            // Deleting a review cleans up its step tasks (R256); there is no task store here.
            container.registerInstance(CleanupTaskSubtreeUseCase, { execute: async () => undefined });
```

(Checked in the consistency pass: the CMS context imports `GetTaskUseCase` then `NoopGetTask` on lines 12-13 and registers `NoopGetTask` on line 61; `createAiStepContext.ts` imports `GetTaskUseCase` on line 7 and registers it on line 98. `api-website-builder-workflows` needs no change: its context registers `BackgroundTasksFeature`, which registers the real `CleanupTaskSubtreeUseCase`.)

- [ ] **Step 4: Run the tests to see them pass**

Run each file on its own:
`yarn test packages/api-workflows/__tests__/review/DeleteTargetReviews.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/review/CancelDeleteAbortTask.test.ts 2>&1 | tail -50`
Expected: PASS for each.

Run the same three with `yarn test:os` (one at a time).
Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

The delete use case is resolved by every delete hook of the three app packages and by the registration test, so run the files that delete reviews:
`yarn test packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/stepRun/StuckStepService.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/stepRun/ReviewTaskAbortService.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/hooks/trashAndDelete.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/hooks/privateModelRevisionDelete.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/graphql/pageRevisionDelete.test.ts 2>&1 | tail -50`
`yarn test packages/ai-powerups/__tests__/features/WorkflowReview/AiStep.e2e.test.ts 2>&1 | tail -50` (this file deletes entries through `ProbeUpdateEntry`, so it proves the ai-powerups registration; the registration test uses a bare container and does not)
`yarn test packages/api-website-builder-workflows/__tests__/target/WbPageTrashAndDelete.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/target/WbPageRevisionDelete.test.ts 2>&1 | tail -50`
Expected: PASS for each. Run the `api-workflows`, `api-headless-cms-workflows`, `api-website-builder-workflows` and `ai-powerups` `AiStep.e2e.test.ts` files again with `yarn test:os` (one at a time).

Prove A93's cleanup side (no code change, a unit test over the real `createCleanupTaskSubtree`):
`yarn test packages/background-tasks/__tests__/crud/cleanupTaskSubtree.test.ts 2>&1 | tail -30`
Expected: PASS (it deletes a task's logs even when `databaseLogs` is false, the descendant tree bottom-up, and is idempotent on a missing root id).

Run: `yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40`, then the same with `-p api-headless-cms-workflows` and `-p ai-powerups`.
Expected: no errors. (If `container.registerInstance(CleanupTaskSubtreeUseCase, { execute: async () => undefined })` complains about the object literal, give it the annotation `const noopCleanup: CleanupTaskSubtreeUseCase.Interface = { execute: async () => undefined };` first.)

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain of phase 8a (`docs/.bruno/plans/2026-10-16-workflows-phase-8a/00-shared.md`) in full: `git add .`, `yarn > /dev/null 2>&1`, `node scripts/generateTsConfigsInPackages.js`, `yarn adio`, `yarn check-ts-configs`, `yarn format:fix > /dev/null 2>&1`, `yarn lint:fix`, `yarn webiny sync-dependencies`, `yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30`, `git add .`. Restore `.gitleaks.toml` (`git checkout -- .gitleaks.toml`); never commit it, `docs/.reports` or `.superpowers`. If any step fails and you fix something, rerun the chain from the start. Then commit:

```
git commit -m "feat(api-workflows): keep the step run task until its review is deleted" -m "The workflowsStepRun task no longer cleans itself up. Deleting a review cleans up the task of every step attempt; a cleanup that fails is logged and never fails the delete." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

## Contract notes

- R256 names the dependency path "Task 3 verifies the deep path, else uses `@webiny/background-tasks/api`": verified, `@webiny/background-tasks/api/features/CleanupTaskSubtree/index.js` exists (`index.ts` exports the abstraction and the impl) and `packages/background-tasks/package.json` is consumed through `"./*"`; the plan uses the deep path, as `StuckStepService` does for `GetTaskUseCase`.
- The contract's file list for Task 3 names only the definition, the use case and the tests. The use case now resolves `CleanupTaskSubtreeUseCase`, which no API test container registers, so the test containers of `api-workflows`, `api-headless-cms-workflows` and `ai-powerups` gain a registration (listed under **Files**). `api-website-builder-workflows` already registers `BackgroundTasksFeature`.
- A93's proof is the existing `cleanupTaskSubtree` unit test (the container-level proof would need a real background-tasks store, which no API test container in these packages has); the definition-side half is pinned by the definition test.
- The abstraction doc comment of `DeleteTargetReviewsUseCase` gains a paragraph (not in the contract's list; wording only).
- `ReviewTaskAbortService` and the `FakeTaskService` comments still say a task can be gone "because it cleaned itself up (R179)". They stay valid for the "task gone" branch (a review deleted earlier, an admin deleting the task) and are not changed by this task.
