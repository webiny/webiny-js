import { createCmsExtension } from "@webiny/api-headless-cms";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { createIdentity, createPermissions } from "./helpers";
import { createRawEventHandler, createRawHandler } from "@webiny/handler-aws";
import type { LambdaContext } from "@webiny/handler-aws/types";
import type { Context } from "~tests/types";
import type { PluginCollection } from "@webiny/plugins/types";
import { createBackgroundTaskContext, createBackgroundTaskGraphQL } from "~/api/index";
import { createMockTaskServicePlugin } from "~tests/mocks/taskTriggerTransportPlugin";
import { createApiCore } from "@webiny/api-core";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";

export interface UseHandlerParams {
    plugins?: PluginCollection;
}

export const useRawHandler = <C extends Context = Context>(params?: UseHandlerParams) => {
    const { plugins = [] } = params || {};
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const handler = createRawHandler<any, C>({
        plugins: [
            apiCoreStorage.storageOperations,
            createApiCore(),
            ...cmsStorage.plugins,
            ...createTenancyAndSecurity({
                setupGraphQL: false,
                permissions: createPermissions(),
                identity: createIdentity()
            }),
            createCmsExtension(),
            graphQLHandlerPlugins(),
            createBackgroundTaskContext(),
            createBackgroundTaskGraphQL(),
            createRawEventHandler(async ({ context }) => {
                return context;
            }),
            createMockTaskServicePlugin(),
            ...plugins
        ]
    });

    return {
        handle: async (payload?: Record<string, any>) => {
            const headers = {
                ["x-tenant"]: "root",
                ...(payload?.headers || {})
            };
            return await handler(
                {
                    ...payload,
                    headers
                },
                {} as LambdaContext
            );
        }
    };
};
