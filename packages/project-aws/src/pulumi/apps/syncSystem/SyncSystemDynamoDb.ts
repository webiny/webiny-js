import * as aws from "@pulumi/aws";
import type { PulumiApp, PulumiAppModule } from "@webiny/pulumi";
import { createAppModule } from "@webiny/pulumi";
import { createSyncResourceName } from "~/pulumi/apps/syncSystem/createSyncResourceName.js";

export type SyncSystemDynamoDb = PulumiAppModule<typeof SyncSystemDynamoDb>;

export const SyncSystemDynamoDb = createAppModule({
    name: "SyncSystemDynamoDb",
    config(app: PulumiApp) {
        return app.addResource(aws.dynamodb.Table, {
            name: createSyncResourceName("table"),
            config: {
                attributes: [
                    { name: "PK", type: "S" },
                    { name: "SK", type: "S" },
                    { name: "GSI1_PK", type: "S" },
                    { name: "GSI1_SK", type: "S" },
                    { name: "GSI2_PK", type: "S" },
                    { name: "GSI2_SK", type: "S" }
                ],
                billingMode: "PAY_PER_REQUEST",
                hashKey: "PK",
                rangeKey: "SK",
                globalSecondaryIndexes: [
                    {
                        name: "GSI1",
                        keySchemas: [
                            {
                                attributeName: "GSI1_PK",
                                keyType: "HASH"
                            },
                            {
                                attributeName: "GSI1_SK",
                                keyType: "RANGE"
                            }
                        ],
                        projectionType: "ALL"
                    },
                    {
                        name: "GSI2",
                        keySchemas: [
                            {
                                attributeName: "GSI2_PK",
                                keyType: "HASH"
                            },
                            {
                                attributeName: "GSI2_SK",
                                keyType: "RANGE"
                            }
                        ],
                        projectionType: "ALL"
                    }
                ],
                ttl: {
                    attributeName: "expiresAt",
                    enabled: true
                }
            }
        });
    }
});
