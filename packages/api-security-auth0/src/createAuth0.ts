import { createAuthenticator, AuthenticatorConfig } from "~/createAuthenticator";
import { createGroupsTeamsAuthorizer, GroupsTeamsAuthorizerConfig } from "@webiny/api-security";
import { createIdentityType } from "~/createIdentityType";
import { createAdminUsersHooks } from "./createAdminUsersHooks";
import { extendTenancy } from "./extendTenancy";
import { Context } from "~/types";

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
            getGroupSlug: config.getGroupSlug,
            inheritGroupsFromParentTenant: config.inheritGroupsFromParentTenant,
            canAccessTenant: config.canAccessTenant
        }),
        createIdentityType({
            identityType,
            name: graphQLIdentityType
        }),
        extendTenancy(),
        createAdminUsersHooks()
    ];
};
