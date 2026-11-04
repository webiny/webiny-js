import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { RecordingReviewNotifier } from "~tests/__helpers/RecordingReviewNotifier.js";
import {
    createNotificationReview,
    EDITORIAL_CHANNEL,
    LEGAL_CHANNEL
} from "~tests/__helpers/notificationReviews.js";
import { NOW, reviewer } from "~tests/__helpers/fixtures.js";
import type { ReviewStepReassignedFact } from "~/domain/review/facts.js";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import {
    ReviewStepReassignedEvent,
    type ReviewStepReassignedEventHandler
} from "~/features/review/ReassignReviewStep/events.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/index.js";
import { ReviewStepReassignedNotifications } from "~/features/notifications/handlers/ReviewStepReassignedNotifications.js";

const HANDLER_FAILED = "A workflow notification handler failed.";

const MANAGER: Actor = {
    type: "user",
    id: "user-manager",
    displayName: "Mona Manager",
    identityType: "admin"
};
const ANNA: Actor = { type: "user", id: "user-anna", displayName: "Anna", identityType: "admin" };

const createFact = (
    overrides: Partial<ReviewStepReassignedFact> = {}
): ReviewStepReassignedFact => {
    return {
        type: "stepReassigned",
        occurredOn: NOW,
        actor: MANAGER,
        change: { stepId: "legal", fromState: "inReview", toState: "inReview" },
        owner: ANNA,
        previousOwner: reviewer,
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
        ReviewStepReassignedNotifications
    ) as ReviewStepReassignedEventHandler.Interface;

    return {
        notifier,
        handle: (review: ReviewData, fact: ReviewStepReassignedFact): Promise<void> => {
            return handler.handle(new ReviewStepReassignedEvent({ review, fact }));
        }
    };
};

describe("ReviewStepReassignedNotifications (R181, R183, R184, R189)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("tells the new owner first and the old owner second, each with its own message", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact());

        expect(notifier.calls).toHaveLength(2);
        const [assigned, reassigned] = notifier.calls;
        expect(assigned.event).toBe("assigned");
        expect(assigned.stepId).toBe("legal");
        expect(assigned.recipients).toEqual([{ id: "user-anna", displayName: "Anna" }]);
        expect(assigned.message).toEqual({
            title: "You’re reviewing “Article 1”",
            body: "Legal review · reassigned to you by Mona Manager",
            subject: "You’re reviewing: Article 1 (Legal review)",
            text: "You are the owner of Legal review. Open the content to approve or reject it.",
            linkLabel: "Open content"
        });
        expect(reassigned.event).toBe("reassigned");
        expect(reassigned.stepId).toBe("legal");
        expect(reassigned.recipients).toEqual([
            { id: "user-reviewer", displayName: "Rob Reviewer" }
        ]);
        expect(reassigned.message).toEqual({
            title: "“Article 1” was reassigned to Anna",
            body: "Legal review · reassigned by Mona Manager. You no longer own this step.",
            subject: "Reassigned: Article 1 (Legal review)",
            text: "Mona Manager reassigned this step to Anna. You don’t need to review it any more.",
            linkLabel: "Open content"
        });
    });

    it("uses the channels of the reassigned step for both messages (Review Focus 8)", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({
                change: { stepId: "editorial", fromState: "inReview", toState: "inReview" }
            })
        );

        expect(notifier.calls.map(call => call.stepId)).toEqual(["editorial", "editorial"]);
        expect(notifier.calls[0].message.body).toBe(
            "Editorial review · reassigned to you by Mona Manager"
        );
        for (const call of notifier.calls) {
            expect(call.review.steps.find(step => step.id === call.stepId)?.notifications).toEqual([
                { id: EDITORIAL_CHANNEL }
            ]);
        }
        expect(
            notifier.calls[0].review.steps.find(step => step.id === "legal")?.notifications
        ).toEqual([{ id: LEGAL_CHANNEL }]);
    });

    it("tells only the new owner when the step was awaiting (no previous owner)", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ previousOwner: null }));

        expect(notifier.calls.map(call => call.event)).toEqual(["assigned"]);
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

        expect(notifier.calls.map(call => call.event)).toEqual(["assigned"]);
    });

    it("does not tell a user who reassigns the step to themselves (R184), but still the old owner", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ actor: ANNA }));

        expect(notifier.calls.map(call => call.event)).toEqual(["reassigned"]);
        expect(notifier.calls[0].recipients).toEqual([
            { id: "user-reviewer", displayName: "Rob Reviewer" }
        ]);
    });

    it("does not tell an old owner who reassigns their own step (R184), but still the new owner", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ actor: reviewer }));

        expect(notifier.calls.map(call => call.event)).toEqual(["assigned"]);
        expect(notifier.calls[0].message.body).toBe(
            "Legal review · reassigned to you by Rob Reviewer"
        );
    });

    it("names every person through getActorName: a blank display name reads `A user` (R189a)", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({
                actor: { ...MANAGER, displayName: "  " },
                owner: { ...ANNA, displayName: "" }
            })
        );

        expect(notifier.calls[0].message.body).toBe("Legal review · reassigned to you by A user");
        expect(notifier.calls[1].message.title).toBe("“Article 1” was reassigned to A user");
        expect(notifier.calls[1].message.body).toBe(
            "Legal review · reassigned by A user. You no longer own this step."
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
                fields: { errorName: "Error", reviewId: "review-1", event: "stepReassigned" }
            }
        ]);
    });
});
