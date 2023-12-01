import { createAuthenticator, AuthenticatorConfig } from "~/createAuthenticator";
import { createGroupAuthorizer, GroupAuthorizerConfig } from "~/createGroupAuthorizer";
import { createIdentityType } from "~/createIdentityType";
import { extendTenancy } from "./extendTenancy";
import { createAdminUsersHooks } from "./createAdminUsersHooks";

export interface CreateOktaConfig extends AuthenticatorConfig, GroupAuthorizerConfig {
    graphQLIdentityType?: string;
}

export const createOkta = (config: CreateOktaConfig) => {
    const identityType = config.identityType || "admin";
    const graphQLIdentityType = config.graphQLIdentityType || "OktaIdentity";

    return [
        createAuthenticator({
            issuer: config.issuer,
            getIdentity: config.getIdentity
        }),
        createGroupAuthorizer({
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
