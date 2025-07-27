import { ServiceDiscovery } from "@webiny/api";
import { getManifest } from "~/sync/utils/manifest.js";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";

describe("manifest", () => {
    let client: DynamoDBDocument;
    beforeEach(() => {
        client = getDocumentClient({});
        ServiceDiscovery.setDocumentClient(client);
        ServiceDiscovery.clear();
    });

    it("should return error because no manifest is provided", async () => {
        const result = await getManifest({
            getDocumentClient: () => client
        });

        expect(result.data).toBeUndefined();
        expect(result.error.message).toEqual(
            "Sync System Manifest not found. Probably Sync System is not turned on."
        );
    });

    it("should return error because sync is missing in manifest", async () => {
        await client.put({
            TableName: process.env.DB_TABLE,
            Item: {
                PK: `SERVICE_MANIFEST#api#sync`,
                SK: "default",
                GSI1_PK: "SERVICE_MANIFESTS",
                GSI1_SK: `api#sync`,
                data: {
                    name: "sync",
                    manifest: {}
                }
            }
        });
        const result = await getManifest({
            getDocumentClient: () => client
        });
        expect(result.data).toBeUndefined();
        expect(result.error.message).toEqual("Validation failed.");
        expect(result.error.data).toEqual({
            invalidFields: {
                "sync.eventBusArn": {
                    code: "invalid_type",
                    data: {
                        fatal: undefined,
                        path: ["sync", "eventBusArn"]
                    },
                    message: "Required"
                },
                "sync.eventBusName": {
                    code: "invalid_type",
                    data: {
                        fatal: undefined,
                        path: ["sync", "eventBusName"]
                    },
                    message: "Required"
                },
                "sync.region": {
                    code: "invalid_type",
                    data: {
                        fatal: undefined,
                        path: ["sync", "region"]
                    },
                    message: "Required"
                }
            }
        });
    });

    it("should return manifest", async () => {
        const eventBusArn = "arn:aws:events:eu-central-1:123456789012:event-bus/sync";
        const eventBusName = "sync";
        const region = "eu-central-1";
        await client.put({
            TableName: process.env.DB_TABLE,
            Item: {
                PK: `SERVICE_MANIFEST#api#sync`,
                SK: "default",
                GSI1_PK: "SERVICE_MANIFESTS",
                GSI1_SK: `api#sync`,
                data: {
                    name: "sync",
                    manifest: {
                        eventBusArn,
                        eventBusName,
                        region
                    }
                }
            }
        });
        const result = await getManifest({
            getDocumentClient: () => client
        });

        expect(result.error).toBeUndefined();
        expect(result.data).toEqual({
            sync: {
                eventBusArn,
                eventBusName,
                region
            }
        });
    });

    it("should return error because some strange error happened on ServiceDiscovery", async () => {
        const original = ServiceDiscovery.load;

        ServiceDiscovery.load = jest.fn(() => {
            throw new Error("Some strange error.");
        });

        const result = await getManifest({
            getDocumentClient: () => client
        });

        expect(result.data).toBeUndefined();
        expect(result.error.message).toEqual("Some strange error.");
        ServiceDiscovery.load = original;
    });
});
