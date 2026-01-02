import { createApiCore } from "@webiny/api-core";
import createGraphQLHandler from "@webiny/handler-graphql";
import { createEventHandler, createHandler } from "@webiny/handler-aws/raw";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import { SecurityPermission } from "@webiny/api-core/types/security.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import type { ApiCoreContext, ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { createContextPlugin } from "@webiny/api";
import { InvalidateCloudfrontCacheTaskDefinition } from "@webiny/api-file-manager-s3/features/FlushCache/InvalidateCacheTask.js";
import { createTenancyAndSecurity } from "./tenancySecurity.js";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { createWebsiteBuilder } from "~/index.js";
import type { Plugin, PluginCollection } from "@webiny/plugins/types";
import { createIdentity } from "./identity.js";
import { createBackgroundTasks } from "~tests/mocks/mockBackgroundTasks.js";

export interface UseHandlerParams {
    permissions?: SecurityPermission[];
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
}

export const useHandler = (params: UseHandlerParams = {}) => {
    const { permissions, plugins = [] } = params;

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const testProjectLicense = createTestWcpLicense();

    const handler = createHandler<any, ApiCoreContext>({
        plugins: [
            createApiCore({
                storageOperations: apiCoreStorage.storageOperations,
                testProjectLicense
            }),
            ...cmsStorage.plugins,
            createGraphQLHandler(),
            ...createTenancyAndSecurity({ permissions, identity: createIdentity() }),
            createHeadlessCmsContext({
                storageOperations: cmsStorage.storageOperations
            }),
            createBackgroundTasks(),
            createHeadlessCmsGraphQL(),
            createWebsiteBuilder(),
            createContextPlugin(context => {
                context.container.register(InvalidateCloudfrontCacheTaskDefinition);
            }),
            createEventHandler<any, ApiCoreContext, ApiCoreContext>(async ({ context }) => {
                return context;
            }),
            plugins
        ]
    });

    return {
        handler: () => {
            return handler(
                {
                    headers: {
                        ["x-tenant"]: "root",
                        ["Content-Type"]: "application/json"
                    }
                } as unknown as APIGatewayEvent,
                {} as unknown as LambdaContext
            );
        }
    };
};
