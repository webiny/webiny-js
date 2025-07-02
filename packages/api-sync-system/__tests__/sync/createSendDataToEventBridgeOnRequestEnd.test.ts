import { createSendDataToEventBridgeOnRequestEnd } from "~/sync/createSendDataToEventBridgeOnRequestEnd.js";
import { createMockSyncHandler } from "~tests/mocks/syncHandler.js";
import { OnRequestResponseSendPlugin } from "@webiny/handler/plugins/OnRequestResponseSendPlugin.js";
import { OnRequestTimeoutPlugin } from "@webiny/handler/plugins/OnRequestTimeoutPlugin.js";
import { createMockEventBridgeClient } from "~tests/mocks/eventBridgeClient.js";
import { createMockPutCommand } from "~tests/mocks/putCommand.js";
import { createMockReply, createMockRequest } from "~tests/mocks/context.js";

describe("createSendDataToEventBridgeOnRequestEnd", () => {
    it("should create plugins to attach handler to request end", () => {
        const handler = createMockSyncHandler();

        const result = createSendDataToEventBridgeOnRequestEnd(handler);

        expect(result).toHaveLength(2);
        expect(result[0]).toBeInstanceOf(OnRequestResponseSendPlugin);
        expect(result[1]).toBeInstanceOf(OnRequestTimeoutPlugin);
    });

    it("should trigger flush on request end", async () => {
        const { request } = createMockRequest();
        const { reply } = createMockReply();

        const send = jest.fn();
        const client = createMockEventBridgeClient({
            send
        });
        const handler = createMockSyncHandler({
            getEventBridgeClient: () => client,
            converter: "all"
        });

        handler.add(createMockPutCommand());

        const plugins = createSendDataToEventBridgeOnRequestEnd(handler);

        const target = plugins[0];
        expect(target).toBeInstanceOf(OnRequestResponseSendPlugin);

        expect(send).not.toHaveBeenCalled();

        await target.exec(request, reply, {});

        await new Promise(resolve => setTimeout(resolve, 100));

        expect(send).toHaveBeenCalledTimes(1);
    });

    it("should trigger flush on request timeout", async () => {
        const { request } = createMockRequest();
        const { reply } = createMockReply();

        const send = jest.fn();
        const client = createMockEventBridgeClient({
            send
        });
        const handler = createMockSyncHandler({
            getEventBridgeClient: () => client,
            converter: "all"
        });

        handler.add(createMockPutCommand());

        const plugins = createSendDataToEventBridgeOnRequestEnd(handler);

        const target = plugins[1];
        expect(target).toBeInstanceOf(OnRequestTimeoutPlugin);

        expect(send).not.toHaveBeenCalled();

        await target.exec(request, reply, {});

        await new Promise(resolve => setTimeout(resolve, 100));

        expect(send).toHaveBeenCalledTimes(1);
    });

    it("should trigger flush on request end and get an unspecified error", async () => {
        const { request } = createMockRequest();
        const { reply } = createMockReply();

        const unspecifiedEventBridgeError = "Unspecified Event Bridge error.";
        const send = jest.fn(() => {
            throw new Error(unspecifiedEventBridgeError);
        });
        const client = createMockEventBridgeClient({
            send
        });
        const handler = createMockSyncHandler({
            getEventBridgeClient: () => client,
            converter: "all"
        });

        handler.add(createMockPutCommand());

        const plugins = createSendDataToEventBridgeOnRequestEnd(handler);

        const target = plugins[0];
        expect(target).toBeInstanceOf(OnRequestResponseSendPlugin);

        const logError = jest.fn();
        console.error = logError;

        expect(send).not.toHaveBeenCalled();
        try {
            await target.exec(request, reply, {});
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (ex) {
            expect(ex).toEqual("SHOULD NOT REACH!");
        }

        expect(send).toHaveBeenCalledTimes(1);
        expect(logError).toHaveBeenCalledWith(unspecifiedEventBridgeError);
    });
});
