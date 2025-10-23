import { ContextPlugin } from "@webiny/api";
import type { TenancyContext } from "@webiny/api-tenancy/types.js";
import type { WcpContext } from "@webiny/api-wcp/types.js";
import type { SecurityContext, SecurityStorageOperations } from "./types.js";
import graphqlPlugins from "./graphql/index.js";
import gqlInterfaces from "./graphql/interfaces.gql.js";
import { createSecurity } from "~/createSecurity.js";
import type {
    MultiTenancyAppConfig,
    MultiTenancyGraphQLConfig
} from "~/enterprise/multiTenancy/index.js";
import { applyMultiTenancyGraphQLPlugins } from "~/enterprise/multiTenancy/index.js";
import { SecurityRolePlugin } from "~/plugins/SecurityRolePlugin.js";
import { SecurityTeamPlugin } from "~/plugins/SecurityTeamPlugin.js";
import { setupFeatures } from "./setupFeatures.js";
import { LegacyContext } from "./legacy/LegacyContext.js";
import { GroupsProvider, TeamsProvider } from "./features/shared/abstractions.js";

export { default as NotAuthorizedResponse } from "./NotAuthorizedResponse.js";
export { default as NotAuthorizedError } from "./NotAuthorizedError.js";

export interface SecurityConfig extends MultiTenancyAppConfig {
    storageOperations: SecurityStorageOperations;
}

export * from "./utils/AppPermissions.js";
export * from "./utils/getPermissionsFromSecurityGroupsForLocale.js";
export * from "./utils/IdentityValue.js";
export * from "./utils/createGroupsTeamsAuthorizer.js";
export { verifyJwtUsingJwk } from "./utils/verifyJwtUsingJwk.js";
export { isJwt } from "./utils/isJwt.js";

type Context = SecurityContext & TenancyContext & WcpContext;

export const createSecurityContext = ({ storageOperations }: SecurityConfig) => {
    return new ContextPlugin<Context>(async context => {
        context.plugins.register(gqlInterfaces);

        // Setup new features in DI container
        setupFeatures(context.container, storageOperations);

        // Register groups and teams providers for plugin-defined groups/teams
        context.container.registerFactory(GroupsProvider, () => {
            return async () =>
                context.plugins
                    .byType<SecurityRolePlugin>(SecurityRolePlugin.type)
                    .map(plugin => plugin.securityRole);
        });

        context.container.registerFactory(TeamsProvider, () => {
            return async () =>
                context.plugins
                    .byType<SecurityTeamPlugin>(SecurityTeamPlugin.type)
                    .map(plugin => plugin.securityTeam);
        });

        const license = context.wcp.getProjectLicense().getRawLicense();

        // Create old security context (for now, still needed for unimplemented features)
        const oldSecurity = await createSecurity({
            advancedAccessControlLayer: license?.package?.features?.advancedAccessControlLayer,
            getTenant: () => {
                const tenant = context.tenancy.getCurrentTenant();
                return tenant ? tenant.id : undefined;
            },
            storageOperations,
            groupsProvider: async () =>
                context.plugins
                    .byType<SecurityRolePlugin>(SecurityRolePlugin.type)
                    .map(plugin => plugin.securityRole),
            teamsProvider: async () =>
                context.plugins
                    .byType<SecurityTeamPlugin>(SecurityTeamPlugin.type)
                    .map(plugin => plugin.securityTeam)
        });

        // Create hybrid legacy context that delegates to new features where implemented
        // and forwards to old security for unimplemented features
        context.security = new LegacyContext(context.container, oldSecurity);
    });
};

export const createSecurityGraphQL = (config: MultiTenancyGraphQLConfig = {}) => {
    return new ContextPlugin<Context>(context => {
        context.plugins.register(graphqlPlugins({ teams: context.wcp.canUseTeams() }));

        const multiTenancy = context.wcp.canUseFeature("multiTenancy");
        if (multiTenancy) {
            applyMultiTenancyGraphQLPlugins(config, context);
        }
    });
};

export { createSecurityRolePlugin } from "./plugins/SecurityRolePlugin.js";
export { createSecurityTeamPlugin } from "./plugins/SecurityTeamPlugin.js";
