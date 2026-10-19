import { beforeEach, describe, expect, it } from "vitest";
import { hasErrorSource } from "~/domain/hasErrorSource.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { FailingReviewGet, reviewGetFaults } from "~tests/__helpers/FailingReviewGet.js";
import { AUTOMATION_STEP_ID } from "~tests/__helpers/stepRunReviews.js";
import { createFakeStepReview } from "~tests/__helpers/TestStepRunner.js";
import { expectOk, requester } from "~tests/__helpers/fixtures.js";
import { Review } from "~/domain/review/Review.js";
import { ReviewPersistenceError } from "~/domain/review/errors.js";
import type { ReviewData } from "~/domain/review/types.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import { StepRunStaleCheckService } from "~/features/stepRun/StepRunStaleCheckService/index.js";

const LATER = "2026-10-09T11:00:00.000Z";

const CURRENT_TASK = { id: "task-1", createdById: requester.id };

const setup = async () => {
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerDecorator(FailingReviewGet);
        }
    });
    const repository = context.container.resolve(ReviewRepository);
    const saver = context.container.resolve(ReviewSaver);
    const service = context.container.resolve(StepRunStaleCheckService);

    return {
        service,
        seed: async (data: ReviewData): Promise<void> => {
            expectOk(await repository.save(data));
            reviewGetFaults.reads = 0;
        },
        /** Cancels the stored review, as a requester would while the runner works. */
        cancel: async (): Promise<void> => {
            const review = Review.fromData(expectOk(await repository.get("review-1")));
            expectOk(review.cancel({ actor: requester, now: LATER }));
            expectOk(await saver.save(review));
            reviewGetFaults.reads = 0;
        },
        /** Restarts the step under another task, as the restart use case would. */
        moveToAnotherTask: async (): Promise<void> => {
            const data = expectOk(await repository.get("review-1"));
            data.steps[0].taskId = "task-new";
            expectOk(await repository.save(data));
            reviewGetFaults.reads = 0;
        }
    };
};

describe("StepRunStaleCheckService (R175, Review Focus 1)", () => {
    beforeEach(() => {
        reviewGetFaults.mode = null;
        reviewGetFaults.reads = 0;
        loggedErrors.length = 0;
    });

    it("is ok(false) for a review whose step is this task's", async () => {
        const { service, seed } = await setup();
        await seed(createFakeStepReview());

        const result = await service.isStale({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            task: CURRENT_TASK
        });

        expect(expectOk(result)).toBe(false);
        expect(reviewGetFaults.reads).toBe(1);
        expect(loggedErrors).toEqual([]);
    });

    it("is ok(true) once the review is cancelled", async () => {
        const { service, seed, cancel } = await setup();
        await seed(createFakeStepReview());
        await cancel();

        const result = await service.isStale({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            task: CURRENT_TASK
        });

        expect(expectOk(result)).toBe(true);
        expect(loggedErrors).toEqual([]);
    });

    it("is ok(true) once the step is restarted under a new task, and ok(false) for the new task", async () => {
        const { service, seed, moveToAnotherTask } = await setup();
        await seed(createFakeStepReview());
        await moveToAnotherTask();

        const oldTask = await service.isStale({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            task: CURRENT_TASK
        });
        const newTask = await service.isStale({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            task: { id: "task-new", createdById: requester.id }
        });

        expect(expectOk(oldTask)).toBe(true);
        expect(expectOk(newTask)).toBe(false);
    });

    it("is ok(true) for a task somebody else created", async () => {
        const { service, seed } = await setup();
        await seed(createFakeStepReview());

        const result = await service.isStale({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            task: { id: "task-1", createdById: "user-intruder" }
        });

        expect(expectOk(result)).toBe(true);
    });

    it("is ok(true) when the review is not found, without logging an error", async () => {
        const { service } = await setup();

        const result = await service.isStale({
            reviewId: "review-missing",
            stepId: AUTOMATION_STEP_ID,
            task: CURRENT_TASK
        });

        expect(expectOk(result)).toBe(true);
        expect(loggedErrors).toEqual([]);
    });

    it('fails closed and logs once when the read fails (a failed read is not a "not stale" answer)', async () => {
        const { service, seed } = await setup();
        await seed(createFakeStepReview());
        reviewGetFaults.mode = "fail";

        const result = await service.isStale({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            task: CURRENT_TASK
        });

        expect(result.isFail()).toBe(true);
        expect(result.error).toBeInstanceOf(ReviewPersistenceError);
        expect(hasErrorSource(result.error) && result.error.source.message).toBe(
            "Storage is down."
        );
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe(
            "Could not read the review to check the step is current."
        );
        expect(loggedErrors[0].fields).toEqual({
            // The raw cause under pino's error key, not the fixed persistence message.
            err: expect.objectContaining({ message: "Storage is down." }),
            taskId: "task-1",
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID
        });
    });

    it("fails closed and logs once when the read throws, and never rejects", async () => {
        const { service, seed } = await setup();
        await seed(createFakeStepReview());
        reviewGetFaults.mode = "throw";

        const result = await service.isStale({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            task: CURRENT_TASK
        });

        expect(result.isFail()).toBe(true);
        expect(result.error).toBeInstanceOf(ReviewPersistenceError);
        expect(hasErrorSource(result.error) && result.error.source.message).toBe("Storage threw.");
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe(
            "Could not read the review to check the step is current."
        );
        expect(loggedErrors[0].fields).toEqual({
            error: expect.objectContaining({ message: "Storage threw." }),
            taskId: "task-1",
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID
        });
    });

    it("reads on every call and keeps no state: no throttle, no sticky answer (those belong to the caller)", async () => {
        const { service, seed, cancel } = await setup();
        await seed(createFakeStepReview());
        const params = { reviewId: "review-1", stepId: AUTOMATION_STEP_ID, task: CURRENT_TASK };

        const before = expectOk(await service.isStale(params));
        expect(reviewGetFaults.reads).toBe(1);
        await cancel(); // resets the read counter
        const after = expectOk(await service.isStale(params));
        const again = expectOk(await service.isStale(params));

        expect([before, after, again]).toEqual([false, true, true]);
        expect(reviewGetFaults.reads).toBe(2);
    });
});
