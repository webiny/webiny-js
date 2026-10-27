### Task 13: Cancel and delete abort the task

Spec 5.1, 7.4; D25, D57; R144, R151; Review Focus 1. An automation step that is `inReview` has a background task running (or about to run its next iteration). When the review ends from outside the task, the task must stop instead of running on for a review that is gone:

- `CancelReviewUseCase` aborts the task of the current step after the cancel is saved. It reads the step before `review.cancel` (a cancel clears the current step): the step with `id === currentStepId`, only when it is `inReview` and carries a `taskId` (a `failed` step keeps its `taskId` but nothing runs any more; a `pending` step has none). It calls `ReviewTaskAbortService.abort({ taskIds, message: "The review was cancelled." })` (Task 9: never throws, logs failures, no call for an empty list) once the cancel is persisted: the save succeeded, or it failed only in the target sync (`ReviewTargetSyncError`, the review is saved and cancelled all the same, R16). A cancel whose save failed, and one refused by the aggregate, abort nothing: the review is still in progress and its task keeps running. Abort failures never change the result (R151). `CancelTargetReviewsUseCase` goes through `CancelReviewUseCase`, so trashing or deleting content with a review in progress aborts the task too.
- `DeleteTargetReviewsUseCase` aborts, for every review it deletes, the task of the in-review current step (same rule) with the message `The review was deleted.`, after that review's row is deleted (records first, then the review, then the abort). A review whose delete failed aborts nothing, and the use case still stops at the first failure as before.
- The aborted task's own `onAbort` hook (Task 11) then finds the review cancelled or gone, the stale guard (R144) returns a reason, and it writes nothing: pinned in Task 11. A task that is mid-iteration when the abort lands can still finish its iteration; its outcome write is discarded by the same guard (the review is not active or does not exist).

No new exports.

**Files:**
- Modify: `packages/api-workflows/src/features/review/CancelReview/CancelReviewUseCase.ts`
- Modify: `packages/api-workflows/src/features/review/DeleteTargetReviews/DeleteTargetReviewsUseCase.ts`
- Create: `packages/api-workflows/__tests__/review/CancelDeleteAbortTask.test.ts`

**Interfaces:**
- Consumes:
  - Task 9: `ReviewTaskAbortService` (`~/features/stepRun/ReviewTaskAbortService/index.js`), `abort(params: { taskIds: string[]; message: string }): Promise<void>`; test seams `FakeTaskService` (registered by default in `createContextHandler`), `abortedTasks: AbortedTask[]` (`{ id; message }`), `fakeTaskFaults`, `resetFakeTasks()` (`~tests/__helpers/FakeTaskService.js`), `FailingReviewSave`, `reviewSaveFaults` (`~tests/__helpers/FailingReviewSave.js`).
  - Task 5: test helpers `createRunningAutomationReview(taskId)`, `createFailedAutomationReview()` (`~tests/__helpers/stepRunReviews.js`); `ReviewData.steps[].taskId` (Task 4).
  - Existing: `CancelReviewUseCase` (`execute({ reviewId, actor, reason? })`), `CancelTargetReviewsUseCase`, `DeleteTargetReviewsUseCase`, `ReviewSaver`, `ReviewTargetSyncError` (`~/domain/review/errors.js`), `ReviewRepository`, `AssignmentRepository`, `AssignmentPersistenceError`, `captureLoggedErrors` / `loggedErrors`, `FailingReviewTargetSync`, `createRequestedReview`, `toSaveData`, `expectOk`, `ARTICLE_MODEL`, `requester`.
