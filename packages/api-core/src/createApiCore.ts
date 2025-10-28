import { createContextPlugin } from "@webiny/handler";
import { type ApiCoreFeatureConfig, ApiCoreFeature } from "./ApiCoreFeature.js";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types.js";
import { createWcpContext } from "~/legacy/wcp/context.js";
import { createSecurityContext } from "~/legacy/security/createSecurityContext.js";
import { createAdminUsersContext } from "~/legacy/users/createAdminUsersContext.js";
import { createTenancyContext } from "~/legacy/tenancy/createTenancyContext.js";
import { createSystemGraphQL } from "~/graphql/system/createSystemGraphQL.js";

export interface ApiCoreConfig extends ApiCoreFeatureConfig {
    testProjectLicense?: DecryptedWcpProjectLicense;
}

export const createApiCore = (config: ApiCoreConfig) => {
    return [
        createContextPlugin(context => {
            // Register ALL core features
            ApiCoreFeature.register(context.container, config);
        }),
        createWcpContext({ testProjectLicense: config.testProjectLicense }),
        createTenancyContext(),
        createSecurityContext(),
        createAdminUsersContext(),
        createSystemGraphQL()
    ];
};
