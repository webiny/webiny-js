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
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import { AssignmentPersistenceError } from "~/domain/assignment/errors.js";
import type { AssignmentRecordValues } from "~/domain/assignment/types.js";
import { AssignmentPageSize } from "~/features/review/DeleteTargetReviews/AssignmentPageSize.js";
import { DeleteTargetReviewsUseCase } from "~/features/review/DeleteTargetReviews/index.js";

const record = (reviewId: string, assignedOn: string): AssignmentRecordValues => {
    return {
        reviewId,
        workflowId: "workflow-1",
        stepId: "legal",
        userId: reviewer.id,
        assignedOn,
        source: "picked",
        ruleId: null,
        by: null,
        reason: null,
        kind: "outcome"
    };
};

/**
 * article-1#0001: review-1 with three assignment records; article-1#0002: review-2;
 * article-2#0001: review-3 with one record.
 */
const createTargetData = async (pageSize?: number) => {
    const { context } = await createContextHandler();
    if (pageSize) {
        context.container.registerInstance(AssignmentPageSize, { value: pageSize });
    }
    const reviews = context.container.resolve(ReviewRepository);
    const assignments = context.container.resolve(AssignmentRepository);
    const faults = { failDeleteOnce: false };
    // The use case gets this wrapper; the test keeps using the real repository.
    context.container.registerInstance(AssignmentRepository, {
        create: values => assignments.create(values),
        list: params => assignments.list(params),
        delete: async id => {
            if (faults.failDeleteOnce) {
                faults.failDeleteOnce = false;
                return Result.fail(new AssignmentPersistenceError(new Error("Storage is down.")));
            }
            return assignments.delete(id);
        }
    });

    expectOk(await reviews.save(toSaveData(createRequestedReview({ id: "review-1" }))));
    expectOk(
        await reviews.save(
            toSaveData(
                createRequestedReview({ id: "review-2", targetRevisionId: "article-1#0002" })
            )
        )
    );
    expectOk(
        await reviews.save(
            toSaveData(
                createRequestedReview({ id: "review-3", targetRevisionId: "article-2#0001" })
            )
        )
    );
    for (const hour of ["10", "11", "12"]) {
        expectOk(await assignments.create(record("review-1", `2026-10-09T${hour}:00:00.000Z`)));
    }
    expectOk(await assignments.create(record("review-3", "2026-10-09T10:00:00.000Z")));

    return {
        reviews,
        assignments,
        faults,
        deleteTargetReviews: context.container.resolve(DeleteTargetReviewsUseCase)
    };
};

describe("DeleteTargetReviewsUseCase", () => {
    it("deletes a target's reviews and their assignment records", async () => {
        const { reviews, assignments, deleteTargetReviews } = await createTargetData();

        const result = expectOk(
            await deleteTargetReviews.execute({ model: ARTICLE_MODEL, targetId: "article-1" })
        );

        expect([...result.deletedReviewIds].sort()).toEqual(["review-1", "review-2"]);
        expect((await reviews.get("review-1")).error?.code).toBe("Workflows/Review/NotFound");
        expect((await reviews.get("review-2")).error?.code).toBe("Workflows/Review/NotFound");
        const records = expectOk(await assignments.list({ where: { reviewId: "review-1" } }));
        expect(records.items).toEqual([]);

        // Another target keeps its review and records.
        expect(expectOk(await reviews.get("review-3")).id).toBe("review-3");
        const kept = expectOk(await assignments.list({ where: { reviewId: "review-3" } }));
        expect(kept.items).toHaveLength(1);
    });

    it("deletes only the reviews of one revision when it is given", async () => {
        const { reviews, assignments, deleteTargetReviews } = await createTargetData();

        const result = expectOk(
            await deleteTargetReviews.execute({
                model: ARTICLE_MODEL,
                targetId: "article-1",
                targetRevisionId: "article-1#0002"
            })
        );

        expect(result.deletedReviewIds).toEqual(["review-2"]);
        expect(expectOk(await reviews.get("review-1")).id).toBe("review-1");
        const records = expectOk(await assignments.list({ where: { reviewId: "review-1" } }));
        expect(records.items).toHaveLength(3);
    });

    it("deletes nothing for a target without reviews", async () => {
        const { deleteTargetReviews } = await createTargetData();

        const result = expectOk(
            await deleteTargetReviews.execute({ model: ARTICLE_MODEL, targetId: "article-9" })
        );

        expect(result.deletedReviewIds).toEqual([]);
    });

    it("treats an already deleted review or record as deleted", async () => {
        const { reviews, assignments } = await createTargetData();

        expectOk(await reviews.delete("review-1"));
        const again = await reviews.delete("review-1");
        const missingRecord = await assignments.delete("missing-record");

        expect(again.isOk()).toBe(true);
        expect(missingRecord.isOk()).toBe(true);
    });

    it("deletes every assignment record when they span several pages", async () => {
        const { assignments, deleteTargetReviews } = await createTargetData(2);

        expectOk(
            await deleteTargetReviews.execute({ model: ARTICLE_MODEL, targetId: "article-1" })
        );

        const records = expectOk(await assignments.list({ where: { reviewId: "review-1" } }));
        expect(records.items).toEqual([]);
    });

    it("fails with a typed error on a partial failure and a re-run finishes the delete", async () => {
        const { reviews, assignments, faults, deleteTargetReviews } = await createTargetData();
        faults.failDeleteOnce = true;

        const failed = await deleteTargetReviews.execute({
            model: ARTICLE_MODEL,
            targetId: "article-1"
        });

        expect(failed.isFail()).toBe(true);
        expect(failed.error?.code).toBe("Workflows/Review/Persistence");
        // Records go first, so the review is still there for the retry to find.
        expect(expectOk(await reviews.get("review-1")).id).toBe("review-1");

        const rerun = expectOk(
            await deleteTargetReviews.execute({ model: ARTICLE_MODEL, targetId: "article-1" })
        );

        expect([...rerun.deletedReviewIds].sort()).toEqual(["review-1", "review-2"]);
        expect((await reviews.get("review-1")).error?.code).toBe("Workflows/Review/NotFound");
        expect((await reviews.get("review-2")).error?.code).toBe("Workflows/Review/NotFound");
        const records = expectOk(await assignments.list({ where: { reviewId: "review-1" } }));
        expect(records.items).toEqual([]);
    });
});

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
