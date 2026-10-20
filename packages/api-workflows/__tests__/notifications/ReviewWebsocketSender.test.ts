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
import {
    ReviewWebsocketSender,
    ReviewWebsocketSenderFeature
} from "~/features/notifications/ReviewWebsocketSender/index.js";

const SECRET = "SECRET-TOKEN-4711";
const WEBSOCKET_TEXT = "Could not send a workflow websocket notification.";
const ACTION = "test.action";
const EVENT = "stepStarted";
const ANNA = "user-anna";
const BOB = "user-bob";

const DATA = { reviewId: "review-1", note: "plain data" };

const setup = async () => {
    const connections = new FakeWebsocketConnections();
    const sends = new RecordingWebsocketsSend();
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            registerFaultyTenantContext(container);
            container.registerInstance(WebsocketsListConnectionsUseCase, connections);
            container.registerInstance(WebsocketsSendToConnectionsUseCase, sends);
            ReviewWebsocketSenderFeature.register(container);
        }
    });
    const sender = context.container.resolve(ReviewWebsocketSender);
    const tenantId = context.container.resolve(TenantContext).getTenant().id;

    return {
        connections,
        sends,
        tenantId,
        send: (overrides: Partial<ReviewWebsocketSender.SendParams> = {}): Promise<void> => {
            return sender.send({
                reviewId: "review-1",
                event: EVENT,
                recipientIds: [ANNA, BOB],
                action: ACTION,
                data: DATA,
                ...overrides
            });
        }
    };
};

