import { beforeEach, describe, expect, it } from "vitest";
import { MailerService } from "@webiny/api-mailer";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import {
    WebsocketsListConnectionsUseCase,
    WebsocketsSendToConnectionsUseCase
} from "@webiny/api-websockets/exports/api.js";
import {
    createRoutingContext,
    resetRoutingFakes,
    ROUTING_USERS
} from "~tests/__helpers/routingContext.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { FakeListUsers, type FakeUser } from "~tests/__helpers/FakeListUsers.js";
import { FakeReviewTargetLoader } from "~tests/__helpers/FakeReviewTargetLoader.js";
import { readableUsers } from "~tests/__helpers/FakeReviewTargetReadAccess.js";
import {
    RecordingEventPublisher,
    recordedEvents,
    workflowEventTypes
} from "~tests/__helpers/RecordingEventPublisher.js";
import { RecordingMailer } from "~tests/__helpers/RecordingMailer.js";
import { FakeWebsocketConnections } from "~tests/__helpers/FakeWebsocketConnections.js";
import { SplitWebsocketsSend } from "~tests/__helpers/SplitWebsocketsSend.js";
import { RecordingNotificationTransport } from "~tests/__helpers/RecordingNotificationTransport.js";
import { FakeWorkflowsAdminUrl } from "~tests/__helpers/FakeWorkflowsAdminUrl.js";
import { FakeReviewTargetLink } from "~tests/__helpers/FakeReviewTargetLink.js";
import { resetFakeTasks } from "~tests/__helpers/FakeTaskService.js";
import { createRequestInput } from "~tests/__helpers/reviewContext.js";
import {
    AUTOMATION_STEP_ID,
    createFailedAutomationReview,
    createRunningAutomationReview
} from "~tests/__helpers/stepRunReviews.js";
import { registerTestAutomation } from "~tests/__helpers/TestAutomationDefinition.js";
import {
    ARTICLE_MODEL,
    createReviewStep,
    createWorkflowValues,
    editor,
    expectOk,
    requester,
    REVIEW_TEAM_ID,
    toSaveData
} from "~tests/__helpers/fixtures.js";
import { WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION } from "~/features/notifications/shared/constants.js";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import type { Actor, ReviewData, ReviewPick } from "~/domain/review/types.js";
import type { WorkflowStep } from "~/domain/workflow/types.js";
import {
    REVIEW_CANCEL_REASON_CONTENT_DELETED,
    REVIEW_CANCEL_REASON_CONTENT_TRASHED
} from "~/domain/review/getDeleteCancelReason.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { RequestReviewUseCase } from "~/features/review/RequestReview/index.js";
import { StartReviewStepUseCase } from "~/features/review/StartReviewStep/index.js";
import { ApproveReviewStepUseCase } from "~/features/review/ApproveReviewStep/index.js";
import { RejectReviewStepUseCase } from "~/features/review/RejectReviewStep/index.js";
import { CancelReviewUseCase } from "~/features/review/CancelReview/index.js";
import { CancelTargetReviewsUseCase } from "~/features/review/CancelTargetReviews/index.js";
import { ListTargetReviewsUseCase } from "~/features/review/ListTargetReviews/index.js";
import { TakeOverReviewStepUseCase } from "~/features/review/TakeOverReviewStep/index.js";
import { ReassignReviewStepUseCase } from "~/features/review/ReassignReviewStep/index.js";
import { RestartReviewStepUseCase } from "~/features/review/RestartReviewStep/index.js";
import { NotificationTransport } from "~/features/notifications/NotificationTransport/index.js";
import { WorkflowsAdminUrlService } from "~/features/notifications/WorkflowsAdminUrlService/index.js";
import { ReviewTargetLink } from "~/features/notifications/ReviewTargetLink/index.js";

const LATER = "2026-10-09T11:00:00.000Z";

/** The title of a review requested through the fake loader: "Article <targetId>". */
const TITLE = "Article article-1";
/** The title of the seeded automation reviews (`createRunningAutomationReview`). */
const AUTOMATION_REVIEW_TITLE = "Article 1";
const ADMIN_URL = "https://admin.example.com";
const COMMENT = "The legal text is unclear.";
const FAILURE_REASON = "The automation failed: boom.";
const MAIL_FAILED = "Could not send a workflow notification e-mail.";
const WEBSOCKET_FAILED = "Could not send a workflow websocket notification.";
const SECRET = "SECRET-e2e-failure";

const ANNA: Actor = { type: "user", id: "user-anna", displayName: "Anna", identityType: "admin" };
const BOB: Actor = { type: "user", id: "user-bob", displayName: "Bob", identityType: "admin" };
/** Holds `workflows.reassign` in the wrapper; the engine only records it (D132). */
const MANAGER: Actor = {
    type: "user",
    id: "user-manager",
    displayName: "Mona Manager",
    identityType: "admin"
};

/** Everyone who may hold a connection in these tests, by user id. */
const CONNECTED_USERS = [
    "user-anna",
    "user-bob",
    "user-cara",
    "user-dan",
    "user-requester",
    "user-manager"
];

/** 25 more members of the reviewers' team for the fan-out test: user-pool-01 ... user-pool-25. */
const POOL_USERS: FakeUser[] = Array.from({ length: 25 }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return { id: `user-pool-${number}`, displayName: `Pool ${number}`, teams: [REVIEW_TEAM_ID] };
});

