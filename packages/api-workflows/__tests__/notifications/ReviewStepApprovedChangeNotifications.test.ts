import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { RecordingReviewChangeNotifier } from "~tests/__helpers/RecordingReviewChangeNotifier.js";
import { createChangeReview } from "~tests/__helpers/changeNotificationReviews.js";
import { NOW, otherReviewer, requester, reviewer } from "~tests/__helpers/fixtures.js";
import type { ReviewStepApprovedFact } from "~/domain/review/facts.js";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import {
    ReviewStepApprovedEvent,
    type ReviewStepApprovedEventHandler
} from "~/features/review/ApproveReviewStep/events.js";
import { ReviewChangeNotifierService } from "~/features/notifications/ReviewChangeNotifierService/index.js";
import { ReviewStepApprovedChangeNotifications } from "~/features/notifications/handlers/ReviewStepApprovedChangeNotifications.js";

const HANDLER_FAILED = "A workflow notification handler failed.";
const AUTOMATION_ACTOR: Actor = {
    type: "automation",
    id: requester.id,
    displayName: "Link checker"
};

const createFact = (overrides: Partial<ReviewStepApprovedFact> = {}): ReviewStepApprovedFact => {
    return {
        type: "stepApproved",
        occurredOn: NOW,
        actor: reviewer,
        change: { stepId: "legal", fromState: "inReview", toState: "approved" },
        comment: null,
        ...overrides
    };
};

/** The saved review after an intermediate approval: the next step belongs to Olga Reviewer. */
const createNextOwnerReview = (): ReviewData => {
    const review = createChangeReview(otherReviewer.id);
    review.currentStepId = "editorial";
    return review;
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
        ReviewStepApprovedChangeNotifications
    ) as ReviewStepApprovedEventHandler.Interface;

    return {
        notifier,
        handle: (review: ReviewData, fact: ReviewStepApprovedFact): Promise<void> => {
            return handler.handle(new ReviewStepApprovedEvent({ review, fact }));
        }
    };
};

describe("ReviewStepApprovedChangeNotifications (R253, R254)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("tells the requester and the next owner when a step is approved and the review goes on", async () => {
        const { handle, notifier } = await setup();
        const review = createNextOwnerReview();

        await handle(review, createFact());

        expect(notifier.calls).toHaveLength(1);
        const [call] = notifier.calls;
        expect(call.kind).toBe("stepApproved");
        expect(call.stepId).toBe("legal");
        expect(call.recipientIds).toEqual(["user-requester", "user-other-reviewer"]);
        expect(call.review).toEqual(review);
    });

    it("does not tell the approver, even when the approver owns the saved step", async () => {
        const { handle, notifier } = await setup();

        await handle(createChangeReview(), createFact());

        expect(notifier.calls[0].recipientIds).toEqual(["user-requester"]);
    });

    it("does not tell the requester who approves", async () => {
        const { handle, notifier } = await setup();

        await handle(createNextOwnerReview(), createFact({ actor: requester }));

        expect(notifier.calls[0].recipientIds).toEqual(["user-other-reviewer"]);
    });

    it("keeps the requester when an automation approves, because it carries the requester's id (D58)", async () => {
        const { handle, notifier } = await setup();

        await handle(createChangeReview(null), createFact({ actor: AUTOMATION_ACTOR }));

        expect(notifier.calls[0].recipientIds).toEqual(["user-requester"]);
    });

    it.each(["approved", "rejected", "cancelled"] as const)(
        "sends nothing when the review is %s: the final approval already sends the approved notification",
        async state => {
            const { handle, notifier } = await setup();
            const review = createNextOwnerReview();
            review.state = state;

            await handle(review, createFact());

            expect(notifier.calls).toEqual([]);
            expect(loggedErrors).toEqual([]);
        }
    );

    it("survives a notifier that throws (R87)", async () => {
        const { handle, notifier } = await setup();
        notifier.mode = "throw";

        await expect(handle(createNextOwnerReview(), createFact())).resolves.toBeUndefined();

        expect(loggedErrors).toEqual([
            {
                message: HANDLER_FAILED,
                fields: { errorName: "Error", reviewId: "review-1", event: "stepApproved" }
            }
        ]);
    });
});
