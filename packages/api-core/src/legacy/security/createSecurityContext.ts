import { ContextPlugin } from "@webiny/api";
import type { ApiCoreContext } from "~/types/core.js";
import { RolesProvider, TeamsProvider } from "~/features/security/shared/abstractions.js";
import { SecurityRolePlugin } from "~/legacy/security/plugins/SecurityRolePlugin.js";
import { SecurityTeamPlugin } from "~/legacy/security/plugins/SecurityTeamPlugin.js";
import { LegacyContext } from "~/legacy/security/LegacyContext.js";
import { createSecurityGraphQL } from "~/graphql/security/index.js";

export const createSecurityContext = () => {
    return new ContextPlugin<ApiCoreContext>(async context => {
        // Register roles and teams providers for plugin-defined roles/teams
        context.container.registerFactory(RolesProvider, () => {
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

        // Create a legacy context that delegates to new features
        context.security = new LegacyContext(context.container);

        // Register GraphQL plugins
        context.plugins.register(createSecurityGraphQL());
    });
};