/** "Legal review" notifies through the built-in e-mail transport, "Editorial review" through `chat`. */
const createChannelSteps = (): WorkflowStep[] => {
    return [
        {
            ...createReviewStep({ id: "legal", title: "Legal review", allowManualPick: true }),
            notifications: [{ id: "e-mail" }]
        },
        {
            ...createReviewStep({
                id: "editorial",
                title: "Editorial review",
                allowManualPick: true
            }),
            notifications: [{ id: "chat" }]
        }
    ];
};

const setup = async (extraUsers: FakeUser[] = []) => {
    const mailer = new RecordingMailer();
    const connections = new FakeWebsocketConnections();
    const sends = new SplitWebsocketsSend();
    const chat = new RecordingNotificationTransport("chat");
    const directory = new FakeListUsers([...ROUTING_USERS, ...extraUsers]);
    const routing = await createRoutingContext({
        setup: container => {
            container.register(FakeReviewTargetLoader);
            container.registerDecorator(RecordingEventPublisher);
            captureLoggedErrors(container);
            registerTestAutomation(container);
            // Instances registered here win over the inert ones of `createContextHandler`.
            container.registerInstance(MailerService, mailer);
            container.registerInstance(WebsocketsListConnectionsUseCase, connections);
            container.registerInstance(WebsocketsSendToConnectionsUseCase, sends);
            container.registerInstance(NotificationTransport, chat);
            container.registerInstance(WorkflowsAdminUrlService, new FakeWorkflowsAdminUrl());
            container.registerInstance(ReviewTargetLink, new FakeReviewTargetLink());
            container.registerInstance(ListUsersUseCase, directory);
        }
    });
    const { container } = routing.context;
    directory.watch(container.resolve(IdentityContext));
    expectOk(
        await container.resolve(StoreWorkflowUseCase).execute({
            workflow: createWorkflowValues({ steps: createChannelSteps() }),
            actor: editor
        })
    );
    const tenantId = container.resolve(TenantContext).getTenant().id;
    const repository = container.resolve(ReviewRepository);

    return {
        mailer,
        connections,
        sends,
        chat,
        tenantId,
        saver: container.resolve(ReviewSaver),
        repository,
        request: container.resolve(RequestReviewUseCase),
        start: container.resolve(StartReviewStepUseCase),
        approve: container.resolve(ApproveReviewStepUseCase),
        reject: container.resolve(RejectReviewStepUseCase),
        cancel: container.resolve(CancelReviewUseCase),
        cancelTarget: container.resolve(CancelTargetReviewsUseCase),
        listTarget: container.resolve(ListTargetReviewsUseCase),
        takeOver: container.resolve(TakeOverReviewStepUseCase),
        reassign: container.resolve(ReassignReviewStepUseCase),
        restart: container.resolve(RestartReviewStepUseCase),
        /** Connects the given users (default: everyone in `CONNECTED_USERS`) in the current tenant. */
        connectAll: (userIds: string[] = CONNECTED_USERS): void => {
            for (const userId of userIds) {
                connections.connect(userId, tenantId);
            }
        },
        /** Forgets everything recorded so far: the next assertions are about the next action only. */
        clear: (): void => {
            sends.sent.length = 0;
            sends.changes.length = 0;
            mailer.sent.length = 0;
            chat.sent.length = 0;
            connections.calls.length = 0;
            recordedEvents.length = 0;
            loggedErrors.length = 0;
        },
        /** The user ids that received a frame (the fake names a connection "<user>:<tenant>"), sorted. */
        frameUsers: (): string[] => {
            return sends.sent
                .flatMap(frame => frame.connections.map(connection => connection.connectionId))
                .map(connectionId => connectionId.split(":")[0])
                .sort();
        },
        /** The user ids that received a change frame (`workflows.reviewChanged`), sorted. */
        changeUsers: (): string[] => {
            return sends.changes
                .flatMap(frame => frame.connections.map(connection => connection.connectionId))
                .map(connectionId => connectionId.split(":")[0])
                .sort();
        },
        read: async (reviewId: string): Promise<ReviewData> => {
            return expectOk(await repository.get(reviewId));
        }
    };
};

/** Readable by the pool: Anna, Bob and Cara (the review team), not Dan (another team). */
const allowReaders = (userIds: string[] = ["user-anna", "user-bob", "user-cara"]): void => {
    for (const userId of userIds) {
        readableUsers.add(userId);
    }
};

const actorInput = (reviewId: string, stepId: string, actor: Actor) => {
    return { reviewId, stepId, actor, actorTeamIds: [REVIEW_TEAM_ID] };
};

type TestSetup = Awaited<ReturnType<typeof setup>>;

interface FailureCase {
    name: string;
    arrange: (fakes: TestSetup) => void;
    /** `RecordingWebsocketsSend` records a failing or throwing send too; a failing list sends nothing. */
    frames: number;
    mails: number;
    /** The fixed log texts the failure produces, each with the number of entries. */
    logged: Array<{ message: string; count: number }>;
}

