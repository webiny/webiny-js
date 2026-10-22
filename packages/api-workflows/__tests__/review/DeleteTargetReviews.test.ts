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
import { ReviewTaskAbortService } from "~/features/stepRun/ReviewTaskAbortService/index.js";

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
        deleteMany: async ids => {
            if (faults.failDeleteOnce) {
                faults.failDeleteOnce = false;
                return Result.fail(new AssignmentPersistenceError(new Error("Storage is down.")));
            }
            return assignments.deleteMany(ids);
        }
    });

    expectOk(await reviews.create(toSaveData(createRequestedReview({ id: "review-1" }))));
    expectOk(
        await reviews.create(
            toSaveData(
                createRequestedReview({ id: "review-2", targetRevisionId: "article-1#0002" })
            )
        )
    );
    expectOk(
        await reviews.create(
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
            await deleteTargetReviews.execute({ model: ARTICLE_MODEL, targetIds: ["article-1"] })
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

    it("deletes the reviews of several targets with one call", async () => {
        const { reviews, assignments, deleteTargetReviews } = await createTargetData();

        const result = expectOk(
            await deleteTargetReviews.execute({
                model: ARTICLE_MODEL,
                targetIds: ["article-1", "article-2", "article-9"]
            })
        );

        expect([...result.deletedReviewIds].sort()).toEqual(["review-1", "review-2", "review-3"]);
        expect((await reviews.get("review-3")).error?.code).toBe("Workflows/Review/NotFound");
        const records = expectOk(await assignments.list({ where: { reviewId: "review-3" } }));
        expect(records.items).toEqual([]);
    });

    it("deletes only the reviews of one revision when it is given", async () => {
        const { reviews, assignments, deleteTargetReviews } = await createTargetData();

        const result = expectOk(
            await deleteTargetReviews.execute({
                model: ARTICLE_MODEL,
                targetIds: ["article-1"],
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
            await deleteTargetReviews.execute({ model: ARTICLE_MODEL, targetIds: ["article-9"] })
        );

        expect(result.deletedReviewIds).toEqual([]);
    });

    it("treats an already deleted review or record as deleted", async () => {
        const { reviews, assignments } = await createTargetData();

        expectOk(await reviews.deleteMany(["review-1"]));
        const again = await reviews.deleteMany(["review-1", "missing-review"]);
        const missingRecord = await assignments.deleteMany(["missing-record"]);

        expect(again.isOk()).toBe(true);
        expect(missingRecord.isOk()).toBe(true);
        // The other review is untouched.
        expect(expectOk(await reviews.get("review-2")).id).toBe("review-2");
    });

    it("deletes every assignment record when they span several pages", async () => {
        const { assignments, deleteTargetReviews } = await createTargetData(2);

        expectOk(
            await deleteTargetReviews.execute({ model: ARTICLE_MODEL, targetIds: ["article-1"] })
        );

        const records = expectOk(await assignments.list({ where: { reviewId: "review-1" } }));
        expect(records.items).toEqual([]);
    });

    it("fails with a typed error on a partial failure and a re-run finishes the delete", async () => {
        const { reviews, assignments, faults, deleteTargetReviews } = await createTargetData();
        faults.failDeleteOnce = true;

        const failed = await deleteTargetReviews.execute({
            model: ARTICLE_MODEL,
            targetIds: ["article-1"]
        });

        expect(failed.isFail()).toBe(true);
        expect(failed.error?.code).toBe("Workflows/Review/Persistence");
        // Records go first, so the review is still there for the retry to find.
        expect(expectOk(await reviews.get("review-1")).id).toBe("review-1");

        const rerun = expectOk(
            await deleteTargetReviews.execute({ model: ARTICLE_MODEL, targetIds: ["article-1"] })
        );

        expect([...rerun.deletedReviewIds].sort()).toEqual(["review-1", "review-2"]);
        expect((await reviews.get("review-1")).error?.code).toBe("Workflows/Review/NotFound");
        expect((await reviews.get("review-2")).error?.code).toBe("Workflows/Review/NotFound");
        const records = expectOk(await assignments.list({ where: { reviewId: "review-1" } }));
        expect(records.items).toEqual([]);
    });
});

/** Calls the delete cascade makes to the repositories and the abort service. */
interface CascadeCalls {
    assignmentLists: number;
    assignmentDeletes: number;
    reviewDeletes: number;
    aborts: number;
}

/**
 * `reviewCount` reviews on as many entries (one review per entry), each with `recordCount`
 * assignment records; the use case gets counting wrappers, the test keeps the real repositories.
 */
const createCountedCascade = async (reviewCount: number, recordCount: number) => {
    const { context } = await createContextHandler();
    const reviews = context.container.resolve(ReviewRepository);
    const assignments = context.container.resolve(AssignmentRepository);
    const taskAbort = context.container.resolve(ReviewTaskAbortService);
    const calls: CascadeCalls = {
        assignmentLists: 0,
        assignmentDeletes: 0,
        reviewDeletes: 0,
        aborts: 0
    };
    context.container.registerInstance(AssignmentRepository, {
        create: values => assignments.create(values),
        list: params => {
            calls.assignmentLists++;
            return assignments.list(params);
        },
        deleteMany: ids => {
            calls.assignmentDeletes++;
            return assignments.deleteMany(ids);
        }
    });
    context.container.registerInstance(
        ReviewRepository,
        new Proxy(reviews, {
            get: (target, property) => {
                if (property === "deleteMany") {
                    return (ids: string[]) => {
                        calls.reviewDeletes++;
                        return target.deleteMany(ids);
                    };
                }
                const value = Reflect.get(target, property);
                return typeof value === "function" ? value.bind(target) : value;
            }
        })
    );
    context.container.registerInstance(ReviewTaskAbortService, {
        abort: params => {
            calls.aborts++;
            return taskAbort.abort(params);
        }
    });

    const targetIds: string[] = [];
    for (let index = 1; index <= reviewCount; index++) {
        const targetId = `article-${index}`;
        targetIds.push(targetId);
        const reviewId = `review-${index}`;
        expectOk(
            await reviews.create(
                toSaveData(
                    createRequestedReview({ id: reviewId, targetRevisionId: `${targetId}#0001` })
                )
            )
        );
        for (let record = 0; record < recordCount; record++) {
            const minute = String(record).padStart(2, "0");
            expectOk(await assignments.create(recordOf(reviewId, minute)));
        }
    }

    return {
        reviews,
        assignments,
        calls,
        targetIds,
        deleteTargetReviews: context.container.resolve(DeleteTargetReviewsUseCase)
    };
};

const recordOf = (reviewId: string, minute: string): AssignmentRecordValues => {
    return record(reviewId, `2026-10-09T10:${minute}:00.000Z`);
};

describe("DeleteTargetReviewsUseCase query count", () => {
    it.each([
        [2, 2],
        [6, 4]
    ])(
        "deletes %i reviews with %i records each with one list and one delete per repository",
        async (reviewCount, recordCount) => {
            const { reviews, assignments, calls, targetIds, deleteTargetReviews } =
                await createCountedCascade(reviewCount, recordCount);

            const result = expectOk(
                await deleteTargetReviews.execute({ model: ARTICLE_MODEL, targetIds })
            );

            expect(result.deletedReviewIds).toHaveLength(reviewCount);
            expect(calls).toEqual({
                assignmentLists: 1,
                assignmentDeletes: 1,
                reviewDeletes: 1,
                aborts: 1
            });
            for (const reviewId of result.deletedReviewIds) {
                expect((await reviews.get(reviewId)).error?.code).toBe("Workflows/Review/NotFound");
                const left = expectOk(await assignments.list({ where: { reviewId } }));
                expect(left.items).toEqual([]);
            }
        }
    );
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
        expectOk(await reviews.create(createReviewWithTasks()));

        const result = expectOk(
            await deleteTargetReviews.execute({ model: ARTICLE_MODEL, targetIds: ["article-1"] })
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
        expectOk(await reviews.create(createReviewWithTasks()));
        expectOk(
            await reviews.create({
                ...toSaveData(createRunningAutomationReview("task-5")),
                id: "review-2",
                targetRevisionId: "article-1#0002"
            })
        );

        expectOk(
            await deleteTargetReviews.execute({
                model: ARTICLE_MODEL,
                targetIds: ["article-1"],
                targetRevisionId: "article-1#0002"
            })
        );

        expect(recordingCleanup.calls.map(call => call.taskId)).toEqual(["task-5"]);

        recordingCleanup.reset();
        expectOk(
            await deleteTargetReviews.execute({ model: ARTICLE_MODEL, targetIds: ["article-1"] })
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
            await reviews.create({
                ...noTask,
                steps: noTask.steps.map(step => ({ ...step, runs: [earlierRun(null)] }))
            })
        );
        expectOk(
            await reviews.create(
                toSaveData(
                    createRequestedReview({ id: "review-9", targetRevisionId: "article-9#0001" })
                )
            )
        );

        expectOk(
            await deleteTargetReviews.execute({ model: ARTICLE_MODEL, targetIds: ["article-1"] })
        );
        expectOk(
            await deleteTargetReviews.execute({ model: ARTICLE_MODEL, targetIds: ["article-9"] })
        );

        expect(recordingCleanup.calls).toEqual([]);
        expect(loggedErrors).toEqual([]);
    });

    it("logs a cleanup that throws, still cleans the other tasks and still deletes the review", async () => {
        const { reviews, deleteTargetReviews } = await setup();
        expectOk(await reviews.create(createReviewWithTasks()));
        recordingCleanup.failFor.add("task-2");

        const result = await deleteTargetReviews.execute({
            model: ARTICLE_MODEL,
            targetIds: ["article-1"]
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
