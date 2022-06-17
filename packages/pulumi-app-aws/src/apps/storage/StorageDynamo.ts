import * as aws from "@pulumi/aws";
import { createAppModule, PulumiApp, PulumiAppModule } from "@webiny/pulumi-app";

export type StorageDynamo = PulumiAppModule<typeof StorageDynamo>;

export const StorageDynamo = createAppModule({
    name: "DynamoDb",
    config(app: PulumiApp, params: { protect: boolean }) {
        return app.addResource(aws.dynamodb.Table, {
            name: "webiny",
            config: {
                attributes: [
                    { name: "PK", type: "S" },
                    { name: "SK", type: "S" },
                    { name: "GSI1_PK", type: "S" },
                    { name: "GSI1_SK", type: "S" }
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
                    }
                ]
            },
            opts: {
                protect: params.protect
            }
        });
    }
});
