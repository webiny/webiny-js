import { createHandler } from "~/handler";
import { createWcpContext } from "@webiny/api-wcp";
import { createTenancyAndSecurity } from "~tests/helpers/tenancySecurity";
import { createDummyLocales, createIdentity, createPermissions } from "~tests/helpers/helpers";
import i18nContext from "@webiny/api-i18n/graphql/context";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { createBackgroundTaskContext } from "~/context";
import { createRawEventHandler } from "@webiny/handler-aws";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { PluginCollection } from "@webiny/plugins/types";
import { LambdaContext } from "@webiny/handler-aws/types";
import { ITaskRawEvent } from "~/handler/types";
import { createMockTaskServicePlugin } from "~tests/mocks/taskTriggerTransportPlugin";

export interface UseTaskHandlerParams {
    plugins?: PluginCollection;
}

export const useTaskHandler = (params?: UseTaskHandlerParams) => {
    const { plugins = [] } = params || {};
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");
    const i18nStorage = getStorageOps<any[]>("i18n");

    const handler = createHandler({
        plugins: [
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
            createBackgroundTaskContext(),
            createRawEventHandler(async ({ context }) => {
                return context;
            }),
            createMockTaskServicePlugin(),
            ...plugins
        ]
    });

    return {
        handle: async (payload: ITaskRawEvent) => {
            return await handler(payload, {} as LambdaContext);
        }
    };
};
