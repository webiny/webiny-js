import { createAuthenticator, AuthenticatorConfig } from "~/createAuthenticator";
import { createGroupAuthorizer, GroupAuthorizerConfig } from "~/createGroupAuthorizer";
import { createIdentityType } from "~/createIdentityType";
import { createAdminUsersHooks } from "./createAdminUsersHooks";
import { extendTenancy } from "./extendTenancy";

export interface CreateAuth0Config extends AuthenticatorConfig, GroupAuthorizerConfig {
    graphQLIdentityType?: string;
}

export const createAuth0 = (config: CreateAuth0Config) => {
    const identityType = config.identityType || "admin";
    const graphQLIdentityType = config.graphQLIdentityType || "Auth0Identity";

    return [
        createAuthenticator({
            domain: config.domain,
            getIdentity: config.getIdentity
        }),
        createGroupAuthorizer({
            identityType,
            getGroupSlug: config.getGroupSlug,
            inheritGroupsFromParentTenant: config.inheritGroupsFromParentTenant
        }),
        createIdentityType({
            identityType,
            name: graphQLIdentityType
        }),
        extendTenancy(),
        createAdminUsersHooks()
    ];
};
