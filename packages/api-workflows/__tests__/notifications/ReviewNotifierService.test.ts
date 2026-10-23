import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MailerService } from "@webiny/api-mailer";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import {
    WebsocketsListConnectionsUseCase,
    WebsocketsSendToConnectionsUseCase
} from "@webiny/api-websockets/exports/api.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { registerFaultyTenantContext, tenantFault } from "~tests/__helpers/FaultyTenantContext.js";
import { FakeListUsers, type FakeUser } from "~tests/__helpers/FakeListUsers.js";
import { RecordingMailer } from "~tests/__helpers/RecordingMailer.js";
import { FakeWebsocketConnections } from "~tests/__helpers/FakeWebsocketConnections.js";
import { RecordingWebsocketsSend } from "~tests/__helpers/RecordingWebsocketsSend.js";
import { RecordingReviewWebsocketSender } from "~tests/__helpers/RecordingReviewWebsocketSender.js";
import { RecordingNotificationTransport } from "~tests/__helpers/RecordingNotificationTransport.js";
import { FakeWorkflowsAdminUrl } from "~tests/__helpers/FakeWorkflowsAdminUrl.js";
import { FakeReviewTargetLink } from "~tests/__helpers/FakeReviewTargetLink.js";
import {
    createReviewStep,
    createStartedReview,
    createWorkflow
} from "~tests/__helpers/fixtures.js";
import { WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION } from "~/features/notifications/shared/constants.js";
import type { NotificationMessage } from "~/domain/notifications/types.js";
import type { ReviewData } from "~/domain/review/types.js";
import { NotificationTransport } from "~/features/notifications/NotificationTransport/index.js";
import { NotificationRecipientService } from "~/features/notifications/NotificationRecipientService/index.js";
import { NotificationRecipientServiceFeature } from "~/features/notifications/NotificationRecipientService/feature.js";
import { WorkflowsAdminUrlService } from "~/features/notifications/WorkflowsAdminUrlService/index.js";
import { ReviewTargetLink } from "~/features/notifications/ReviewTargetLink/index.js";
import { ReviewTargetLinkService } from "~/features/notifications/ReviewTargetLinkService/index.js";
import { ReviewTargetLinkServiceFeature } from "~/features/notifications/ReviewTargetLinkService/feature.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/index.js";
import { ReviewNotifierServiceFeature } from "~/features/notifications/ReviewNotifierService/feature.js";
import { ReviewWebsocketSender } from "~/features/notifications/ReviewWebsocketSender/index.js";
import { ReviewWebsocketSenderFeature } from "~/features/notifications/ReviewWebsocketSender/feature.js";

const SECRET = "SECRET-TOKEN-4711";
const WEBSOCKET_TEXT = "Could not send a workflow websocket notification.";
const LOOKUP_TEXT = "Could not look up the users to e-mail.";
const TRANSPORT_TEXT = "Could not send a workflow notification through a transport.";
const UNKNOWN_TRANSPORT_TEXT = "A step names a notification transport that is not registered.";
const LINK_TEXT = "Could not build the workflow notification link.";

const ANNA: NotificationRecipientService.Recipient = { id: "user-anna", displayName: "Anna" };
const BOB: NotificationRecipientService.Recipient = { id: "user-bob", displayName: "Bob" };

const USERS: FakeUser[] = [
    { id: "user-anna", displayName: "Anna", teams: [] },
    { id: "user-bob", displayName: "Bob", teams: [] }
];

const MESSAGE: NotificationMessage = {
    title: "“Article 1” was approved",
    body: "All steps approved. It’s ready to publish.",
    subject: "Approved: Article 1",
    text: "Every step approved this revision. It’s ready to publish.",
    linkLabel: "Open content"
};

/**
 * Two steps with different channels (Review Focus 8): "legal" lists `chat` twice, an unknown
 * `missing` and `chat-b`; "editorial" lists `chat-b` only; "plain" lists nothing.
 */
