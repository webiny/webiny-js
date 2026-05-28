import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { createIdentity, createPermissions } from "./helpers";
import { createRawEventHandler, createRawHandler } from "@webiny/handler-aws";
import type { PluginCollection } from "@webiny/plugins/types";
import { createBackgroundTaskContext } from "@webiny/background-tasks/api";
import { createHandler } from "@webiny/background-tasks/api/handler";
import type { ITaskEvent } from "@webiny/background-tasks/api/handler/types";
import type { LambdaContext } from "@webiny/handler-aws/types";
import type { Context } from "~/types";
import { createElasticsearchBackgroundTasks } from "~/index";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { createApiCore } from "@webiny/api-core";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";

export interface UseHandlerParams {
    plugins?: PluginCollection;
}

export const useHandler = (params?: UseHandlerParams) => {
    const { plugins: initialPlugins = [] } = params || {};
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const documentClient = getDocumentClient();

    const plugins = [
        [
            dbPlugins({
                table: process.env.DB_TABLE,
                driver: new DynamoDbDriver({
                    documentClient
                })
            }),
            createApiCore({
                storageOperations: apiCoreStorage.storageOperations
            }),
            ...cmsStorage.plugins,
            ...createTenancyAndSecurity({
                setupGraphQL: false,
                permissions: createPermissions(),
                identity: createIdentity()
            }),
            createHeadlessCmsContext(),
            createHeadlessCmsGraphQL(),
            graphQLHandlerPlugins(),
            ...createBackgroundTaskContext(),
            createRawEventHandler(async ({ context }) => {
                return context;
            }),
            ...createElasticsearchBackgroundTasks({
                documentClient: getDocumentClient()
            }),
            ...initialPlugins
        ]
    ];

    const handle = createHandler({
        plugins
    });

    const rawHandler = createRawHandler<any, Context>({
        plugins
    });

    return {
        handle: (event: ITaskEvent, context?: Partial<LambdaContext>) => {
            return handle(event, {
                getRemainingTimeInMillis: () => 1000000,
                ...context
            } as LambdaContext);
        },
        rawHandle: async () => {
            return await rawHandler({}, {} as LambdaContext);
        }
    };
};
