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
                    },
                    {
                        name: "GSI3",
                        keySchemas: [
                            {
                                attributeName: "GSI3_PK",
                                keyType: "HASH"
                            },
                            {
                                attributeName: "GSI3_SK",
                                keyType: "RANGE"
                            }
                        ],
                        projectionType: "ALL"
                    },
                    {
                        name: "GSI4",
                        keySchemas: [
                            {
                                attributeName: "GSI4_PK",
                                keyType: "HASH"
                            },
                            {
                                attributeName: "GSI4_SK",
                                keyType: "RANGE"
                            }
                        ],
                        projectionType: "ALL"
                    },
                    {
                        name: "GSI5",
                        keySchemas: [
                            {
                                attributeName: "GSI5_PK",
                                keyType: "HASH"
                            },
                            {
                                attributeName: "GSI5_SK",
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
