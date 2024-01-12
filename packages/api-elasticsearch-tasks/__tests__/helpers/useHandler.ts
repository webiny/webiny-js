import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { createWcpContext } from "@webiny/api-wcp";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { createDummyLocales, createIdentity, createPermissions } from "./helpers";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import i18nContext from "@webiny/api-i18n/graphql/context";
import { createRawEventHandler, createRawHandler } from "@webiny/handler-aws";
import { PluginCollection } from "@webiny/plugins/types";
import { createBackgroundTaskContext } from "@webiny/tasks";
import { createHandler } from "@webiny/tasks/handler";
import { ITaskEvent } from "@webiny/tasks/handler/types";
import { LambdaContext } from "@webiny/handler-aws/types";
import { Context } from "~/types";
import { createElasticsearchBackgroundTasks } from "~/index";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";

export interface UseHandlerParams {
    plugins?: PluginCollection;
}

export const useHandler = (params?: UseHandlerParams) => {
    const { plugins: initialPlugins = [] } = params || {};
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");
    const i18nStorage = getStorageOps<any[]>("i18n");

    const documentClient = getDocumentClient();
    // const elasticsearchClient = createElasticsearchClient();

    const plugins = [
        [
            dbPlugins({
                table: process.env.DB_TABLE,
                driver: new DynamoDbDriver({
                    documentClient
                })
            }),
            createWcpContext(),
            ...cmsStorage.plugins,
            ...createTenancyAndSecurity({
                setupGraphQL: false,
                permissions: createPermissions(),
                identity: createIdentity()
            }),
            i18nContext(),
            i18nStorage.storageOperations,
            createDummyLocales(),
            mockLocalesPlugins(),
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
