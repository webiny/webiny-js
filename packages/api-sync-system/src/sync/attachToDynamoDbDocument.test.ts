import { attachToDynamoDbDocument } from "~/sync/attachToDynamoDbDocument.js";
import { createHandler } from "~/sync/createHandler.js";
import { createMockSystem } from "~tests/mocks/system.js";
import { createMockManifest } from "~tests/mocks/manifest.js";
import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb/getDocumentClient.js";
import { createMockEventBridgeClient } from "~tests/mocks/eventBridgeClient.js";
import { createMockPluginsContainer } from "~tests/mocks/plugins.js";

describe("attachToDynamoDbDocument", () => {
    it("should not have attached decorator", async () => {
        const client = getDocumentClient();
        // @ts-expect-error
        expect(client.__decoratedByWebiny).toBeUndefined();

        const anotherClient = getDocumentClient();
        // @ts-expect-error
        expect(anotherClient.__decoratedByWebiny).toBeUndefined();
    });

    it("should attach a decorator to the DynamoDB DocumentClient", async () => {
        const initialClient = getDocumentClient();
        // @ts-expect-error
        expect(initialClient.__decoratedByWebiny).toBeUndefined();

        const { handler } = createHandler({
            system: createMockSystem(),
            manifest: createMockManifest(),
            commandConverters: [],
            getEventBridgeClient: () => createMockEventBridgeClient(),
            getPlugins() {
                return createMockPluginsContainer();
            }
        });

        attachToDynamoDbDocument({
            handler
        });

        const client = getDocumentClient();
        // @ts-expect-error
        expect(client.__decoratedByWebiny).toBe(true);
    });
});
