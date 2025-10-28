import { createContextPlugin } from "@webiny/handler";
import { type ApiCoreFeatureConfig, ApiCoreFeature } from "./ApiCoreFeature.js";
import { WcpContext } from "@webiny/api-wcp/features/WcpContext/index.js";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types.js";
import { createWcpContext } from "~/legacy/wcp/context.js";
import { createSecurityContext } from "~/legacy/security/createSecurityContext.js";
import { createAdminUsersContext } from "~/legacy/users/createAdminUsersContext.js";
import { createTenancyContext } from "~/legacy/tenancy/createTenancyContext.js";

export interface ApiCoreConfig extends ApiCoreFeatureConfig {
    testProjectLicense?: DecryptedWcpProjectLicense;
}

export const createApiCore = (config: ApiCoreConfig) => {
    return [
        createContextPlugin(context => {
            // Register ALL core features
            ApiCoreFeature.register(context.container, config);

            // Setup graphql and legacy contexts
            const wcp = context.container.resolve(WcpContext);
            const teams = wcp.canUseTeams();

            createWcpContext({ testProjectLicense: config.testProjectLicense });
            createTenancyContext(),
            createSecurityContext({ teams });
            createAdminUsersContext({ teams });
        })
    ];
};