const createReview = (): ReviewData => {
    const workflow = createWorkflow({
        steps: [
            {
                ...createReviewStep({ id: "legal", title: "Legal review", allowManualPick: true }),
                notifications: [{ id: "chat" }, { id: "missing" }, { id: "chat" }, { id: "chat-b" }]
            },
            {
                ...createReviewStep({ id: "editorial", title: "Editorial review" }),
                notifications: [{ id: "chat-b" }]
            },
            createReviewStep({ id: "plain", title: "Plain review" })
        ]
    });
    return createStartedReview({ workflow }).toData();
};

/** The same review, but "legal" notifies through the built-in e-mail transport. */
const createMailReview = (): ReviewData => {
    const review = createReview();
    review.steps[0].notifications = [{ id: "e-mail" }];
    return review;
};

class ThrowingListUsers implements ListUsersUseCase.Interface {
    public async execute(): Promise<never> {
        throw new Error(`The user lookup crashed for anna@webiny.test ${SECRET}.`);
    }
}

class ThrowingLinkService implements ReviewTargetLinkService.Interface {
    public async getUrl(): Promise<string | null> {
        throw new Error("The link service crashed.");
    }
}

class ThrowingRecipientService implements NotificationRecipientService.Interface {
    public async listPool(): NotificationRecipientService.PoolReturn {
        throw new Error("Not used by these tests.");
    }

    public async listUsers(): NotificationRecipientService.UsersReturn {
        throw new Error(`The recipient service crashed ${SECRET}.`);
    }
}

interface SetupParams {
    users?: ListUsersUseCase.Interface;
    link?: ReviewTargetLinkService.Interface;
    recipients?: NotificationRecipientService.Interface;
    sender?: ReviewWebsocketSender.Interface;
}

const setup = async (params: SetupParams = {}) => {
    const order: string[] = [];
    const mailer = new RecordingMailer();
    const connections = new FakeWebsocketConnections();
    const sends = new RecordingWebsocketsSend();
    const chat = new RecordingNotificationTransport("chat", order);
    const chatB = new RecordingNotificationTransport("chat-b", order);
    const adminUrl = new FakeWorkflowsAdminUrl();
    const link = new FakeReviewTargetLink();
    const users = new FakeListUsers(USERS);
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            registerFaultyTenantContext(container);
            container.registerInstance(MailerService, mailer);
            container.registerInstance(WebsocketsListConnectionsUseCase, connections);
            container.registerInstance(WebsocketsSendToConnectionsUseCase, sends);
            container.registerInstance(NotificationTransport, chat);
            container.registerInstance(NotificationTransport, chatB);
            container.registerInstance(WorkflowsAdminUrlService, adminUrl);
            container.registerInstance(ReviewTargetLink, link);
            container.registerInstance(ListUsersUseCase, params.users ?? users);
            NotificationRecipientServiceFeature.register(container);
            ReviewTargetLinkServiceFeature.register(container);
            ReviewWebsocketSenderFeature.register(container);
            ReviewNotifierServiceFeature.register(container);
            if (params.recipients) {
                container.registerInstance(NotificationRecipientService, params.recipients);
            }
            if (params.link) {
                container.registerInstance(ReviewTargetLinkService, params.link);
            }
            if (params.sender) {
                container.registerInstance(ReviewWebsocketSender, params.sender);
            }
        }
    });
    const notifier = context.container.resolve(ReviewNotifierService);
    const tenantId = context.container.resolve(TenantContext).getTenant().id;

    return {
        order,
        mailer,
        connections,
        sends,
        chat,
        chatB,
        adminUrl,
        link,
        users,
        tenantId,
        notify: (overrides: Partial<ReviewNotifierService.Params> = {}): Promise<void> => {
            return notifier.notify({
                review: createReview(),
                stepId: "legal",
                event: "approved",
                recipients: [ANNA, BOB],
                message: MESSAGE,
                ...overrides
            });
        }
    };
};

