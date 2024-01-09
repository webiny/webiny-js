import { PutCommand } from "@webiny/aws-sdk/client-dynamodb";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb";
import { ServiceDiscovery } from "~/ServiceDiscovery";

describe("Service Discovery", () => {
    it("should load service manifests and combine them into one manifest object", async () => {
        const client = getDocumentClient();

        // For testing, since we don't have a proper DI container yet, we need to inject a DB client to use.
        ServiceDiscovery.setDocumentClient(client);

        await client.send(
            new PutCommand({
                TableName: process.env.DB_TABLE,
                Item: {
                    PK: "SERVICE_MANIFEST#api#api",
                    SK: "default",
                    GSI1_PK: "SERVICE_MANIFESTS",
                    GSI1_SK: "api#api",
                    data: {
                        name: "api",
                        manifest: {
                            cloudfront: {
                                distributionId: "12345678"
                            }
                        }
                    }
                }
            })
        );

        await client.send(
            new PutCommand({
                TableName: process.env.DB_TABLE,
                Item: {
                    PK: "SERVICE_MANIFEST#core#api",
                    SK: "default",
                    GSI1_PK: "SERVICE_MANIFESTS",
                    GSI1_SK: "core#core",
                    data: {
                        name: "core",
                        manifest: {
                            bucket: {
                                name: "bucket"
                            }
                        }
                    }
                }
            })
        );

        // Assert
        const manifest = await ServiceDiscovery.load();
        expect(manifest).toEqual({
            core: {
                bucket: {
                    name: "bucket"
                }
            },
            api: {
                cloudfront: {
                    distributionId: "12345678"
                }
            }
        });
    });
});
