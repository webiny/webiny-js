import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import {
    WebsocketsListConnectionsUseCase,
    WebsocketsSendToConnectionsUseCase
} from "@webiny/api-websockets/exports/api.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { registerFaultyTenantContext, tenantFault } from "~tests/__helpers/FaultyTenantContext.js";
import { FakeWebsocketConnections } from "~tests/__helpers/FakeWebsocketConnections.js";
import { RecordingWebsocketsSend } from "~tests/__helpers/RecordingWebsocketsSend.js";
import { RecordingReviewWebsocketSender } from "~tests/__helpers/RecordingReviewWebsocketSender.js";
import { createChangeReview } from "~tests/__helpers/changeNotificationReviews.js";
import { WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION } from "~/features/notifications/shared/constants.js";
import type { WorkflowReviewChangedKind } from "~/domain/notifications/types.js";
import { ReviewChangeNotifierService } from "~/features/notifications/ReviewChangeNotifierService/index.js";
import { ReviewChangeNotifierServiceFeature } from "~/features/notifications/ReviewChangeNotifierService/feature.js";
import { ReviewWebsocketSender } from "~/features/notifications/ReviewWebsocketSender/index.js";
import { ReviewWebsocketSenderFeature } from "~/features/notifications/ReviewWebsocketSender/feature.js";

const SECRET = "SECRET-TOKEN-4711";
const WEBSOCKET_TEXT = "Could not send a workflow websocket notification.";
const ANNA = "user-anna";
const BOB = "user-bob";

const KINDS: WorkflowReviewChangedKind[] = [
    "requested",
    "stepStarted",
    "stepApproved",
    "stepRestarted"
];

interface SetupParams {
    sender?: ReviewWebsocketSender.Interface;
}

const setup = async (params: SetupParams = {}) => {
    const connections = new FakeWebsocketConnections();
    const sends = new RecordingWebsocketsSend();
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            registerFaultyTenantContext(container);
            container.registerInstance(WebsocketsListConnectionsUseCase, connections);
            container.registerInstance(WebsocketsSendToConnectionsUseCase, sends);
            ReviewWebsocketSenderFeature.register(container);
            ReviewChangeNotifierServiceFeature.register(container);
            if (params.sender) {
                container.registerInstance(ReviewWebsocketSender, params.sender);
            }
        }
    });
    const notifier = context.container.resolve(ReviewChangeNotifierService);
    const tenantId = context.container.resolve(TenantContext).getTenant().id;

    return {
        connections,
        sends,
        tenantId,
        notify: (overrides: Partial<ReviewChangeNotifierService.Params> = {}): Promise<void> => {
            return notifier.notify({
                review: createChangeReview(),
                stepId: "legal",
                kind: "stepStarted",
                recipientIds: [ANNA],
                ...overrides
            });
        }
    };
};

