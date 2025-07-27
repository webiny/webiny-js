import { createEventHandler as createSQSEventHandler } from "@webiny/handler-aws/sqs";
import { createResolverApp } from "./app/ResolverApplication.js";
import { convertException } from "@webiny/utils";
import { createRecordHandler } from "./app/RecordHandler.js";
import { createFetcher } from "~/resolver/app/fetcher/Fetcher.js";
import { createDeploymentsFetcher } from "~/resolver/deployment/DeploymentsFetcher.js";
import { WebinyError } from "@webiny/error/index.js";
import type {
    DynamoDBClientConfig,
    DynamoDBDocument
} from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createBundler } from "~/resolver/app/bundler/Bundler.js";
import { createBundles } from "~/resolver/app/bundler/Bundles.js";
import { createCommandBundle } from "~/resolver/app/bundler/CommandBundle.js";
import { createTableBundle } from "~/resolver/app/bundler/TableBundle.js";
import { TransformHandler } from "~/resolver/app/transform/TransformHandler.js";
import type { Reply as FastifyReply } from "@webiny/handler/types.js";
import { SQSEventHandler } from "@webiny/handler-aws/sqs/plugins/SQSEventHandler.js";
import { createStorer } from "./app/storer/Storer.js";
import { StorerAfterEachPlugin } from "./plugins/StorerAfterEachPlugin.js";
import { SourceDataContainer } from "~/resolver/app/data/SourceDataContainer.js";

export interface ICreateEventHandlerPluginParams {
    tableName: string | undefined;
    createDocumentClient: (params: DynamoDBClientConfig) => Pick<DynamoDBDocument, "send">;
}
/**
 * TODO maybe add logger?
 */
export const createEventHandlerPlugin = (params: ICreateEventHandlerPluginParams) => {
    const { createDocumentClient, tableName } = params;

    const plugin = createSQSEventHandler(
        async ({ event, context, reply }): Promise<FastifyReply> => {
            if (!tableName) {
                throw new WebinyError({
                    message: "Table name variable is not set."
                });
            }
            try {
                const fetcher = createFetcher({
                    maxRetries: 10,
                    retryDelay: 1000,
                    createDocumentClient: deployment => {
                        return createDocumentClient({
                            region: deployment.region
                        });
                    }
                });

                const deploymentsFetcher = createDeploymentsFetcher({
                    client: createDocumentClient({
                        region: process.env.AWS_REGION
                    }),
                    table: tableName
                });
                /**
                 * Fetch all possible deployments, out of which we will filter out the deployment that the records came from.
                 */
                const deployments = await deploymentsFetcher.fetch();

                const storerAfterEachPlugins = context.plugins.byType<StorerAfterEachPlugin>(
                    StorerAfterEachPlugin.type
                );

                const storer = createStorer({
                    createDocumentClient: deployment => {
                        return createDocumentClient({
                            region: deployment.region
                        });
                    },
                    afterEach: async params => {
                        for (const plugin of storerAfterEachPlugins) {
                            if (!plugin.canHandle(params)) {
                                continue;
                            }
                            await plugin.handle(params);
                        }
                    }
                });

                const transformHandler = new TransformHandler({
                    plugins: context.plugins
                });

                const recordHandler = createRecordHandler({
                    plugins: context.plugins,
                    fetcher,
                    storer,
                    deployments,
                    transformHandler,
                    commandBundler: createBundler({
                        createBundles: () => {
                            return createBundles({
                                createBundle: createCommandBundle
                            });
                        }
                    }),
                    tableBundler: createBundler({
                        createBundles: () => {
                            return createBundles({
                                createBundle: createTableBundle
                            });
                        }
                    }),
                    createSourceDataContainer: () => {
                        return SourceDataContainer.create();
                    }
                });
                const app = createResolverApp({
                    recordHandler,
                    deployments
                });

                await app.resolve({
                    records: event.Records
                });
                return reply.send({
                    ok: true
                });
            } catch (ex) {
                const error = convertException(ex);
                console.error(error);
                return reply.send({
                    error
                });
            }
        }
    );

    plugin.name = `${SQSEventHandler.type}.syncResolver`;

    return plugin;
};
