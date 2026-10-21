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
import { FailingReviewTargetSync } from "~tests/__helpers/FailingReviewTargetSync.js";
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
    /** The review is saved but the target sync fails (R16). */
    failSync?: boolean;
}

const setup = async (params: SetupParams = {}) => {
    const { context } = await createContextHandler({
        setup: container => {
            container.registerDecorator(FailingReviewSave);
            container.registerDecorator(RecordingEventPublisher);
            if (params.defined !== false) {
                registerTestAutomation(container);
            }
            if (params.failSync) {
                container.register(FailingReviewTargetSync);
            }
        }
    });
    const reviews = context.container.resolve(ReviewRepository);
    expectOk(await reviews.create(params.seed ?? toSaveData(createFailedReview())));
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
            await restart.execute({
                reviewId: "review-1",
                stepId: AUTOMATION_STEP_ID,
                actor: editor
            })
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
            await restart.execute({
                reviewId: "review-1",
                stepId: AUTOMATION_STEP_ID,
                actor: editor
            })
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
            await restart.execute({
                reviewId: "review-1",
                stepId: AUTOMATION_STEP_ID,
                actor: editor
            })
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
        const { restart } = await setup({
            seed: toSaveData(createRunningAutomationReview("task-1"))
        });

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
        expect(abortedTasks).toEqual([{ id: "task-1", message: "The review could not be saved." }]);
        const stored = expectOk(await reviews.get("review-1"));
        expect(stored.steps[0]).toMatchObject({ state: "failed", comment: FAILURE });
        expect(stored.steps[0].runs).toEqual([]);
    });

    it("keeps the new task and the restarted review when only the target sync fails (R16)", async () => {
        const { restart, reviews } = await setup({ failSync: true });

        const result = await restart.execute({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            actor: editor
        });

        expect(result.error?.code).toBe("Workflows/Review/TargetSync");
        expect(triggeredTasks.map(task => task.id)).toEqual(["task-1"]);
        expect(abortedTasks).toEqual([]);
        const stored = expectOk(await reviews.get("review-1"));
        expect(stored.steps[0]).toMatchObject({
            state: "inReview",
            taskId: "task-1",
            comment: null
        });
        expect(stored.steps[0].runs).toHaveLength(1);
    });
});
