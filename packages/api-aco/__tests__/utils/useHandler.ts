import { createApiCore } from "@webiny/api-core";
import createGraphQLHandler from "@webiny/handler-graphql";
import { createEventHandler, createHandler } from "@webiny/handler-aws/raw";
import type { AcoContext } from "~/types";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { createAco } from "~/index";
import type { Plugin, PluginCollection } from "@webiny/plugins/types";
import { createIdentity } from "./identity";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import {
    SecurityPermission,
    type SecurityStorageOperations
} from "@webiny/api-core/types/security.js";
import type { TenancyStorageOperations } from "@webiny/api-core/types/tenancy.js";
import type { AdminUsersStorageOperations } from "@webiny/api-core/types/users.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";

export interface UseHandlerParams {
    permissions?: SecurityPermission[];
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
}

export const useHandler = (params: UseHandlerParams = {}) => {
    const documentClient = getDocumentClient();
    const { permissions, plugins = [] } = params;

    const tenancyStorage = getStorageOps<TenancyStorageOperations>("tenancy");
    const securityStorage = getStorageOps<SecurityStorageOperations>("security");
    const adminUsersStorage = getStorageOps<AdminUsersStorageOperations>("adminUsers");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const testProjectLicense = createTestWcpLicense();

    const handler = createHandler<any, AcoContext>({
        plugins: [
            createApiCore({
                tenancyStorageOperations: tenancyStorage.storageOperations,
                securityStorageOperations: securityStorage.storageOperations,
                usersStorageOperations: adminUsersStorage.storageOperations,
                testProjectLicense
            }),
            ...cmsStorage.plugins,
            createGraphQLHandler(),
            ...createTenancyAndSecurity({ permissions, identity: createIdentity() }),
            createHeadlessCmsContext({
                storageOperations: cmsStorage.storageOperations
            }),
            createHeadlessCmsGraphQL(),
            createAco({ documentClient }),
            createEventHandler<any, AcoContext, AcoContext>(async ({ context }) => {
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
