import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { RecordingReviewNotifier } from "~tests/__helpers/RecordingReviewNotifier.js";
import {
    createNotificationReview,
    EDITORIAL_CHANNEL,
    LEGAL_CHANNEL
} from "~tests/__helpers/notificationReviews.js";
import { NOW, requester, reviewer } from "~tests/__helpers/fixtures.js";
import type { ReviewStepRejectedFact } from "~/domain/review/facts.js";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import {
    ReviewStepRejectedEvent,
    type ReviewStepRejectedEventHandler
} from "~/features/review/events.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/index.js";
import { ReviewStepRejectedNotifications } from "~/features/notifications/handlers/ReviewStepRejectedNotifications.js";

const HANDLER_FAILED = "A workflow notification handler failed.";
const COMMENT = "The terms are unclear.";

const AI_ACTOR: Actor = { type: "ai", id: requester.id, displayName: "AI model name" };
const AUTOMATION_ACTOR: Actor = {
    type: "automation",
    id: requester.id,
    displayName: "Link checker"
};

const createFact = (overrides: Partial<ReviewStepRejectedFact> = {}): ReviewStepRejectedFact => {
    return {
        type: "stepRejected",
        occurredOn: NOW,
        actor: reviewer,
        change: { stepId: "legal", fromState: "inReview", toState: "rejected" },
        comment: COMMENT,
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
        ReviewStepRejectedNotifications
    ) as ReviewStepRejectedEventHandler.Interface;

    return {
        notifier,
        handle: (review: ReviewData, fact: ReviewStepRejectedFact): Promise<void> => {
            return handler.handle(new ReviewStepRejectedEvent({ review, fact }));
        }
    };
};

describe("ReviewStepRejectedNotifications (R181, R183, R184, R189, D107)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("tells the requester who rejected the review and why, through the rejecting step's channels", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact());

        expect(notifier.calls).toHaveLength(1);
        const [call] = notifier.calls;
        expect(call.event).toBe("rejected");
        expect(call.stepId).toBe("legal");
        expect(call.recipients).toEqual([{ id: "user-requester", displayName: "Rita Requester" }]);
        expect(call.message).toEqual({
            title: "“Article 1” was rejected at Legal review",
            body: "Rob Reviewer: “The terms are unclear.”. Create a new revision to fix it.",
            subject: "Rejected: Article 1 (Legal review)",
            text: "Rob Reviewer rejected this revision at Legal review: “The terms are unclear.”. This revision can’t be changed; create a new revision, fix it and request a new review.",
            linkLabel: "Open content"
        });
        expect(call.review.steps.find(step => step.id === call.stepId)?.notifications).toEqual([
            { id: LEGAL_CHANNEL }
        ]);
    });

    it("uses the channels of the step that rejected (Review Focus 8)", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({
                change: { stepId: "editorial", fromState: "inReview", toState: "rejected" }
            })
        );

        const [call] = notifier.calls;
        expect(call.stepId).toBe("editorial");
        expect(call.message.title).toBe("“Article 1” was rejected at Editorial review");
        expect(call.review.steps.find(step => step.id === call.stepId)?.notifications).toEqual([
            { id: EDITORIAL_CHANNEL }
        ]);
    });

    it.each([
        { name: "an AI", actor: AI_ACTOR },
        { name: "an automation", actor: AUTOMATION_ACTOR }
    ])(
        "names $name decider by the step title, never by its own name (D107, D126)",
        async ({ actor }) => {
            const { handle, notifier } = await setup();

            await handle(createNotificationReview(), createFact({ actor }));

            const [call] = notifier.calls;
            expect(call.message.body).toBe(
                "Legal review: “The terms are unclear.”. Create a new revision to fix it."
            );
            expect(call.message.text).toContain(
                "Legal review rejected this revision at Legal review"
            );
            expect(JSON.stringify(call.message)).not.toContain("AI model name");
            expect(JSON.stringify(call.message)).not.toContain("Link checker");
        }
    );

    it.each([
        { name: "an AI", actor: AI_ACTOR },
        { name: "an automation", actor: AUTOMATION_ACTOR }
    ])(
        "still tells the requester when $name actor carries the requester's id (R184, D58, Review Focus 2)",
        async ({ actor }) => {
            const { handle, notifier } = await setup();

            await handle(createNotificationReview(), createFact({ actor }));

            expect(notifier.calls).toHaveLength(1);
            expect(notifier.calls[0].recipients).toEqual([
                { id: "user-requester", displayName: "Rita Requester" }
            ]);
        }
    );

    it("does not tell a user who rejects as the requester (R184)", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ actor: requester }));

        expect(notifier.calls).toEqual([]);
    });

    it("names a person with a blank display name `A user` (R189a)", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({ actor: { ...reviewer, displayName: "  " } })
        );

        expect(notifier.calls[0].message.body).toBe(
            "A user: “The terms are unclear.”. Create a new revision to fix it."
        );
    });

    it("passes an empty comment for a null comment (the type allows null, a reject always has one, D100)", async () => {
        const { handle, notifier } = await setup();

        await handle(createNotificationReview(), createFact({ comment: null }));

        expect(notifier.calls[0].message.body).toBe(
            "Rob Reviewer: “”. Create a new revision to fix it."
        );
    });

    it("clamps a long comment to at most 300 characters (R189a)", async () => {
        const { handle, notifier } = await setup();
        const comment = "x".repeat(400);

        await handle(createNotificationReview(), createFact({ comment }));

        const body = notifier.calls[0].message.body;
        expect(body).toContain(`“${"x".repeat(299)}…”`);
        expect(body).not.toContain("x".repeat(300));
    });

    it("logs and returns when the step is not in the review", async () => {
        const { handle, notifier } = await setup();

        await handle(
            createNotificationReview(),
            createFact({ change: { stepId: "gone", fromState: "inReview", toState: "rejected" } })
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
                fields: { errorName: "Error", reviewId: "review-1", event: "stepRejected" }
            }
        ]);
    });
});
