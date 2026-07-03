import { SqsEventHandler } from "@webiny/event-handler-aws/abstractions/handlers/SqsEventHandler.js";
import type { SqsResult } from "@webiny/event-handler-aws/abstractions/handlers/SqsEventHandler.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import type { SQSEvent } from "@webiny/aws-sdk/types/index.js";
import { PluginsContainer } from "@webiny/plugins";
import { WebinyError } from "@webiny/error";
import { convertException } from "@webiny/utils";
import { SyncResolverConfig } from "./SyncResolverConfig.js";
import type { ISyncResolverConfig } from "./SyncResolverConfig.js";
import { createFetcher } from "~/resolver/app/fetcher/Fetcher.js";
import { createDeploymentsFetcher } from "~/resolver/deployment/DeploymentsFetcher.js";
import { createStorer } from "~/resolver/app/storer/Storer.js";
import { TransformHandler } from "~/resolver/app/transform/TransformHandler.js";
import { createRecordHandler } from "~/resolver/app/RecordHandler.js";
import { createResolverApp } from "~/resolver/app/ResolverApplication.js";
import { createBundler } from "~/resolver/app/bundler/Bundler.js";
import { createBundles } from "~/resolver/app/bundler/Bundles.js";
import { createCommandBundle } from "~/resolver/app/bundler/CommandBundle.js";
import { createTableBundle } from "~/resolver/app/bundler/TableBundle.js";
import { SourceDataContainer } from "~/resolver/app/data/SourceDataContainer.js";
import { StorerAfterEachPlugin } from "~/resolver/plugins/StorerAfterEachPlugin.js";
import { createFileManagerPlugins } from "~/resolver/recordTypes/fileManager/fileManager.js";
import { LambdaTrigger } from "~/resolver/lambda/LambdaTrigger.js";
import { CopyFile } from "~/resolver/recordTypes/fileManager/CopyFile.js";
import { DeleteFile } from "~/resolver/recordTypes/fileManager/DeleteFile.js";
import { createUsersPlugins } from "~/resolver/recordTypes/users/users.js";
import { CopyUser } from "~/resolver/recordTypes/users/CopyUser.js";
import { DeleteUser } from "~/resolver/recordTypes/users/DeleteUser.js";
import { createPutCommandHandlerPlugin } from "~/resolver/app/commandHandler/put.js";
import { createDeleteCommandHandlerPlugin } from "~/resolver/app/commandHandler/delete.js";
import type {
    ICopyFileLambdaPayload,
    IDeleteFileLambdaPayload,
    ICopyUserLambdaPayload,
    IDeleteUserLambdaPayload
} from "~/types.js";

async function processResolverEvent(
    records: SQSEvent["Records"],
    config: ISyncResolverConfig,
    plugins: PluginsContainer
): Promise<void> {
    const tableName = config.tableName || process.env.DB_TABLE;
    if (!tableName) {
        throw new WebinyError({ message: "Table name variable is not set." });
    }

    const fetcher = createFetcher({
        maxRetries: 10,
        retryDelay: 1000,
        createDocumentClient: deployment =>
            config.createDocumentClient({ region: deployment.region })
    });

    const deploymentsFetcher = createDeploymentsFetcher({
        client: config.createDocumentClient({ region: process.env.AWS_REGION }),
        table: tableName
    });

    const deployments = await deploymentsFetcher.fetch();

    const storerAfterEachPlugins = plugins.byType<StorerAfterEachPlugin>(
        StorerAfterEachPlugin.type
    );

    const storer = createStorer({
        createDocumentClient: deployment =>
            config.createDocumentClient({ region: deployment.region }),
        afterEach: async params => {
            for (const plugin of storerAfterEachPlugins) {
                if (!plugin.canHandle(params)) {
                    continue;
                }
                await plugin.handle(params);
            }
        }
    });

    const transformHandler = new TransformHandler({ plugins });
    const recordHandler = createRecordHandler({
        plugins,
        fetcher,
        storer,
        deployments,
        transformHandler,
        commandBundler: createBundler({
            createBundles: () => createBundles({ createBundle: createCommandBundle })
        }),
        tableBundler: createBundler({
            createBundles: () => createBundles({ createBundle: createTableBundle })
        }),
        createSourceDataContainer: () => SourceDataContainer.create()
    });

    const app = createResolverApp({ recordHandler, deployments });
    await app.resolve({ records });
}

class SyncResolverLambdaHandlerImpl implements SqsEventHandler.Interface {
    constructor(private config: ISyncResolverConfig) {}

    async execute(eventCtx: EventContext<SQSEvent>, _next: NextFunction): Promise<SqsResult> {
        const { createLambdaClient, createS3Client, createCognitoIdentityProviderClient } =
            this.config;

        const awsWorkerLambdaArn =
            this.config.awsWorkerLambdaArn || process.env.AWS_SYNC_WORKER_LAMBDA_ARN;

        const copyFileTrigger =
            createLambdaClient && awsWorkerLambdaArn
                ? new LambdaTrigger<ICopyFileLambdaPayload>({
                      arn: awsWorkerLambdaArn,
                      createLambdaClient
                  })
                : undefined;

        const deleteFileTrigger =
            createLambdaClient && awsWorkerLambdaArn
                ? new LambdaTrigger<IDeleteFileLambdaPayload>({
                      arn: awsWorkerLambdaArn,
                      createLambdaClient
                  })
                : undefined;

        const copyUserTrigger =
            createLambdaClient && awsWorkerLambdaArn
                ? new LambdaTrigger<ICopyUserLambdaPayload>({
                      arn: awsWorkerLambdaArn,
                      createLambdaClient
                  })
                : undefined;

        const deleteUserTrigger =
            createLambdaClient && awsWorkerLambdaArn
                ? new LambdaTrigger<IDeleteUserLambdaPayload>({
                      arn: awsWorkerLambdaArn,
                      createLambdaClient
                  })
                : undefined;

        const copyFile =
            createS3Client && copyFileTrigger
                ? new CopyFile({
                      createS3Client,
                      getLambdaTrigger: () => copyFileTrigger
                  })
                : undefined;

        const deleteFile =
            createS3Client && deleteFileTrigger
                ? new DeleteFile({
                      createS3Client,
                      getLambdaTrigger: () => deleteFileTrigger
                  })
                : undefined;

        const copyUser =
            createCognitoIdentityProviderClient && copyUserTrigger
                ? new CopyUser({
                      createCognitoIdentityProviderClient,
                      getLambdaTrigger: () => copyUserTrigger
                  })
                : undefined;

        const deleteUser =
            createCognitoIdentityProviderClient && deleteUserTrigger
                ? new DeleteUser({
                      createCognitoIdentityProviderClient,
                      getLambdaTrigger: () => deleteUserTrigger
                  })
                : undefined;

        const plugins = new PluginsContainer([
            ...(copyFile && deleteFile ? createFileManagerPlugins({ copyFile, deleteFile }) : []),
            ...(copyUser && deleteUser ? createUsersPlugins({ copyUser, deleteUser }) : []),
            createPutCommandHandlerPlugin(),
            createDeleteCommandHandlerPlugin(),
            ...(this.config.plugins || [])
        ]);

        try {
            await processResolverEvent(eventCtx.event.Records, this.config, plugins);
            return { success: true };
        } catch (ex) {
            const error = convertException(ex);
            console.error(error);
            return { success: false, message: error.message };
        }
    }
}

export const SyncResolverLambdaHandler = SqsEventHandler.createImplementation({
    implementation: SyncResolverLambdaHandlerImpl,
    dependencies: [SyncResolverConfig]
});
