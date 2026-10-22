import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { RecordingReviewNotifier } from "~tests/__helpers/RecordingReviewNotifier.js";
import {
    createNotificationReview,
    EDITORIAL_CHANNEL
} from "~tests/__helpers/notificationReviews.js";
import { NOW, requester, reviewer } from "~tests/__helpers/fixtures.js";
import type { ReviewApprovedFact } from "~/domain/review/facts.js";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import {
    ReviewApprovedEvent,
    type ReviewApprovedEventHandler
} from "~/features/review/ApproveReviewStep/events.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/index.js";
import { ReviewApprovedNotifications } from "~/features/notifications/handlers/ReviewApprovedNotifications.js";

const HANDLER_FAILED = "A workflow notification handler failed.";

const AI_ACTOR: Actor = { type: "ai", id: requester.id, displayName: "AI check" };

const createFact = (overrides: Partial<ReviewApprovedFact> = {}): ReviewApprovedFact => {
    return { type: "approved", occurredOn: NOW, actor: reviewer, ...overrides };
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
        ReviewApprovedNotifications
    ) as ReviewApprovedEventHandler.Interface;

    return {
        notifier,
        handle: (review: ReviewData, fact: ReviewApprovedFact): Promise<void> => {
            return handler.handle(new ReviewApprovedEvent({ review, fact }));
        }
    };
};

describe("ReviewApprovedNotifications (R181, R183, R184, R189)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("tells the requester the review is approved, through the channels of the last step", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact());

        expect(notifier.calls).toHaveLength(1);
        const [call] = notifier.calls;
        expect(call.event).toBe("approved");
        expect(call.stepId).toBe("editorial");
        expect(call.recipients).toEqual([{ id: "user-requester", displayName: "Rita Requester" }]);
        expect(call.message).toEqual({
            title: "“Article 1” was approved",
            body: "All steps approved. It’s ready to publish.",
            subject: "Approved: Article 1",
            text: "Every step approved this revision. It’s ready to publish.",
            linkLabel: "Open content"
        });
        expect(call.review.steps.find(step => step.id === call.stepId)?.notifications).toEqual([
            { id: EDITORIAL_CHANNEL }
        ]);
    });

    it("tells the requester when an AI or an automation approved (R184, D58)", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ actor: AI_ACTOR }));

        expect(notifier.calls).toHaveLength(1);
        expect(notifier.calls[0].recipients).toEqual([
            { id: "user-requester", displayName: "Rita Requester" }
        ]);
    });

    it("does not tell a user who approves as the requester (R184)", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ actor: requester }));

        expect(notifier.calls).toEqual([]);
    });

    it("logs and returns when the review has no step", async () => {
        const { handle, notifier } = await setup();
        const review = createNotificationReview();
        review.steps = [];

        await handle(review, createFact());

        expect(notifier.calls).toEqual([]);
        expect(loggedErrors).toEqual([
            {
                message: "Could not find the step for a workflow notification.",
                fields: { reviewId: "review-1", stepId: null }
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
                fields: { errorName: "Error", reviewId: "review-1", event: "approved" }
            }
        ]);
    });
});