describe("ReviewChangeNotifierService (R253, R254, D149)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
        tenantFault.mode = "none";
    });

    afterEach(() => {
        tenantFault.mode = "none";
    });

    describe("the frame (R253)", () => {
        it("sends one frame with the change action and exactly the six ids-and-namespace fields", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna");

            await notify();

            expect(sends.sent).toEqual([
                {
                    connections: [{ connectionId: "conn-anna", endpoint: "wss://websockets.test" }],
                    message: {
                        action: WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION,
                        data: {
                            kind: "stepStarted",
                            reviewId: "review-1",
                            stepId: "legal",
                            namespace: "cms.article",
                            targetId: "article-1",
                            targetRevisionId: "article-1#0001"
                        }
                    }
                }
            ]);
            expect(Object.keys(sends.sent[0].message.data ?? {}).sort()).toEqual([
                "kind",
                "namespace",
                "reviewId",
                "stepId",
                "targetId",
                "targetRevisionId"
            ]);
        });

        it("carries no title, no body and no event: ids and namespace only (R200)", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna");

            await notify();

            const keys = Object.keys(sends.sent[0].message.data ?? {});
            expect(keys).not.toContain("title");
            expect(keys).not.toContain("body");
            expect(keys).not.toContain("event");
        });

        it("carries a null step id", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna");

            await notify({ stepId: null });

            expect(sends.sent[0].message.data).toMatchObject({ stepId: null });
        });

        it.each(KINDS)("carries the kind %s", async kind => {
            const { notify, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna");

            await notify({ kind });

            expect(sends.sent[0].message.data).toMatchObject({ kind });
        });
    });

    describe("what it hands the sender (R255)", () => {
        it("calls the sender once with the kind as the event, the recipient ids, the change action and the frame data", async () => {
            const sender = new RecordingReviewWebsocketSender();
            const { notify } = await setup({ sender });

            await notify({ kind: "stepRestarted", recipientIds: [ANNA, BOB] });

            expect(sender.calls).toEqual([
                {
                    reviewId: "review-1",
                    event: "stepRestarted",
                    recipientIds: [ANNA, BOB],
                    action: WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION,
                    data: {
                        kind: "stepRestarted",
                        reviewId: "review-1",
                        stepId: "legal",
                        namespace: "cms.article",
                        targetId: "article-1",
                        targetRevisionId: "article-1#0001"
                    }
                }
            ]);
        });

        it("does not call the sender without recipients", async () => {
            const sender = new RecordingReviewWebsocketSender();
            const { notify } = await setup({ sender });

            await notify({ recipientIds: [] });

            expect(sender.calls).toEqual([]);
        });
    });

    describe("recipients and tenant (R254, D149)", () => {
        it("sends only to the recipients, one frame each", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections
                .connect(ANNA, tenantId, "conn-anna")
                .connect(BOB, tenantId, "conn-bob")
                .connect("user-dan", tenantId, "conn-dan");

            await notify({ recipientIds: [ANNA, BOB] });

            const frames = sends.sent
                .map(frame => frame.connections.map(item => item.connectionId))
                .sort((a, b) => a[0].localeCompare(b[0]));
            expect(frames).toEqual([["conn-anna"], ["conn-bob"]]);
        });

        it("sends nothing to the same user connected only in another tenant, and logs nothing", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections
                .connect(ANNA, "another-tenant", "conn-other-tenant")
                .connect(BOB, tenantId, "conn-bob");

            await notify({ recipientIds: [ANNA, BOB] });

            expect(sends.sent.map(frame => frame.connections[0].connectionId)).toEqual([
                "conn-bob"
            ]);
            expect(loggedErrors).toEqual([]);
        });

        it("makes no connection call without recipients", async () => {
            const { notify, connections, sends } = await setup();

            await notify({ recipientIds: [] });

            expect(connections.calls).toEqual([]);
            expect(sends.sent).toEqual([]);
        });

        it("sends nothing and logs once when there is no current tenant", async () => {
            const { notify, connections, sends } = await setup();
            connections.connect(ANNA, "root", "conn-anna");
            tenantFault.mode = "missing";

            await expect(notify({ recipientIds: [ANNA, BOB] })).resolves.toBeUndefined();

            expect(sends.sent).toEqual([]);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(WEBSOCKET_TEXT);
            expect(loggedErrors[0].fields).toEqual({
                reviewId: "review-1",
                event: "stepStarted"
            });
        });
    });

    describe("failures never reject (R87, R196)", () => {
        it("a throwing connection list is logged once and the other recipient still gets the frame", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna").connect(BOB, tenantId, "conn-bob");
            connections.mode = "throw";
            connections.onlyFor = ANNA;
            connections.failureMessage = `The list crashed ${SECRET}.`;

            await expect(notify({ recipientIds: [ANNA, BOB] })).resolves.toBeUndefined();

            expect(sends.sent.map(frame => frame.connections[0].connectionId)).toEqual([
                "conn-bob"
            ]);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(WEBSOCKET_TEXT);
            expect(loggedErrors[0].fields).toMatchObject({
                reviewId: "review-1",
                event: "stepStarted",
                recipientId: ANNA
            });
        });

        it("a failed send is logged once with the error code and name", async () => {
            const { notify, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna");
            sends.mode = "fail";

            await expect(notify()).resolves.toBeUndefined();

            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(WEBSOCKET_TEXT);
            expect(loggedErrors[0].fields).toMatchObject({
                errorCode: "Websocket/Service",
                errorName: "Error",
                recipientId: ANNA
            });
        });

        it("a sender that rejects is logged once with code and name only, never the message", async () => {
            const sender = new RecordingReviewWebsocketSender();
            sender.mode = "throw";
            const { notify } = await setup({ sender });

            await expect(notify({ kind: "requested" })).resolves.toBeUndefined();

            expect(loggedErrors).toEqual([
                {
                    message: WEBSOCKET_TEXT,
                    fields: { errorName: "Error", reviewId: "review-1", event: "requested" }
                }
            ]);
        });
    });
});
