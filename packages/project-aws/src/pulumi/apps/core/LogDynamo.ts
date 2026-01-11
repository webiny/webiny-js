import * as aws from "@pulumi/aws";
import { createAppModule, type PulumiApp, type PulumiAppModule } from "@webiny/pulumi";

export type LogDynamo = PulumiAppModule<typeof LogDynamo>;

export const LogDynamo = createAppModule({
    name: "DynamoDbLog",
    config(app: PulumiApp, params: { protect: boolean }) {
        return app.addResource(aws.dynamodb.Table, {
            name: "webiny-log",
            config: {
                attributes: [
                    { name: "PK", type: "S" },
                    { name: "SK", type: "S" },
                    { name: "GSI_TENANT", type: "S" },
                    { name: "GSI1_PK", type: "S" },
                    { name: "GSI1_SK", type: "S" },
                    { name: "GSI2_PK", type: "S" },
                    { name: "GSI2_SK", type: "S" },
                    { name: "GSI3_PK", type: "S" },
                    { name: "GSI3_SK", type: "S" },
                    { name: "GSI4_PK", type: "S" },
                    { name: "GSI4_SK", type: "S" },
                    { name: "GSI5_PK", type: "S" },
                    { name: "GSI5_SK", type: "S" }
                ],
                billingMode: "PAY_PER_REQUEST",
                hashKey: "PK",
                rangeKey: "SK",
                globalSecondaryIndexes: [
                    {
                        name: "GSI_TENANT",
                        hashKey: "GSI_TENANT",
                        projectionType: "KEYS_ONLY"
                    },
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
                    },
                    {
                        name: "GSI3",
                        hashKey: "GSI3_PK",
                        rangeKey: "GSI3_SK",
                        projectionType: "ALL"
                    },
                    {
                        name: "GSI4",
                        hashKey: "GSI4_PK",
                        rangeKey: "GSI4_SK",
                        projectionType: "ALL"
                    },
                    {
                        name: "GSI5",
                        hashKey: "GSI5_PK",
                        rangeKey: "GSI5_SK",
                        projectionType: "ALL"
                    }
                ],
                ttl: {
                    attributeName: "expiresAt",
                    enabled: true
                }
            },
            opts: {
                protect: params.protect
            }
        });
    }
});
