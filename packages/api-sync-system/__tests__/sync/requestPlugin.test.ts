import { beforeEach, describe, expect, it } from "vitest";
import { createSyncSystemHandlerOnRequestPlugin } from "~/sync/requestPlugin.js";
import { createMockSystem } from "~tests/mocks/system.js";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { HandlerOnRequestPlugin } from "@webiny/handler/plugins/HandlerOnRequestPlugin.js";
import { createMockContext } from "~tests/mocks/context";
import { OnRequestResponseSendPlugin } from "@webiny/handler/plugins/OnRequestResponseSendPlugin.js";
import { OnRequestTimeoutPlugin } from "@webiny/handler/plugins/OnRequestTimeoutPlugin.js";
import { createMockManifest, createMockManifestInDynamoDb } from "~tests/mocks/manifest.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { ServiceDiscovery } from "@webiny/api";
import { mockClient } from "aws-sdk-client-mock";
import {
    createEventBridgeClient,
    EventBridgeClient,
    PutEventsCommand
} from "@webiny/aws-sdk/client-eventbridge";

describe("requestPlugin", () => {
    let client: DynamoDBDocument;
    beforeEach(() => {
        client = getDocumentClient({});
        ServiceDiscovery.setDocumentClient(client);
        ServiceDiscovery.clear();
    });

    it("should not have any plugins registered if no manifest is provided", async () => {
        const mockedEventBridgeClient = mockClient(EventBridgeClient);
        mockedEventBridgeClient.on(PutEventsCommand).resolves({
            $metadata: {
                httpStatusCode: 200
            }
        });

        const result = createSyncSystemHandlerOnRequestPlugin({
            system: createMockSystem(),
            getDocumentClient: () => client,
            getEventBridgeClient: createEventBridgeClient
        });

        expect(result).toBeInstanceOf(HandlerOnRequestPlugin);

        const { context, reply, request } = createMockContext();

        await result.exec(request, reply, context);

        expect(context.plugins.byType(OnRequestResponseSendPlugin.type)).toHaveLength(0);
        expect(context.plugins.byType(OnRequestTimeoutPlugin.type)).toHaveLength(0);
    });

    it("should have registered plugins if manifest exists", async () => {
        const mockedEventBridgeClient = mockClient(EventBridgeClient);
        mockedEventBridgeClient.on(PutEventsCommand).resolves({
            $metadata: {
                httpStatusCode: 200
            }
        });
        await createMockManifestInDynamoDb({
            client,
            manifest: createMockManifest().sync
        });

        const result = createSyncSystemHandlerOnRequestPlugin({
            system: createMockSystem(),
            getDocumentClient: () => client,
            getEventBridgeClient: createEventBridgeClient
        });

        expect(result).toBeInstanceOf(HandlerOnRequestPlugin);

        const { context, reply, request } = createMockContext();

        await result.exec(request, reply, context);

        expect(context.plugins.byType(OnRequestResponseSendPlugin.type)).toHaveLength(1);
        expect(context.plugins.byType(OnRequestTimeoutPlugin.type)).toHaveLength(1);
    });
});