describe("ReviewWebsocketSender (R255, D149, R188, R197)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
        tenantFault.mode = "none";
    });

    afterEach(() => {
        tenantFault.mode = "none";
    });

    describe("the frame", () => {
        it("sends one { action, data } frame to the recipient's current-tenant connection", async () => {
            const { send, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna");

            await send({ recipientIds: [ANNA] });

            expect(sends.sent).toEqual([
                {
                    connections: [{ connectionId: "conn-anna", endpoint: "wss://websockets.test" }],
                    message: { action: ACTION, data: DATA }
                }
            ]);
            expect(Object.keys(sends.sent[0].message).sort()).toEqual(["action", "data"]);
            expect(connections.calls).toEqual([{ where: { identityId: ANNA } }]);
        });

        it("sends the action and the data it is given, whatever they are", async () => {
            const { send, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna");

            await send({
                recipientIds: [ANNA],
                action: "workflows.reviewChanged",
                data: { kind: "requested", reviewId: "review-9", stepId: null }
            });

            expect(sends.sent[0].message).toEqual({
                action: "workflows.reviewChanged",
                data: { kind: "requested", reviewId: "review-9", stepId: null }
            });
        });
    });

    describe("recipients (R188)", () => {
        it("sends only to the recipients, never to other users with connections", async () => {
            const { send, connections, sends, tenantId } = await setup();
            connections
                .connect(ANNA, tenantId, "conn-anna")
                .connect(BOB, tenantId, "conn-bob")
                .connect("user-dan", tenantId, "conn-dan");

            await send({ recipientIds: [ANNA] });

            expect(
                sends.sent.map(frame => frame.connections.map(item => item.connectionId))
            ).toEqual([["conn-anna"]]);
        });

        it("sends one frame per recipient, with every connection of that recipient in the tenant", async () => {
            const { send, connections, sends, tenantId } = await setup();
            connections
                .connect(ANNA, tenantId, "anna-tab-1")
                .connect(ANNA, tenantId, "anna-tab-2")
                .connect(BOB, tenantId, "bob-tab-1");

            await send();

            // Order-independent: batches run concurrently.
            const frames = sends.sent
                .map(frame => frame.connections.map(item => item.connectionId).sort())
                .sort((a, b) => a[0].localeCompare(b[0]));
            expect(frames).toEqual([["anna-tab-1", "anna-tab-2"], ["bob-tab-1"]]);
        });

        it("sends an id listed twice once", async () => {
            const { send, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna");

            await send({ recipientIds: [ANNA, ANNA] });

            expect(sends.sent).toHaveLength(1);
            expect(connections.calls).toHaveLength(1);
        });

        it("does nothing at all without recipients, not even a tenant read", async () => {
            const { send, connections, sends } = await setup();
            tenantFault.mode = "throws";

            await expect(send({ recipientIds: [] })).resolves.toBeUndefined();

            expect(connections.calls).toEqual([]);
            expect(sends.sent).toEqual([]);
            expect(loggedErrors).toEqual([]);
        });

        it("makes no list call for an empty or missing id, and logs nothing (R188)", async () => {
            const { send, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna");
            tenantFault.mode = "throws";

            await send({ recipientIds: ["", undefined as unknown as string] });

            expect(connections.calls).toEqual([]);
            expect(sends.sent).toEqual([]);
            expect(loggedErrors).toEqual([]);
        });

        it("still sends to the ids it has when others are empty", async () => {
            const { send, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna");

            await send({ recipientIds: ["", ANNA] });

            expect(connections.calls).toEqual([{ where: { identityId: ANNA } }]);
            expect(sends.sent).toHaveLength(1);
        });
    });

    describe("tenant (R188, A63, D149)", () => {
        it("sends to the connection of the current tenant only, not to the same user in another tenant", async () => {
            const { send, connections, sends, tenantId } = await setup();
            connections
                .connect(ANNA, "another-tenant", "conn-other-tenant")
                .connect(ANNA, tenantId, "conn-this-tenant");

            await send({ recipientIds: [ANNA] });

            expect(sends.sent).toHaveLength(1);
            expect(sends.sent[0].connections).toEqual([
                { connectionId: "conn-this-tenant", endpoint: "wss://websockets.test" }
            ]);
        });

        it("sends nothing, and logs nothing, to a recipient connected only in another tenant", async () => {
            const { send, connections, sends } = await setup();
            connections.connect(ANNA, "another-tenant", "conn-other-tenant");

            await expect(send({ recipientIds: [ANNA] })).resolves.toBeUndefined();

            expect(connections.calls).toEqual([{ where: { identityId: ANNA } }]);
            expect(sends.sent).toEqual([]);
            expect(loggedErrors).toEqual([]);
        });

        it("sends nothing, and logs nothing, to a recipient with no connection", async () => {
            const { send, sends } = await setup();

            await send({ recipientIds: [ANNA] });

            expect(sends.sent).toEqual([]);
            expect(loggedErrors).toEqual([]);
        });

        it("sends nothing and logs once when there is no current tenant", async () => {
            const { send, connections, sends } = await setup();
            connections.connect(ANNA, "root", "conn-anna");
            tenantFault.mode = "missing";

            await expect(send()).resolves.toBeUndefined();

            expect(connections.calls).toEqual([]);
            expect(sends.sent).toEqual([]);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(WEBSOCKET_TEXT);
            expect(loggedErrors[0].fields).toEqual({ reviewId: "review-1", event: EVENT });
        });

        it("sends nothing and logs once when the tenant read throws", async () => {
            const { send, connections, sends } = await setup();
            connections.connect(ANNA, "root", "conn-anna");
            tenantFault.mode = "throws";

            await expect(send()).resolves.toBeUndefined();

            expect(sends.sent).toEqual([]);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(WEBSOCKET_TEXT);
            expect(loggedErrors[0].fields).toEqual({
                errorName: "Error",
                reviewId: "review-1",
                event: EVENT
            });
        });
    });

    describe("failures never reject (R87, R196)", () => {
        it("a throwing connection list for one recipient is logged once and the others still get their frame", async () => {
            const { send, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna").connect(BOB, tenantId, "conn-bob");
            connections.mode = "throw";
            connections.onlyFor = ANNA;
            connections.failureMessage = `The list crashed ${SECRET}.`;

            await expect(send()).resolves.toBeUndefined();

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
                        event: EVENT,
                        recipientId: ANNA
                    }
                }
            ]);
        });

        it("a failed connection list is logged once per recipient with the error code and name", async () => {
            const { send, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna").connect(BOB, tenantId, "conn-bob");
            connections.mode = "fail";

            await expect(send()).resolves.toBeUndefined();

            expect(sends.sent).toEqual([]);
            expect(loggedErrors.map(item => item.message)).toEqual([
                WEBSOCKET_TEXT,
                WEBSOCKET_TEXT
            ]);
            expect(loggedErrors.map(item => item.fields.recipientId)).toEqual([ANNA, BOB]);
            expect(loggedErrors[0].fields).toMatchObject({
                errorCode: "Websocket/Service",
                errorName: "Error",
                reviewId: "review-1",
                event: EVENT
            });
        });

        it("a throwing send for one recipient is logged once and the others still get their frame", async () => {
            const { send, connections, sends, tenantId } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna").connect(BOB, tenantId, "conn-bob");
            sends.mode = "throw";
            sends.onlyFor = "conn-anna";

            await expect(send()).resolves.toBeUndefined();

            expect(sends.sent.map(frame => frame.connections[0].connectionId)).toEqual([
                "conn-anna",
                "conn-bob"
            ]);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(WEBSOCKET_TEXT);
            expect(loggedErrors[0].fields).toMatchObject({ recipientId: ANNA });
        });

        it("a failed send is logged once per recipient", async () => {
            const { send, connections, tenantId, sends } = await setup();
            connections.connect(ANNA, tenantId, "conn-anna");
            sends.mode = "fail";

            await expect(send({ recipientIds: [ANNA] })).resolves.toBeUndefined();

            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(WEBSOCKET_TEXT);
            expect(loggedErrors[0].fields).toMatchObject({
                errorCode: "Websocket/Service",
                recipientId: ANNA
            });
        });
    });

    describe("fan-out (R197, A65)", () => {
        it("sends 25 frames with at most 10 connection lists and 10 sends in flight", async () => {
            const { send, connections, sends, tenantId } = await setup();
            const recipientIds = Array.from({ length: 25 }, (_, index) => `user-${index}`);
            for (const recipientId of recipientIds) {
                connections.connect(recipientId, tenantId, `conn-${recipientId}`);
            }
            connections.holdMs = 5;
            sends.holdMs = 5;

            await send({ recipientIds });

            expect(sends.sent).toHaveLength(25);
            expect(new Set(sends.sent.map(frame => frame.connections[0].connectionId)).size).toBe(
                25
            );
            expect(connections.maxInFlight).toBe(10);
            expect(sends.maxInFlight).toBe(10);
        });
    });
});
