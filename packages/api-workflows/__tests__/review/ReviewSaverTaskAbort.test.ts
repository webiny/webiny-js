import { beforeEach, describe, expect, it } from "vitest";
import { hasErrorSource } from "~/domain/hasErrorSource.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { abortedTasks, fakeTaskFaults, resetFakeTasks } from "~tests/__helpers/FakeTaskService.js";
import { FailingReviewSave, reviewSaveFaults } from "~tests/__helpers/FailingReviewSave.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { FailingReviewTargetSync } from "~tests/__helpers/FailingReviewTargetSync.js";
import { recordedSyncs } from "~tests/__helpers/RecordingReviewTargetSync.js";
import { expectOk, NOW, requester } from "~tests/__helpers/fixtures.js";
import { automationActor, createPendingAutomationReview } from "~tests/__helpers/stepRunReviews.js";
import type { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";

/** The automation step reached with `taskId`; the `requested` and `stepReached` facts are kept. */
const createAutomationReview = (taskId: string | null): Review => {
    const review = createPendingAutomationReview();
    expectOk(review.reachRun({ actor: requester, owner: automationActor, taskId, now: NOW }));
    return review;
};

const createSaverContext = async (withFailingSync = false) => {
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerDecorator(FailingReviewSave);
            if (withFailingSync) {
                container.register(FailingReviewTargetSync);
            }
        }
    });
    return context;
};

describe("ReviewSaver aborts the triggered task when the save fails (D57, R143)", () => {
    beforeEach(() => {
        resetFakeTasks();
        recordedSyncs.length = 0;
        loggedErrors.length = 0;
        reviewSaveFaults.failNext = false;
    });

    it("aborts the triggered task when the save fails", async () => {
        const context = await createSaverContext();
        reviewSaveFaults.failNext = true;

        const result = await context.container
            .resolve(ReviewSaver)
            .save(createAutomationReview("task-1"));

        expect(result.isFail()).toBe(true);
        expect(abortedTasks).toEqual([{ id: "task-1", message: "The review could not be saved." }]);
    });

    it("returns the persistence error unchanged and stores nothing", async () => {
        const context = await createSaverContext();
        reviewSaveFaults.failNext = true;

        const result = await context.container
            .resolve(ReviewSaver)
            .save(createAutomationReview("task-1"));
        const stored = await context.container.resolve(ReviewRepository).get("review-1");

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(hasErrorSource(result.error) && result.error.source.message).toBe(
            "Storage is down."
        );
        expect(stored.isFail()).toBe(true);
    });

    it("keeps the persistence error when the abort itself fails or throws", async () => {
        const context = await createSaverContext();

        reviewSaveFaults.failNext = true;
        fakeTaskFaults.abort = "fail";
        const failed = await context.container
            .resolve(ReviewSaver)
            .save(createAutomationReview("task-1"));

        reviewSaveFaults.failNext = true;
        fakeTaskFaults.abort = "throw";
        const thrown = await context.container
            .resolve(ReviewSaver)
            .save(createAutomationReview("task-2"));

        expect(failed.error.code).toBe("Workflows/Review/Persistence");
        expect(thrown.error.code).toBe("Workflows/Review/Persistence");
        expect(abortedTasks.map(task => task.id)).toEqual(["task-1", "task-2"]);
        expect(loggedErrors.map(logged => logged.message)).toEqual([
            "Could not abort a workflow step run task.",
            "Could not abort a workflow step run task."
        ]);
    });

    it("aborts nothing when the save succeeds", async () => {
        const context = await createSaverContext();

        const result = await context.container
            .resolve(ReviewSaver)
            .save(createAutomationReview("task-1"));

        expect(result.isOk()).toBe(true);
        expect(abortedTasks).toEqual([]);
    });

    it("aborts nothing when the reach failed before a task started (taskId null)", async () => {
        const context = await createSaverContext();
        reviewSaveFaults.failNext = true;

        const result = await context.container
            .resolve(ReviewSaver)
            .save(createAutomationReview(null));

        expect(result.isFail()).toBe(true);
        expect(abortedTasks).toEqual([]);
    });

    it("aborts nothing when the target sync fails after a successful save", async () => {
        const context = await createSaverContext(true);

        const result = await context.container
            .resolve(ReviewSaver)
            .save(createAutomationReview("task-1"));

        expect(result.error.code).toBe("Workflows/Review/TargetSync");
        expect(abortedTasks).toEqual([]);
    });
});
