import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { RecordingReviewNotifier } from "~tests/__helpers/RecordingReviewNotifier.js";
import {
    createNotificationReview,
    EDITORIAL_CHANNEL
} from "~tests/__helpers/notificationReviews.js";
import { NOW, reviewer } from "~tests/__helpers/fixtures.js";
import type { ReviewStepTakenOverFact } from "~/domain/review/facts.js";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import {
    ReviewStepTakenOverEvent,
    type ReviewStepTakenOverEventHandler
} from "~/features/review/events.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/index.js";
import { ReviewStepTakenOverNotifications } from "~/features/notifications/handlers/ReviewStepTakenOverNotifications.js";

const HANDLER_FAILED = "A workflow notification handler failed.";

const ANNA: Actor = { type: "user", id: "user-anna", displayName: "Anna", identityType: "admin" };

const createFact = (overrides: Partial<ReviewStepTakenOverFact> = {}): ReviewStepTakenOverFact => {
    return {
        type: "stepTakenOver",
        occurredOn: NOW,
        actor: ANNA,
        change: { stepId: "legal", fromState: "inReview", toState: "inReview" },
        previousOwner: reviewer,
        notifyPreviousOwner: true,
        records: [],
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
        ReviewStepTakenOverNotifications
    ) as ReviewStepTakenOverEventHandler.Interface;

    return {
        notifier,
        handle: (review: ReviewData, fact: ReviewStepTakenOverFact): Promise<void> => {
            return handler.handle(new ReviewStepTakenOverEvent({ review, fact }));
        }
    };
};

describe("ReviewStepTakenOverNotifications (R181, R183, R185, D111)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("tells the previous owner who took the step over", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact());

        expect(notifier.calls).toHaveLength(1);
        const [call] = notifier.calls;
        expect(call.event).toBe("takenOver");
        expect(call.stepId).toBe("legal");
        expect(call.recipients).toEqual([{ id: "user-reviewer", displayName: "Rob Reviewer" }]);
        expect(call.message).toEqual({
            title: "Anna took over Legal review on “Article 1”.",
            body: "You no longer own this step.",
            subject: "Taken over: Article 1 (Legal review)",
            text: "Anna took over Legal review on “Article 1”. You don’t need to review it any more.",
            linkLabel: "Open content"
        });
    });

    it("uses the channels of the step that was taken over (Review Focus 8)", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({
                change: { stepId: "editorial", fromState: "inReview", toState: "inReview" }
            })
        );

        const [call] = notifier.calls;
        expect(call.stepId).toBe("editorial");
        expect(call.message.title).toBe("Anna took over Editorial review on “Article 1”.");
        expect(call.review.steps.find(step => step.id === call.stepId)?.notifications).toEqual([
            { id: EDITORIAL_CHANNEL }
        ]);
    });

    it("sends nothing when the taker opted out of the notice (D111, R185)", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ notifyPreviousOwner: false }));

        expect(notifier.calls).toEqual([]);
        expect(loggedErrors).toEqual([]);
    });

    it.each([
        { type: "ai", displayName: "AI check" },
        { type: "automation", displayName: "Link checker" }
    ] as const)("never tells an $type previous owner", async ({ type, displayName }) => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({ previousOwner: { type, id: "user-requester", displayName } })
        );

        expect(notifier.calls).toEqual([]);
    });

    it("does not tell a user who takes over their own step (R184)", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ actor: reviewer }));

        expect(notifier.calls).toEqual([]);
    });

    it("names the taker through getActorName: a blank display name reads `A user` (R189a)", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({ actor: { ...ANNA, displayName: "  " } })
        );

        expect(notifier.calls[0].message.title).toBe(
            "A user took over Legal review on “Article 1”."
        );
    });

    it("logs and returns when the step is not in the review", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({ change: { stepId: "gone", fromState: "inReview", toState: "inReview" } })
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
                fields: { errorName: "Error", reviewId: "review-1", event: "stepTakenOver" }
            }
        ]);
    });
});
