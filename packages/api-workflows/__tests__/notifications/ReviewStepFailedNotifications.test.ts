import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { RecordingReviewNotifier } from "~tests/__helpers/RecordingReviewNotifier.js";
import {
    createNotificationReview,
    EDITORIAL_CHANNEL,
    LEGAL_CHANNEL
} from "~tests/__helpers/notificationReviews.js";
import { NOW, requester } from "~tests/__helpers/fixtures.js";
import type { ReviewStepFailedFact } from "~/domain/review/facts.js";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import {
    ReviewStepFailedEvent,
    type ReviewStepFailedEventHandler
} from "~/features/review/events.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/index.js";
import { ReviewStepFailedNotifications } from "~/features/notifications/handlers/ReviewStepFailedNotifications.js";

const HANDLER_FAILED = "A workflow notification handler failed.";
const REASON = "The automation failed.";

const AUTOMATION_ACTOR: Actor = {
    type: "automation",
    id: requester.id,
    displayName: "Link checker"
};

const createFact = (overrides: Partial<ReviewStepFailedFact> = {}): ReviewStepFailedFact => {
    return {
        type: "stepFailed",
        occurredOn: NOW,
        actor: AUTOMATION_ACTOR,
        change: { stepId: "legal", fromState: "inReview", toState: "failed" },
        reason: REASON,
        ...overrides
    };
};

const setup = async () => {
    const notifier = new RecordingReviewNotifier();
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerInstance(ReviewNotifierService, notifier);
        }
    });
    const handler = context.container.resolveImplementation(
        ReviewStepFailedNotifications
    ) as ReviewStepFailedEventHandler.Interface;

    return {
        notifier,
        handle: (review: ReviewData, fact: ReviewStepFailedFact): Promise<void> => {
            return handler.handle(new ReviewStepFailedEvent({ review, fact }));
        }
    };
};

describe("ReviewStepFailedNotifications (R181, R183, R184, R189, R146)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("tells the requester the step failed, through the failed step's channels", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact());

        expect(notifier.calls).toHaveLength(1);
        const [call] = notifier.calls;
        expect(call.event).toBe("failed");
        expect(call.stepId).toBe("legal");
        expect(call.recipients).toEqual([{ id: "user-requester", displayName: "Rita Requester" }]);
        expect(call.message).toEqual({
            title: "Legal review failed on “Article 1”",
            body: "The automation failed. You can restart the step.",
            subject: "Step failed: Article 1 (Legal review)",
            text: "Legal review hit a technical error. The automation failed. The review is paused at this step until it is restarted.",
            linkLabel: "Open content"
        });
        expect(call.review.steps.find(step => step.id === call.stepId)?.notifications).toEqual([
            { id: LEGAL_CHANNEL }
        ]);
    });

    it("uses the channels of the step that failed (Review Focus 8)", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({
                change: { stepId: "editorial", fromState: "inReview", toState: "failed" }
            })
        );

        const [call] = notifier.calls;
        expect(call.stepId).toBe("editorial");
        expect(call.review.steps.find(step => step.id === call.stepId)?.notifications).toEqual([
            { id: EDITORIAL_CHANNEL }
        ]);
    });

    it("tells the requester even when the actor is the requester as a user (R184, R140, Review Focus 2)", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ actor: requester }));

        expect(notifier.calls).toHaveLength(1);
        expect(notifier.calls[0].recipients).toEqual([
            { id: "user-requester", displayName: "Rita Requester" }
        ]);
    });

    it("uses only fact.reason: nothing else of the failure reaches the message (R146 mirror, Review Focus 4)", async () => {
        const { handle, notifier } = await setup();
        const review = createNotificationReview();
        review.steps[0].comment = "SECRET stack trace at /var/task/index.js:42";
        review.steps[0].runs = [
            {
                taskId: "task-0",
                startedOn: NOW,
                finishedOn: NOW,
                outcome: "failed",
                reason: "SECRET earlier failure"
            }
        ];

        await handle(review, createFact());

        expect(JSON.stringify(notifier.calls[0].message)).not.toContain("SECRET");
    });

    it("logs and returns when the step is not in the review", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({ change: { stepId: "gone", fromState: "inReview", toState: "failed" } })
        );

        expect(notifier.calls).toEqual([]);
        expect(loggedErrors).toEqual([
            {
                message: "Could not find the step for a workflow notification.",
                fields: { reviewId: "review-1", stepId: "gone" }
            }
        ]);
    });

    it("survives a notifier that throws (R87, Review Focus 1)", async () => {
        const { handle, notifier } = await setup();
        notifier.mode = "throw";

        await expect(handle(createNotificationReview(), createFact())).resolves.toBeUndefined();

        expect(loggedErrors).toEqual([
            {
                message: HANDLER_FAILED,
                fields: { errorName: "Error", reviewId: "review-1", event: "stepFailed" }
            }
        ]);
    });
});
