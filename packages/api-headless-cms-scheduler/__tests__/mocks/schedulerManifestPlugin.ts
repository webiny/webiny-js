import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";
import { PutCommand } from "@webiny/aws-sdk/client-dynamodb";
import type { ScheduleContext } from "~/types.js";
import { ContextPlugin } from "@webiny/api";

export const createSchedulerManifestPlugin = () => {
    return new ContextPlugin<ScheduleContext>(async context => {
        const manifest = {
            lambdaArn: "arn:aws:lambda:us-east-1:123456789012:function:my-scheduler-function",
            roleArn: "arn:aws:iam::123456789012:role/my-scheduler-role"
        };

        const client = context.db.driver.getClient() as DynamoDBDocument;

        await client.send(
            new PutCommand({
                TableName: process.env.DB_TABLE,
                Item: {
                    PK: "SERVICE_MANIFEST#api#scheduler",
                    SK: "default",
                    GSI1_PK: "SERVICE_MANIFESTS",
                    GSI1_SK: "api#scheduler",
                    data: {
                        name: "scheduler",
                        manifest
                    }
                }
            })
        );
    });
};
