import { createSyncSystem } from "~/sync/createSyncSystem.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { ServiceDiscovery } from "@webiny/api";
import { createMockSystem } from "~tests/mocks/system.js";
import {
    createEventBridgeClient,
    EventBridgeClient,
    PutEventsCommand
} from "@webiny/aws-sdk/client-eventbridge/index.js";
import { mockClient } from "aws-sdk-client-mock";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("createSyncSystem", () => {
    let client: DynamoDBDocument;
    beforeEach(() => {
        client = getDocumentClient({});
        ServiceDiscovery.setDocumentClient(client);
        ServiceDiscovery.clear();
    });

    it("should create an empty sync system plugins array", () => {
        const mockedEventBridgeClient = mockClient(EventBridgeClient);
        mockedEventBridgeClient.on(PutEventsCommand).resolves({
            $metadata: {
                httpStatusCode: 200
            }
        });

        const error = vi.fn();

        console.error = error;

        const syncSystem = createSyncSystem({
            system: {
                env: undefined,
                version: undefined,
                region: undefined,
                variant: undefined
            },
            getDocumentClient: () => client,
            getEventBridgeClient: createEventBridgeClient
        });

        expect(syncSystem.plugins()).toHaveLength(0);

        expect(error).toHaveBeenCalledTimes(1);
        expect(error).toHaveBeenCalledWith(
            "Sync System: No environment variable provided. Sync System will not be attached."
        );
    });

    it("should create a sync system plugins", async () => {
        const mockedEventBridgeClient = mockClient(EventBridgeClient);
        mockedEventBridgeClient.on(PutEventsCommand).resolves({
            $metadata: {
                httpStatusCode: 200
            }
        });

        const syncSystem = createSyncSystem({
            system: createMockSystem(),
            getDocumentClient: () => client,
            getEventBridgeClient: createEventBridgeClient
        });
        /**
         * Update the plugin number according to the plugins initially created inside the createSyncSystem function.
         */
        expect(syncSystem.plugins()).toHaveLength(2);
    });
});
