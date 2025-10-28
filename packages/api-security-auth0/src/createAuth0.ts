import type { AuthenticatorConfig } from "~/createAuthenticator.js";
import { createAuthenticator } from "~/createAuthenticator.js";
import { createIdentityType } from "~/createIdentityType.js";
import { extendTenancy } from "./extendTenancy.js";
import type { Context } from "~/types.js";
import { createContextPlugin } from "@webiny/handler/Context.js";
import { ExternalIdpUserSyncFeature } from "@webiny/api-core/features/ExternalIdpUserSync";
import type { GroupsTeamsAuthorizerConfig } from "@webiny/api-core/features/security/utils/createGroupsTeamsAuthorizer/listPermissionsFromGroupsAndTeams.js";
import { createGroupsTeamsAuthorizer } from "@webiny/api-core/features/security/utils/createGroupsTeamsAuthorizer.js";

export interface CreateAuth0Config<TContext extends Context = Context>
    extends AuthenticatorConfig,
        GroupsTeamsAuthorizerConfig<TContext> {
    graphQLIdentityType?: string;
}

export const createAuth0 = <TContext extends Context = Context>(
    config: CreateAuth0Config<TContext>
) => {
    const identityType = config.identityType || "admin";
    const graphQLIdentityType = config.graphQLIdentityType || "Auth0Identity";

    return [
        createAuthenticator({
            domain: config.domain,
            getIdentity: config.getIdentity
        }),
        createGroupsTeamsAuthorizer<TContext>({
            identityType,
            inheritGroupsFromParentTenant: config.inheritGroupsFromParentTenant,
            canAccessTenant: config.canAccessTenant
        }),
        createIdentityType({
            identityType,
            name: graphQLIdentityType
        }),
        extendTenancy(),
        createContextPlugin(context => {
            ExternalIdpUserSyncFeature.register(context.container);
        })
    ];
};
