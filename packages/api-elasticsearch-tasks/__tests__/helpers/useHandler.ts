import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { createIdentity, createPermissions } from "./helpers";
import { createRawEventHandler, createRawHandler } from "@webiny/handler-aws";
import type { PluginCollection } from "@webiny/plugins/types";
import { createBackgroundTaskContext } from "@webiny/tasks";
import { createHandler } from "@webiny/tasks/handler";
import type { ITaskEvent } from "@webiny/tasks/handler/types";
import type { LambdaContext } from "@webiny/handler-aws/types";
import type { Context } from "~/types";
import { createElasticsearchBackgroundTasks } from "~/index";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { createLogger } from "@webiny/api-log";
import type { TenancyStorageOperations } from "@webiny/api-core/types/tenancy.js";
import type { SecurityStorageOperations } from "@webiny/api-core/types/security.js";
import type { AdminUsersStorageOperations } from "@webiny/api-core/types/users.js";
import { createApiCore } from "@webiny/api-core";

export interface UseHandlerParams {
    plugins?: PluginCollection;
}

export const useHandler = (params?: UseHandlerParams) => {
    const { plugins: initialPlugins = [] } = params || {};
    const tenancyStorage = getStorageOps<TenancyStorageOperations>("tenancy");
    const securityStorage = getStorageOps<SecurityStorageOperations>("security");
    const adminUsersStorage = getStorageOps<AdminUsersStorageOperations>("adminUsers");
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
                tenancyStorageOperations: tenancyStorage.storageOperations,
                securityStorageOperations: securityStorage.storageOperations,
                usersStorageOperations: adminUsersStorage.storageOperations
            }),
            ...cmsStorage.plugins,
            ...createTenancyAndSecurity({
                setupGraphQL: false,
                permissions: createPermissions(),
                identity: createIdentity()
            }),
            createLogger({
                documentClient
            }),
            createHeadlessCmsContext({
                storageOperations: cmsStorage.storageOperations
            }),
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
