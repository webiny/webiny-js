import { createRegisterExtensionPlugin } from "@webiny/handler/plugins/RegisterExtensionPlugin.js";
import { ApiCoreFeature } from "./ApiCoreFeature.js";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types.js";
import { createWcpContext } from "~/legacy/wcp/context.js";
import { createSecurityContext } from "~/legacy/security/createSecurityContext.js";
import { createAdminUsersContext } from "~/legacy/users/createAdminUsersContext.js";
import { createTenancyContext } from "~/legacy/tenancy/createTenancyContext.js";
import { createSystemGraphQL } from "~/graphql/system/createSystemGraphQL.js";
import type { ApiCoreStorageOperations } from "~/types/core.js";

export interface ApiCoreConfig {
    storageOperations: ApiCoreStorageOperations;
    testProjectLicense?: DecryptedWcpProjectLicense;
}

// TODO: delete — legacy factory used only in __tests__/. Production uses ApiCoreFeature directly.
export const createApiCore = (config: ApiCoreConfig) => {
    return [
        createRegisterExtensionPlugin(context => {
            ApiCoreFeature.register(context.container, config.storageOperations);
        }),
        createWcpContext({ testProjectLicense: config.testProjectLicense }),
        createTenancyContext(),
        createSecurityContext(),
        createAdminUsersContext(),
        createSystemGraphQL()
    ];
};