const FAILURE_CASES: FailureCase[] = [
    {
        name: "the mailer throws",
        arrange: ({ mailer }) => {
            mailer.throwOn = [0];
            mailer.failureMessage = SECRET;
        },
        frames: 1,
        mails: 1,
        logged: [{ message: MAIL_FAILED, count: 1 }]
    },
    {
        name: "the mailer returns a failed Result",
        arrange: ({ mailer }) => {
            mailer.failOn = [0];
            mailer.failureMessage = SECRET;
        },
        frames: 1,
        mails: 1,
        logged: [{ message: MAIL_FAILED, count: 1 }]
    },
    {
        name: "the websocket connection list fails",
        arrange: ({ connections }) => {
            connections.mode = "fail";
            connections.failureMessage = SECRET;
        },
        frames: 0,
        mails: 1,
        logged: [{ message: WEBSOCKET_FAILED, count: 1 }]
    },
    {
        name: "the websocket connection list throws",
        arrange: ({ connections }) => {
            connections.mode = "throw";
            connections.failureMessage = SECRET;
        },
        frames: 0,
        mails: 1,
        logged: [{ message: WEBSOCKET_FAILED, count: 1 }]
    },
    {
        name: "the websocket send fails",
        arrange: ({ sends }) => {
            sends.mode = "fail";
            sends.failureMessage = SECRET;
        },
        frames: 1,
        mails: 1,
        logged: [{ message: WEBSOCKET_FAILED, count: 1 }]
    },
    {
        name: "the websocket send throws",
        arrange: ({ sends }) => {
            sends.mode = "throw";
            sends.failureMessage = SECRET;
        },
        frames: 1,
        mails: 1,
        logged: [{ message: WEBSOCKET_FAILED, count: 1 }]
    },
    {
        name: "the mailer, the connection list and the send all throw",
        arrange: ({ mailer, connections, sends }) => {
            mailer.throwOn = [0];
            connections.mode = "throw";
            sends.mode = "throw";
            mailer.failureMessage = SECRET;
            connections.failureMessage = SECRET;
            sends.failureMessage = SECRET;
        },
        frames: 0,
        mails: 1,
        logged: [
            { message: MAIL_FAILED, count: 1 },
            { message: WEBSOCKET_FAILED, count: 1 }
        ]
    }
];

