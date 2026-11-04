import { beforeEach, describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/feature/api";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { abortedTasks, fakeTaskFaults, resetFakeTasks } from "~tests/__helpers/FakeTaskService.js";
import { recordingCleanup } from "~tests/__helpers/RecordingCleanupTaskSubtree.js";
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
import { ReviewPersistenceError } from "~/domain/review/errors.js";
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
        expectOk(await reviews.create(runningReview("review-1", "task-1", "article-1#0001")));

        const cancelled = expectOk(
            await cancel.execute({ reviewId: "review-1", actor: requester })
        );

        expect(cancelled.state).toBe("cancelled");
        expect(expectOk(await reviews.get("review-1")).state).toBe("cancelled");
        expect(abortedTasks).toEqual([{ id: "task-1", message: "The review was cancelled." }]);
    });

    it("aborts nothing for a review step, a failed step or a step without a task id", async () => {
        const { reviews, cancel } = await setup();
        expectOk(await reviews.create(toSaveData(createRequestedReview({ id: "review-1" }))));
        expectOk(
            await reviews.create({
                ...toSaveData(createFailedAutomationReview()),
                id: "review-2",
                targetRevisionId: "article-1#0002"
            })
        );
        const noTask = toSaveData(createRunningAutomationReview(null));
        expectOk(
            await reviews.create({
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
        expectOk(await reviews.create(runningReview("review-1", "task-1", "article-1#0001")));
        expectOk(await cancel.execute({ reviewId: "review-1", actor: requester }));
        resetFakeTasks();
        expectOk(await reviews.create(runningReview("review-2", "task-2", "article-1#0002")));
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
        expectOk(await reviews.create(runningReview("review-1", "task-1", "article-1#0001")));

        const result = await cancel.execute({ reviewId: "review-1", actor: requester });

        expect(result.error?.code).toBe("Workflows/Review/TargetSync");
        expect(expectOk(await reviews.get("review-1")).state).toBe("cancelled");
        expect(abortedTasks).toEqual([{ id: "task-1", message: "The review was cancelled." }]);
    });

    it("never fails the cancel because the abort failed or threw", async () => {
        const { reviews, cancel } = await setup();
        expectOk(await reviews.create(runningReview("review-1", "task-1", "article-1#0001")));
        expectOk(await reviews.create(runningReview("review-2", "task-2", "article-1#0002")));

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
        expectOk(await reviews.create(runningReview("review-1", "task-1", "article-1#0001")));
        expectOk(await reviews.create(runningReview("review-2", "task-2", "article-2#0001")));

        const listed = expectOk(
            await reviews.listByTarget({ model: ARTICLE_MODEL, targetId: "article-1" })
        );
        const cancelled = expectOk(
            await context.container.resolve(CancelTargetReviewsUseCase).execute({
                reviews: listed,
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
        recordingCleanup.reset();
        loggedErrors.length = 0;
    });

    /**
     * article-1#0001: review-1 (task-1); article-1#0002: review-2 (task-2);
     * article-1#0003: review-3 on a review step; article-2#0001: review-4 (task-4).
     */
    const createTargetData = async (extraSetup?: (container: Container) => void) => {
        const { context, reviews } = await setup(extraSetup);
        expectOk(await reviews.create(runningReview("review-1", "task-1", "article-1#0001")));
        expectOk(await reviews.create(runningReview("review-2", "task-2", "article-1#0002")));
        expectOk(
            await reviews.create({
                ...toSaveData(createRequestedReview()),
                id: "review-3",
                targetRevisionId: "article-1#0003"
            })
        );
        expectOk(await reviews.create(runningReview("review-4", "task-4", "article-2#0001")));
        return {
            context,
            reviews,
            deleteTargetReviews: context.container.resolve(DeleteTargetReviewsUseCase)
        };
    };

    it("aborts the in-review automation task of every deleted review", async () => {
        const { reviews, deleteTargetReviews } = await createTargetData();

        const result = expectOk(
            await deleteTargetReviews.execute({ model: ARTICLE_MODEL, targetIds: ["article-1"] })
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
                targetIds: ["article-1"],
                targetRevisionId: "article-1#0002"
            })
        );

        expect(abortedTasks).toEqual([{ id: "task-2", message: "The review was deleted." }]);
    });

    it("aborts nothing for a review whose delete failed", async () => {
        const { context } = await setup();
        const reviews = context.container.resolve(ReviewRepository);
        expectOk(await reviews.create(runningReview("review-1", "task-1", "article-1#0001")));
        // Every read and write is the real repository's; only the delete fails.
        context.container.registerInstance(
            ReviewRepository,
            new Proxy(reviews, {
                get: (target, property) => {
                    if (property === "deleteMany") {
                        return async () =>
                            Result.fail(new ReviewPersistenceError(new Error("Storage is down.")));
                    }
                    const value = Reflect.get(target, property);
                    return typeof value === "function" ? value.bind(target) : value;
                }
            })
        );

        const failed = await context.container
            .resolve(DeleteTargetReviewsUseCase)
            .execute({ model: ARTICLE_MODEL, targetIds: ["article-1"] });

        expect(failed.error?.code).toBe("Workflows/Review/Persistence");
        expect(expectOk(await reviews.get("review-1")).id).toBe("review-1");
        expect(abortedTasks).toEqual([]);
        // The review is still there, so its task is too (R256).
        expect(recordingCleanup.calls).toEqual([]);
    });

    it("never fails the delete because the abort failed or threw", async () => {
        const { deleteTargetReviews } = await createTargetData();
        fakeTaskFaults.abort = "fail";

        const failedAbort = await deleteTargetReviews.execute({
            model: ARTICLE_MODEL,
            targetIds: ["article-1"],
            targetRevisionId: "article-1#0001"
        });
        fakeTaskFaults.abort = "throw";
        const thrownAbort = await deleteTargetReviews.execute({
            model: ARTICLE_MODEL,
            targetIds: ["article-1"],
            targetRevisionId: "article-1#0002"
        });

        expect(failedAbort.value?.deletedReviewIds).toEqual(["review-1"]);
        expect(thrownAbort.value?.deletedReviewIds).toEqual(["review-2"]);
        expect(abortedTasks.map(task => task.id)).toEqual(["task-1", "task-2"]);
        expect(loggedErrors).toHaveLength(2);
    });
});
