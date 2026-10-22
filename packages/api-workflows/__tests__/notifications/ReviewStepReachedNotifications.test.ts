import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { RecordingReviewNotifier } from "~tests/__helpers/RecordingReviewNotifier.js";
import {
    POOL_FAILURE_SECRET,
    StubNotificationRecipients
} from "~tests/__helpers/StubNotificationRecipients.js";
import {
    createNotificationReview,
    EDITORIAL_CHANNEL,
    LEGAL_CHANNEL
} from "~tests/__helpers/notificationReviews.js";
import { NOW, requester } from "~tests/__helpers/fixtures.js";
import type { ReviewStepReachedFact } from "~/domain/review/facts.js";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import {
    ReviewStepReachedEvent,
    type ReviewStepReachedEventHandler
} from "~/features/review/ReviewStepReacher/events.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/index.js";
import { NotificationRecipientService } from "~/features/notifications/NotificationRecipientService/index.js";
import { ReviewStepReachedNotifications } from "~/features/notifications/handlers/ReviewStepReachedNotifications.js";

const HANDLER_FAILED = "A workflow notification handler failed.";

const ANNA: Actor = { type: "user", id: "user-anna", displayName: "Anna", identityType: "admin" };
const BOB: Actor = { type: "user", id: "user-bob", displayName: "Bob", identityType: "admin" };
const AI_OWNER: Actor = { type: "ai", id: requester.id, displayName: "AI check" };
const AUTOMATION_OWNER: Actor = {
    type: "automation",
    id: requester.id,
    displayName: "Link checker"
};

const createFact = (overrides: Partial<ReviewStepReachedFact> = {}): ReviewStepReachedFact => {
    return {
        type: "stepReached",
        occurredOn: NOW,
        actor: requester,
        owner: ANNA,
        change: { stepId: "legal", fromState: "pending", toState: "inReview" },
        assignment: { source: "picked" },
        taskId: null,
        records: [],
        ...overrides
    };
};

const setup = async () => {
    const notifier = new RecordingReviewNotifier();
    const recipients = new StubNotificationRecipients();
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerInstance(ReviewNotifierService, notifier);
            container.registerInstance(NotificationRecipientService, recipients);
        }
    });
    const handler = context.container.resolveImplementation(
        ReviewStepReachedNotifications
    ) as ReviewStepReachedEventHandler.Interface;

    return {
        notifier,
        recipients,
        handle: (review: ReviewData, fact: ReviewStepReachedFact): Promise<void> => {
            return handler.handle(new ReviewStepReachedEvent({ review, fact }));
        }
    };
};

