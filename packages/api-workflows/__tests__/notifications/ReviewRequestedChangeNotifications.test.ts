import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { RecordingReviewChangeNotifier } from "~tests/__helpers/RecordingReviewChangeNotifier.js";
import { createChangeReview } from "~tests/__helpers/changeNotificationReviews.js";
import { NOW, otherReviewer, requester } from "~tests/__helpers/fixtures.js";
import type { ReviewRequestedFact } from "~/domain/review/facts.js";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import {
    ReviewRequestedEvent,
    type ReviewRequestedEventHandler
} from "~/features/review/events.js";
import { ReviewChangeNotifierService } from "~/features/notifications/ReviewChangeNotifierService/index.js";
import { ReviewRequestedChangeNotifications } from "~/features/notifications/handlers/ReviewRequestedChangeNotifications.js";

const HANDLER_FAILED = "A workflow notification handler failed.";
const AI_ACTOR: Actor = { type: "ai", id: requester.id, displayName: "AI check" };

const createFact = (overrides: Partial<ReviewRequestedFact> = {}): ReviewRequestedFact => {
    return { type: "requested", occurredOn: NOW, actor: requester, ...overrides };
};

const setup = async () => {
    const notifier = new RecordingReviewChangeNotifier();
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerInstance(ReviewChangeNotifierService, notifier);
        }
    });
    const handler = context.container.resolveImplementation(
        ReviewRequestedChangeNotifications
    ) as ReviewRequestedEventHandler.Interface;

    return {
        notifier,
        handle: (review: ReviewData, fact: ReviewRequestedFact): Promise<void> => {
            return handler.handle(new ReviewRequestedEvent({ review, fact }));
        }
    };
};

describe("ReviewRequestedChangeNotifications (R253, R254)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("tells the current owner, not the requester who acted, that the review was requested", async () => {
        const { handle, notifier } = await setup();
        const review = createChangeReview();

        await handle(review, createFact());

        expect(notifier.calls).toHaveLength(1);
        const [call] = notifier.calls;
        expect(call.kind).toBe("requested");
        expect(call.stepId).toBe("legal");
        expect(call.recipientIds).toEqual(["user-reviewer"]);
        expect(call.review).toEqual(review);
    });

    it("tells the requester too when another user requested it", async () => {
        const { handle, notifier } = await setup();

        await handle(createChangeReview(), createFact({ actor: otherReviewer }));

        expect(notifier.calls[0].recipientIds).toEqual(["user-requester", "user-reviewer"]);
    });

    it("hands the notifier no recipient when the requester acts and no user owns the step", async () => {
        const { handle, notifier } = await setup();

        await handle(createChangeReview(null), createFact());

        expect(notifier.calls).toHaveLength(1);
        expect(notifier.calls[0].recipientIds).toEqual([]);
    });

    it("keeps the requester when an AI is the actor, because it carries the requester's id (D58)", async () => {
        const { handle, notifier } = await setup();

        await handle(createChangeReview(null), createFact({ actor: AI_ACTOR }));

        expect(notifier.calls[0].recipientIds).toEqual(["user-requester"]);
    });

    it("sends a null step when the review has no current step", async () => {
        const { handle, notifier } = await setup();
        const review = createChangeReview();
        review.currentStepId = null;

        await handle(review, createFact());

        expect(notifier.calls[0].stepId).toBeNull();
    });

    it("survives a notifier that throws (R87)", async () => {
        const { handle, notifier } = await setup();
        notifier.mode = "throw";

        await expect(handle(createChangeReview(), createFact())).resolves.toBeUndefined();

        expect(loggedErrors).toEqual([
            {
                message: HANDLER_FAILED,
                fields: { errorName: "Error", reviewId: "review-1", event: "requested" }
            }
        ]);
    });
});
