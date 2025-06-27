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

export type AllowedResolverPlugins = TransformRecordPlugin | CommandHandlerPlugin;

export interface ICreateResolverHandlerParams extends HandlerParams {
    plugins: AllowedResolverPlugins[];
    createDocumentClient: (params: DynamoDBClientConfig) => DynamoDBDocument;
    tableName?: string;
}
/**
 * Handler for the Sync System Resolver - based on SQS handler.
 */
export const createResolverHandler = (params: ICreateResolverHandlerParams): HandlerCallable => {
    const plugins = new PluginsContainer([
        // TODO move into related packages
        createFileManagerPlugins(),
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