describe("ReviewStepReachedNotifications (R181, R183, R184, R189)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    describe("a user owns the reached step", () => {
        it("tells the owner the step is theirs, through the channels of the reached step", async () => {
            const { handle, notifier } = await setup();
            const review = createNotificationReview();

            await handle(review, createFact());

            expect(notifier.calls).toHaveLength(1);
            const [call] = notifier.calls;
            expect(call.event).toBe("assigned");
            expect(call.stepId).toBe("legal");
            expect(call.recipients).toEqual([{ id: "user-anna", displayName: "Anna" }]);
            expect(call.message).toEqual({
                title: "You’re reviewing “Article 1”",
                body: "Legal review · picked by Rita Requester",
                subject: "You’re reviewing: Article 1 (Legal review)",
                text: "You are the owner of Legal review. Open the content to approve or reject it.",
                linkLabel: "Open content"
            });
            expect(call.review.steps.find(step => step.id === call.stepId)?.notifications).toEqual([
                { id: LEGAL_CHANNEL }
            ]);
        });

        it("uses the channels of the second step when the second step was reached (Review Focus 8)", async () => {
            const { handle, notifier } = await setup();

            await handle(
                createNotificationReview(),
                createFact({
                    owner: BOB,
                    actor: ANNA,
                    change: { stepId: "editorial", fromState: "pending", toState: "inReview" }
                })
            );

            expect(notifier.calls).toHaveLength(1);
            const [call] = notifier.calls;
            expect(call.stepId).toBe("editorial");
            expect(call.recipients).toEqual([{ id: "user-bob", displayName: "Bob" }]);
            expect(call.message.body).toBe("Editorial review · picked by Rita Requester");
            expect(call.review.steps.find(step => step.id === call.stepId)?.notifications).toEqual([
                { id: EDITORIAL_CHANNEL }
            ]);
        });

        it.each([
            { source: "picked", reason: "picked by Rita Requester" },
            { source: "rule", reason: "assigned by a routing rule" },
            { source: "roundRobin", reason: "assigned by round-robin" },
            { source: "leastLoaded", reason: "assigned by least-loaded" },
            { source: "poolStart", reason: "assigned to you" }
        ] as const)("explains an assignment by $source", async ({ source, reason }) => {
            const { handle, notifier } = await setup();

            await handle(createNotificationReview(), createFact({ assignment: { source } }));

            expect(notifier.calls[0].message.body).toBe(`Legal review · ${reason}`);
        });

        it("reads a missing assignment as assigned to you", async () => {
            const { handle, notifier } = await setup();

            await handle(createNotificationReview(), createFact({ assignment: null }));

            expect(notifier.calls[0].message.body).toBe("Legal review · assigned to you");
        });

        it("names a requester with a blank display name `A user` (R189a)", async () => {
            const { handle, notifier } = await setup();
            const review = createNotificationReview();
            review.createdBy = { ...requester, displayName: "   " };

            await handle(review, createFact());

            expect(notifier.calls[0].message.body).toBe("Legal review · picked by A user");
        });

        it("does not tell a user who reached the step for themselves (R184)", async () => {
            const { handle, notifier } = await setup();

            await handle(createNotificationReview(), createFact({ actor: ANNA, owner: ANNA }));

            expect(notifier.calls).toEqual([]);
        });

        it("still tells the owner when an AI actor with the owner's id reached the step (R184, D58)", async () => {
            const { handle, notifier } = await setup();
            const aiActor: Actor = { type: "ai", id: "user-anna", displayName: "AI check" };

            await handle(createNotificationReview(), createFact({ actor: aiActor, owner: ANNA }));

            expect(notifier.calls).toHaveLength(1);
            expect(notifier.calls[0].recipients).toEqual([
                { id: "user-anna", displayName: "Anna" }
            ]);
        });

        it.each([
            { name: "an AI owner", owner: AI_OWNER },
            { name: "an automation owner", owner: AUTOMATION_OWNER }
        ])("tells nobody when the owner is $name (R183)", async ({ owner }) => {
            const { handle, notifier, recipients } = await setup();

            await handle(createNotificationReview(), createFact({ owner, assignment: null }));

            expect(notifier.calls).toEqual([]);
            expect(recipients.poolCalls).toEqual([]);
        });
    });

    describe("the step went to the pool", () => {
        const poolFact = (overrides: Partial<ReviewStepReachedFact> = {}) => {
            return createFact({
                owner: null,
                assignment: { source: "pool" },
                change: { stepId: "editorial", fromState: "pending", toState: "awaiting" },
                ...overrides
            });
        };

        it("tells the pool members, through the channels of the reached step", async () => {
            const { handle, notifier, recipients } = await setup();
            recipients.pool = [
                { id: "user-anna", displayName: "Anna" },
                { id: "user-bob", displayName: "Bob" }
            ];
            const review = createNotificationReview();

            await handle(review, poolFact());

            expect(recipients.poolCalls).toEqual([
                { review, stepId: "editorial", now: new Date(NOW) }
            ]);
            expect(notifier.calls).toHaveLength(1);
            const [call] = notifier.calls;
            expect(call.event).toBe("poolReached");
            expect(call.stepId).toBe("editorial");
            expect(call.recipients).toEqual([
                { id: "user-anna", displayName: "Anna" },
                { id: "user-bob", displayName: "Bob" }
            ]);
            expect(call.message).toEqual({
                title: "“Article 1” is waiting in the team pool",
                body: "Editorial review · requested by Rita Requester",
                subject: "Team pool: Article 1 (Editorial review)",
                text: "“Editorial review” is waiting in the team pool. Anyone in the team can start it.",
                linkLabel: "Open content"
            });
            expect(call.review.steps.find(step => step.id === call.stepId)?.notifications).toEqual([
                { id: EDITORIAL_CHANNEL }
            ]);
        });

        it("drops a pool member who caused the step to be reached (R184)", async () => {
            const { handle, notifier, recipients } = await setup();
            recipients.pool = [
                { id: "user-anna", displayName: "Anna" },
                { id: "user-bob", displayName: "Bob" }
            ];

            await handle(createNotificationReview(), poolFact({ actor: ANNA }));

            expect(notifier.calls[0].recipients).toEqual([{ id: "user-bob", displayName: "Bob" }]);
        });

        it("keeps a pool member when an AI actor with their id reached the step (R184)", async () => {
            const { handle, notifier, recipients } = await setup();
            recipients.pool = [{ id: "user-anna", displayName: "Anna" }];
            const aiActor: Actor = { type: "ai", id: "user-anna", displayName: "AI check" };

            await handle(createNotificationReview(), poolFact({ actor: aiActor }));

            expect(notifier.calls[0].recipients).toEqual([
                { id: "user-anna", displayName: "Anna" }
            ]);
        });

        it("sends nothing when the pool is empty", async () => {
            const { handle, notifier } = await setup();

            await handle(createNotificationReview(), poolFact());

            expect(notifier.calls).toEqual([]);
        });

        it("names a requester with a blank display name `A user` (R189a)", async () => {
            const { handle, notifier, recipients } = await setup();
            recipients.pool = [{ id: "user-anna", displayName: "Anna" }];
            const review = createNotificationReview();
            review.createdBy = { ...requester, displayName: "" };

            await handle(review, poolFact());

            expect(notifier.calls[0].message.body).toBe("Editorial review · requested by A user");
        });

        it("logs a failed pool lookup with code and name only and sends nothing (R196)", async () => {
            const { handle, notifier, recipients } = await setup();
            recipients.mode = "fail";

            await expect(handle(createNotificationReview(), poolFact())).resolves.toBeUndefined();

            expect(notifier.calls).toEqual([]);
            expect(loggedErrors).toEqual([
                {
                    message: "Could not list the members of the step's teams.",
                    fields: {
                        errorCode: "Workflows/Workflow/Persistence",
                        errorName: "Error",
                        reviewId: "review-1",
                        stepId: "editorial"
                    }
                }
            ]);
            expect(JSON.stringify(loggedErrors)).not.toContain(POOL_FAILURE_SECRET);
        });

        it("survives a recipient service that throws (R87)", async () => {
            const { handle, notifier, recipients } = await setup();
            recipients.mode = "throw";

            await expect(handle(createNotificationReview(), poolFact())).resolves.toBeUndefined();

            expect(notifier.calls).toEqual([]);
            expect(loggedErrors).toEqual([
                {
                    message: HANDLER_FAILED,
                    fields: {
                        errorName: "Error",
                        reviewId: "review-1",
                        event: "stepReached"
                    }
                }
            ]);
        });
    });

    it("logs and returns when the reached step is not in the review", async () => {
        const { handle, notifier } = await setup();

        await expect(
            handle(
                createNotificationReview(),
                createFact({
                    change: { stepId: "gone", fromState: "pending", toState: "inReview" }
                })
            )
        ).resolves.toBeUndefined();

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
                fields: { errorName: "Error", reviewId: "review-1", event: "stepReached" }
            }
        ]);
    });
});
