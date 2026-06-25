import { createRegisterExtensionPlugin } from "@webiny/handler/plugins/RegisterExtensionPlugin.js";
import { ApiCoreFeature } from "./ApiCoreFeature.js";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types.js";
import { createWcpContext } from "~/legacy/wcp/context.js";
import { createSecurityContext } from "~/legacy/security/createSecurityContext.js";
import { createAdminUsersContext } from "~/legacy/users/createAdminUsersContext.js";
import { createTenancyContext } from "~/legacy/tenancy/createTenancyContext.js";
import { createSystemGraphQL } from "~/graphql/system/createSystemGraphQL.js";

export interface ApiCoreConfig {
    testProjectLicense?: DecryptedWcpProjectLicense;
}

export const createApiCore = (config: ApiCoreConfig) => {
    const plugin = createRegisterExtensionPlugin(context => {
        ApiCoreFeature.register(context.container);
    });
    plugin.name = "apiCore.extension";

    return [
        plugin,
        createWcpContext({ testProjectLicense: config.testProjectLicense }),
        createTenancyContext(),
        createSecurityContext(),
        createAdminUsersContext(),
        createSystemGraphQL()
    ];
};
