import * as aws from "@pulumi/aws";
import { createAppModule, type PulumiApp, type PulumiAppModule } from "@webiny/pulumi";

export type CoreDynamo = PulumiAppModule<typeof CoreDynamo>;

export const CoreDynamo = createAppModule({
    name: "DynamoDb",
    config(app: PulumiApp, params: { protect: boolean }) {
        return app.addResource(aws.dynamodb.Table, {
            name: "webiny",
            config: {
                attributes: [
                    { name: "PK", type: "S" },
                    { name: "SK", type: "S" },
                    { name: "GSI_TENANT", type: "S" },
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
                        name: "GSI_TENANT",
                        keySchemas: [
                            {
                                attributeName: "GSI_TENANT",
                                keyType: "HASH"
                            }
                        ],
                        projectionType: "KEYS_ONLY"
                    },
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
            },
            opts: {
                protect: params.protect
            }
        });
    }
});
