import { createAuthenticator, AuthenticatorConfig } from "~/createAuthenticator";
import { createTenantLinksPermissionsAuthorizer, GroupAuthorizerConfig } from "~/createTenantLinksPermissionsAuthorizer";
import { createIdentityType } from "~/createIdentityType";
import { extendTenancy } from "./extendTenancy";

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
        createTenantLinksPermissionsAuthorizer({
            identityType,
            getGroupSlug: config.getGroupSlug
        }),
        createIdentityType({
            identityType,
            name: graphQLIdentityType
        }),
        extendTenancy()
    ];
};
