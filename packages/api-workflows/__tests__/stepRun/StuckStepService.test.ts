import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TaskDataStatus } from "@webiny/api-core/features/task/TaskService/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { fakeGetTask } from "~tests/__helpers/FakeGetTask.js";
import { FailingReviewSave, reviewSaveFaults } from "~tests/__helpers/FailingReviewSave.js";
import { FailingReviewTargetSync } from "~tests/__helpers/FailingReviewTargetSync.js";
import {
    RecordingEventPublisher,
    recordedEvents,
    workflowEventTypes
} from "~tests/__helpers/RecordingEventPublisher.js";
import {
    AUTOMATION_STEP_ID,
    automationActor,
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
import { STEP_RUN_STUCK_GRACE_MS } from "~/features/stepRun/constants.js";
import { Review } from "~/domain/review/Review.js";
import type { ReviewData } from "~/domain/review/types.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { GetReviewUseCase } from "~/features/review/GetReview/index.js";
import { GetTargetReviewUseCase } from "~/features/review/GetTargetReview/index.js";
import { GetActiveTargetReviewUseCase } from "~/features/review/GetActiveTargetReview/index.js";
import { ListTargetReviewsUseCase } from "~/features/review/ListTargetReviews/index.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import { StuckStepService } from "~/features/stepRun/StuckStepService/index.js";

const STUCK_REASON = "The automation task ended without a result.";

interface SaverFaults {
    throwNext: boolean;
}

const saverFaults: SaverFaults = { throwNext: false };

class ThrowingReviewSaverImpl implements ReviewSaver.Interface {
    public constructor(private decoratee: ReviewSaver.Interface) {}

    public async save(review: Review): ReviewSaver.Return {
        if (saverFaults.throwNext) {
            saverFaults.throwNext = false;
            throw new Error("The saver crashed.");
        }
        return this.decoratee.save(review);
    }
}

const ThrowingReviewSaver = ReviewSaver.createDecorator({
    decorator: ThrowingReviewSaverImpl,
    dependencies: []
});

interface SetupParams {
    seed?: ReviewData;
    failSync?: boolean;
}

/** One review ("review-1" on "article-1#0001") is stored; the recorders are empty afterwards. */
const setup = async (params: SetupParams = {}) => {
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerDecorator(FailingReviewSave);
            container.registerDecorator(ThrowingReviewSaver);
            container.registerDecorator(RecordingEventPublisher);
            if (params.failSync) {
                container.register(FailingReviewTargetSync);
            }
        }
    });
    const reviews = context.container.resolve(ReviewRepository);
    expectOk(
        await reviews.create(params.seed ?? toSaveData(createRunningAutomationReview("task-1")))
    );
    recordedEvents.length = 0;

    return {
        reviews,
        stuckSteps: context.container.resolve(StuckStepService),
        getReview: context.container.resolve(GetReviewUseCase),
        getTargetReview: context.container.resolve(GetTargetReviewUseCase),
        getActiveTargetReview: context.container.resolve(GetActiveTargetReviewUseCase),
        listTargetReviews: context.container.resolve(ListTargetReviewsUseCase)
    };
};

