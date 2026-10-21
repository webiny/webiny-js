import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { expectOk, requester } from "~tests/__helpers/fixtures.js";
import {
    AUTOMATION_STEP_ID,
    automationActor,
    createRunningAutomationReview
} from "~tests/__helpers/stepRunReviews.js";
import {
    RecordingEventPublisher,
    recordedEvents,
    workflowEventTypes
} from "~tests/__helpers/RecordingEventPublisher.js";
import {
    RecordingReviewTargetSync,
    recordedSyncs
} from "~tests/__helpers/RecordingReviewTargetSync.js";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import type {
    ReviewStepFailedEvent,
    ReviewStepReachedEvent,
    ReviewStepRestartedEvent
} from "~/features/review/events.js";

const LATER = "2026-10-09T11:00:00.000Z";
const EVEN_LATER = "2026-10-09T12:00:00.000Z";
const REASON = "The automation failed: boom.";

const createRecordingContext = async () => {
    recordedEvents.length = 0;
    recordedSyncs.length = 0;
    const { context } = await createContextHandler({
        setup: container => {
            container.register(RecordingReviewTargetSync);
            container.registerDecorator(RecordingEventPublisher);
        }
    });
    return context;
};

describe("ReviewSaver with fail and restart", () => {
    it("persists a failed step and publishes StepFailed", async () => {
        const context = await createRecordingContext();
        const saver = context.container.resolve(ReviewSaver);
        const saved = expectOk(await saver.save(createRunningAutomationReview()));
        recordedEvents.length = 0;
        recordedSyncs.length = 0;
        const review = Review.fromData(saved);
        expectOk(review.fail({ stepId: AUTOMATION_STEP_ID, reason: REASON, now: LATER }));

        const result = await saver.save(review);

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            state: "inProgress",
            currentStepId: AUTOMATION_STEP_ID,
            currentStepState: "failed",
            lastChangedOn: LATER
        });
        expect(result.value.steps[0]).toMatchObject({
            state: "failed",
            comment: REASON,
            finishedOn: LATER,
            taskId: "task-1"
        });
        const stored = await context.container.resolve(ReviewRepository).get(review.id);
        expect(stored.value).toEqual(result.value);
        expect(workflowEventTypes()).toEqual(["Workflows/Review/StepFailed"]);
        const failed = recordedEvents.find(
            event => event.eventType === "Workflows/Review/StepFailed"
        ) as ReviewStepFailedEvent;
        expect(failed.payload.review).toEqual(result.value);
        expect(failed.payload.fact).toEqual({
            type: "stepFailed",
            occurredOn: LATER,
            actor: automationActor,
            change: { stepId: AUTOMATION_STEP_ID, fromState: "inReview", toState: "failed" },
            reason: REASON
        });
        expect(recordedSyncs.map(sync => sync.systemWorkflow?.stepState)).toEqual(["failed"]);
    });

    it("persists the restart with its run history, then the re-reach", async () => {
        const context = await createRecordingContext();
        const saver = context.container.resolve(ReviewSaver);
        const running = expectOk(await saver.save(createRunningAutomationReview()));
        const failing = Review.fromData(running);
        expectOk(failing.fail({ stepId: AUTOMATION_STEP_ID, reason: REASON, now: LATER }));
        const failed = expectOk(await saver.save(failing));
        recordedEvents.length = 0;
        const review = Review.fromData(failed);
        expectOk(review.restart({ stepId: AUTOMATION_STEP_ID, actor: requester, now: EVEN_LATER }));
        expectOk(
            review.reachRun({
                actor: requester,
                owner: automationActor,
                taskId: "task-2",
                now: EVEN_LATER
            })
        );

        const result = await saver.save(review);

        expect(result.isOk()).toBe(true);
        expect(result.value.steps[0]).toMatchObject({
            state: "inReview",
            taskId: "task-2",
            comment: null,
            owner: automationActor,
            runs: [
                {
                    taskId: "task-1",
                    startedOn: "2026-10-09T10:00:00.000Z",
                    finishedOn: LATER,
                    outcome: "failed",
                    reason: REASON
                }
            ]
        });
        expect(workflowEventTypes()).toEqual([
            "Workflows/Review/StepRestarted",
            "Workflows/Review/StepReached"
        ]);
        const restarted = recordedEvents.find(
            event => event.eventType === "Workflows/Review/StepRestarted"
        ) as ReviewStepRestartedEvent;
        expect(restarted.payload.fact).toEqual({
            type: "stepRestarted",
            occurredOn: EVEN_LATER,
            actor: requester,
            change: { stepId: AUTOMATION_STEP_ID, fromState: "failed", toState: "pending" },
            previousTaskId: "task-1"
        });
        const reached = recordedEvents.find(
            event => event.eventType === "Workflows/Review/StepReached"
        ) as ReviewStepReachedEvent;
        expect(reached.payload.fact).toEqual({
            type: "stepReached",
            occurredOn: EVEN_LATER,
            actor: requester,
            owner: automationActor,
            change: { stepId: AUTOMATION_STEP_ID, fromState: "pending", toState: "inReview" },
            assignment: null,
            taskId: "task-2",
            records: []
        });
    });
});