- Produces: nothing new. `CancelReviewUseCase` gains the dependency `ReviewTaskAbortService`, `DeleteTargetReviewsUseCase` the dependency `ReviewTaskAbortService` (constructor parameter appended last in both).

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/review/CancelDeleteAbortTask.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/feature/api";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import {
    abortedTasks,
    fakeTaskFaults,
    resetFakeTasks
} from "~tests/__helpers/FakeTaskService.js";
import { FailingReviewSave, reviewSaveFaults } from "~tests/__helpers/FailingReviewSave.js";
import { FailingReviewTargetSync } from "~tests/__helpers/FailingReviewTargetSync.js";
import {
    createFailedAutomationReview,
    createRunningAutomationReview
} from "~tests/__helpers/stepRunReviews.js";
import {
    ARTICLE_MODEL,
    createRequestedReview,
    expectOk,
    requester,
    toSaveData
} from "~tests/__helpers/fixtures.js";
import type { ReviewData } from "~/domain/review/types.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import { AssignmentPersistenceError } from "~/domain/assignment/errors.js";
import { CancelReviewUseCase } from "~/features/review/CancelReview/index.js";
import { CancelTargetReviewsUseCase } from "~/features/review/CancelTargetReviews/index.js";
import { DeleteTargetReviewsUseCase } from "~/features/review/DeleteTargetReviews/index.js";

/** An in-review automation step with the task `taskId` on the given revision of a target. */
const runningReview = (id: string, taskId: string, targetRevisionId: string): ReviewData => {
    return {
        ...toSaveData(createRunningAutomationReview(taskId)),
        id,
        targetId: targetRevisionId.split("#")[0],
        targetRevisionId
    };
};

const setup = async (extraSetup?: (container: Container) => void) => {
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerDecorator(FailingReviewSave);
            extraSetup?.(container);
        }
    });
    return {
        context,
        reviews: context.container.resolve(ReviewRepository),
        cancel: context.container.resolve(CancelReviewUseCase)
    };
};

describe("CancelReviewUseCase aborts the step's task (D25, R151)", () => {
    beforeEach(() => {
        resetFakeTasks();
        loggedErrors.length = 0;
        reviewSaveFaults.failNext = false;
    });

    it("aborts the task of the in-review automation step after the cancel is saved", async () => {
        const { reviews, cancel } = await setup();
        expectOk(await reviews.save(runningReview("review-1", "task-1", "article-1#0001")));

        const cancelled = expectOk(await cancel.execute({ reviewId: "review-1", actor: requester }));

        expect(cancelled.state).toBe("cancelled");
        expect(expectOk(await reviews.get("review-1")).state).toBe("cancelled");
        expect(abortedTasks).toEqual([{ id: "task-1", message: "The review was cancelled." }]);
    });

    it("aborts nothing for a review step, a failed step or a step without a task id", async () => {
        const { reviews, cancel } = await setup();
        expectOk(await reviews.save(toSaveData(createRequestedReview({ id: "review-1" }))));
        expectOk(
            await reviews.save({
                ...toSaveData(createFailedAutomationReview()),
                id: "review-2",
                targetRevisionId: "article-1#0002"
            })
        );
        const noTask = toSaveData(createRunningAutomationReview(null));
        expectOk(
            await reviews.save({
                ...noTask,
                id: "review-4",
                targetRevisionId: "article-1#0004"
            })
        );

        for (const reviewId of ["review-1", "review-2", "review-4"]) {
            expectOk(await cancel.execute({ reviewId, actor: requester }));
        }

        expect(abortedTasks).toEqual([]);
    });

    it("aborts nothing when the cancel is refused or its save fails", async () => {
        const { reviews, cancel } = await setup();
        expectOk(await reviews.save(runningReview("review-1", "task-1", "article-1#0001")));
        expectOk(await cancel.execute({ reviewId: "review-1", actor: requester }));
        resetFakeTasks();
        expectOk(await reviews.save(runningReview("review-2", "task-2", "article-1#0002")));
        reviewSaveFaults.failNext = true;

        const refused = await cancel.execute({ reviewId: "review-1", actor: requester });
        const failed = await cancel.execute({ reviewId: "review-2", actor: requester });

        expect(refused.error?.code).toBe("Workflows/Review/InvalidState");
        expect(failed.error?.code).toBe("Workflows/Review/Persistence");
        expect(abortedTasks).toEqual([]);
        expect(expectOk(await reviews.get("review-2")).state).toBe("inProgress");
    });

    it("still aborts when the cancel was saved but the target sync failed (R16)", async () => {
        const { reviews, cancel } = await setup(container => {
            container.register(FailingReviewTargetSync);
        });
        expectOk(await reviews.save(runningReview("review-1", "task-1", "article-1#0001")));

        const result = await cancel.execute({ reviewId: "review-1", actor: requester });

        expect(result.error?.code).toBe("Workflows/Review/TargetSync");
        expect(expectOk(await reviews.get("review-1")).state).toBe("cancelled");
        expect(abortedTasks).toEqual([{ id: "task-1", message: "The review was cancelled." }]);
    });

    it("never fails the cancel because the abort failed or threw", async () => {
        const { reviews, cancel } = await setup();
        expectOk(await reviews.save(runningReview("review-1", "task-1", "article-1#0001")));
        expectOk(await reviews.save(runningReview("review-2", "task-2", "article-1#0002")));

        fakeTaskFaults.abort = "fail";
        const failedAbort = await cancel.execute({ reviewId: "review-1", actor: requester });
        fakeTaskFaults.abort = "throw";
        const thrownAbort = await cancel.execute({ reviewId: "review-2", actor: requester });

        expect(failedAbort.isOk()).toBe(true);
        expect(thrownAbort.isOk()).toBe(true);
        expect(abortedTasks.map(task => task.id)).toEqual(["task-1", "task-2"]);
        expect(loggedErrors).toHaveLength(2);
    });

    it("aborts the task when content is trashed or deleted with the review in progress", async () => {
        const { context, reviews } = await setup();
        expectOk(await reviews.save(runningReview("review-1", "task-1", "article-1#0001")));
        expectOk(await reviews.save(runningReview("review-2", "task-2", "article-2#0001")));

        const cancelled = expectOk(
            await context.container.resolve(CancelTargetReviewsUseCase).execute({
                model: ARTICLE_MODEL,
                targetId: "article-1",
                actor: requester,
                reason: "The content was trashed."
            })
        );

        expect(cancelled.map(review => review.id)).toEqual(["review-1"]);
        expect(abortedTasks).toEqual([{ id: "task-1", message: "The review was cancelled." }]);
    });
});

