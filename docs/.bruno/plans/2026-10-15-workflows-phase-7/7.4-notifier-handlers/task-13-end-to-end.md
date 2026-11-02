### Task 13: End-to-end notification tests through the saver and the background-task step run

Spec 12; D36, D44, D58, D60, D103, D107, D111, D132, D134; R181, R183, R184, R186, R188, R195, R196, R197, A62, A63, A64, A65; Review Focus 1, 2, 3, 5, 8, 9. No production code: this task pins the whole chain. Tasks 10-12 tested each part against fakes (the notifier against fake websocket and transport use cases, each handler against a recording notifier). This task runs the real `ReviewSaver`, `EventPublisher`, engine use cases, the seven handlers, the notifier, the recipient, link and mail services, and fakes only the outermost edges: the mailer, the websocket use cases, one custom transport (`chat`), the admin host and the target link port. Two files, each with its own imports and constants:

- `ReviewNotifications.test.ts`: the engine use cases and the real `ReviewSaver`. Request (pool told), pool Start (nothing), approve of a middle step (next owner only), approve of the last step (requester once), reject with a comment, cancel (owned, awaiting, by the owner themself, content trashed, content deleted), take over (flag at its default, `true`, `false`, an automation-owned step refused), reassign, restart, a failed step (fixed reason only), the accepted A64 duplicate, a throwing mailer and failing websocket, a pool of 25 with bounded concurrency, a recipient connected in another tenant, the link carrying `tenantId`, and the bulk cancel of a target (`CancelTargetReviewsUseCase`, D134).
- `ReviewNotificationsBackgroundTask.test.ts`: the private step run task handler (`WorkflowStepRunTaskHandler`) run under a non-root tenant (`tenant-a`; the test context's own tenant is the root tenant). An automation approves or rejects; the requester is notified once and named by the step title, the websocket tenant filter uses `tenant-a` (a root-tenant connection of the same user gets nothing), the e-mail link carries `tenantId=tenant-a`, and every user lookup runs with authorization off (D36: the lookups are not run as the requester). A two-step workflow (the automation approves, then a pool review step) runs the pool lookups inside the step run.

What the tests pin, per Review Focus:
1. **Failing mailer or websocket (Review Focus 1):** the action returns `ok` and the review is stored with the mailer throwing or failing, the websocket list failing or throwing, the websocket send failing or throwing, and all at once, in the saver path and in the step run path. The other channel still goes out.
2. **Skipping the wrong people (Review Focus 2):** an automation decision notifies the requester although the automation actor carries the requester's id (D58); a failed step notifies the requester; an owner who cancels their own review is not told.
3. **Another tenant (Review Focus 3):** a recipient connected only in another tenant gets no frame and no log; a recipient connected in two tenants gets one frame on the current tenant's connection; in the step run, the requester's root-tenant connection gets nothing.
5. **Duplicates and strays (Review Focus 5):** request tells the pool only; pool Start and restart send nothing; approve of a middle step notifies the next owner only; approve of the last step notifies the requester once (`stepApproved` then `approved` publish, one notification); cancel of an awaiting step sends nothing; bulk cancel notifies the owner of the owned review only. The accepted A64 race (two stale fail saves publish `stepFailed` twice) is pinned as two notifications.
8. **Channels (Review Focus 8):** "Legal review" notifies through `e-mail`, "Editorial review" through the custom `chat` transport; every flow asserts the channel of the step the event happened on.
9. **Fan-out (Review Focus 9):** a pool of 25 sends 25 frames with at most 10 list calls and 10 sends in flight, and one mail with 25 recipients; a bulk cancel notifies each review's owner in turn and a failing first mail does not stop the second.

**Files:**
- Create: `packages/api-workflows/__tests__/notifications/ReviewNotifications.test.ts`
- Create: `packages/api-workflows/__tests__/notifications/ReviewNotificationsBackgroundTask.test.ts`

**Interfaces:**
- Consumes:
  - Tasks 10-12 (names as written there; verify against the as-built code): `RecordingMailer` (`sent`, `failOn`, `throwOn`), `FakeWebsocketConnections` (`connect(identityId, tenant, connectionId?)`, `calls`, `mode`, `holdMs`, `maxInFlight`), `RecordingWebsocketsSend` (`sent: SentFrame[]` with `connections` and `message`, `mode`, `holdMs`, `maxInFlight`), `RecordingNotificationTransport` (`new RecordingNotificationTransport(id)`, `sent`), `FakeWorkflowsAdminUrl` (default `https://admin.example.com`), `FakeReviewTargetLink` (path `/cms/content-entries/article?id=<encoded revision id>`), all under `~tests/__helpers/`; `ReviewNotificationsFeature` registered by `WorkflowsFeature` (the seven handlers, the notifier, the recipient, link and admin URL services); `createContextHandler` of `~tests/__helpers/handler.js` (registers inert mailer and websocket instances before `params.setup`, so an instance registered in `setup` wins).
  - Task 4: `notifyPreviousOwner?: boolean` on the take-over input. Task 6: `REVIEW_CANCEL_REASON_CONTENT_TRASHED` and `REVIEW_CANCEL_REASON_CONTENT_DELETED` (`~/domain/review/getDeleteCancelReason.js`) and the message texts of R189.
  - Existing helpers: `createRoutingContext`, `resetRoutingFakes`, `ROUTING_USERS` (`~tests/__helpers/routingContext.js`; the context registers the requester's team, the settings and the read-access and folder-chain fakes), `FakeListUsers`, `FakeUser` (`~tests/__helpers/FakeListUsers.js`; `calls[].authorizationEnabled` after `watch(identityContext)`), `readableUsers` (`~tests/__helpers/FakeReviewTargetReadAccess.js`), `FakeReviewTargetLoader` (title `Article <targetId>`), `RecordingEventPublisher`, `recordedEvents`, `workflowEventTypes`, `createRequestInput` (`~tests/__helpers/reviewContext.js`), `captureLoggedErrors`, `loggedErrors`, `createReviewStep`, `createWorkflow`, `createWorkflowValues`, `editor`, `expectOk`, `NOW`, `requester`, `REVIEW_TEAM_ID`, `ARTICLE_MODEL`, `targetContext`, `toSaveData` (`~tests/__helpers/fixtures.js`), `AUTOMATION_STEP_ID`, `automationActor`, `createRunningAutomationReview`, `createFailedAutomationReview` (`~tests/__helpers/stepRunReviews.js`), `createAutomationStep`, `registerTestAutomation` (`~tests/__helpers/TestAutomationDefinition.js`; `mode` and `comment` in the step settings), `createFakeTaskController` (`~tests/__helpers/FakeTaskController.js`), `resetFakeTasks` (`~tests/__helpers/FakeTaskService.js`).
  - Engine use cases (`~/features/review/<Name>/index.js`): `RequestReviewUseCase`, `StartReviewStepUseCase`, `ApproveReviewStepUseCase`, `RejectReviewStepUseCase`, `CancelReviewUseCase`, `CancelTargetReviewsUseCase`, `TakeOverReviewStepUseCase`, `ReassignReviewStepUseCase`, `RestartReviewStepUseCase`, `StoreWorkflowUseCase` (`~/features/workflow/StoreWorkflow/index.js`); `ReviewSaver` (`~/features/review/ReviewSaver/abstractions.js`), `ReviewRepository`, `Review`; `WorkflowStepRunTaskHandler` (`~/features/stepRun/WorkflowStepRunTask/index.js`).
- Produces: no export. Both files only assert.

- [ ] **Step 1: Write the tests**

There is no production change in this task, so there is no failing run first: the tests are written against the finished chain. If one fails on its first run, the failure is a defect in the code of Tasks 10-12; fix it there, in a new commit, and do not weaken an assertion.

Create `packages/api-workflows/__tests__/notifications/ReviewNotifications.test.ts`:

```ts
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
import { RecordingWebsocketsSend } from "~tests/__helpers/RecordingWebsocketsSend.js";
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
    const sends = new RecordingWebsocketsSend();
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
}

const FAILURE_CASES: FailureCase[] = [
    {
        name: "the mailer throws",
        arrange: ({ mailer }) => {
            mailer.throwOn = [0];
        },
        frames: 1,
        mails: 1
    },
    {
        name: "the mailer returns a failed Result",
        arrange: ({ mailer }) => {
            mailer.failOn = [0];
        },
        frames: 1,
        mails: 1
    },
    {
        name: "the websocket connection list fails",
        arrange: ({ connections }) => {
            connections.mode = "fail";
        },
        frames: 0,
        mails: 1
    },
    {
        name: "the websocket connection list throws",
        arrange: ({ connections }) => {
            connections.mode = "throw";
        },
        frames: 0,
        mails: 1
    },
    {
        name: "the websocket send fails",
        arrange: ({ sends }) => {
            sends.mode = "fail";
        },
        frames: 1,
        mails: 1
    },
    {
        name: "the websocket send throws",
        arrange: ({ sends }) => {
            sends.mode = "throw";
        },
        frames: 1,
        mails: 1
    },
    {
        name: "the mailer, the connection list and the send all throw",
        arrange: ({ mailer, connections, sends }) => {
            mailer.throwOn = [0];
            connections.mode = "throw";
            sends.mode = "throw";
        },
        frames: 0,
        mails: 1
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

        it("sends nothing when a pool step is started", async () => {
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
            expect(chat.sent[0].message.title).toBe(`You’re reviewing: ${TITLE} (Editorial review)`);
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
                body: `Anna: “${COMMENT}”. Create a new revision to fix it.`
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
        ])("tells the owner the reason when $name, and never `Cancelled by`", async ({ reason, body }) => {
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
        });
    });

    describe("bulk cancel when content is trashed or deleted (D134, A65)", () => {
        it("tells the owner of the owned review only, not the pool of the other review", async () => {
            const { request, start, cancelTarget, connectAll, clear, sends, mailer, frameUsers, read } =
                await setup();
            allowReaders();
            connectAll();
            const owned = expectOk(await request.execute(createRequestInput()));
            expectOk(await start.execute(actorInput(owned.id, "legal", ANNA)));
            const waiting = expectOk(
                await request.execute(createRequestInput({ targetRevisionId: "article-1#0002" }))
            );
            clear();

            const cancelled = expectOk(
                await cancelTarget.execute({
                    model: ARTICLE_MODEL,
                    targetId: "article-1",
                    actor: MANAGER,
                    reason: REVIEW_CANCEL_REASON_CONTENT_TRASHED
                })
            );

            expect(cancelled.map(review => review.id).sort()).toEqual([owned.id, waiting.id].sort());
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
            const { request, start, cancelTarget, connectAll, clear, sends, mailer, frameUsers } =
                await setup();
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

            expectOk(
                await cancelTarget.execute({
                    model: ARTICLE_MODEL,
                    targetId: "article-1",
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
            expectOk(await repository.save(toSaveData(createRunningAutomationReview())));
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
            expectOk(await repository.save(toSaveData(createRunningAutomationReview("task-1"))));
            clear();

            const review = Review.fromData(expectOk(await repository.get("review-1")));
            expectOk(review.fail({ stepId: AUTOMATION_STEP_ID, reason: FAILURE_REASON, now: LATER }));
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
            expectOk(await repository.save(toSaveData(createRunningAutomationReview("task-1"))));
            // Two writers loaded the review while it was running (stuck detection and a late hook,
            // for example). There is no optimistic lock (D27), so each one fails the step and saves.
            const stale = Review.fromData(expectOk(await repository.get("review-1")));
            const late = Review.fromData(expectOk(await repository.get("review-1")));
            clear();

            expectOk(stale.fail({ stepId: AUTOMATION_STEP_ID, reason: FAILURE_REASON, now: LATER }));
            expectOk(late.fail({ stepId: AUTOMATION_STEP_ID, reason: FAILURE_REASON, now: LATER }));
            expectOk(await saver.save(stale));
            expectOk(await saver.save(late));

            expect(workflowEventTypes()).toEqual([
                "Workflows/Review/StepFailed",
                "Workflows/Review/StepFailed"
            ]);
            expect(sends.sent).toHaveLength(2);
        });

        it("sends nothing when a failed step is restarted", async () => {
            const { repository, restart, connectAll, clear, sends, mailer, chat } = await setup();
            connectAll();
            expectOk(await repository.save(toSaveData(createFailedAutomationReview(FAILURE_REASON))));
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

    describe("a failing mailer or websocket never fails the review action (R87, R196)", () => {
        it.each(FAILURE_CASES)(
            "returns the rejected review and still sends the other channel when $name",
            async testCase => {
                const fakes = await setup();
                const { request, start, reject, connectAll, clear, sends, mailer, read } = fakes;
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
                expect(loggedErrors.length).toBeGreaterThan(0);
            }
        );
    });
});
```

Create `packages/api-workflows/__tests__/notifications/ReviewNotificationsBackgroundTask.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { MailerService } from "@webiny/api-mailer";
import type {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
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
import { FakeListUsers } from "~tests/__helpers/FakeListUsers.js";
import { readableUsers } from "~tests/__helpers/FakeReviewTargetReadAccess.js";
import {
    RecordingEventPublisher,
    recordedEvents,
    workflowEventTypes
} from "~tests/__helpers/RecordingEventPublisher.js";
import { RecordingMailer } from "~tests/__helpers/RecordingMailer.js";
import { FakeWebsocketConnections } from "~tests/__helpers/FakeWebsocketConnections.js";
import { RecordingWebsocketsSend } from "~tests/__helpers/RecordingWebsocketsSend.js";
import { FakeWorkflowsAdminUrl } from "~tests/__helpers/FakeWorkflowsAdminUrl.js";
import { FakeReviewTargetLink } from "~tests/__helpers/FakeReviewTargetLink.js";
import { createFakeTaskController } from "~tests/__helpers/FakeTaskController.js";
import { resetFakeTasks } from "~tests/__helpers/FakeTaskService.js";
import {
    createAutomationStep,
    registerTestAutomation
} from "~tests/__helpers/TestAutomationDefinition.js";
import { AUTOMATION_STEP_ID, automationActor } from "~tests/__helpers/stepRunReviews.js";
import {
    ARTICLE_MODEL,
    createReviewStep,
    createWorkflow,
    expectOk,
    NOW,
    requester,
    targetContext
} from "~tests/__helpers/fixtures.js";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import type { ReviewData } from "~/domain/review/types.js";
import type { WorkflowStep } from "~/domain/workflow/types.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import {
    STEP_RUN_MAX_ITERATIONS,
    STEP_RUN_TASK_DEFINITION_ID
} from "~/features/stepRun/constants.js";
import { WorkflowStepRunTaskHandler } from "~/features/stepRun/WorkflowStepRunTask/index.js";
import type { StepRunTaskInput } from "~/features/stepRun/types.js";
import { WorkflowsAdminUrlService } from "~/features/notifications/WorkflowsAdminUrlService/index.js";
import { ReviewTargetLink } from "~/features/notifications/ReviewTargetLink/index.js";

/** A tenant that is not the root tenant of the test context. */
const TENANT_ID = "tenant-a";
const ADMIN_URL = "https://admin.example.com";
const TITLE = "Article article-1";
const REJECT_COMMENT = "The links are broken.";

const DEFINITION: TaskDefinition.Metadata = {
    id: STEP_RUN_TASK_DEFINITION_ID,
    title: "Workflow step run",
    isPrivate: true,
    maxIterations: STEP_RUN_MAX_ITERATIONS
};

/** The automation step "Check links" notifies by e-mail; its settings pick the outcome. */
const createAutomationReviewStep = (settings: Record<string, unknown>): WorkflowStep => {
    return {
        ...createAutomationStep({ id: AUTOMATION_STEP_ID, title: "Check links", settings }),
        notifications: [{ id: "e-mail" }]
    };
};

/** A pool review step after the automation: reaching it runs the pool lookups (R183). */
const createPoolReviewStep = (): WorkflowStep => {
    return {
        ...createReviewStep({ id: "editorial", title: "Editorial review" }),
        notifications: [{ id: "e-mail" }]
    };
};

/**
 * A review whose automation step "Check links" is running as `task-1`, and which notifies by
 * e-mail. By default the workflow is that one step: approving it approves the review.
 */
const createNotifyingAutomationReview = (
    settings: Record<string, unknown>,
    steps: WorkflowStep[] = [createAutomationReviewStep(settings)]
): Review => {
    const review = expectOk(
        Review.request({
            id: "review-1",
            workflow: createWorkflow({ steps }),
            model: ARTICLE_MODEL,
            targetId: "article-1",
            targetRevisionId: "article-1#0001",
            title: TITLE,
            targetContext,
            picks: [],
            requester,
            now: NOW
        })
    );
    expectOk(
        review.reachRun({ actor: requester, owner: automationActor, taskId: "task-1", now: NOW })
    );
    return review;
};

const setup = async () => {
    const mailer = new RecordingMailer();
    const connections = new FakeWebsocketConnections();
    const sends = new RecordingWebsocketsSend();
    const directory = new FakeListUsers(ROUTING_USERS);
    // The routing context adds the read-access fakes the pool lookup needs.
    const { context } = await createRoutingContext({
        setup: container => {
            captureLoggedErrors(container);
            container.registerDecorator(RecordingEventPublisher);
            registerTestAutomation(container);
            container.registerInstance(MailerService, mailer);
            container.registerInstance(WebsocketsListConnectionsUseCase, connections);
            container.registerInstance(WebsocketsSendToConnectionsUseCase, sends);
            container.registerInstance(WorkflowsAdminUrlService, new FakeWorkflowsAdminUrl());
            container.registerInstance(ReviewTargetLink, new FakeReviewTargetLink());
            container.registerInstance(ListUsersUseCase, directory);
        }
    });
    const { container } = context;
    directory.watch(container.resolve(IdentityContext));
    const tenantContext = container.resolve(TenantContext);
    const rootTenantId = tenantContext.getTenant().id;
    const tenant = { ...tenantContext.getTenant(), id: TENANT_ID };
    const handler = container.resolveImplementation(
        WorkflowStepRunTaskHandler
    ) as TaskHandler.Interface<StepRunTaskInput>;
    const saver = container.resolve(ReviewSaver);
    const repository = container.resolve(ReviewRepository);

    return {
        mailer,
        connections,
        sends,
        directory,
        tenantContext,
        rootTenantId,
        /** Runs `callback` with `tenant-a` as the current tenant: the review lives in it. */
        inTenant: <TValue>(callback: () => Promise<TValue>): Promise<TValue> => {
            return tenantContext.withTenant(tenant, callback);
        },
        seed: async (review: Review): Promise<void> => {
            expectOk(await saver.save(review));
            recordedEvents.length = 0;
            loggedErrors.length = 0;
            mailer.sent.length = 0;
            sends.sent.length = 0;
        },
        read: async (): Promise<ReviewData> => expectOk(await repository.get("review-1")),
        /**
         * One iteration of the step run task, driven the way the runner does (R157). It calls
         * `handler.run` directly, so it is NOT inside the task runner's `withoutAuthorization`
         * (D26): authorization is on here, and the `authorizationEnabled === false` assertions
         * below prove that the recipient service wraps its own lookups (D36).
         */
        run: async () => {
            const { controller, task } = createFakeTaskController({ iterations: 1 });
            return handler.run({ input: task.input, controller, definition: DEFINITION });
        }
    };
};

describe("review notifications inside the background-task step run (R188, R195, R196, D36)", () => {
    beforeEach(() => {
        resetRoutingFakes();
        resetFakeTasks();
        recordedEvents.length = 0;
        loggedErrors.length = 0;
    });

    it("notifies the requester once, with the step title as decider, in the tenant of the run (reject)", async () => {
        const { inTenant, seed, run, read, tenantContext, rootTenantId, connections, sends, mailer } =
            await setup();
        // The same user is connected in the root tenant and in `tenant-a`: only the second counts.
        connections.connect(requester.id, rootTenantId, "conn-root");
        connections.connect(requester.id, TENANT_ID, "conn-tenant-a");

        expect(tenantContext.getTenant().id).toBe(rootTenantId);
        expect(rootTenantId).not.toBe(TENANT_ID);
        const stored = await inTenant(async () => {
            expect(tenantContext.getTenant().id).toBe(TENANT_ID);
            await seed(createNotifyingAutomationReview({ mode: "reject", comment: REJECT_COMMENT }));
            const result = await run();
            expect(result.status).toBe("done");
            return read();
        });

        expect(stored.state).toBe("rejected");
        expect(workflowEventTypes()).toEqual(["Workflows/Review/StepRejected"]);
        // One frame, to the tenant-a connection only: the root connection of the same user got nothing.
        expect(sends.sent).toHaveLength(1);
        expect(sends.sent[0].connections).toEqual([
            { connectionId: "conn-tenant-a", endpoint: "wss://websockets.test" }
        ]);
        // The automation is named by its step title (D107), never by the requester's name it carries.
        expect(sends.sent[0].message.data).toMatchObject({
            event: "rejected",
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            namespace: ARTICLE_MODEL,
            title: `“${TITLE}” was rejected at Check links`,
            body: `Check links: “${REJECT_COMMENT}”. Create a new revision to fix it.`
        });
        // One mail to the requester, with a link that opens the review's own tenant.
        expect(mailer.sent).toHaveLength(1);
        expect(mailer.sent[0].bcc).toEqual(["user-requester@webiny.test"]);
        expect(mailer.sent[0].subject).toBe(`Rejected: ${TITLE} (Check links)`);
        expect(mailer.sent[0].text).toContain(
            `Open content: ${ADMIN_URL}/cms/content-entries/article?id=article-1%230001&tenantId=${TENANT_ID}`
        );
        expect(loggedErrors).toEqual([]);
    });

    it("notifies the requester once when the automation approves the review", async () => {
        const { inTenant, seed, run, read, connections, sends, mailer, rootTenantId } =
            await setup();
        connections.connect(requester.id, rootTenantId, "conn-root");
        connections.connect(requester.id, TENANT_ID, "conn-tenant-a");

        const stored = await inTenant(async () => {
            await seed(createNotifyingAutomationReview({ comment: "Links are fine." }));
            await run();
            return read();
        });

        expect(stored.state).toBe("approved");
        expect(workflowEventTypes()).toEqual([
            "Workflows/Review/StepApproved",
            "Workflows/Review/Approved"
        ]);
        expect(sends.sent).toHaveLength(1);
        expect(sends.sent[0].connections.map(connection => connection.connectionId)).toEqual([
            "conn-tenant-a"
        ]);
        expect(sends.sent[0].message.data).toMatchObject({
            event: "approved",
            title: `“${TITLE}” was approved`
        });
        expect(mailer.sent).toHaveLength(1);
        expect(mailer.sent[0].subject).toBe(`Approved: ${TITLE}`);
        expect(mailer.sent[0].text).toContain(`tenantId=${TENANT_ID}`);
    });

    it("sends no frame to a requester who is connected only in the root tenant, but still sends the mail", async () => {
        const { inTenant, seed, run, connections, sends, mailer, rootTenantId } = await setup();
        connections.connect(requester.id, rootTenantId, "conn-root");

        await inTenant(async () => {
            await seed(createNotifyingAutomationReview({ mode: "reject", comment: REJECT_COMMENT }));
            await run();
        });

        expect(sends.sent).toEqual([]);
        expect(mailer.sent).toHaveLength(1);
        expect(loggedErrors).toEqual([]);
    });

    it("looks the users up without authorization, not as the requester (D36)", async () => {
        const { inTenant, seed, run, directory, connections } = await setup();
        connections.connect(requester.id, TENANT_ID, "conn-tenant-a");

        await inTenant(async () => {
            await seed(createNotifyingAutomationReview({ mode: "reject", comment: REJECT_COMMENT }));
            directory.calls.length = 0;
            await run();
        });

        expect(directory.calls.length).toBeGreaterThan(0);
        for (const call of directory.calls) {
            expect(call.authorizationEnabled).toBe(false);
        }
        expect(directory.calls.some(call => call.input.where?.id_in?.includes(requester.id))).toBe(
            true
        );
    });

    it("runs the pool lookups inside the step run when the next step is a pool step, all without authorization", async () => {
        const { inTenant, seed, run, read, directory, connections, sends, mailer } = await setup();
        readableUsers.add("user-anna");
        connections.connect("user-anna", TENANT_ID, "conn-anna-a");
        connections.connect(requester.id, TENANT_ID, "conn-requester-a");

        const stored = await inTenant(async () => {
            await seed(
                createNotifyingAutomationReview({}, [
                    createAutomationReviewStep({ comment: "Links are fine." }),
                    createPoolReviewStep()
                ])
            );
            directory.calls.length = 0;
            await run();
            return read();
        });

        expect(stored).toMatchObject({ state: "inProgress", currentStepId: "editorial" });
        expect(workflowEventTypes()).toEqual([
            "Workflows/Review/StepApproved",
            "Workflows/Review/StepReached"
        ]);
        // The pool is told, the requester is not (an intermediate approve sends nothing).
        expect(sends.sent).toHaveLength(1);
        expect(sends.sent[0].connections.map(connection => connection.connectionId)).toEqual([
            "conn-anna-a"
        ]);
        expect(sends.sent[0].message.data).toMatchObject({
            event: "poolReached",
            stepId: "editorial"
        });
        expect(mailer.sent).toHaveLength(1);
        expect(mailer.sent[0].bcc).toEqual(["user-anna@webiny.test"]);
        // The member lookup (`teams_in`) and the e-mail lookup (`id_in`) both ran, all unauthorized.
        expect(directory.calls.some(call => call.input.where?.teams_in !== undefined)).toBe(true);
        expect(directory.calls.some(call => call.input.where?.id_in !== undefined)).toBe(true);
        for (const call of directory.calls) {
            expect(call.authorizationEnabled).toBe(false);
        }
    });

    it("finishes the task and keeps the decision when the mailer and the websocket throw (R87, R196)", async () => {
        const { inTenant, seed, run, read, connections, sends, mailer } = await setup();
        connections.connect(requester.id, TENANT_ID, "conn-tenant-a");
        mailer.throwOn = [0];
        sends.mode = "throw";

        const { result, stored } = await inTenant(async () => {
            await seed(createNotifyingAutomationReview({ mode: "reject", comment: REJECT_COMMENT }));
            const taskResult = await run();
            return { result: taskResult, stored: await read() };
        });

        expect(result.status).toBe("done");
        expect(stored.state).toBe("rejected");
        expect(mailer.sent).toHaveLength(1);
        expect(sends.sent).toHaveLength(1);
        expect(loggedErrors.length).toBeGreaterThan(0);
    });
});
```

Tenant of the background file: it runs under `tenant-a`, a copy of the context's tenant with another id (`TenantContext.withTenant`), on the context's own storage. Confirm on both storages that the saver and the repository accept the made-up id (`yarn test` and `yarn test:os`, Steps 2 and 3). If storage rejects it on either one, create a real second tenant instead and use its id as `TENANT_ID`, with the pattern of `packages/api-headless-cms-workflows/__tests__/target/CmsEntryAdapter.tenants.test.ts` (`CreateTenantUseCase` run through `IdentityContext.withoutAuthorization`, then the tenant used with `TenantContext.withTenant`). In `setup`, after `directory.watch(...)`, replace the `tenant` line with:

```ts
    const created = expectOk(
        await container.resolve(IdentityContext).withoutAuthorization(() => {
            return container.resolve(CreateTenantUseCase).execute({
                id: TENANT_ID,
                name: TENANT_ID,
                description: "Child tenant",
                tags: [],
                parent: "root"
            });
        })
    );
    const tenant = created;
```

and add `import { CreateTenantUseCase } from "@webiny/api-core/features/tenancy/CreateTenant/index.js";` to the imports. Nothing else in the file changes.

- [ ] **Step 2: Run the tests**

Run each file on its own:
`yarn test packages/api-workflows/__tests__/notifications/ReviewNotifications.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewNotificationsBackgroundTask.test.ts 2>&1 | tail -50`
Expected: PASS. There is nothing to implement in this task and no RED step: the chain is complete after Task 12. A failure here is a defect in the code of Tasks 10-12, not in the test. Read the failing assertion, fix the production code in the task that owns it (a new commit, named after the fix) and rerun; never weaken an assertion. Typical suspects: a recipient dropped by `dropActor` that should not be, a frame to the wrong tenant, a transport of the wrong step, a handler that is not registered, a lookup that runs with authorization on. A failure of a test helper's own shape (a field of `FakeWebsocketConnections` or `RecordingMailer`) is fixed in the helper's task the same way.

- [ ] **Step 3: Run the same files on OpenSearch**

`yarn test:os packages/api-workflows/__tests__/notifications/ReviewNotifications.test.ts 2>&1 | tail -50`
`yarn test:os packages/api-workflows/__tests__/notifications/ReviewNotificationsBackgroundTask.test.ts 2>&1 | tail -50`
Expected: PASS (one at a time; parallel runs clash on port 8001).

- [ ] **Step 4: Run the tests that cover the code these tests exercise**

By path, one file per command, each also with `yarn test:os`:
`yarn test packages/api-workflows/__tests__/notifications/ReviewNotifierService.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/notifications/ReviewNotificationsFeature.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskRun.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/review/ReviewSaver.test.ts 2>&1 | tail -50`
Expected: PASS, unchanged.

Task 12 changed the CMS and Website Builder test contexts (the inert mailer and websocket stubs), so run their registration tests again, by path, on both storages:
`yarn test packages/api-headless-cms-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
`yarn test:os packages/api-headless-cms-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
`yarn test:os packages/api-website-builder-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn check:test:types -p api-workflows,api-headless-cms-workflows,api-website-builder-workflows --report cli 2>&1 | tail -40`
Expected: no errors in the touched packages.

- [ ] **Step 5: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `00-shared.md` in full (no package build is needed: this task adds test files only), and restore `.gitleaks.toml` (`git checkout -- .gitleaks.toml`). If any step fails and you fix something, rerun the chain from the start. Then commit:

```
git commit -m "test(api-workflows): add end-to-end notification tests through the saver and the step run" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EWvjsBXWqViJPTrgbzhYr4"
```
