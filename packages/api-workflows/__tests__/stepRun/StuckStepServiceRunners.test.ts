import { beforeEach, describe, expect, it } from "vitest";
import { TaskDataStatus } from "@webiny/api-core/features/task/TaskService/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { fakeGetTask } from "~tests/__helpers/FakeGetTask.js";
import {
    RecordingEventPublisher,
    recordedEvents,
    workflowEventTypes
} from "~tests/__helpers/RecordingEventPublisher.js";
import {
    createFakeStepReview,
    FAKE_STEP_TYPE,
    registerTestStepRunner,
    TestStepRunner
} from "~tests/__helpers/TestStepRunner.js";
import { expectOk } from "~tests/__helpers/fixtures.js";
import type { ReviewData } from "~/domain/review/types.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { GetReviewUseCase } from "~/features/review/GetReview/index.js";

/** One review ("review-1") is stored; `runner` null registers no runner of the fake type. */
const setup = async (seed: ReviewData, runner: TestStepRunner | null) => {
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerDecorator(RecordingEventPublisher);
            if (runner) {
                registerTestStepRunner(container, runner);
            }
        }
    });
    expectOk(await context.container.resolve(ReviewRepository).save(seed));
    recordedEvents.length = 0;

    return { getReview: context.container.resolve(GetReviewUseCase) };
};

describe("Stuck detection covers every step type (R152, R168)", () => {
    beforeEach(() => {
        fakeGetTask.reset();
        loggedErrors.length = 0;
        recordedEvents.length = 0;
    });

    it("fails a stuck step with the stuck reason of its own runner", async () => {
        fakeGetTask.set("task-1", TaskDataStatus.SUCCESS);
        const { getReview } = await setup(createFakeStepReview("task-1"), new TestStepRunner());

        const review = expectOk(await getReview.execute({ id: "review-1" }));

        expect(fakeGetTask.calls).toEqual(["task-1"]);
        expect(review).toMatchObject({
            state: "inProgress",
            currentStepState: "failed",
            currentStepType: FAKE_STEP_TYPE
        });
        expect(review.steps[0]).toMatchObject({
            state: "failed",
            comment: "The fake step ended without a result."
        });
        expect(workflowEventTypes()).toEqual(["Workflows/Review/StepFailed"]);
        expect(loggedErrors).toEqual([]);
    });

    it.each([TaskDataStatus.FAILED, TaskDataStatus.ABORTED])(
        "fails a stuck step of such a type when its task is %s (finished long ago)",
        async status => {
            fakeGetTask.set("task-1", status);
            const { getReview } = await setup(createFakeStepReview("task-1"), new TestStepRunner());

            const review = expectOk(await getReview.execute({ id: "review-1" }));

            expect(review.steps[0]).toMatchObject({
                state: "failed",
                comment: "The fake step ended without a result."
            });
        }
    );

    it("fails a stuck step whose type has no runner with the neutral text", async () => {
        fakeGetTask.set("task-1", TaskDataStatus.SUCCESS);
        const { getReview } = await setup(createFakeStepReview("task-1", "no-such-runner"), null);

        const review = expectOk(await getReview.execute({ id: "review-1" }));

        expect(review).toMatchObject({
            state: "inProgress",
            currentStepState: "failed",
            currentStepType: "no-such-runner"
        });
        expect(review.steps[0]).toMatchObject({ state: "failed", comment: "The step failed." });
        expect(workflowEventTypes()).toEqual(["Workflows/Review/StepFailed"]);
    });

    it.each([TaskDataStatus.PENDING, TaskDataStatus.RUNNING])(
        "leaves a step whose task is %s alone, whatever its type",
        async status => {
            fakeGetTask.set("task-1", status);
            const withRunner = await setup(createFakeStepReview("task-1"), new TestStepRunner());
            const first = expectOk(await withRunner.getReview.execute({ id: "review-1" }));

            const withoutRunner = await setup(
                createFakeStepReview("task-1", "no-such-runner"),
                null
            );
            const second = expectOk(await withoutRunner.getReview.execute({ id: "review-1" }));

            expect(first.steps[0]).toMatchObject({ state: "inReview", comment: null });
            expect(second.steps[0]).toMatchObject({ state: "inReview", comment: null });
        }
    );

    it("keeps the stale guard for a step of such a type: a task somebody else created is not stuck", async () => {
        fakeGetTask.set("task-1", TaskDataStatus.SUCCESS, "user-intruder");
        const { getReview } = await setup(createFakeStepReview("task-1", "no-such-runner"), null);

        const review = expectOk(await getReview.execute({ id: "review-1" }));

        expect(review.steps[0]).toMatchObject({ state: "inReview", comment: null });
        expect(workflowEventTypes()).toEqual([]);
    });

    it("never looks up a task for a step that has no task id, as a review step has none", async () => {
        const { getReview } = await setup(createFakeStepReview(null, "review"), null);

        const review = expectOk(await getReview.execute({ id: "review-1" }));

        expect(fakeGetTask.calls).toEqual([]);
        expect(review.steps[0]).toMatchObject({ state: "inReview", comment: null });
    });
});
