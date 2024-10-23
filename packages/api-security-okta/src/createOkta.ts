import { createAuthenticator, AuthenticatorConfig } from "~/createAuthenticator";
import { createGroupsTeamsAuthorizer, GroupsTeamsAuthorizerConfig } from "@webiny/api-security";
import { createIdentityType } from "~/createIdentityType";
import { extendTenancy } from "./extendTenancy";
import { createAdminUsersHooks } from "./createAdminUsersHooks";
import { Context } from "~/types";

export interface CreateOktaConfig<TContext extends Context = Context>
    extends AuthenticatorConfig,
        GroupsTeamsAuthorizerConfig<TContext> {
    graphQLIdentityType?: string;
}

export const createOkta = <TContext extends Context = Context>(
    config: CreateOktaConfig<TContext>
) => {
    const identityType = config.identityType || "admin";
    const graphQLIdentityType = config.graphQLIdentityType || "OktaIdentity";

    return [
        createAuthenticator({
            issuer: config.issuer,
            getIdentity: config.getIdentity
        }),
        createGroupsTeamsAuthorizer<TContext>({
            identityType,
            getGroupSlug: config.getGroupSlug
        }),
        createIdentityType({
            identityType,
            name: graphQLIdentityType
        }),
        extendTenancy(),
        createAdminUsersHooks()
    ];
};
