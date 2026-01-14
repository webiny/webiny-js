import { ApiCoreFeature } from "./ApiCoreFeature.js";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types.js";
import { createWcpContext } from "~/legacy/wcp/context.js";
import { createSecurityContext } from "~/legacy/security/createSecurityContext.js";
import { createAdminUsersContext } from "~/legacy/users/createAdminUsersContext.js";
import { createTenancyContext } from "~/legacy/tenancy/createTenancyContext.js";
import { createSystemGraphQL } from "~/graphql/system/createSystemGraphQL.js";
import type { ApiCoreStorageOperations } from "~/types/core.js";
import { createHandlerOnRequest } from "@webiny/handler/plugins/HandlerOnRequestPlugin.js";

export interface ApiCoreConfig {
    storageOperations: ApiCoreStorageOperations;
    testProjectLicense?: DecryptedWcpProjectLicense;
}

export const createApiCore = (config: ApiCoreConfig) => {
    return [
        createHandlerOnRequest(async (_, __, context) => {
            // Register ALL core features as early as possible.
            ApiCoreFeature.register(context.container, config.storageOperations);
        }),
        createWcpContext({ testProjectLicense: config.testProjectLicense }),
        createTenancyContext(),
        createSecurityContext(),
        createAdminUsersContext(),
        createSystemGraphQL()
    ];
};
