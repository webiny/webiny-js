import type { HandlerCallable, HandlerParams } from "@webiny/handler-aws/sqs";
import { createHandler as createSQSHandler } from "@webiny/handler-aws/sqs";
import { PluginsContainer } from "@webiny/plugins";
import { createEventHandlerPlugin } from "./createEventHandlerPlugin.js";
import type { TransformRecordPlugin } from "~/resolver/plugins/TransformRecordPlugin.js";
import type { CommandHandlerPlugin } from "~/resolver/plugins/CommandHandlerPlugin.js";
import { createPutCommandHandlerPlugin } from "~/resolver/app/commandHandler/put.js";
import { createDeleteCommandHandlerPlugin } from "~/resolver/app/commandHandler/delete.js";
import type {
    DynamoDBClientConfig,
    DynamoDBDocument
} from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createFileManagerPlugins } from "~/resolver/fileManager/fileManager.js";
import { LambdaTrigger } from "~/resolver/app/lambda/LambdaTrigger.js";
import type { LambdaClient } from "@webiny/aws-sdk/client-lambda/index.js";
import type { S3ClientConfig } from "@webiny/aws-sdk/client-s3/index.js";
import { S3Client } from "@webiny/aws-sdk/client-s3/index.js";

export type AllowedResolverPlugins = TransformRecordPlugin | CommandHandlerPlugin;

export interface ICreateResolverHandlerParams extends HandlerParams {
    plugins: AllowedResolverPlugins[];
    createS3Client: (params: S3ClientConfig) => S3Client;
    createLambdaClient: () => LambdaClient;
    createDocumentClient: (params: DynamoDBClientConfig) => DynamoDBDocument;
    tableName?: string;
}
/**
 * Handler for the Sync System Resolver - based on SQS handler.
 */
export const createResolverHandler = (params: ICreateResolverHandlerParams): HandlerCallable => {
    const awsSyncLambdaArn = process.env.AWS_SYNC_FILE_LAMBDA_ARN;
    if (!awsSyncLambdaArn) {
        const message = `Missing "process.env.AWS_SYNC_FILE_LAMBDA_ARN".`;
        console.error(message);
        throw new Error(message);
    }

    const lambdaTrigger = new LambdaTrigger({
        arn: awsSyncLambdaArn,
        createLambdaClient: params.createLambdaClient
    });

    const plugins = new PluginsContainer([
        // TODO move into related packages
        createFileManagerPlugins({
            createS3Client: params.createS3Client,
            getLambdaTrigger: () => {
                return lambdaTrigger;
            }
        }),
        // leave here
        createEventHandlerPlugin({
            createDocumentClient: params.createDocumentClient,
            tableName: params.tableName || process.env.DB_TABLE
        }),
        createPutCommandHandlerPlugin(),
        createDeleteCommandHandlerPlugin()
    ]);

    plugins.register(params.plugins);

    return createSQSHandler({
        ...params,
        plugins
    });
};
