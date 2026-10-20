import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { RecordingReviewChangeNotifier } from "~tests/__helpers/RecordingReviewChangeNotifier.js";
import { createChangeReview } from "~tests/__helpers/changeNotificationReviews.js";
import { NOW, otherReviewer, reviewer } from "~tests/__helpers/fixtures.js";
import type { ReviewStepStartedFact } from "~/domain/review/facts.js";
import type { ReviewData } from "~/domain/review/types.js";
import {
    ReviewStepStartedEvent,
    type ReviewStepStartedEventHandler
} from "~/features/review/events.js";
import { ReviewChangeNotifierService } from "~/features/notifications/ReviewChangeNotifierService/index.js";
import { ReviewStepStartedChangeNotifications } from "~/features/notifications/handlers/ReviewStepStartedChangeNotifications.js";

const HANDLER_FAILED = "A workflow notification handler failed.";
const createFact = (overrides: Partial<ReviewStepStartedFact> = {}): ReviewStepStartedFact => {
    return {
        type: "stepStarted",
        occurredOn: NOW,
        actor: reviewer,
        change: { stepId: "legal", fromState: "awaiting", toState: "inReview" },
        records: [],
        ...overrides
    };
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
        ReviewStepStartedChangeNotifications
    ) as ReviewStepStartedEventHandler.Interface;

    return {
        notifier,
        handle: (review: ReviewData, fact: ReviewStepStartedFact): Promise<void> => {
            return handler.handle(new ReviewStepStartedEvent({ review, fact }));
        }
    };
};

describe("ReviewStepStartedChangeNotifications (R253, R254)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("tells the requester, not the user who started the step and now owns it", async () => {
        const { handle, notifier } = await setup();
        const review = createChangeReview();

        await handle(review, createFact());

        expect(notifier.calls).toHaveLength(1);
        const [call] = notifier.calls;
        expect(call.kind).toBe("stepStarted");
        expect(call.stepId).toBe("legal");
        expect(call.recipientIds).toEqual(["user-requester"]);
        expect(call.review).toEqual(review);
    });

    it("tells the owner too when another user acted", async () => {
        const { handle, notifier } = await setup();

        await handle(createChangeReview(), createFact({ actor: otherReviewer }));

        expect(notifier.calls[0].recipientIds).toEqual(["user-requester", "user-reviewer"]);
    });

    it("uses the step of the fact, not the review's current step", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createChangeReview(),
            createFact({
                change: { stepId: "editorial", fromState: "awaiting", toState: "inReview" }
            })
        );

        expect(notifier.calls[0].stepId).toBe("editorial");
    });

    it("survives a notifier that throws (R87)", async () => {
        const { handle, notifier } = await setup();
        notifier.mode = "throw";

        await expect(handle(createChangeReview(), createFact())).resolves.toBeUndefined();

        expect(loggedErrors).toEqual([
            {
                message: HANDLER_FAILED,
                fields: { errorName: "Error", reviewId: "review-1", event: "stepStarted" }
            }
        ]);
    });
});
