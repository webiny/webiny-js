import { beforeEach, describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
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
import {
    ListReviewCandidateTeamsUseCase,
    type ReviewCandidateTeam
} from "~/features/review/ListReviewCandidateTeams/index.js";
import { ReviewPersistenceError } from "~/domain/review/errors.js";

const HANDLER_FAILED = "A workflow notification handler failed.";
const REVIEWER_FOOTER =
    "You get this e-mail because you review this step and it notifies by e-mail.";

const TEAM_LEGAL = "team-legal";
const TEAM_MARKETING = "team-marketing";
const TEAM_DESIGN = "team-design";

/**
 * Answers the candidate team names with a fixed list, a failure or a throw, and records the ids
 * it was asked for.
 */
class StubCandidateTeams implements ListReviewCandidateTeamsUseCase.Interface {
    public teams: ReviewCandidateTeam[] = [
        { id: TEAM_LEGAL, name: "Legal" },
        { id: TEAM_MARKETING, name: "Marketing" },
        { id: TEAM_DESIGN, name: "Design" }
    ];
    public mode: "ok" | "fail" | "throw" = "ok";
    public readonly calls: ListReviewCandidateTeamsUseCase.Input[] = [];

    public async execute(
        input: ListReviewCandidateTeamsUseCase.Input
    ): ListReviewCandidateTeamsUseCase.Return {
        this.calls.push(structuredClone(input));
        if (this.mode === "throw") {
            throw new Error("The team lookup crashed.");
        }
        if (this.mode === "fail") {
            return Result.fail(new ReviewPersistenceError(new Error("Team lookup failed.")));
        }
        return Result.ok(
            this.teams.filter(team => input.teamIds.includes(team.id)).map(team => ({ ...team }))
        );
    }
}

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
    const teams = new StubCandidateTeams();
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerInstance(ReviewNotifierService, notifier);
            container.registerInstance(NotificationRecipientService, recipients);
            container.registerInstance(ListReviewCandidateTeamsUseCase, teams);
        }
    });
    const handler = context.container.resolveImplementation(
        ReviewStepReachedNotifications
    ) as ReviewStepReachedEventHandler.Interface;

    return {
        notifier,
        recipients,
        teams,
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
            expect(call.deliveries[0].recipients).toEqual([
                { id: "user-anna", displayName: "Anna" }
            ]);
            expect(call.deliveries[0].message).toEqual({
                title: "You’re reviewing “Article 1”",
                body: "Legal review · picked by Rita Requester",
                subject: "You’re reviewing: Article 1 (Legal review)",
                text: "You are the owner of Legal review. Open the content to approve or reject it.",
                linkLabel: "Open content",
                link: "content",
                footer: "You get this e-mail because you review this step and it notifies by e-mail."
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
            expect(call.deliveries[0].recipients).toEqual([{ id: "user-bob", displayName: "Bob" }]);
            expect(call.deliveries[0].message.body).toBe(
                "Editorial review · picked by Rita Requester"
            );
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

            expect(notifier.calls[0].deliveries[0].message.body).toBe(`Legal review · ${reason}`);
        });

        it("reads a missing assignment as assigned to you", async () => {
            const { handle, notifier } = await setup();

            await handle(createNotificationReview(), createFact({ assignment: null }));

            expect(notifier.calls[0].deliveries[0].message.body).toBe(
                "Legal review · assigned to you"
            );
        });

        it("names a requester with a blank display name `A user` (R189a)", async () => {
            const { handle, notifier } = await setup();
            const review = createNotificationReview();
            review.createdBy = { ...requester, displayName: "   " };

            await handle(review, createFact());

            expect(notifier.calls[0].deliveries[0].message.body).toBe(
                "Legal review · picked by A user"
            );
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
            expect(notifier.calls[0].deliveries[0].recipients).toEqual([
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

        // The editorial step was reached with three candidate teams, in this order.
        const createPoolReview = (): ReviewData => {
            const review = createNotificationReview();
            const step = review.steps.find(item => item.id === "editorial");
            if (step) {
                step.candidateTeamIds = [TEAM_LEGAL, TEAM_MARKETING, TEAM_DESIGN];
            }
            return review;
        };

        it("tells the pool members, through the channels of the reached step", async () => {
            const { handle, notifier, recipients, teams } = await setup();
            recipients.pool = [
                { id: "user-anna", displayName: "Anna", teamIds: [TEAM_LEGAL] },
                { id: "user-bob", displayName: "Bob", teamIds: [TEAM_LEGAL] }
            ];
            const review = createPoolReview();

            await handle(review, poolFact());

            expect(recipients.poolCalls).toEqual([
                { review, stepId: "editorial", now: new Date(NOW) }
            ]);
            expect(teams.calls).toEqual([{ teamIds: [TEAM_LEGAL, TEAM_MARKETING, TEAM_DESIGN] }]);
            expect(notifier.calls).toHaveLength(1);
            const [call] = notifier.calls;
            expect(call.event).toBe("poolReached");
            expect(call.stepId).toBe("editorial");
            expect(call.deliveries).toHaveLength(1);
            expect(call.deliveries[0].recipients).toEqual([
                { id: "user-anna", displayName: "Anna" },
                { id: "user-bob", displayName: "Bob" }
            ]);
            expect(call.deliveries[0].message).toEqual({
                title: "“Article 1” is waiting in the Legal team pool",
                body: "Editorial review · requested by Rita Requester",
                subject: "Team pool: Article 1 (Editorial review)",
                text: "“Editorial review” is waiting in the Legal team pool. Anyone in the team can start it.",
                linkLabel: "Open content",
                link: "content",
                footer: "You get this e-mail because you review this step and it notifies by e-mail."
            });
            expect(call.review.steps.find(step => step.id === call.stepId)?.notifications).toEqual([
                { id: EDITORIAL_CHANNEL }
            ]);
        });

        it("sends one delivery per team set, naming the teams in the step's order, with one name lookup", async () => {
            const { handle, notifier, recipients, teams } = await setup();
            recipients.pool = [
                { id: "user-anna", displayName: "Anna", teamIds: [TEAM_LEGAL] },
                { id: "user-bob", displayName: "Bob", teamIds: [TEAM_LEGAL, TEAM_MARKETING] },
                { id: "user-cara", displayName: "Cara", teamIds: [TEAM_LEGAL] },
                {
                    id: "user-dan",
                    displayName: "Dan",
                    teamIds: [TEAM_LEGAL, TEAM_MARKETING, TEAM_DESIGN]
                }
            ];

            await handle(createPoolReview(), poolFact());

            expect(teams.calls).toHaveLength(1);
            expect(notifier.calls).toHaveLength(1);
            const [call] = notifier.calls;
            expect(
                call.deliveries.map(delivery => {
                    return {
                        ids: delivery.recipients.map(item => item.id),
                        title: delivery.message.title,
                        text: delivery.message.text
                    };
                })
            ).toEqual([
                {
                    ids: ["user-anna", "user-cara"],
                    title: "“Article 1” is waiting in the Legal team pool",
                    text: "“Editorial review” is waiting in the Legal team pool. Anyone in the team can start it."
                },
                {
                    ids: ["user-bob"],
                    title: "“Article 1” is waiting in the Legal and Marketing team pool",
                    text: "“Editorial review” is waiting in the Legal and Marketing team pool. Anyone in the team can start it."
                },
                {
                    ids: ["user-dan"],
                    title: "“Article 1” is waiting in the Legal, Marketing and 1 more team pool",
                    text: "“Editorial review” is waiting in the Legal, Marketing and 1 more team pool. Anyone in the team can start it."
                }
            ]);
            for (const delivery of call.deliveries) {
                expect(delivery.message.footer).toBe(REVIEWER_FOOTER);
            }
        });

        it("leaves out a team it cannot name and says `the team pool` when it can name none", async () => {
            const { handle, notifier, recipients, teams } = await setup();
            teams.teams = [{ id: TEAM_MARKETING, name: "Marketing" }];
            recipients.pool = [
                { id: "user-anna", displayName: "Anna", teamIds: [TEAM_LEGAL] },
                { id: "user-bob", displayName: "Bob", teamIds: [TEAM_LEGAL, TEAM_MARKETING] }
            ];

            await handle(createPoolReview(), poolFact());

            const titles = notifier.calls[0].deliveries.map(delivery => delivery.message.title);
            expect(titles).toEqual([
                "“Article 1” is waiting in the team pool",
                "“Article 1” is waiting in the Marketing team pool"
            ]);

            // Sets that read the same once unknown teams are left out share a delivery.
            recipients.pool = [
                { id: "user-anna", displayName: "Anna", teamIds: [TEAM_MARKETING] },
                { id: "user-bob", displayName: "Bob", teamIds: [TEAM_LEGAL, TEAM_MARKETING] }
            ];
            await handle(createPoolReview(), poolFact());

            const [shared, ...rest] = notifier.calls[1].deliveries;
            expect(rest).toEqual([]);
            expect(shared.recipients.map(item => item.id)).toEqual(["user-anna", "user-bob"]);
            expect(shared.message.title).toBe("“Article 1” is waiting in the Marketing team pool");
        });

        it.each(["fail", "throw"] as const)(
            "still tells the pool, without team names, when the name lookup does %s",
            async mode => {
                const { handle, notifier, recipients, teams } = await setup();
                teams.mode = mode;
                recipients.pool = [
                    { id: "user-anna", displayName: "Anna", teamIds: [TEAM_LEGAL] },
                    { id: "user-bob", displayName: "Bob", teamIds: [TEAM_MARKETING] }
                ];

                await handle(createPoolReview(), poolFact());

                expect(notifier.calls).toHaveLength(1);
                // Two team sets, one text: they share one delivery.
                const [delivery, ...others] = notifier.calls[0].deliveries;
                expect(others).toEqual([]);
                expect(delivery.recipients.map(item => item.id)).toEqual(["user-anna", "user-bob"]);
                expect(delivery.message.title).toBe("“Article 1” is waiting in the team pool");
                if (mode === "throw") {
                    expect(loggedErrors).toEqual([
                        {
                            message: "Could not look up the names of the step's teams.",
                            fields: {
                                errorName: "Error",
                                reviewId: "review-1",
                                stepId: "editorial"
                            }
                        }
                    ]);
                }
            }
        );

        it("does not look up team names when nobody is left to tell", async () => {
            const { handle, notifier, recipients, teams } = await setup();
            recipients.pool = [{ id: "user-anna", displayName: "Anna", teamIds: [TEAM_LEGAL] }];

            await handle(createPoolReview(), poolFact({ actor: ANNA }));

            expect(notifier.calls).toEqual([]);
            expect(teams.calls).toEqual([]);
        });

        it("drops a pool member who caused the step to be reached (R184)", async () => {
            const { handle, notifier, recipients } = await setup();
            recipients.pool = [
                { id: "user-anna", displayName: "Anna", teamIds: [TEAM_LEGAL] },
                { id: "user-bob", displayName: "Bob", teamIds: [TEAM_LEGAL] }
            ];

            await handle(createNotificationReview(), poolFact({ actor: ANNA }));

            expect(notifier.calls[0].deliveries[0].recipients).toEqual([
                { id: "user-bob", displayName: "Bob" }
            ]);
        });

        it("keeps a pool member when an AI actor with their id reached the step (R184)", async () => {
            const { handle, notifier, recipients } = await setup();
            recipients.pool = [{ id: "user-anna", displayName: "Anna", teamIds: [TEAM_LEGAL] }];
            const aiActor: Actor = { type: "ai", id: "user-anna", displayName: "AI check" };

            await handle(createNotificationReview(), poolFact({ actor: aiActor }));

            expect(notifier.calls[0].deliveries[0].recipients).toEqual([
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
            recipients.pool = [{ id: "user-anna", displayName: "Anna", teamIds: [TEAM_LEGAL] }];
            const review = createNotificationReview();
            review.createdBy = { ...requester, displayName: "" };

            await handle(review, poolFact());

            expect(notifier.calls[0].deliveries[0].message.body).toBe(
                "Editorial review · requested by A user"
            );
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
