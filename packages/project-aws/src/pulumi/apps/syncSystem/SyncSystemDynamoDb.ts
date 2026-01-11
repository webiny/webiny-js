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
                        hashKey: "GSI1_PK",
                        rangeKey: "GSI1_SK",
                        projectionType: "ALL"
                    },
                    {
                        name: "GSI2",
                        hashKey: "GSI2_PK",
                        rangeKey: "GSI2_SK",
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
