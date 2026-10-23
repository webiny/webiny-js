import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { RecordingReviewNotifier } from "~tests/__helpers/RecordingReviewNotifier.js";
import {
    createNotificationReview,
    EDITORIAL_CHANNEL,
    LEGAL_CHANNEL
} from "~tests/__helpers/notificationReviews.js";
import { NOW, otherReviewer, requester, reviewer } from "~tests/__helpers/fixtures.js";
import type { ReviewCancelledFact } from "~/domain/review/facts.js";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import {
    REVIEW_CANCEL_REASON_CONTENT_DELETED,
    REVIEW_CANCEL_REASON_CONTENT_TRASHED
} from "~/domain/review/getDeleteCancelReason.js";
import {
    ReviewCancelledEvent,
    type ReviewCancelledEventHandler
} from "~/features/review/CancelReview/events.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/index.js";
import { ReviewCancelledNotifications } from "~/features/notifications/handlers/ReviewCancelledNotifications.js";

const HANDLER_FAILED = "A workflow notification handler failed.";

const AI_OWNER: Actor = { type: "ai", id: requester.id, displayName: "AI check" };

const createFact = (overrides: Partial<ReviewCancelledFact> = {}): ReviewCancelledFact => {
    return {
        type: "cancelled",
        occurredOn: NOW,
        actor: requester,
        stepId: "legal",
        stepState: "inReview",
        reason: null,
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
        ReviewCancelledNotifications
    ) as ReviewCancelledEventHandler.Interface;

    return {
        notifier,
        handle: (review: ReviewData, fact: ReviewCancelledFact): Promise<void> => {
            return handler.handle(new ReviewCancelledEvent({ review, fact }));
        }
    };
};

/** "Editorial review" is the current step, `inReview`, owned by Olga (the cancel keeps owners). */
const createReviewOnEditorial = (): ReviewData => {
    const review = createNotificationReview();
    review.steps[0].state = "approved";
    review.steps[1].state = "inReview";
    review.steps[1].owner = otherReviewer;
    review.currentStepId = "editorial";
    review.currentStepState = "inReview";
    return review;
};

describe("ReviewCancelledNotifications (R181, R183, R184, R189, D134)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("tells the owner of the step the review was on, through that step's channels", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact());

        expect(notifier.calls).toHaveLength(1);
        const [call] = notifier.calls;
        expect(call.event).toBe("cancelled");
        expect(call.stepId).toBe("legal");
        expect(call.recipients).toEqual([{ id: "user-reviewer", displayName: "Rob Reviewer" }]);
        expect(call.message).toEqual({
            title: "The review of “Article 1” was cancelled",
            body: "Cancelled by Rita Requester. You no longer need to review Legal review.",
            subject: "Review cancelled: Article 1",
            text: "Rita Requester cancelled this review. You don’t need to review Legal review any more.",
            linkLabel: "Open content"
        });
        expect(call.review.steps.find(step => step.id === call.stepId)?.notifications).toEqual([
            { id: LEGAL_CHANNEL }
        ]);
    });

    it("reads the owner from the step and uses the step's channels when the review was on the second step (Review Focus 8)", async () => {
        const { handle, notifier } = await setup();

        await handle(createReviewOnEditorial(), createFact({ stepId: "editorial" }));

        const [call] = notifier.calls;
        expect(call.stepId).toBe("editorial");
        expect(call.recipients).toEqual([
            { id: "user-other-reviewer", displayName: "Olga Reviewer" }
        ]);
        expect(call.message.body).toBe(
            "Cancelled by Rita Requester. You no longer need to review Editorial review."
        );
        expect(call.review.steps.find(step => step.id === call.stepId)?.notifications).toEqual([
            { id: EDITORIAL_CHANNEL }
        ]);
    });

    it("does not read the owner from review.currentOwnerId", async () => {
        const { handle, notifier } = await setup();
        const review = createNotificationReview();
        review.currentOwnerId = "user-someone-else";

        await handle(review, createFact());

        expect(notifier.calls[0].recipients).toEqual([
            { id: "user-reviewer", displayName: "Rob Reviewer" }
        ]);
    });

    it("tells nobody when the step was awaiting (a pool step has no owner)", async () => {
        const { handle, notifier } = await setup();
        const review = createNotificationReview();
        review.steps[0].state = "awaiting";
        review.steps[0].owner = null;

        await handle(review, createFact({ stepState: "awaiting" }));

        expect(notifier.calls).toEqual([]);
    });

    it("tells nobody when the cancel names no step", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ stepId: null, stepState: null }));

        expect(notifier.calls).toEqual([]);
        expect(loggedErrors).toEqual([]);
    });

    it("tells nobody when the owner is an AI or an automation (R183)", async () => {
        const { handle, notifier } = await setup();
        const review = createNotificationReview();
        review.steps[0].owner = AI_OWNER;

        await handle(review, createFact());

        expect(notifier.calls).toEqual([]);
    });

    it("does not tell an owner who cancels their own review (R184)", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ actor: reviewer }));

        expect(notifier.calls).toEqual([]);
    });

    it("names a canceller with a blank display name `A user` (R189a)", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({ actor: { ...requester, displayName: "" } })
        );

        expect(notifier.calls[0].message.body).toBe(
            "Cancelled by A user. You no longer need to review Legal review."
        );
    });

    it("uses the trash text when the content was trashed (D134)", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({ reason: REVIEW_CANCEL_REASON_CONTENT_TRASHED })
        );

        expect(notifier.calls[0].message).toEqual({
            title: "The review of “Article 1” was cancelled",
            body: "The content was moved to the trash. You no longer need to review Legal review.",
            subject: "Review cancelled: Article 1",
            text: "The content was moved to the trash, so this review was cancelled. You don’t need to review Legal review any more.",
            linkLabel: "Open content"
        });
    });

    it("uses the delete text when the content was deleted (D134)", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({ reason: REVIEW_CANCEL_REASON_CONTENT_DELETED })
        );

        expect(notifier.calls[0].message.body).toBe(
            "The content was deleted. You no longer need to review Legal review."
        );
    });

    it("never prints an unknown cancel reason (R146 mirror)", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ reason: "SECRET internal reason" }));

        expect(notifier.calls[0].message.body).toBe(
            "Cancelled by Rita Requester. You no longer need to review Legal review."
        );
        expect(JSON.stringify(notifier.calls[0].message)).not.toContain("SECRET");
    });

    it("logs and returns when the cancelled step is not in the review", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ stepId: "gone" }));

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
                fields: { errorName: "Error", reviewId: "review-1", event: "cancelled" }
            }
        ]);
    });
});
