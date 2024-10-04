import { ContextPlugin } from "@webiny/api";
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
    MultiTenancyAppConfig,
    MultiTenancyGraphQLConfig
} from "~/enterprise/multiTenancy";
import { SecurityTeamPlugin } from "~/plugins/SecurityTeamPlugin";
import { WithGroupsFromPlugins } from "~/groups/repository/WithGroupsFromPlugins";
import { ListGroupsRepository } from "~/groups/repository/ListGroupsRepository";
import { GetGroupRepository } from "~/groups/repository/GetGroupRepository";
import { WithGroupFromPlugins } from "~/groups/repository/WithGroupFromPlugins";

export { default as NotAuthorizedResponse } from "./NotAuthorizedResponse";
export { default as NotAuthorizedError } from "./NotAuthorizedError";

export interface SecurityConfig extends MultiTenancyAppConfig {
    storageOperations: SecurityStorageOperations;
}

export * from "./utils/AppPermissions";
export * from "./utils/getPermissionsFromSecurityGroupsForLocale";
export * from "./utils/IdentityValue";

type Context = SecurityContext & TenancyContext & WcpContext;

export const createSecurityContext = ({ storageOperations }: SecurityConfig) => {
    return new ContextPlugin<Context>(async context => {
        context.plugins.register(gqlInterfaces);

        const license = context.wcp.getProjectLicense();

        const listGroupsRepository = new WithGroupsFromPlugins(
            context.plugins,
            new ListGroupsRepository(storageOperations)
        );

        const getGroupRepository = new WithGroupFromPlugins(
            context.plugins,
            new GetGroupRepository(storageOperations)
        );

        context.security = await createSecurity({
            advancedAccessControlLayer: license?.package?.features?.advancedAccessControlLayer,
            getTenant: () => {
                const tenant = context.tenancy.getCurrentTenant();
                return tenant ? tenant.id : undefined;
            },
            storageOperations,
            getGroupRepository,
            listGroupsRepository,
            teamsProvider: async () =>
                context.plugins
                    .byType<SecurityTeamPlugin>(SecurityTeamPlugin.type)
                    .map(plugin => plugin.securityTeam)
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
    });
};

export const createSecurityGraphQL = (config: MultiTenancyGraphQLConfig = {}) => {
    return new ContextPlugin<Context>(context => {
        context.plugins.register(graphqlPlugins({ teams: context.wcp.canUseTeams() }));

        if (context.tenancy.isMultiTenant()) {
            applyMultiTenancyGraphQLPlugins(config, context);
        }
    });
};

export { createSecurityRolePlugin } from "./plugins/SecurityRolePlugin";
export { createSecurityTeamPlugin } from "./plugins/SecurityTeamPlugin";
