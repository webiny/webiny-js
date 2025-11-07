import { ContextPlugin } from "@webiny/api";
import type { ApiCoreContext } from "~/types/core.js";
import { GroupsProvider, TeamsProvider } from "~/features/security/shared/abstractions.js";
import { SecurityRolePlugin } from "~/legacy/security/plugins/SecurityRolePlugin.js";
import { SecurityTeamPlugin } from "~/legacy/security/plugins/SecurityTeamPlugin.js";
import { LegacyContext } from "~/legacy/security/LegacyContext.js";
import { createSecurityGraphQL } from "~/graphql/security/index.js";
import { WcpContext } from "~/features/wcp/WcpContext/index.js";

export const createSecurityContext = () => {
    return new ContextPlugin<ApiCoreContext>(async context => {
        const wcp = context.container.resolve(WcpContext);
        const teams = wcp.canUseTeams();

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

        // Create a legacy context that delegates to new features
        context.security = new LegacyContext(context.container);

        // Register GraphQL plugins
        context.plugins.register(createSecurityGraphQL({ teams }));
    });
};