describe("Stuck detection on single reads (D28, R152)", () => {
    beforeEach(() => {
        fakeGetTask.reset();
        loggedErrors.length = 0;
        recordedEvents.length = 0;
        reviewSaveFaults.failNext = false;
        saverFaults.throwNext = false;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it.each([TaskDataStatus.SUCCESS, TaskDataStatus.FAILED, TaskDataStatus.ABORTED])(
        "fails an in-review automation step whose task is %s (finished long ago) and returns the failed review",
        async status => {
            fakeGetTask.set("task-1", status);
            const { getReview, reviews } = await setup();

            const review = expectOk(await getReview.execute({ id: "review-1" }));

            expect(fakeGetTask.calls).toEqual(["task-1"]);
            expect(review).toMatchObject({
                state: "inProgress",
                currentStepState: "failed",
                currentStepType: "automation"
            });
            expect(review.steps[0]).toMatchObject({
                state: "failed",
                comment: STUCK_REASON,
                taskId: "task-1"
            });
            const stored = expectOk(await reviews.get("review-1"));
            expect(stored.steps[0]).toMatchObject({ state: "failed", comment: STUCK_REASON });
            expect(workflowEventTypes()).toEqual(["Workflows/Review/StepFailed"]);
        }
    );

    it.each([TaskDataStatus.FAILED, TaskDataStatus.ABORTED])(
        "leaves the step alone while a %s task finished inside the grace, its hooks may still run (R152)",
        async status => {
            const justNow = new Date(Date.now() - 1000).toISOString();
            fakeGetTask.set("task-1", status, requester.id, justNow);
            const { getReview, reviews } = await setup();

            const review = expectOk(await getReview.execute({ id: "review-1" }));

            expect(review.steps[0]).toMatchObject({ state: "inReview", comment: null });
            expect(expectOk(await reviews.get("review-1")).steps[0].state).toBe("inReview");
            expect(workflowEventTypes()).toEqual([]);
        }
    );

    it.each([TaskDataStatus.FAILED, TaskDataStatus.ABORTED])(
        "fails the step once a %s task finished longer ago than the grace (R152)",
        async status => {
            const pastGrace = new Date(Date.now() - STEP_RUN_STUCK_GRACE_MS - 1000).toISOString();
            fakeGetTask.set("task-1", status, requester.id, pastGrace);
            const { getReview } = await setup();

            const review = expectOk(await getReview.execute({ id: "review-1" }));

            expect(review.steps[0]).toMatchObject({ state: "failed", comment: STUCK_REASON });
        }
    );

    it("fails the step at once when the task succeeded without writing a result, no grace", async () => {
        const justNow = new Date(Date.now() - 1000).toISOString();
        fakeGetTask.set("task-1", TaskDataStatus.SUCCESS, requester.id, justNow);
        const { getReview } = await setup();

        const review = expectOk(await getReview.execute({ id: "review-1" }));

        expect(review.steps[0]).toMatchObject({ state: "failed", comment: STUCK_REASON });
    });

    it("fails the step when the task record is gone and the step is older than the grace", async () => {
        const seed = toSaveData(createRunningAutomationReview("task-1"));
        // pins the step older than STEP_RUN_STUCK_GRACE_MS regardless of the fixture's reach time
        seed.steps[0].startedOn = new Date(
            Date.now() - STEP_RUN_STUCK_GRACE_MS - 1000
        ).toISOString();
        const { getReview } = await setup({ seed });

        const review = expectOk(await getReview.execute({ id: "review-1" }));

        expect(review.steps[0]).toMatchObject({ state: "failed", comment: STUCK_REASON });
    });

    it("leaves a recent step alone when its task record is missing, the read may have failed (R152)", async () => {
        const seed = toSaveData(createRunningAutomationReview("task-1"));
        seed.steps[0].startedOn = new Date(Date.now() - 1000).toISOString();
        const { getReview, reviews } = await setup({ seed });

        const review = expectOk(await getReview.execute({ id: "review-1" }));

        expect(review.steps[0]).toMatchObject({ state: "inReview", comment: null });
        const stored = expectOk(await reviews.get("review-1"));
        expect(stored.steps[0].state).toBe("inReview");
    });

    it.each([TaskDataStatus.PENDING, TaskDataStatus.RUNNING])(
        "leaves the step alone while its task is %s",
        async status => {
            fakeGetTask.set("task-1", status);
            const { getReview, reviews } = await setup();

            const review = expectOk(await getReview.execute({ id: "review-1" }));

            expect(review.steps[0]).toMatchObject({ state: "inReview", comment: null });
            const stored = expectOk(await reviews.get("review-1"));
            expect(stored.steps[0].state).toBe("inReview");
            expect(workflowEventTypes()).toEqual([]);
        }
    );

    it("never fails a step for a task somebody else created (stale guard, R144)", async () => {
        fakeGetTask.set("task-1", TaskDataStatus.SUCCESS, "user-intruder");
        const { getReview, reviews } = await setup();

        const review = expectOk(await getReview.execute({ id: "review-1" }));

        expect(review.steps[0].state).toBe("inReview");
        expect(expectOk(await reviews.get("review-1")).steps[0].state).toBe("inReview");
        expect(workflowEventTypes()).toEqual([]);
    });

    it.each([
        { name: "a review step", seed: () => createRequestedReview(), state: "awaiting" },
        { name: "a failed step", seed: () => createFailedAutomationReview(), state: "failed" },
        {
            name: "a step without a task id",
            seed: () => createRunningAutomationReview(null),
            state: "inReview"
        }
    ])("does not read a task for $name", async ({ seed, state }) => {
        const { getReview } = await setup({ seed: toSaveData(seed()) });

        const review = expectOk(await getReview.execute({ id: "review-1" }));

        expect(fakeGetTask.calls).toEqual([]);
        expect(review.steps[0].state).toBe(state);
    });

    it("fails the step through GetTargetReview too, and returns null without a review", async () => {
        fakeGetTask.set("task-1", TaskDataStatus.SUCCESS);
        const { getTargetReview } = await setup();

        const review = expectOk(
            await getTargetReview.execute({
                model: ARTICLE_MODEL,
                targetRevisionId: "article-1#0001"
            })
        );
        fakeGetTask.calls.length = 0;
        const none = expectOk(
            await getTargetReview.execute({
                model: ARTICLE_MODEL,
                targetRevisionId: "article-9#0001"
            })
        );

        expect(review?.steps[0]).toMatchObject({ state: "failed", comment: STUCK_REASON });
        expect(none).toBeNull();
        expect(fakeGetTask.calls).toEqual([]);
    });

    it("leaves a stuck step alone through GetActiveTargetReview, the read-only lookup", async () => {
        fakeGetTask.set("task-1", TaskDataStatus.SUCCESS);
        const { getActiveTargetReview, reviews } = await setup();
        fakeGetTask.calls.length = 0;

        const review = expectOk(
            await getActiveTargetReview.execute({
                model: ARTICLE_MODEL,
                targetRevisionId: "article-1#0001"
            })
        );

        expect(review?.steps[0]).toMatchObject({ state: "inReview" });
        expect(expectOk(await reviews.get("review-1")).steps[0]).toMatchObject({
            state: "inReview"
        });
        expect(fakeGetTask.calls).toEqual([]);
        expect(recordedEvents).toEqual([]);
    });

    it("does not look at tasks when listing", async () => {
        fakeGetTask.set("task-1", TaskDataStatus.SUCCESS);
        const { listTargetReviews } = await setup();

        const reviews = expectOk(
            await listTargetReviews.execute({ model: ARTICLE_MODEL, targetId: "article-1" })
        );

        expect(fakeGetTask.calls).toEqual([]);
        expect(reviews[0].steps[0].state).toBe("inReview");
    });

    it("returns the review as read and logs when the task lookup throws", async () => {
        fakeGetTask.failure = new Error("Tasks are down.");
        const { getReview, reviews } = await setup();

        const result = await getReview.execute({ id: "review-1" });

        expect(result.isOk()).toBe(true);
        expect(result.value.steps[0].state).toBe("inReview");
        expect(expectOk(await reviews.get("review-1")).steps[0].state).toBe("inReview");
        expect(loggedErrors.map(logged => logged.message)).toEqual([
            "Could not read the step run task; the review is returned as read."
        ]);
    });

    it("returns the review as read and logs when the write fails", async () => {
        fakeGetTask.set("task-1", TaskDataStatus.SUCCESS);
        const { getReview, reviews } = await setup();
        reviewSaveFaults.failNext = true;

        const result = await getReview.execute({ id: "review-1" });

        expect(result.isOk()).toBe(true);
        expect(result.value.steps[0].state).toBe("inReview");
        expect(expectOk(await reviews.get("review-1")).steps[0].state).toBe("inReview");
        expect(loggedErrors.map(logged => logged.message)).toEqual([
            "Could not mark the stuck step as failed; the review is returned as read."
        ]);
    });

    it("returns the review as read and logs when the save throws", async () => {
        fakeGetTask.set("task-1", TaskDataStatus.SUCCESS);
        const { getReview } = await setup();
        saverFaults.throwNext = true;

        const result = await getReview.execute({ id: "review-1" });

        expect(result.isOk()).toBe(true);
        expect(result.value.steps[0].state).toBe("inReview");
        expect(loggedErrors.map(logged => logged.message)).toEqual([
            "Could not mark the stuck step as failed; the review is returned as read."
        ]);
    });

    it("counts a write that persisted but failed in the target sync as written", async () => {
        fakeGetTask.set("task-1", TaskDataStatus.SUCCESS);
        const { getReview, reviews } = await setup({ failSync: true });

        const result = await getReview.execute({ id: "review-1" });

        expect(result.isOk()).toBe(true);
        expect(result.value.steps[0]).toMatchObject({ state: "failed", comment: STUCK_REASON });
        expect(expectOk(await reviews.get("review-1")).steps[0].state).toBe("failed");
        expect(loggedErrors.map(logged => logged.message)).toEqual([
            "The stuck step was failed, but syncing the target failed."
        ]);
    });

    it("leaves a step its run decided after the review was read (the run saves before its task succeeds)", async () => {
        fakeGetTask.set("task-1", TaskDataStatus.SUCCESS);
        const { stuckSteps, reviews } = await setup();
        // Read while the step was still in review...
        const snapshot = expectOk(await reviews.get("review-1"));
        // ...then the run approved the step and its task turned `success`.
        const decided = Review.fromData(snapshot);
        expectOk(
            decided.approve({
                stepId: AUTOMATION_STEP_ID,
                actor: automationActor,
                actorTeamIds: [],
                comment: null,
                now: new Date().toISOString()
            })
        );
        expectOk(await reviews.update(toSaveData(decided)));
        recordedEvents.length = 0;

        const checked = await stuckSteps.check(snapshot);

        expect(checked.steps[0]).toMatchObject({ state: "approved" });
        expect(expectOk(await reviews.get("review-1")).steps[0]).toMatchObject({
            state: "approved"
        });
        expect(workflowEventTypes()).toEqual([]);
    });

    it("checks a review passed in directly and never throws", async () => {
        fakeGetTask.set("task-1", TaskDataStatus.SUCCESS);
        const { stuckSteps, reviews } = await setup();
        const data = expectOk(await reviews.get("review-1"));

        const checked = await stuckSteps.check(data);

        expect(checked.steps[0]).toMatchObject({ state: "failed", comment: STUCK_REASON });
    });
});

describe("Stuck detection grace boundaries (R152)", () => {
    // Only `Date` is faked, after the setup, so the async stores keep their real timers.
    const NOW = new Date("2026-10-14T12:00:00.000Z");
    const ago = (ms: number): string => new Date(NOW.getTime() - ms).toISOString();

    beforeEach(() => {
        fakeGetTask.reset();
        loggedErrors.length = 0;
        recordedEvents.length = 0;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const freezeTime = () => {
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(NOW);
    };

    it.each([TaskDataStatus.FAILED, TaskDataStatus.ABORTED])(
        "is not stuck when a %s task finished exactly the grace ago, strictly older is required",
        async status => {
            fakeGetTask.set("task-1", status, requester.id, ago(STEP_RUN_STUCK_GRACE_MS));
            const { getReview } = await setup();
            freezeTime();

            const review = expectOk(await getReview.execute({ id: "review-1" }));

            expect(review.steps[0]).toMatchObject({ state: "inReview", comment: null });
        }
    );

    it.each([TaskDataStatus.FAILED, TaskDataStatus.ABORTED])(
        "is stuck when a %s task finished one millisecond past the grace",
        async status => {
            fakeGetTask.set("task-1", status, requester.id, ago(STEP_RUN_STUCK_GRACE_MS + 1));
            const { getReview } = await setup();
            freezeTime();

            const review = expectOk(await getReview.execute({ id: "review-1" }));

            expect(review.steps[0]).toMatchObject({ state: "failed", comment: STUCK_REASON });
        }
    );

    it("is not stuck when the task is missing and the step started exactly the grace ago", async () => {
        const seed = toSaveData(createRunningAutomationReview("task-1"));
        seed.steps[0].startedOn = ago(STEP_RUN_STUCK_GRACE_MS);
        const { getReview } = await setup({ seed });
        freezeTime();

        const review = expectOk(await getReview.execute({ id: "review-1" }));

        expect(review.steps[0]).toMatchObject({ state: "inReview", comment: null });
    });

    it("is stuck when the task is missing and the step started one millisecond past the grace", async () => {
        const seed = toSaveData(createRunningAutomationReview("task-1"));
        seed.steps[0].startedOn = ago(STEP_RUN_STUCK_GRACE_MS + 1);
        const { getReview } = await setup({ seed });
        freezeTime();

        const review = expectOk(await getReview.execute({ id: "review-1" }));

        expect(review.steps[0]).toMatchObject({ state: "failed", comment: STUCK_REASON });
    });

    it("measures a missing task from reachedOn when the step has no startedOn", async () => {
        const seed = toSaveData(createRunningAutomationReview("task-1"));
        seed.steps[0].startedOn = null;
        seed.steps[0].reachedOn = ago(STEP_RUN_STUCK_GRACE_MS + 1000);
        const { getReview } = await setup({ seed });
        freezeTime();

        const review = expectOk(await getReview.execute({ id: "review-1" }));

        expect(review.steps[0]).toMatchObject({ state: "failed", comment: STUCK_REASON });
    });

    it("measures a missing task from the review's lastChangedOn when the step has no times", async () => {
        const seed = toSaveData(createRunningAutomationReview("task-1"));
        seed.steps[0].startedOn = null;
        seed.steps[0].reachedOn = null;
        seed.lastChangedOn = ago(STEP_RUN_STUCK_GRACE_MS + 1000);
        const { getReview } = await setup({ seed });
        freezeTime();

        const review = expectOk(await getReview.execute({ id: "review-1" }));

        expect(review.steps[0]).toMatchObject({ state: "failed", comment: STUCK_REASON });
    });
});
