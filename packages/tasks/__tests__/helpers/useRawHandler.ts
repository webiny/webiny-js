import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { createIdentity, createPermissions } from "./helpers";
import { createRawEventHandler, createRawHandler } from "@webiny/handler-aws";
import type { LambdaContext } from "@webiny/handler-aws/types";
import type { Context } from "~tests/types";
import type { PluginCollection } from "@webiny/plugins/types";
import { createBackgroundTaskContext } from "~/index";
import { createMockTaskServicePlugin } from "~tests/mocks/taskTriggerTransportPlugin";
import { createApiCore } from "@webiny/api-core";
import { TenancyStorageOperations } from "@webiny/api-core/types/tenancy";
import { SecurityStorageOperations } from "@webiny/api-core/types/security";
import type { AdminUsersStorageOperations } from "@webiny/api-core/types/users.js";

export interface UseHandlerParams {
    plugins?: PluginCollection;
}

export const useRawHandler = <C extends Context = Context>(params?: UseHandlerParams) => {
    const { plugins = [] } = params || {};
    const tenancyStorage = getStorageOps<TenancyStorageOperations>("tenancy");
    const securityStorage = getStorageOps<SecurityStorageOperations>("security");
    const adminUsersStorage = getStorageOps<AdminUsersStorageOperations>("adminUsers");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const handler = createRawHandler<any, C>({
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