describe("review notifications through the real saver (R181-R197)", () => {
    beforeEach(() => {
        resetRoutingFakes();
        resetFakeTasks();
        recordedEvents.length = 0;
        loggedErrors.length = 0;
    });

    describe("request and pool", () => {
        it("tells the pool of the first step, not the requester, by frame and by e-mail with a link that carries the tenant", async () => {
            const { request, connectAll, clear, sends, mailer, chat, frameUsers, tenantId } =
                await setup();
            allowReaders();
            connectAll();
            clear();

            const review = expectOk(await request.execute(createRequestInput()));

            // Anna, Bob and Cara: readers in the team. Dan is in another team, the requester is
            // never part of the pool (R183, R194).
            expect(frameUsers()).toEqual(["user-anna", "user-bob", "user-cara"]);
            for (const frame of sends.sent) {
                expect(frame.message.data).toMatchObject({
                    event: "poolReached",
                    reviewId: review.id,
                    stepId: "legal",
                    namespace: ARTICLE_MODEL,
                    targetId: "article-1",
                    targetRevisionId: "article-1#0001",
                    title: `“${TITLE}” is waiting in the team pool`,
                    body: "Legal review · requested by Rita Requester"
                });
            }
            // One mail through the step's e-mail transport, blind copy to the three members.
            expect(mailer.sent).toHaveLength(1);
            expect([...(mailer.sent[0].bcc as string[])].sort()).toEqual([
                "user-anna@webiny.test",
                "user-bob@webiny.test",
                "user-cara@webiny.test"
            ]);
            expect(mailer.sent[0].subject).toBe(`Team pool: ${TITLE} (Legal review)`);
            expect(mailer.sent[0].text).toContain(
                `Open content: ${ADMIN_URL}/cms/content-entries/article?id=article-1%230001&tenantId=${tenantId}`
            );
            expect(chat.sent).toEqual([]);
            expect(loggedErrors).toEqual([]);
        });

        it("sends no notification when a pool step is started", async () => {
            const { request, start, connectAll, clear, sends, mailer, chat } = await setup();
            allowReaders();
            connectAll();
            const review = expectOk(await request.execute(createRequestInput()));
            clear();

            expectOk(await start.execute(actorInput(review.id, "legal", ANNA)));

            expect(workflowEventTypes()).toEqual(["Workflows/Review/StepStarted"]);
            expect(sends.sent).toEqual([]);
            expect(mailer.sent).toEqual([]);
            expect(chat.sent).toEqual([]);
        });

        it("tells a pool of 25 with bounded concurrency, one frame each and one mail", async () => {
            const { request, connectAll, clear, sends, connections, mailer } =
                await setup(POOL_USERS);
            const poolIds = POOL_USERS.map(user => user.id);
            allowReaders(poolIds);
            connectAll(poolIds);
            connections.holdMs = 5;
            sends.holdMs = 5;
            clear();

            expectOk(await request.execute(createRequestInput()));

            expect(sends.sent).toHaveLength(25);
            expect(sends.sent.map(frame => frame.connections.length)).toEqual(
                Array.from({ length: 25 }, () => 1)
            );
            // At most NOTIFICATION_SEND_CONCURRENCY (10) in flight, and more than one at a time.
            expect(connections.maxInFlight).toBeLessThanOrEqual(10);
            expect(connections.maxInFlight).toBeGreaterThan(1);
            expect(sends.maxInFlight).toBeLessThanOrEqual(10);
            expect(sends.maxInFlight).toBeGreaterThan(1);
            expect(mailer.sent).toHaveLength(1);
            expect([...(mailer.sent[0].bcc as string[])].sort()).toEqual(
                poolIds.map(id => `${id}@webiny.test`)
            );
        });

        it("sends no frame to a recipient connected only in another tenant, and logs nothing", async () => {
            const { request, connections, connectAll, clear, frameUsers, sends, tenantId } =
                await setup();
            allowReaders();
            // Bob is connected in this tenant and in another one; Anna only in the other one.
            connectAll(["user-bob"]);
            connections.connect("user-bob", "tenant-elsewhere", "conn-bob-elsewhere");
            connections.connect("user-anna", "tenant-elsewhere", "conn-anna-elsewhere");
            clear();

            expectOk(await request.execute(createRequestInput()));

            expect(frameUsers()).toEqual(["user-bob"]);
            expect(sends.sent[0].connections).toEqual([
                { connectionId: `user-bob:${tenantId}`, endpoint: "wss://websockets.test" }
            ]);
            expect(loggedErrors).toEqual([]);
        });
    });

    describe("approve", () => {
        it("tells the next owner only when a middle step is approved, through the next step's channel", async () => {
            const { request, start, approve, connectAll, clear, sends, mailer, chat, frameUsers } =
                await setup();
            allowReaders();
            connectAll();
            const picks: ReviewPick[] = [{ stepId: "editorial", userId: "user-bob" }];
            const review = expectOk(await request.execute(createRequestInput({ picks })));
            expectOk(await start.execute(actorInput(review.id, "legal", ANNA)));
            clear();

            expectOk(await approve.execute(actorInput(review.id, "legal", ANNA)));

            expect(workflowEventTypes()).toEqual([
                "Workflows/Review/StepApproved",
                "Workflows/Review/StepReached"
            ]);
            // Bob owns the next step: not the requester, not the approver, not the pool.
            expect(frameUsers()).toEqual(["user-bob"]);
            expect(sends.sent[0].message.data).toMatchObject({
                event: "assigned",
                stepId: "editorial",
                title: `You’re reviewing “${TITLE}”`,
                body: "Editorial review · picked by Rita Requester"
            });
            // "Editorial review" notifies through `chat`, not through e-mail.
            expect(mailer.sent).toEqual([]);
            expect(chat.sent).toHaveLength(1);
            expect(chat.sent[0].users.map(user => user.id)).toEqual(["user-bob"]);
            expect(chat.sent[0].message.title).toBe(
                `You’re reviewing: ${TITLE} (Editorial review)`
            );
        });

        it("tells the requester once when the last step is approved, through the last step's channel", async () => {
            const { request, start, approve, connectAll, clear, sends, mailer, chat, frameUsers } =
                await setup();
            allowReaders();
            connectAll();
            const picks: ReviewPick[] = [{ stepId: "editorial", userId: "user-bob" }];
            const review = expectOk(await request.execute(createRequestInput({ picks })));
            expectOk(await start.execute(actorInput(review.id, "legal", ANNA)));
            expectOk(await approve.execute(actorInput(review.id, "legal", ANNA)));
            clear();

            expectOk(await approve.execute(actorInput(review.id, "editorial", BOB)));

            expect(workflowEventTypes()).toEqual([
                "Workflows/Review/StepApproved",
                "Workflows/Review/Approved"
            ]);
            expect(frameUsers()).toEqual(["user-requester"]);
            expect(sends.sent[0].message.data).toMatchObject({
                event: "approved",
                title: `“${TITLE}” was approved`,
                body: "All steps approved. It’s ready to publish."
            });
            expect(mailer.sent).toEqual([]);
            expect(chat.sent).toHaveLength(1);
            expect(chat.sent[0].users.map(user => user.id)).toEqual(["user-requester"]);
            expect(chat.sent[0].message.title).toBe(`Approved: ${TITLE}`);
        });
    });

    describe("reject", () => {
        it("tells the requester who rejected, with the comment, through the rejecting step's channel", async () => {
            const { request, start, reject, connectAll, clear, sends, mailer, frameUsers, read } =
                await setup();
            allowReaders();
            connectAll();
            const review = expectOk(await request.execute(createRequestInput()));
            expectOk(await start.execute(actorInput(review.id, "legal", ANNA)));
            clear();

            const result = await reject.execute({
                ...actorInput(review.id, "legal", ANNA),
                comment: COMMENT
            });

            expect(result.isOk()).toBe(true);
            expect((await read(review.id)).state).toBe("rejected");
            expect(frameUsers()).toEqual(["user-requester"]);
            expect(sends.sent[0].message.data).toMatchObject({
                event: "rejected",
                stepId: "legal",
                title: `“${TITLE}” was rejected at Legal review`,
                body: `Anna: “${COMMENT}”. Create a new revision to fix it, then request a new review.`
            });
            expect(mailer.sent).toHaveLength(1);
            expect(mailer.sent[0].bcc).toEqual(["user-requester@webiny.test"]);
            expect(mailer.sent[0].subject).toBe(`Rejected: ${TITLE} (Legal review)`);
        });
    });

    describe("cancel", () => {
        it("tells the owner of the current step, with the canceller's name", async () => {
            const { request, start, cancel, connectAll, clear, sends, mailer, frameUsers } =
                await setup();
            allowReaders();
            connectAll();
            const review = expectOk(await request.execute(createRequestInput()));
            expectOk(await start.execute(actorInput(review.id, "legal", ANNA)));
            clear();

            expectOk(await cancel.execute({ reviewId: review.id, actor: requester, reason: null }));

            expect(frameUsers()).toEqual(["user-anna"]);
            expect(sends.sent[0].message.data).toMatchObject({
                event: "cancelled",
                stepId: "legal",
                title: `The review of “${TITLE}” was cancelled`,
                body: "Cancelled by Rita Requester. You no longer need to review Legal review."
            });
            expect(mailer.sent).toHaveLength(1);
            expect(mailer.sent[0].bcc).toEqual(["user-anna@webiny.test"]);
            expect(mailer.sent[0].subject).toBe(`Review cancelled: ${TITLE}`);
        });

        it("sends nothing when the review is cancelled while its step waits in the pool", async () => {
            const { request, cancel, connectAll, clear, sends, mailer, chat } = await setup();
            allowReaders();
            connectAll();
            const review = expectOk(await request.execute(createRequestInput()));
            clear();

            expectOk(await cancel.execute({ reviewId: review.id, actor: requester }));

            expect(workflowEventTypes()).toEqual(["Workflows/Review/Cancelled"]);
            expect(sends.sent).toEqual([]);
            expect(mailer.sent).toEqual([]);
            expect(chat.sent).toEqual([]);
        });

        it("does not tell the owner who cancels their own review", async () => {
            const { request, start, cancel, connectAll, clear, sends, mailer } = await setup();
            allowReaders();
            connectAll();
            const review = expectOk(await request.execute(createRequestInput()));
            expectOk(await start.execute(actorInput(review.id, "legal", ANNA)));
            clear();

            expectOk(await cancel.execute({ reviewId: review.id, actor: ANNA }));

            expect(sends.sent).toEqual([]);
            expect(mailer.sent).toEqual([]);
        });

        it.each([
            {
                name: "the content was moved to the trash",
                reason: REVIEW_CANCEL_REASON_CONTENT_TRASHED,
                body: "The content was moved to the trash. You no longer need to review Legal review."
            },
            {
                name: "the content was deleted",
                reason: REVIEW_CANCEL_REASON_CONTENT_DELETED,
                body: "The content was deleted. You no longer need to review Legal review."
            }
        ])(
            "tells the owner the reason when $name, and never `Cancelled by`",
            async ({ reason, body }) => {
                const { request, start, cancel, connectAll, clear, sends } = await setup();
                allowReaders();
                connectAll();
                const review = expectOk(await request.execute(createRequestInput()));
                expectOk(await start.execute(actorInput(review.id, "legal", ANNA)));
                clear();

                expectOk(await cancel.execute({ reviewId: review.id, actor: MANAGER, reason }));

                expect(sends.sent).toHaveLength(1);
                expect(sends.sent[0].message.data).toMatchObject({
                    event: "cancelled",
                    title: `The review of “${TITLE}” was cancelled`,
                    body
                });
                expect(JSON.stringify(sends.sent[0].message)).not.toContain("Cancelled by");
            }
        );
    });

    describe("bulk cancel when content is trashed or deleted (D134, A65)", () => {
        it("tells the owner of the owned review only, not the pool of the other review", async () => {
            const {
                request,
                start,
                cancelTarget,
                listTarget,
                connectAll,
                clear,
                sends,
                mailer,
                frameUsers,
                read
            } = await setup();
            allowReaders();
            connectAll();
            const owned = expectOk(await request.execute(createRequestInput()));
            expectOk(await start.execute(actorInput(owned.id, "legal", ANNA)));
            const waiting = expectOk(
                await request.execute(createRequestInput({ targetRevisionId: "article-1#0002" }))
            );
            clear();

            const listed = expectOk(
                await listTarget.execute({ model: ARTICLE_MODEL, targetId: "article-1" })
            );
            const cancelled = expectOk(
                await cancelTarget.execute({
                    reviews: listed,
                    actor: MANAGER,
                    reason: REVIEW_CANCEL_REASON_CONTENT_TRASHED
                })
            );

            expect(cancelled.map(review => review.id).sort()).toEqual(
                [owned.id, waiting.id].sort()
            );
            expect((await read(waiting.id)).state).toBe("cancelled");
            // One frame, to the owner of the owned review; nothing for the review in the pool.
            expect(frameUsers()).toEqual(["user-anna"]);
            expect(sends.sent[0].message.data).toMatchObject({
                event: "cancelled",
                reviewId: owned.id,
                body: "The content was moved to the trash. You no longer need to review Legal review."
            });
            expect(mailer.sent).toHaveLength(1);
            expect(mailer.sent[0].bcc).toEqual(["user-anna@webiny.test"]);
        });

        it("tells both owners when the first mail fails, and logs the failure once", async () => {
            const {
                request,
                start,
                cancelTarget,
                listTarget,
                connectAll,
                clear,
                sends,
                mailer,
                frameUsers
            } = await setup();
            allowReaders();
            connectAll();
            const first = expectOk(await request.execute(createRequestInput()));
            expectOk(await start.execute(actorInput(first.id, "legal", ANNA)));
            const second = expectOk(
                await request.execute(createRequestInput({ targetRevisionId: "article-1#0002" }))
            );
            expectOk(await start.execute(actorInput(second.id, "legal", BOB)));
            clear();
            mailer.failOn = [0];

            const listed = expectOk(
                await listTarget.execute({ model: ARTICLE_MODEL, targetId: "article-1" })
            );
            expectOk(
                await cancelTarget.execute({
                    reviews: listed,
                    actor: MANAGER,
                    reason: REVIEW_CANCEL_REASON_CONTENT_DELETED
                })
            );

            // Both owners got their frame, both mails were tried, one failure was logged.
            expect(frameUsers()).toEqual(["user-anna", "user-bob"]);
            expect(sends.sent).toHaveLength(2);
            expect(mailer.sent).toHaveLength(2);
            expect(loggedErrors.filter(entry => entry.message === MAIL_FAILED)).toHaveLength(1);
        });
    });

    describe("take over", () => {
        it.each([
            { name: "the flag is left at its default", input: {}, notified: true },
            { name: "the flag is true", input: { notifyPreviousOwner: true }, notified: true },
            { name: "the flag is false", input: { notifyPreviousOwner: false }, notified: false }
        ])("tells the previous owner, or not, when $name (D111)", async ({ input, notified }) => {
            const { request, start, takeOver, connectAll, clear, sends, mailer, frameUsers } =
                await setup();
            allowReaders();
            connectAll();
            const review = expectOk(await request.execute(createRequestInput()));
            expectOk(await start.execute(actorInput(review.id, "legal", ANNA)));
            clear();

            expectOk(await takeOver.execute({ ...actorInput(review.id, "legal", BOB), ...input }));

            if (!notified) {
                expect(sends.sent).toEqual([]);
                expect(mailer.sent).toEqual([]);
                return;
            }
            expect(frameUsers()).toEqual(["user-anna"]);
            expect(sends.sent[0].message.data).toMatchObject({
                event: "takenOver",
                title: `Bob took over Legal review on “${TITLE}”.`,
                body: "You no longer own this step."
            });
            expect(mailer.sent).toHaveLength(1);
            expect(mailer.sent[0].bcc).toEqual(["user-anna@webiny.test"]);
            expect(mailer.sent[0].subject).toBe(`Taken over: ${TITLE} (Legal review)`);
        });

        // The handler's own skip of a previousOwner whose type is not "user" is pinned in Task 11; through the
        // real engine an AI or automation step cannot be taken over (D9), so the take-over is refused.
        it("refuses to take over an automation-owned step, so nobody is told", async () => {
            const { repository, takeOver, connectAll, clear, sends, mailer } = await setup();
            allowReaders();
            connectAll();
            expectOk(await repository.create(toSaveData(createRunningAutomationReview())));
            clear();

            const result = await takeOver.execute(actorInput("review-1", AUTOMATION_STEP_ID, BOB));

            expect(result.isFail()).toBe(true);
            expect(sends.sent).toEqual([]);
            expect(mailer.sent).toEqual([]);
        });
    });

    describe("reassign", () => {
        it("tells the new owner, then the old owner and the next new owner, with the operator's name", async () => {
            const { request, reassign, connectAll, clear, sends, mailer, frameUsers } =
                await setup();
            allowReaders();
            connectAll();
            const review = expectOk(await request.execute(createRequestInput()));
            clear();

            expectOk(
                await reassign.execute({
                    reviewId: review.id,
                    stepId: "legal",
                    userId: "user-anna",
                    actor: MANAGER
                })
            );

            // A pool step has no old owner: only the new owner is told.
            expect(frameUsers()).toEqual(["user-anna"]);
            expect(sends.sent[0].message.data).toMatchObject({
                event: "assigned",
                title: `You’re reviewing “${TITLE}”`,
                body: "Legal review · reassigned to you by Mona Manager"
            });
            expect(mailer.sent).toHaveLength(1);
            expect(mailer.sent[0].subject).toBe(`You’re reviewing: ${TITLE} (Legal review)`);
            clear();

            expectOk(
                await reassign.execute({
                    reviewId: review.id,
                    stepId: "legal",
                    userId: "user-bob",
                    actor: MANAGER
                })
            );

            expect(frameUsers()).toEqual(["user-anna", "user-bob"]);
            const byUser = new Map(
                sends.sent.map(frame => [frame.connections[0].connectionId.split(":")[0], frame])
            );
            expect(byUser.get("user-bob")?.message.data).toMatchObject({
                event: "assigned",
                body: "Legal review · reassigned to you by Mona Manager"
            });
            expect(byUser.get("user-anna")?.message.data).toMatchObject({
                event: "reassigned",
                title: `“${TITLE}” was reassigned to Bob`,
                body: "Legal review · reassigned by Mona Manager. You no longer own this step."
            });
        });
    });

    describe("failed step and restart", () => {
        it("tells the requester with the fixed reason only, through the failed step's channel", async () => {
            const { repository, saver, connectAll, clear, sends, mailer, chat, frameUsers } =
                await setup();
            connectAll();
            expectOk(await repository.create(toSaveData(createRunningAutomationReview("task-1"))));
            clear();

            const review = Review.fromData(expectOk(await repository.get("review-1")));
            expectOk(
                review.fail({ stepId: AUTOMATION_STEP_ID, reason: FAILURE_REASON, now: LATER })
            );
            expectOk(await saver.save(review));

            expect(workflowEventTypes()).toEqual(["Workflows/Review/StepFailed"]);
            expect(frameUsers()).toEqual(["user-requester"]);
            expect(sends.sent[0].message.data).toMatchObject({
                event: "failed",
                stepId: AUTOMATION_STEP_ID,
                title: `Check links failed on “${AUTOMATION_REVIEW_TITLE}”`,
                body: `${FAILURE_REASON} You can restart the step.`
            });
            // The automation step lists no transport: websocket only.
            expect(mailer.sent).toEqual([]);
            expect(chat.sent).toEqual([]);
        });

        it("pins the accepted A64 duplicate: two stale fail saves tell the requester twice", async () => {
            const { repository, saver, connectAll, clear, sends } = await setup();
            connectAll();
            expectOk(await repository.create(toSaveData(createRunningAutomationReview("task-1"))));
            // Two writers loaded the review while it was running (stuck detection and a late hook,
            // for example). There is no optimistic lock (D27), so each one fails the step and saves.
            const stale = Review.fromData(expectOk(await repository.get("review-1")));
            const late = Review.fromData(expectOk(await repository.get("review-1")));
            clear();

            expectOk(
                stale.fail({ stepId: AUTOMATION_STEP_ID, reason: FAILURE_REASON, now: LATER })
            );
            expectOk(late.fail({ stepId: AUTOMATION_STEP_ID, reason: FAILURE_REASON, now: LATER }));
            expectOk(await saver.save(stale));
            expectOk(await saver.save(late));

            expect(workflowEventTypes()).toEqual([
                "Workflows/Review/StepFailed",
                "Workflows/Review/StepFailed"
            ]);
            expect(sends.sent).toHaveLength(2);
        });

        it("sends no notification when a failed step is restarted", async () => {
            const { repository, restart, connectAll, clear, sends, mailer, chat } = await setup();
            connectAll();
            expectOk(
                await repository.create(toSaveData(createFailedAutomationReview(FAILURE_REASON)))
            );
            clear();

            expectOk(
                await restart.execute({
                    reviewId: "review-1",
                    stepId: AUTOMATION_STEP_ID,
                    actor: requester
                })
            );

            expect(workflowEventTypes()).toContain("Workflows/Review/StepRestarted");
            expect(sends.sent).toEqual([]);
            expect(mailer.sent).toEqual([]);
            expect(chat.sent).toEqual([]);
        });
    });

    describe("live change messages (R253, R254)", () => {
        const CHANGE_KEYS = [
            "kind",
            "namespace",
            "reviewId",
            "stepId",
            "targetId",
            "targetRevisionId"
        ];

        it("tells the picked owner, not the requester who acts, when a review is requested", async () => {
            const { request, connectAll, clear, sends, changeUsers } = await setup();
            allowReaders();
            connectAll();
            clear();
            const picks: ReviewPick[] = [{ stepId: "legal", userId: "user-bob" }];

            const review = expectOk(await request.execute(createRequestInput({ picks })));

            expect(workflowEventTypes()).toContain("Workflows/Review/Requested");
            expect(changeUsers()).toEqual(["user-bob"]);
            expect(sends.changes[0].message.action).toBe(WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION);
            expect(sends.changes[0].message.data).toEqual({
                kind: "requested",
                reviewId: review.id,
                stepId: "legal",
                namespace: ARTICLE_MODEL,
                targetId: "article-1",
                targetRevisionId: "article-1#0001"
            });
            expect(Object.keys(sends.changes[0].message.data ?? {}).sort()).toEqual(CHANGE_KEYS);
        });

        it("sends no change message when a review is requested into the pool, because the requester is the actor", async () => {
            const { request, connectAll, clear, sends, frameUsers } = await setup();
            allowReaders();
            connectAll();
            clear();

            expectOk(await request.execute(createRequestInput()));

            expect(sends.changes).toEqual([]);
            // The pool still gets its notification: the change message is a second, separate frame.
            expect(frameUsers()).toEqual(["user-anna", "user-bob", "user-cara"]);
        });

        it("tells the requester, not the user who starts a pool step", async () => {
            const { request, start, connectAll, clear, sends, changeUsers } = await setup();
            allowReaders();
            connectAll();
            const review = expectOk(await request.execute(createRequestInput()));
            clear();

            expectOk(await start.execute(actorInput(review.id, "legal", ANNA)));

            expect(workflowEventTypes()).toEqual(["Workflows/Review/StepStarted"]);
            expect(changeUsers()).toEqual(["user-requester"]);
            expect(sends.changes[0].message.data).toEqual({
                kind: "stepStarted",
                reviewId: review.id,
                stepId: "legal",
                namespace: ARTICLE_MODEL,
                targetId: "article-1",
                targetRevisionId: "article-1#0001"
            });
        });

        it("tells the requester and the next owner, not the approver, when a middle step is approved", async () => {
            const { request, start, approve, connectAll, clear, sends, changeUsers, frameUsers } =
                await setup();
            allowReaders();
            connectAll();
            const picks: ReviewPick[] = [{ stepId: "editorial", userId: "user-bob" }];
            const review = expectOk(await request.execute(createRequestInput({ picks })));
            expectOk(await start.execute(actorInput(review.id, "legal", ANNA)));
            clear();

            expectOk(await approve.execute(actorInput(review.id, "legal", ANNA)));

            expect(changeUsers()).toEqual(["user-bob", "user-requester"]);
            for (const frame of sends.changes) {
                expect(frame.message.data).toMatchObject({
                    kind: "stepApproved",
                    reviewId: review.id,
                    stepId: "legal"
                });
            }
            // The next owner still gets the `assigned` notification, a separate frame.
            expect(frameUsers()).toEqual(["user-bob"]);
        });

        it("sends no change message for the final approval, which already sends the approved notification", async () => {
            const { request, start, approve, connectAll, clear, sends, frameUsers } = await setup();
            allowReaders();
            connectAll();
            const picks: ReviewPick[] = [{ stepId: "editorial", userId: "user-bob" }];
            const review = expectOk(await request.execute(createRequestInput({ picks })));
            expectOk(await start.execute(actorInput(review.id, "legal", ANNA)));
            expectOk(await approve.execute(actorInput(review.id, "legal", ANNA)));
            clear();

            expectOk(await approve.execute(actorInput(review.id, "editorial", BOB)));

            expect(workflowEventTypes()).toEqual([
                "Workflows/Review/StepApproved",
                "Workflows/Review/Approved"
            ]);
            expect(sends.changes).toEqual([]);
            expect(frameUsers()).toEqual(["user-requester"]);
        });

        it("tells the requester when an operator restarts a failed step", async () => {
            const { repository, restart, connectAll, clear, sends, changeUsers } = await setup();
            connectAll();
            expectOk(
                await repository.create(toSaveData(createFailedAutomationReview(FAILURE_REASON)))
            );
            clear();

            expectOk(
                await restart.execute({
                    reviewId: "review-1",
                    stepId: AUTOMATION_STEP_ID,
                    actor: MANAGER
                })
            );

            expect(workflowEventTypes()).toContain("Workflows/Review/StepRestarted");
            expect(changeUsers()).toEqual(["user-requester"]);
            expect(sends.changes[0].message.data).toMatchObject({
                kind: "stepRestarted",
                reviewId: "review-1",
                stepId: AUTOMATION_STEP_ID
            });
        });

        it("sends no change message when the requester restarts the step, because the requester is the actor", async () => {
            const { repository, restart, connectAll, clear, sends } = await setup();
            connectAll();
            expectOk(
                await repository.create(toSaveData(createFailedAutomationReview(FAILURE_REASON)))
            );
            clear();

            expectOk(
                await restart.execute({
                    reviewId: "review-1",
                    stepId: AUTOMATION_STEP_ID,
                    actor: requester
                })
            );

            expect(sends.changes).toEqual([]);
        });

        it("sends the requester the failed notification and no second change message when a step fails", async () => {
            const { repository, saver, connectAll, clear, sends, frameUsers } = await setup();
            connectAll();
            expectOk(await repository.create(toSaveData(createRunningAutomationReview("task-1"))));
            clear();

            const review = Review.fromData(expectOk(await repository.get("review-1")));
            expectOk(
                review.fail({ stepId: AUTOMATION_STEP_ID, reason: FAILURE_REASON, now: LATER })
            );
            expectOk(await saver.save(review));

            expect(workflowEventTypes()).toEqual(["Workflows/Review/StepFailed"]);
            expect(frameUsers()).toEqual(["user-requester"]);
            // The step is owned by the automation, not by a user: nobody else is a participant.
            expect(sends.changes).toEqual([]);
        });

        it("sends nothing to a recipient connected only in another tenant, and logs nothing", async () => {
            const { request, connections, clear, sends } = await setup();
            allowReaders();
            connections.connect("user-bob", "tenant-elsewhere", "conn-bob-elsewhere");
            clear();
            const picks: ReviewPick[] = [{ stepId: "legal", userId: "user-bob" }];

            expectOk(await request.execute(createRequestInput({ picks })));

            expect(sends.changes).toEqual([]);
            expect(loggedErrors).toEqual([]);
        });

        it("never fails the review action when the connection list throws, and logs once", async () => {
            const { request, start, connectAll, connections, clear, sends, read } = await setup();
            allowReaders();
            connectAll();
            const review = expectOk(await request.execute(createRequestInput()));
            clear();
            connections.mode = "throw";
            connections.failureMessage = SECRET;

            const result = await start.execute(actorInput(review.id, "legal", ANNA));

            expect(result.isOk()).toBe(true);
            expect((await read(review.id)).currentOwnerId).toBe("user-anna");
            expect(sends.changes).toEqual([]);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(WEBSOCKET_FAILED);
        });
    });

    describe("a failing mailer or websocket never fails the review action (R87, R196)", () => {
        it.each(FAILURE_CASES)(
            "returns the rejected review and still sends the other channel when $name",
            async testCase => {
                const fakes = await setup();
                const { request, start, reject, connectAll, clear, sends, mailer, chat, read } =
                    fakes;
                allowReaders();
                connectAll();
                const review = expectOk(await request.execute(createRequestInput()));
                expectOk(await start.execute(actorInput(review.id, "legal", ANNA)));
                clear();
                testCase.arrange(fakes);

                const result = await reject.execute({
                    ...actorInput(review.id, "legal", ANNA),
                    comment: COMMENT
                });

                expect(result.isOk()).toBe(true);
                expect((await read(review.id)).state).toBe("rejected");
                expect(sends.sent).toHaveLength(testCase.frames);
                expect(mailer.sent).toHaveLength(testCase.mails);
                // The exact fixed texts, one entry per failing dependency, and nothing else.
                expect(loggedErrors).toHaveLength(
                    testCase.logged.reduce((total, entry) => total + entry.count, 0)
                );
                for (const entry of testCase.logged) {
                    expect(
                        loggedErrors.filter(logged => logged.message === entry.message)
                    ).toHaveLength(entry.count);
                }
                // The raw error text is logged only; it never reaches a frame, a mail or a transport.
                expect(JSON.stringify(sends.sent)).not.toContain(SECRET);
                expect(JSON.stringify(mailer.sent)).not.toContain(SECRET);
                expect(JSON.stringify(chat.sent)).not.toContain(SECRET);
            }
        );
    });
});
