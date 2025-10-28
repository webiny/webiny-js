import { ContextPlugin } from "@webiny/api";
import type { Config as CognitoConfig, TokenData } from "@webiny/api-cognito-authenticator";
import { createAuthenticator } from "@webiny/api-cognito-authenticator";
import adminUsersGqlPlugins from "./graphql/user.gql.js";
import { AdminUserInstallerFeature } from "~/features/AdminUserInstaller/feature.js";
import { UpdateUserPermissions } from "~/features/UpdateUserPermissions/feature.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import type { SecurityIdentity, SecurityPermission } from "@webiny/api-core/types/security.js";
import {
    createGroupsTeamsAuthorizerHandler
} from "@webiny/api-core/features/security/utils/createGroupsTeamsAuthorizer.js";
import { ExternalIdpUserSyncFeature } from "@webiny/api-core/features/ExternalIdpUserSync";

interface GetIdentityParams<TContext, TToken, TIdentity> {
    identity: TIdentity;
    identityType: string;
    token: TToken;
    context: TContext;
}

interface GetPermissionsParams<TContext> {
    context: TContext;
}

interface Config<TContext, TToken, TIdentity> extends CognitoConfig {
    identityType: string;

    getIdentity?(params: GetIdentityParams<TContext, TToken, TIdentity>): TIdentity;

    getPermissions?(params: GetPermissionsParams<TContext>): Promise<SecurityPermission[] | null>;
}

export interface CognitoTokenData extends TokenData {
    given_name: string;
    family_name: string;
    email: string;
    "custom:id": string;

    [key: string]: any;
}

export const createCognito = <
    TContext extends ApiCoreContext = ApiCoreContext,
    TToken extends CognitoTokenData = CognitoTokenData,
    TIdentity extends SecurityIdentity = SecurityIdentity
>(
    config: Config<TContext, TToken, TIdentity>
) => {
    const cognitoAuthenticator = createAuthenticator({
        region: config.region,
        userPoolId: config.userPoolId
    });

    const { getIdentity, getPermissions } = config;
    const isAdminIdentity = config.identityType === "admin";

    return [
        new ContextPlugin<TContext>(context => {
            // Register event handlers for "admin" users
            if (isAdminIdentity) {
                UpdateUserPermissions.register(context.container);
            }

            // Register admin user installer
            AdminUserInstallerFeature.register(context.container);

            context.security.addAuthenticator(async token => {
                const tokenObj = await cognitoAuthenticator<TToken>(token);
                if (!tokenObj) {
                    return null;
                }

                let identity = {
                    id: tokenObj["custom:id"] || tokenObj.sub,
                    type: config.identityType,
                    displayName: `${tokenObj.given_name} ${tokenObj.family_name}`,
                    email: tokenObj.email,
                    firstName: tokenObj.given_name,
                    lastName: tokenObj.family_name
                } as unknown as TIdentity;

                if (getIdentity) {
                    identity = getIdentity({
                        identity,
                        identityType: config.identityType,
                        token: tokenObj,
                        context
                    });
                }

                const federatedIdentity = Boolean(tokenObj.identities);
                if (!federatedIdentity) {
                    return identity;
                }

                // With federated identities, teams and roles are loaded
                // from identity objects and not from tenant links.
                const authorizer = createGroupsTeamsAuthorizerHandler(config, context);
                context.security.addAuthorizer(authorizer);

                // With federated identities, we also want an Admin user entry to be created
                // on Webiny's end. This is how other external IdP integrations work too, for
                // example Okta or Auth0. This way we get to track distinct users in a Webiny
                // instance, which WCP can then utilize in order to track active users.
                ExternalIdpUserSyncFeature.register(context.container);

                return identity;
            });

            if (getPermissions) {
                context.security.addAuthorizer(async () => {
                    return getPermissions({ context });
                });
            }

            const teams = context.wcp.canUseTeams();
            context.plugins.register(adminUsersGqlPlugins({ teams }));
        })
    ];
};
