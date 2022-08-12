import { ContextPlugin } from "@webiny/handler";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { WcpContext } from "@webiny/api-wcp/types";
import {
    SecurityAuthenticationPlugin,
    SecurityAuthorizationPlugin,
    SecurityContext,
    SecurityStorageOperations
} from "./types";
import graphqlPlugins from "./graphql";
import gqlInterfaces from "./graphql/interfaces.gql";
import { createSecurity } from "~/createSecurity";
import { attachGroupInstaller } from "~/installation/groups";
import {
    applyMultiTenancyGraphQLPlugins,
    applyMultiTenancyPlugins,
    MultiTenancyAppConfig,
    MultiTenancyGraphQLConfig
} from "~/enterprise/multiTenancy";

export { default as NotAuthorizedResponse } from "./NotAuthorizedResponse";
export { default as NotAuthorizedError } from "./NotAuthorizedError";

export interface SecurityConfig extends MultiTenancyAppConfig {
    storageOperations: SecurityStorageOperations;
}

type Context = SecurityContext & TenancyContext & WcpContext;

export const createSecurityContext = ({ storageOperations, ...config }: SecurityConfig) => {
    return new ContextPlugin<Context>(async context => {
        context.plugins.register(gqlInterfaces);

        const advancedAccessControlLayer = context.wcp.canUseFeature("advancedAccessControlLayer");

        context.security = await createSecurity({
            advancedAccessControlLayer,
            getTenant: () => {
                const tenant = context.tenancy.getCurrentTenant();
                return tenant ? tenant.id : undefined;
            },
            storageOperations
        });

        attachGroupInstaller(context.security);

        // Backwards Compatibility - START
        context.plugins
            .byType<SecurityAuthenticationPlugin>("security-authentication")
            .forEach(pl => {
                context.security.addAuthenticator(() => {
                    return pl.authenticate(context);
                });
            });

        context.plugins
            .byType<SecurityAuthorizationPlugin>("security-authorization")
            .forEach(pl => {
                context.security.addAuthorizer(() => {
                    return pl.getPermissions(context);
                });
            });

        // Backwards Compatibility - END

        if (context.tenancy.isMultiTenant()) {
            applyMultiTenancyPlugins(config, context);
        }
    });
};

export const createSecurityGraphQL = (config: MultiTenancyGraphQLConfig = {}) => {
    return new ContextPlugin<Context>(context => {
        context.plugins.register(graphqlPlugins);

        if (context.tenancy.isMultiTenant()) {
            applyMultiTenancyGraphQLPlugins(config, context);
        }
    });
};
