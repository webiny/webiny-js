import * as aws from "@pulumi/aws";
import type { PulumiApp, PulumiAppModule } from "@webiny/pulumi";
import { createAppModule } from "@webiny/pulumi";

export type AuditLogsDynamo = PulumiAppModule<typeof AuditLogsDynamo>;

export const AuditLogsDynamo = createAppModule({
    name: "AuditLogsDynamoDb",
    config(app: PulumiApp, params: { protect: boolean }) {
        return app.addResource(aws.dynamodb.Table, {
            name: "webiny-audit-logs",
            config: {
                attributes: [
                    { name: "PK", type: "S" },
                    { name: "SK", type: "S" },
                    { name: "GSI1_PK", type: "S" },
                    { name: "GSI1_SK", type: "N" },
                    { name: "GSI2_PK", type: "S" },
                    { name: "GSI2_SK", type: "N" },
                    { name: "GSI3_PK", type: "S" },
                    { name: "GSI3_SK", type: "N" },
                    { name: "GSI4_PK", type: "S" },
                    { name: "GSI4_SK", type: "N" },
                    { name: "GSI5_PK", type: "S" },
                    { name: "GSI5_SK", type: "N" }
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
