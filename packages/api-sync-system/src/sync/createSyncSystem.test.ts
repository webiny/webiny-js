import { createSyncSystem } from "~/index.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { ServiceDiscovery } from "@webiny/api";
import { createMockSystem } from "~tests/mocks/system.js";
import { createMockEventBridgeClient } from "~tests/mocks/eventBridgeClient.js";

describe("createSyncSystem", () => {
    let client: DynamoDBDocument;
    beforeEach(() => {
        client = getDocumentClient({});
        ServiceDiscovery.setDocumentClient(client);
        ServiceDiscovery.clear();
    });

    it("should create an empty sync system plugins array", () => {
        const error = jest.fn();

        console.error = error;

        const syncSystem = createSyncSystem({
            system: {
                env: undefined,
                version: undefined,
                region: undefined,
                variant: undefined
            },
            getDocumentClient: () => client,
            getEventBridgeClient: () => {
                return createMockEventBridgeClient();
            }
        });

        expect(syncSystem.plugins()).toHaveLength(0);

        expect(error).toHaveBeenCalledTimes(1);
        expect(error).toHaveBeenCalledWith(
            "Sync System: No environment variable provided. Sync System will not be attached."
        );
    });

    it("should create a sync system plugins", async () => {
        const syncSystem = createSyncSystem({
            system: createMockSystem(),
            getDocumentClient: () => client,
            getEventBridgeClient: () => {
                return createMockEventBridgeClient();
            }
        });

        expect(syncSystem.plugins()).toHaveLength(1);
    });
});
