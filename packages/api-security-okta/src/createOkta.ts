import { createAuthenticator, AuthenticatorConfig } from "~/createAuthenticator";
import { createGroupAuthorizer, GroupAuthorizerConfig } from "~/createGroupAuthorizer";
import { createIdentityType } from "~/createIdentityType";
import { extendTenancy } from "./extendTenancy";
import { createAdminUsersHooks } from "./createAdminUsersHooks";
import { Context } from "~/types";

export interface CreateOktaConfig<TContext extends Context = Context>
    extends AuthenticatorConfig,
        GroupAuthorizerConfig<TContext> {
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
        createGroupAuthorizer<TContext>({
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
