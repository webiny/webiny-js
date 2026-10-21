import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { RecordingReviewChangeNotifier } from "~tests/__helpers/RecordingReviewChangeNotifier.js";
import { createChangeReview } from "~tests/__helpers/changeNotificationReviews.js";
import { NOW, requester } from "~tests/__helpers/fixtures.js";
import type { ReviewStepRestartedFact } from "~/domain/review/facts.js";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import {
    ReviewStepRestartedEvent,
    type ReviewStepRestartedEventHandler
} from "~/features/review/events.js";
import { ReviewChangeNotifierService } from "~/features/notifications/ReviewChangeNotifierService/index.js";
import { ReviewStepRestartedChangeNotifications } from "~/features/notifications/handlers/ReviewStepRestartedChangeNotifications.js";

const HANDLER_FAILED = "A workflow notification handler failed.";
/** A user with `workflows.reassign`: the wrapper checked it, the engine only records it (D132). */
const MANAGER: Actor = { type: "user", id: "user-manager", displayName: "Mona Manager" };

const createFact = (overrides: Partial<ReviewStepRestartedFact> = {}): ReviewStepRestartedFact => {
    return {
        type: "stepRestarted",
        occurredOn: NOW,
        actor: MANAGER,
        change: { stepId: "legal", fromState: "failed", toState: "pending" },
        previousTaskId: "task-1",
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
        ReviewStepRestartedChangeNotifications
    ) as ReviewStepRestartedEventHandler.Interface;

    return {
        notifier,
        handle: (review: ReviewData, fact: ReviewStepRestartedFact): Promise<void> => {
            return handler.handle(new ReviewStepRestartedEvent({ review, fact }));
        }
    };
};

describe("ReviewStepRestartedChangeNotifications (R253, R254)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("tells the requester when an operator restarts a step that no user owns", async () => {
        const { handle, notifier } = await setup();
        const review = createChangeReview(null);

        await handle(review, createFact());

        expect(notifier.calls).toHaveLength(1);
        const [call] = notifier.calls;
        expect(call.kind).toBe("stepRestarted");
        expect(call.stepId).toBe("legal");
        expect(call.recipientIds).toEqual(["user-requester"]);
        expect(call.review).toEqual(review);
    });

    it("hands the notifier no recipient when the requester restarts it and no user owns the step", async () => {
        const { handle, notifier } = await setup();

        await handle(createChangeReview(null), createFact({ actor: requester }));

        expect(notifier.calls).toHaveLength(1);
        expect(notifier.calls[0].recipientIds).toEqual([]);
    });

    it("tells the current user owner too", async () => {
        const { handle, notifier } = await setup();

        await handle(createChangeReview(), createFact());

        expect(notifier.calls[0].recipientIds).toEqual(["user-requester", "user-reviewer"]);
    });

    it("uses the step of the fact", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createChangeReview(null),
            createFact({ change: { stepId: "editorial", fromState: "failed", toState: "pending" } })
        );

        expect(notifier.calls[0].stepId).toBe("editorial");
    });

    it("survives a notifier that throws (R87)", async () => {
        const { handle, notifier } = await setup();
        notifier.mode = "throw";

        await expect(handle(createChangeReview(null), createFact())).resolves.toBeUndefined();

        expect(loggedErrors).toEqual([
            {
                message: HANDLER_FAILED,
                fields: { errorName: "Error", reviewId: "review-1", event: "stepRestarted" }
            }
        ]);
    });
});
