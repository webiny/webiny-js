import { createSendDataToEventBridgeOnRequestEnd } from "~/sync/createSendDataToEventBridgeOnRequestEnd.js";
import { createMockSyncHandler } from "~tests/mocks/syncHandler.js";
import { OnRequestResponseSendPlugin } from "@webiny/handler/plugins/OnRequestResponseSendPlugin.js";
import { OnRequestTimeoutPlugin } from "@webiny/handler/plugins/OnRequestTimeoutPlugin.js";
import { createMockPutCommand } from "~tests/mocks/putCommand.js";
import { createMockReply, createMockRequest } from "~tests/mocks/context.js";
import {
    createEventBridgeClient,
    EventBridgeClient,
    PutEventsCommand
} from "@webiny/aws-sdk/client-eventbridge/index.js";
import { mockClient } from "aws-sdk-client-mock";

describe("createSendDataToEventBridgeOnRequestEnd", () => {
    it("should create plugins to attach handler to request end", () => {
        const mockedEventBridgeClient = mockClient(EventBridgeClient);
        mockedEventBridgeClient.on(PutEventsCommand).resolves({
            $metadata: {
                httpStatusCode: 200
            }
        });

        const handler = createMockSyncHandler({
            getEventBridgeClient: createEventBridgeClient
        });

        const result = createSendDataToEventBridgeOnRequestEnd(handler);

        expect(result).toHaveLength(2);
        expect(result[0]).toBeInstanceOf(OnRequestResponseSendPlugin);
        expect(result[1]).toBeInstanceOf(OnRequestTimeoutPlugin);
    });

    it("should trigger flush on request end", async () => {
        const send = jest.fn();
        const mockedEventBridgeClient = mockClient(EventBridgeClient);
        mockedEventBridgeClient.on(PutEventsCommand).callsFake(input => {
            send(input);
            return {
                $metadata: {
                    httpStatusCode: 200
                }
            };
        });

        const { request } = createMockRequest();
        const { reply } = createMockReply();

        const handler = createMockSyncHandler({
            getEventBridgeClient: createEventBridgeClient,
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
        const send = jest.fn();
        const mockedEventBridgeClient = mockClient(EventBridgeClient);
        mockedEventBridgeClient.on(PutEventsCommand).callsFake(input => {
            send(input);
            return {
                $metadata: {
                    httpStatusCode: 200
                }
            };
        });
        const { request } = createMockRequest();
        const { reply } = createMockReply();

        const handler = createMockSyncHandler({
            getEventBridgeClient: createEventBridgeClient,
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

        const send = jest.fn();

        const mockedEventBridgeClient = mockClient(EventBridgeClient);
        mockedEventBridgeClient.on(PutEventsCommand).callsFake(input => {
            send(input);
            throw new Error(unspecifiedEventBridgeError);
        });

        const handler = createMockSyncHandler({
            getEventBridgeClient: createEventBridgeClient,
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
