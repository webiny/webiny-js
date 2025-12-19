import path from "path";
import * as aws from "@pulumi/aws";
import type { PulumiApp, PulumiAppModule } from "@webiny/pulumi";
import { createAppModule } from "@webiny/pulumi";
import { createLambdaRoleWithoutVpc } from "../lambdaUtils.js";
import { LAMBDA_RUNTIME } from "~/pulumi/constants.js";
import { createSyncSystemResolverLambdaPolicy } from "./lambda/createSyncSystemResolverLambdaPolicy.js";
import { createSyncResourceName } from "./createSyncResourceName.js";
import { createAssetArchive } from "~/pulumi/utils/createAssetArchive.js";
import { SyncSystemSQS } from "./SyncSystemSQS.js";
import { SyncSystemDynamoDb } from "~/pulumi/apps/syncSystem/SyncSystemDynamoDb.js";
import { SyncSystemWorkerLambda } from "~/pulumi/apps/syncSystem/SyncSystemWorkerLambda.js";

export type SyncSystemResolverLambda = PulumiAppModule<typeof SyncSystemResolverLambda>;

export const SyncSystemResolverLambda = createAppModule({
    name: "SyncSystemResolverLambda",
    config(app: PulumiApp) {
        const { sqsQueue } = app.getModule(SyncSystemSQS);
        const dynamoDb = app.getModule(SyncSystemDynamoDb);

        const { lambda: workerLambda } = app.getModule(SyncSystemWorkerLambda);

        const roleName = createSyncResourceName("resolver-lambda-role");
        const policy = createSyncSystemResolverLambdaPolicy({
            name: `${roleName}-policy`,
            app
        });
        const role = createLambdaRoleWithoutVpc(app, {
            name: roleName,
            policy: policy.output
        });

        const lambda = app.addResource(aws.lambda.Function, {
            name: createSyncResourceName("resolver-lambda"),
            config: {
                runtime: LAMBDA_RUNTIME,
                handler: "handler.handler",
                role: role.output.arn,
                timeout: 900,
                memorySize: 512,
                code: createAssetArchive(path.join(app.paths.workspace, "resolver/build")),
                environment: {
                    variables: {
                        DB_TABLE: dynamoDb.output.name,
                        AWS_SYNC_WORKER_LAMBDA_ARN: workerLambda.output.arn,
                        DEBUG: String(process.env.DEBUG),
                        PULUMI_APPS: "true",
                        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1"
                    }
                },
                loggingConfig: {
                    logFormat: "JSON"
                }
            }
        });

        const eventSourceMapping = app.addResource(aws.lambda.EventSourceMapping, {
            name: createSyncResourceName("sqs-to-resolver-lambda"),
            config: {
                enabled: true,
                eventSourceArn: sqsQueue.output.arn,
                functionName: lambda.output.arn,
                batchSize: 1
                // maximumBatchingWindowInSeconds: 2
            }
        });

        return {
            role,
            policy,
            lambda,
            eventSourceMapping
        };
    }
});
