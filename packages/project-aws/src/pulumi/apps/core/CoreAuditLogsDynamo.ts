import * as aws from "@pulumi/aws";
import type { PulumiApp, PulumiAppModule } from "@webiny/pulumi";
import { createAppModule } from "@webiny/pulumi";

export type CoreAuditLogsDynamo = PulumiAppModule<typeof CoreAuditLogsDynamo>;

export const CoreAuditLogsDynamo = createAppModule({
    name: "AuditLogsDynamoDb",
    config(app: PulumiApp, params: { protect: boolean }) {
        return app.addResource(aws.dynamodb.Table, {
            name: "webiny-audit-logs",
            config: {
                attributes: [
                    { name: "PK", type: "S" },
                    { name: "SK", type: "S" },
                    { name: "GSI_TENANT", type: "S" },
                    { name: "GSI1_PK", type: "S" },
                    { name: "GSI1_SK", type: "N" },
                    { name: "GSI2_PK", type: "S" },
                    { name: "GSI2_SK", type: "N" },
                    { name: "GSI3_PK", type: "S" },
                    { name: "GSI3_SK", type: "N" },
                    { name: "GSI4_PK", type: "S" },
                    { name: "GSI4_SK", type: "N" },
                    { name: "GSI5_PK", type: "S" },
                    { name: "GSI5_SK", type: "N" },
                    { name: "GSI6_PK", type: "S" },
                    { name: "GSI6_SK", type: "N" },
                    { name: "GSI7_PK", type: "S" },
                    { name: "GSI7_SK", type: "N" },
                    { name: "GSI8_PK", type: "S" },
                    { name: "GSI8_SK", type: "N" },
                    { name: "GSI9_PK", type: "S" },
                    { name: "GSI9_SK", type: "N" }
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
                        projectionType: "KEYS_ONLY"
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
                        projectionType: "KEYS_ONLY"
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
                        projectionType: "KEYS_ONLY"
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
                        projectionType: "KEYS_ONLY"
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
                        projectionType: "KEYS_ONLY"
                    },
                    {
                        name: "GSI6",
                        keySchemas: [
                            {
                                attributeName: "GSI6_PK",
                                keyType: "HASH"
                            },
                            {
                                attributeName: "GSI6_SK",
                                keyType: "RANGE"
                            }
                        ],
                        projectionType: "KEYS_ONLY"
                    },
                    {
                        name: "GSI7",
                        keySchemas: [
                            {
                                attributeName: "GSI7_PK",
                                keyType: "HASH"
                            },
                            {
                                attributeName: "GSI7_SK",
                                keyType: "RANGE"
                            }
                        ],
                        projectionType: "KEYS_ONLY"
                    },
                    {
                        name: "GSI8",
                        keySchemas: [
                            {
                                attributeName: "GSI8_PK",
                                keyType: "HASH"
                            },
                            {
                                attributeName: "GSI8_SK",
                                keyType: "RANGE"
                            }
                        ],
                        projectionType: "KEYS_ONLY"
                    },
                    {
                        name: "GSI9",
                        keySchemas: [
                            {
                                attributeName: "GSI9_PK",
                                keyType: "HASH"
                            },
                            {
                                attributeName: "GSI9_SK",
                                keyType: "RANGE"
                            }
                        ],
                        projectionType: "KEYS_ONLY"
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
