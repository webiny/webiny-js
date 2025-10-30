import { createHandler } from "~/handler";
import { createTenancyAndSecurity } from "~tests/helpers/tenancySecurity";
import { createIdentity, createPermissions } from "~tests/helpers/helpers";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { createBackgroundTaskContext } from "~/context";
import { createRawEventHandler } from "@webiny/handler-aws";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type { PluginCollection } from "@webiny/plugins/types";
import type { LambdaContext } from "@webiny/handler-aws/types";
import type { ITaskRawEvent } from "~/handler/types";
import { createMockTaskServicePlugin } from "~tests/mocks/taskTriggerTransportPlugin";
import type { TenancyStorageOperations } from "@webiny/api-core/types/tenancy.js";
import type { SecurityStorageOperations } from "@webiny/api-core/types/security.js";
import type { AdminUsersStorageOperations } from "@webiny/api-core/types/users.js";
import { createApiCore } from "@webiny/api-core";

export interface UseTaskHandlerParams {
    plugins?: PluginCollection;
}

export const useTaskHandler = (params?: UseTaskHandlerParams) => {
    const { plugins = [] } = params || {};
    const tenancyStorage = getStorageOps<TenancyStorageOperations>("tenancy");
    const securityStorage = getStorageOps<SecurityStorageOperations>("security");
    const adminUsersStorage = getStorageOps<AdminUsersStorageOperations>("adminUsers");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const handler = createHandler({
        plugins: [
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
