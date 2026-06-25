import { createHandler } from "~/api/handler";
import { createTenancyAndSecurity } from "~tests/helpers/tenancySecurity";
import { createIdentity, createPermissions } from "~tests/helpers/helpers";
import { createCmsExtension } from "@webiny/api-headless-cms";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { createBackgroundTaskContext } from "~/api/context";
import { createRawEventHandler } from "@webiny/handler-aws";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type { PluginCollection } from "@webiny/plugins/types";
import type { LambdaContext } from "@webiny/handler-aws/types";
import type { ITaskRawEvent } from "~/api/handler/types";
import { createMockTaskServicePlugin } from "~tests/mocks/taskTriggerTransportPlugin";
import { createApiCore } from "@webiny/api-core";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";

export interface UseTaskHandlerParams {
    plugins?: PluginCollection;
}

export const useTaskHandler = (params?: UseTaskHandlerParams) => {
    const { plugins = [] } = params || {};
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const handler = createHandler({
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