describe("ReviewNotifierService (R186-R188, R192-R197)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
        tenantFault.mode = "none";
    });

    afterEach(() => {
        tenantFault.mode = "none";
    });

    describe("websocket (R187, R188)", () => {
        it("sends one frame with exactly the R187 data, to the recipient's current-tenant connection", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections.connect("user-anna", tenantId, "conn-anna");
            const review = createReview();

            await notify({ review, stepId: "editorial", recipients: [ANNA] });

            expect(sends.sent).toEqual([
                {
                    connections: [{ connectionId: "conn-anna", endpoint: "wss://websockets.test" }],
                    message: {
                        action: WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION,
                        data: {
                            event: "approved",
                            reviewId: "review-1",
                            stepId: "editorial",
                            namespace: "cms.article",
                            targetId: "article-1",
                            targetRevisionId: "article-1#0001",
                            title: MESSAGE.title,
                            body: MESSAGE.body
                        }
                    }
                }
            ]);
            expect(Object.keys(sends.sent[0].message.data ?? {}).sort()).toEqual([
                "body",
                "event",
                "namespace",
                "reviewId",
                "stepId",
                "targetId",
                "targetRevisionId",
                "title"
            ]);
            expect(Object.keys(sends.sent[0].message).sort()).toEqual(["action", "data"]);
            expect(connections.calls).toEqual([{ where: { identityId: "user-anna" } }]);
        });

        it("carries a null stepId and the namespace of the review", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections.connect("user-anna", tenantId, "conn-anna");

            await notify({ stepId: null, event: "cancelled", recipients: [ANNA] });

            expect(sends.sent[0].message.data).toMatchObject({
                event: "cancelled",
                stepId: null,
                namespace: "cms.article"
            });
        });

        it("sends only to the recipients, never to other users with connections", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections
                .connect("user-anna", tenantId, "conn-anna")
                .connect("user-bob", tenantId, "conn-bob")
                .connect("user-dan", tenantId, "conn-dan");

            await notify({ recipients: [ANNA] });

            expect(
                sends.sent.map(frame => frame.connections.map(item => item.connectionId))
            ).toEqual([["conn-anna"]]);
        });

        it("sends one frame per recipient, with every connection of that recipient in the tenant", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections
                .connect("user-anna", tenantId, "anna-tab-1")
                .connect("user-anna", tenantId, "anna-tab-2")
                .connect("user-bob", tenantId, "bob-tab-1");

            await notify();

            // Order-independent: batches run concurrently.
            const frames = sends.sent
                .map(frame => frame.connections.map(item => item.connectionId).sort())
                .sort((a, b) => a[0].localeCompare(b[0]));
            expect(frames).toEqual([["anna-tab-1", "anna-tab-2"], ["bob-tab-1"]]);
        });

        it("sends a recipient listed twice once", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections.connect("user-anna", tenantId, "conn-anna");

            await notify({ recipients: [ANNA, ANNA] });

            expect(sends.sent).toHaveLength(1);
            expect(connections.calls).toHaveLength(1);
        });

        it("does nothing at all without recipients", async () => {
            const { notify, connections, sends, users } = await setup();

            await notify({ recipients: [] });

            expect(connections.calls).toEqual([]);
            expect(sends.sent).toEqual([]);
            expect(users.calls).toEqual([]);
        });

        it("makes no list call for a recipient with an empty or missing id (R188)", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections.connect("user-anna", tenantId, "conn-anna");

            await notify({
                stepId: "plain",
                recipients: [
                    { id: "", displayName: "Nobody" },
                    { id: undefined as unknown as string, displayName: "Undefined" }
                ]
            });

            expect(connections.calls).toEqual([]);
            expect(sends.sent).toEqual([]);
            expect(loggedErrors).toEqual([]);
        });

        it("still notifies the recipients with an id when others have none", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections.connect("user-anna", tenantId, "conn-anna");

            await notify({ recipients: [{ id: "", displayName: "Nobody" }, ANNA] });

            expect(connections.calls).toEqual([{ where: { identityId: "user-anna" } }]);
            expect(sends.sent).toHaveLength(1);
        });

        it("sends to the connection of the current tenant only, not to the same user in another tenant (R188, A63)", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections
                .connect("user-anna", "another-tenant", "conn-other-tenant")
                .connect("user-anna", tenantId, "conn-this-tenant");

            await notify({ recipients: [ANNA] });

            expect(sends.sent).toHaveLength(1);
            expect(sends.sent[0].connections).toEqual([
                { connectionId: "conn-this-tenant", endpoint: "wss://websockets.test" }
            ]);
        });

        it("sends nothing, and logs nothing, to a recipient connected only in another tenant", async () => {
            const { notify, connections, sends } = await setup();
            connections.connect("user-anna", "another-tenant", "conn-other-tenant");

            await expect(notify({ stepId: "plain", recipients: [ANNA] })).resolves.toBeUndefined();

            expect(connections.calls).toEqual([{ where: { identityId: "user-anna" } }]);
            expect(sends.sent).toEqual([]);
            expect(loggedErrors).toEqual([]);
        });

        it("sends nothing, and logs nothing, to a recipient with no connection", async () => {
            const { notify, sends } = await setup();

            await notify({ stepId: "plain", recipients: [ANNA] });

            expect(sends.sent).toEqual([]);
            expect(loggedErrors).toEqual([]);
        });

        it("sends nothing and logs once when there is no current tenant", async () => {
            const { notify, connections, sends } = await setup();
            connections.connect("user-anna", "root", "conn-anna");
            tenantFault.mode = "missing";

            await expect(
                notify({ stepId: null, recipients: [ANNA, BOB] })
            ).resolves.toBeUndefined();

            expect(connections.calls).toEqual([]);
            expect(sends.sent).toEqual([]);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(WEBSOCKET_TEXT);
            expect(loggedErrors[0].fields).toEqual({ reviewId: "review-1", event: "approved" });
        });

        it("sends nothing and logs once when the tenant read throws", async () => {
            const { notify, connections, sends } = await setup();
            connections.connect("user-anna", "root", "conn-anna");
            tenantFault.mode = "throws";

            await expect(
                notify({ stepId: null, recipients: [ANNA, BOB] })
            ).resolves.toBeUndefined();

            expect(sends.sent).toEqual([]);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(WEBSOCKET_TEXT);
            expect(loggedErrors[0].fields).toEqual({
                errorName: "Error",
                reviewId: "review-1",
                event: "approved"
            });
        });
    });

    describe("the websocket frame goes through the sender (R255)", () => {
        it("hands the sender the unique recipient ids, the event, the notification action and the R187 data, once", async () => {
            const sender = new RecordingReviewWebsocketSender();
            const { notify } = await setup({ sender });

            await notify({ stepId: "plain", recipients: [ANNA, BOB, ANNA] });

            expect(sender.calls).toEqual([
                {
                    reviewId: "review-1",
                    event: "approved",
                    recipientIds: ["user-anna", "user-bob"],
                    action: WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION,
                    data: {
                        event: "approved",
                        reviewId: "review-1",
                        stepId: "plain",
                        namespace: "cms.article",
                        targetId: "article-1",
                        targetRevisionId: "article-1#0001",
                        title: MESSAGE.title,
                        body: MESSAGE.body
                    }
                }
            ]);
        });

        it("does not call the sender without recipients", async () => {
            const sender = new RecordingReviewWebsocketSender();
            const { notify } = await setup({ sender });

            await notify({ recipients: [] });

            expect(sender.calls).toEqual([]);
        });

        it("survives a sender that rejects: logs it once with code and name only and still runs the transports", async () => {
            const sender = new RecordingReviewWebsocketSender();
            sender.mode = "throw";
            const { notify, chatB } = await setup({ sender });

            await expect(
                notify({ stepId: "editorial", recipients: [ANNA] })
            ).resolves.toBeUndefined();

            expect(loggedErrors.filter(item => item.message === WEBSOCKET_TEXT)).toEqual([
                {
                    message: WEBSOCKET_TEXT,
                    fields: { errorName: "Error", reviewId: "review-1", event: "approved" }
                }
            ]);
            expect(chatB.sent).toHaveLength(1);
        });
    });

    describe("transports (R186, R192, R194, R195)", () => {
        it("makes no lookup and no link call when the step has no transport", async () => {
            const { notify, users, adminUrl, link, tenantId, connections } = await setup();
            connections.connect("user-anna", tenantId, "conn-anna");

            await notify({ stepId: "plain" });

            expect(users.calls).toEqual([]);
            expect(adminUrl.calls).toBe(0);
            expect(link.paths).toEqual([]);
        });

        it("makes no lookup when the step id is null or names no step", async () => {
            const { notify, users, adminUrl } = await setup();

            await notify({ stepId: null });
            await notify({ stepId: "no-such-step" });

            expect(users.calls).toEqual([]);
            expect(adminUrl.calls).toBe(0);
        });

        it("uses the channels of the step it is given (Review Focus 8)", async () => {
            const { notify, chat, chatB } = await setup();

            await notify({ stepId: "editorial" });

            expect(chat.sent).toEqual([]);
            expect(chatB.sent).toHaveLength(1);
        });

        it("calls each registered transport of the step once, in the step's order, and skips an unknown and a duplicate id", async () => {
            const { notify, chat, chatB, order } = await setup();

            await notify({ stepId: "legal" });

            expect(order).toEqual(["chat", "chat-b"]);
            expect(chat.sent).toHaveLength(1);
            expect(chatB.sent).toHaveLength(1);
            expect(loggedErrors).toEqual([
                {
                    message: UNKNOWN_TRANSPORT_TEXT,
                    fields: { reviewId: "review-1", stepId: "legal", transportId: "missing" }
                }
            ]);
        });

        it("sends the message shape of R190 to every transport, with the looked-up users and the link", async () => {
            const { notify, chat, users, tenantId } = await setup();

            await notify({ stepId: "legal" });

            expect(users.calls).toHaveLength(1);
            expect(users.calls[0].input).toEqual({ where: { id_in: ["user-anna", "user-bob"] } });
            expect(chat.sent).toEqual([
                {
                    users: [
                        { id: "user-anna", email: "user-anna@webiny.test", displayName: "Anna" },
                        { id: "user-bob", email: "user-bob@webiny.test", displayName: "Bob" }
                    ],
                    message: {
                        title: MESSAGE.subject,
                        body: MESSAGE.text,
                        url: `https://admin.example.com/cms/content-entries/article?id=article-1%230001&tenantId=${tenantId}`,
                        linkLabel: MESSAGE.linkLabel
                    }
                }
            ]);
        });

        it("builds the link once per notification, however many transports send it", async () => {
            const { notify, link, adminUrl } = await setup();

            await notify({ stepId: "legal" });

            expect(link.paths).toHaveLength(1);
            expect(adminUrl.calls).toBe(1);
        });

        it("passes url null to the transport and logs nothing itself when there is no admin host", async () => {
            const { notify, chatB, adminUrl } = await setup();
            adminUrl.url = null;

            await notify({ stepId: "editorial" });

            expect(chatB.sent).toHaveLength(1);
            expect(chatB.sent[0].message.url).toBeNull();
            expect(loggedErrors).toEqual([]);
        });

        it("sends no transport message when none of the recipients has a user", async () => {
            const { notify, chatB } = await setup();

            await notify({
                stepId: "editorial",
                recipients: [{ id: "user-unknown", displayName: "Api key" }]
            });

            expect(chatB.sent).toEqual([]);
            expect(loggedErrors).toEqual([]);
        });

        it("reaches the real e-mail transport and the mailer with the subject, the text and the link", async () => {
            const { notify, mailer, tenantId } = await setup();

            await notify({ review: createMailReview(), stepId: "legal" });

            expect(mailer.sent).toHaveLength(1);
            expect(mailer.sent[0]).toMatchObject({
                bcc: ["user-anna@webiny.test", "user-bob@webiny.test"],
                subject: "Approved: Article 1"
            });
            expect(mailer.sent[0].text).toContain("Every step approved this revision.");
            expect(mailer.sent[0].text).toContain(
                `Open content: https://admin.example.com/cms/content-entries/article?id=article-1%230001&tenantId=${tenantId}`
            );
        });
    });

    describe("failures never fail the action (R87, R196, Review Focus 1)", () => {
        it("a throwing connection list for one recipient is logged once and the others still get their frame", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections
                .connect("user-anna", tenantId, "conn-anna")
                .connect("user-bob", tenantId, "conn-bob");
            connections.mode = "throw";
            connections.onlyFor = "user-anna";
            connections.failureMessage = `The list crashed ${SECRET}.`;

            await expect(notify({ stepId: "plain" })).resolves.toBeUndefined();

            expect(sends.sent.map(frame => frame.connections[0].connectionId)).toEqual([
                "conn-bob"
            ]);
            expect(loggedErrors).toEqual([
                {
                    message: WEBSOCKET_TEXT,
                    fields: {
                        errorName: "Error",
                        errorMessage: `The list crashed ${SECRET}.`,
                        reviewId: "review-1",
                        event: "approved",
                        recipientId: "user-anna"
                    }
                }
            ]);
        });

        it("a failed connection list is logged once per recipient with the error code and name", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections
                .connect("user-anna", tenantId, "conn-anna")
                .connect("user-bob", tenantId, "conn-bob");
            connections.mode = "fail";

            await expect(notify({ stepId: "plain" })).resolves.toBeUndefined();

            expect(sends.sent).toEqual([]);
            expect(loggedErrors.map(item => item.message)).toEqual([
                WEBSOCKET_TEXT,
                WEBSOCKET_TEXT
            ]);
            expect(loggedErrors.map(item => item.fields.recipientId)).toEqual([
                "user-anna",
                "user-bob"
            ]);
            expect(loggedErrors[0].fields).toMatchObject({
                errorCode: "Websocket/Service",
                errorName: "Error",
                reviewId: "review-1",
                event: "approved"
            });
        });

        it("a throwing send for one recipient is logged once and the others still get their frame", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections
                .connect("user-anna", tenantId, "conn-anna")
                .connect("user-bob", tenantId, "conn-bob");
            sends.mode = "throw";
            sends.onlyFor = "conn-anna";

            await expect(notify({ stepId: "plain" })).resolves.toBeUndefined();

            expect(sends.sent.map(frame => frame.connections[0].connectionId)).toEqual([
                "conn-anna",
                "conn-bob"
            ]);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(WEBSOCKET_TEXT);
            expect(loggedErrors[0].fields).toMatchObject({ recipientId: "user-anna" });
        });

        it("a failed send is logged once per recipient", async () => {
            const { notify, connections, tenantId, sends } = await setup();
            connections.connect("user-anna", tenantId, "conn-anna");
            sends.mode = "fail";

            await expect(notify({ stepId: "plain", recipients: [ANNA] })).resolves.toBeUndefined();

            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(WEBSOCKET_TEXT);
            expect(loggedErrors[0].fields).toMatchObject({
                errorCode: "Websocket/Service",
                recipientId: "user-anna"
            });
        });

        it("a failed websocket does not stop the transports", async () => {
            const { notify, connections, tenantId, sends, chatB } = await setup();
            connections.connect("user-anna", tenantId, "conn-anna");
            sends.mode = "throw";

            await expect(notify({ stepId: "editorial" })).resolves.toBeUndefined();

            expect(chatB.sent).toHaveLength(1);
            expect(loggedErrors.map(item => item.message)).toEqual([WEBSOCKET_TEXT]);
        });

        it("a failed user lookup is logged once with code and name only, the websocket still went out and no transport runs", async () => {
            const { notify, connections, tenantId, sends, users, chat, chatB } = await setup();
            connections.connect("user-anna", tenantId, "conn-anna");
            users.failuresLeft = 1;

            await expect(notify({ stepId: "legal", recipients: [ANNA] })).resolves.toBeUndefined();

            expect(sends.sent).toHaveLength(1);
            expect(chat.sent).toEqual([]);
            expect(chatB.sent).toEqual([]);
            expect(loggedErrors.filter(item => item.message === LOOKUP_TEXT)).toEqual([
                {
                    message: LOOKUP_TEXT,
                    fields: {
                        errorCode: "Workflows/Workflow/Persistence",
                        errorName: "Error",
                        reviewId: "review-1",
                        event: "approved"
                    }
                }
            ]);
        });

        it("a throwing user lookup is logged once with code and name only, never the message", async () => {
            const { notify, connections, tenantId, sends, chatB } = await setup({
                users: new ThrowingListUsers()
            });
            connections.connect("user-anna", tenantId, "conn-anna");

            await expect(
                notify({ stepId: "editorial", recipients: [ANNA] })
            ).resolves.toBeUndefined();

            expect(sends.sent).toHaveLength(1);
            expect(chatB.sent).toEqual([]);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(LOOKUP_TEXT);
            expect(JSON.stringify(loggedErrors)).not.toContain(SECRET);
            expect(JSON.stringify(loggedErrors)).not.toContain("anna@webiny.test");
        });

        it("a recipient service that rejects is logged as a failed lookup", async () => {
            const { notify, connections, tenantId, sends, chatB } = await setup({
                recipients: new ThrowingRecipientService()
            });
            connections.connect("user-anna", tenantId, "conn-anna");

            await expect(
                notify({ stepId: "editorial", recipients: [ANNA] })
            ).resolves.toBeUndefined();

            expect(sends.sent).toHaveLength(1);
            expect(chatB.sent).toEqual([]);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(LOOKUP_TEXT);
            expect(JSON.stringify(loggedErrors)).not.toContain(SECRET);
        });

        it("a throwing transport is logged once with code and name only and the other transport still sends", async () => {
            const { notify, chat, chatB } = await setup();
            chat.mode = "throw";
            chat.failureMessage = `The transport crashed ${SECRET}.`;

            await expect(notify({ stepId: "legal" })).resolves.toBeUndefined();

            expect(chatB.sent).toHaveLength(1);
            expect(loggedErrors.filter(item => item.message === TRANSPORT_TEXT)).toEqual([
                {
                    message: TRANSPORT_TEXT,
                    fields: {
                        transportId: "chat",
                        errorCode: "TRANSPORT_FAILED",
                        errorName: "Error",
                        reviewId: "review-1",
                        event: "approved"
                    }
                }
            ]);
            expect(JSON.stringify(loggedErrors)).not.toContain(SECRET);
        });

        it("a failing admin host lookup is logged once by the link service and the transport still sends without a link", async () => {
            const { notify, adminUrl, chatB } = await setup();
            adminUrl.mode = "throw";

            await expect(notify({ stepId: "editorial" })).resolves.toBeUndefined();

            expect(chatB.sent).toHaveLength(1);
            expect(chatB.sent[0].message.url).toBeNull();
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(LINK_TEXT);
        });

        it("a throwing tenant read in the link is logged once by the link service and the mail goes without a link", async () => {
            const { notify, connections, chatB } = await setup();
            connections.connect("user-anna", "root", "conn-anna");
            tenantFault.mode = "throws";

            await expect(notify({ stepId: "editorial" })).resolves.toBeUndefined();

            expect(chatB.sent).toHaveLength(1);
            expect(chatB.sent[0].message.url).toBeNull();
            expect(loggedErrors.map(item => item.message)).toContain(LINK_TEXT);
        });

        it("a link service that rejects is caught, logged once, and the websocket already went out", async () => {
            const { notify, connections, tenantId, sends, chatB } = await setup({
                link: new ThrowingLinkService()
            });
            connections.connect("user-anna", tenantId, "conn-anna");

            await expect(
                notify({ stepId: "editorial", recipients: [ANNA] })
            ).resolves.toBeUndefined();

            expect(sends.sent).toHaveLength(1);
            expect(chatB.sent).toEqual([]);
            expect(loggedErrors.map(item => item.message)).toEqual([TRANSPORT_TEXT]);
        });

        it("a failing mailer behind the e-mail transport is logged by the transport and the websocket still went out", async () => {
            const { notify, mailer, connections, tenantId, sends } = await setup();
            connections.connect("user-anna", tenantId, "conn-anna");
            mailer.failOn = [0];
            mailer.failureMessage = `SMTP refused anna@webiny.test ${SECRET}.`;

            await expect(
                notify({ review: createMailReview(), stepId: "legal", recipients: [ANNA] })
            ).resolves.toBeUndefined();

            expect(sends.sent).toHaveLength(1);
            expect(mailer.sent).toHaveLength(1);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe("Could not send a workflow notification e-mail.");
            expect(JSON.stringify(loggedErrors)).not.toContain(SECRET);
            expect(JSON.stringify(loggedErrors)).not.toContain("anna@webiny.test");
        });

        it("a throwing mailer behind the e-mail transport resolves", async () => {
            const { notify, mailer } = await setup();
            mailer.throwOn = [0];

            await expect(
                notify({ review: createMailReview(), stepId: "legal" })
            ).resolves.toBeUndefined();

            expect(loggedErrors.map(item => item.message)).toEqual([
                "Could not send a workflow notification e-mail."
            ]);
        });
    });

    describe("raw error text never reaches a message (R146 mirror, Review Focus 4)", () => {
        it("a failing mailer, websocket, lookup and transport leave the secret in no sent message", async () => {
            const { notify, connections, tenantId, sends, chat, chatB, mailer } = await setup();
            connections.connect("user-anna", tenantId, "conn-anna");
            connections.connect("user-bob", tenantId, "conn-bob");
            sends.mode = "throw";
            sends.onlyFor = "conn-anna";
            sends.failureMessage = `The send crashed ${SECRET}.`;
            chat.mode = "throw";
            chat.failureMessage = `The transport crashed ${SECRET}.`;
            mailer.failOn = [0];
            mailer.failureMessage = `SMTP refused ${SECRET}.`;

            await notify({ stepId: "legal" });
            await notify({ review: createMailReview(), stepId: "legal" });

            const sentTexts = JSON.stringify([sends.sent, chat.sent, chatB.sent, mailer.sent]);
            expect(sentTexts).not.toContain(SECRET);
            expect(loggedErrors.length).toBeGreaterThan(0);
        });

        it("the websocket error message is in the log, the lookup and transport messages are not (R196)", async () => {
            const { notify, connections, tenantId, sends, chat } = await setup();
            connections.connect("user-anna", tenantId, "conn-anna");
            sends.mode = "throw";
            sends.failureMessage = `The send crashed ${SECRET}.`;
            chat.mode = "throw";
            chat.failureMessage = `The transport crashed ${SECRET}.`;

            await notify({ stepId: "legal", recipients: [ANNA] });

            const websocketLogs = loggedErrors.filter(item => item.message === WEBSOCKET_TEXT);
            const transportLogs = loggedErrors.filter(item => item.message === TRANSPORT_TEXT);
            expect(JSON.stringify(websocketLogs)).toContain(SECRET);
            expect(JSON.stringify(transportLogs)).not.toContain(SECRET);
        });
    });

    describe("fan-out (R197, A65, Review Focus 9)", () => {
        it("sends 25 frames with at most 10 connection lists and 10 sends in flight", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            const recipients: NotificationRecipientService.Recipient[] = Array.from(
                { length: 25 },
                (_, index) => ({
                    id: `user-${index}`,
                    displayName: `User ${index}`
                })
            );
            for (const recipient of recipients) {
                connections.connect(recipient.id, tenantId, `conn-${recipient.id}`);
            }
            connections.holdMs = 5;
            sends.holdMs = 5;

            await notify({ stepId: "plain", recipients });

            expect(sends.sent).toHaveLength(25);
            expect(new Set(sends.sent.map(frame => frame.connections[0].connectionId)).size).toBe(
                25
            );
            expect(connections.maxInFlight).toBe(10);
            expect(sends.maxInFlight).toBe(10);
        });
    });
});