describe("DeleteTargetReviewsUseCase aborts the steps' tasks (R151)", () => {
    beforeEach(() => {
        resetFakeTasks();
        loggedErrors.length = 0;
    });

    /**
     * article-1#0001: review-1 (task-1); article-1#0002: review-2 (task-2);
     * article-1#0003: review-3 on a review step; article-2#0001: review-4 (task-4).
     */
    const createTargetData = async (extraSetup?: (container: Container) => void) => {
        const { context, reviews } = await setup(extraSetup);
        expectOk(await reviews.save(runningReview("review-1", "task-1", "article-1#0001")));
        expectOk(await reviews.save(runningReview("review-2", "task-2", "article-1#0002")));
        expectOk(
            await reviews.save({
                ...toSaveData(createRequestedReview()),
                id: "review-3",
                targetRevisionId: "article-1#0003"
            })
        );
        expectOk(await reviews.save(runningReview("review-4", "task-4", "article-2#0001")));
        return {
            context,
            reviews,
            deleteTargetReviews: context.container.resolve(DeleteTargetReviewsUseCase)
        };
    };

    it("aborts the in-review automation task of every deleted review", async () => {
        const { reviews, deleteTargetReviews } = await createTargetData();

        const result = expectOk(
            await deleteTargetReviews.execute({ model: ARTICLE_MODEL, targetId: "article-1" })
        );

        expect([...result.deletedReviewIds].sort()).toEqual(["review-1", "review-2", "review-3"]);
        expect((await reviews.get("review-1")).error?.code).toBe("Workflows/Review/NotFound");
        expect([...abortedTasks].sort((a, b) => a.id.localeCompare(b.id))).toEqual([
            { id: "task-1", message: "The review was deleted." },
            { id: "task-2", message: "The review was deleted." }
        ]);
        expect(expectOk(await reviews.get("review-4")).id).toBe("review-4");
    });

    it("aborts only the tasks of the deleted revision", async () => {
        const { deleteTargetReviews } = await createTargetData();

        expectOk(
            await deleteTargetReviews.execute({
                model: ARTICLE_MODEL,
                targetId: "article-1",
                targetRevisionId: "article-1#0002"
            })
        );

        expect(abortedTasks).toEqual([{ id: "task-2", message: "The review was deleted." }]);
    });

    it("aborts nothing for a review whose delete failed", async () => {
        const { context } = await setup();
        const assignments = context.container.resolve(AssignmentRepository);
        const reviews = context.container.resolve(ReviewRepository);
        expectOk(await reviews.save(runningReview("review-1", "task-1", "article-1#0001")));
        context.container.registerInstance(AssignmentRepository, {
            create: values => assignments.create(values),
            list: async () =>
                Result.fail(new AssignmentPersistenceError(new Error("Storage is down."))),
            delete: id => assignments.delete(id)
        });

        const failed = await context.container
            .resolve(DeleteTargetReviewsUseCase)
            .execute({ model: ARTICLE_MODEL, targetId: "article-1" });

        expect(failed.error?.code).toBe("Workflows/Review/Persistence");
        expect(expectOk(await reviews.get("review-1")).id).toBe("review-1");
        expect(abortedTasks).toEqual([]);
    });

    it("never fails the delete because the abort failed or threw", async () => {
        const { deleteTargetReviews } = await createTargetData();
        fakeTaskFaults.abort = "fail";

        const failedAbort = await deleteTargetReviews.execute({
            model: ARTICLE_MODEL,
            targetId: "article-1",
            targetRevisionId: "article-1#0001"
        });
        fakeTaskFaults.abort = "throw";
        const thrownAbort = await deleteTargetReviews.execute({
            model: ARTICLE_MODEL,
            targetId: "article-1",
            targetRevisionId: "article-1#0002"
        });

        expect(failedAbort.value?.deletedReviewIds).toEqual(["review-1"]);
        expect(thrownAbort.value?.deletedReviewIds).toEqual(["review-2"]);
        expect(abortedTasks.map(task => task.id)).toEqual(["task-1", "task-2"]);
        expect(loggedErrors).toHaveLength(2);
    });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/review/CancelDeleteAbortTask.test.ts 2>&1 | tail -50`
Expected: FAIL. Every test that expects an abort fails with `abortedTasks` equal to `[]` (neither use case aborts yet); the "aborts nothing" tests pass.

Run the same with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/review/CancelDeleteAbortTask.test.ts 2>&1 | tail -50`
Expected: FAIL, same reason.

- [ ] **Step 3: Cancel aborts**

Replace `packages/api-workflows/src/features/review/CancelReview/CancelReviewUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import { ReviewTargetSyncError } from "~/domain/review/errors.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewTaskAbortService } from "~/features/stepRun/ReviewTaskAbortService/index.js";
import { ReviewSaver } from "../ReviewSaver/abstractions.js";
import { CancelReviewUseCase as UseCase } from "./abstractions.js";

class CancelReviewUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private saver: ReviewSaver.Interface,
        private taskAbort: ReviewTaskAbortService.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const loaded = await this.repository.get(input.reviewId);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        const review = Review.fromData(loaded.value);

        // The running task of the current step, read before the cancel clears the current step
        // (D25, R151). Only an in-review step has one running.
        const current = loaded.value.steps.find(step => step.id === loaded.value.currentStepId);
        const taskIds =
            current && current.state === "inReview" && current.taskId ? [current.taskId] : [];

        const cancelled = review.cancel({
            actor: input.actor,
            now: new Date().toISOString(),
            reason: input.reason
        });
        if (cancelled.isFail()) {
            return Result.fail(cancelled.error);
        }

        const saved = await this.saver.save(review);
        // Abort once the cancel is persisted: the save succeeded, or only the target sync failed
        // (R16) and the review is cancelled all the same. A failed save leaves the review in
        // progress, so its task keeps running. An abort failure is logged by the service and never
        // changes the result (R151).
        if (saved.isOk() || saved.error instanceof ReviewTargetSyncError) {
            await this.taskAbort.abort({ taskIds, message: "The review was cancelled." });
        }
        return saved;
    }
}

export const CancelReviewUseCase = UseCase.createImplementation({
    implementation: CancelReviewUseCaseImpl,
    dependencies: [ReviewRepository, ReviewSaver, ReviewTaskAbortService]
});
```

- [ ] **Step 4: Delete aborts**

Replace `packages/api-workflows/src/features/review/DeleteTargetReviews/DeleteTargetReviewsUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import { ReviewPersistenceError } from "~/domain/review/errors.js";
import { ReviewTaskAbortService } from "~/features/stepRun/ReviewTaskAbortService/index.js";
import { AssignmentPageSize } from "./AssignmentPageSize.js";
import { DeleteTargetReviewsUseCase as UseCase } from "./abstractions.js";

class DeleteTargetReviewsUseCaseImpl implements UseCase.Interface {
    constructor(
        private reviewRepository: ReviewRepository.Interface,
        private assignmentRepository: AssignmentRepository.Interface,
        private assignmentPageSize: AssignmentPageSize.Interface,
        private taskAbort: ReviewTaskAbortService.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const listed = await this.reviewRepository.listByTarget({
            model: input.model,
            targetId: input.targetId,
            targetRevisionId: input.targetRevisionId ?? undefined
        });
        if (listed.isFail()) {
            return Result.fail(listed.error);
        }

        const deletedReviewIds: string[] = [];
        for (const review of listed.value) {
            // Records first: a failure leaves the review in place, so a retry finds it again.
            // Every record id is collected first, so deleting does not shift the cursor pages (R23).
            const recordIds: string[] = [];
            let after: string | null = null;
            do {
                const page: Awaited<ReturnType<AssignmentRepository.Interface["list"]>> =
                    await this.assignmentRepository.list({
                        where: { reviewId: review.id },
                        limit: this.assignmentPageSize.value,
                        after
                    });
                if (page.isFail()) {
                    return Result.fail(new ReviewPersistenceError(page.error));
                }
                recordIds.push(...page.value.items.map(item => item.id));
                after = page.value.meta.hasMoreItems ? page.value.meta.cursor : null;
            } while (after);

            for (const recordId of recordIds) {
                const recordDeleted = await this.assignmentRepository.delete(recordId);
                if (recordDeleted.isFail()) {
                    return Result.fail(new ReviewPersistenceError(recordDeleted.error));
                }
            }
            const deleted = await this.reviewRepository.delete(review.id);
            if (deleted.isFail()) {
                return Result.fail(deleted.error);
            }
            deletedReviewIds.push(review.id);

            // The review is gone, so the task of its in-review step must stop (R151). Only an
            // in-review step has one running. An abort failure is logged by the service and never
            // fails the delete.
            const current = review.steps.find(step => step.id === review.currentStepId);
            const taskIds =
                current && current.state === "inReview" && current.taskId ? [current.taskId] : [];
            await this.taskAbort.abort({ taskIds, message: "The review was deleted." });
        }

        return Result.ok({ deletedReviewIds });
    }
}

export const DeleteTargetReviewsUseCase = UseCase.createImplementation({
    implementation: DeleteTargetReviewsUseCaseImpl,
    dependencies: [ReviewRepository, AssignmentRepository, AssignmentPageSize, ReviewTaskAbortService]
});
```

- [ ] **Step 5: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/review/CancelDeleteAbortTask.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/review/CancelDeleteAbortTask.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|headless-cms-workflows|website-builder-workflows|background-tasks" | head`
Expected: no output.

- [ ] **Step 6: Run the existing tests covering the changed code**

Run: `yarn test packages/api-workflows/__tests__/review/ReviewTransitions.test.ts packages/api-workflows/__tests__/review/CancelTargetReviews.test.ts packages/api-workflows/__tests__/review/DeleteTargetReviews.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/review/ReviewTransitions.test.ts packages/api-workflows/__tests__/review/CancelTargetReviews.test.ts packages/api-workflows/__tests__/review/DeleteTargetReviews.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 7: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
feat(api-workflows): abort the step's background task when its review is cancelled or deleted

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
