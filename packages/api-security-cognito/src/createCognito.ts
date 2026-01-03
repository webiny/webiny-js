import { ContextPlugin } from "@webiny/api";
import type { Config as CognitoConfig, TokenData } from "@webiny/api-cognito-authenticator";
import { createAuthenticator } from "@webiny/api-cognito-authenticator";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import type { SecurityIdentity } from "@webiny/api-core/types/security.js";
import adminUsersGqlPlugins from "./graphql/user.gql.js";
import { AdminUserInstallerFeature } from "~/features/AdminUserInstaller/feature.js";

interface GetIdentityParams<TContext, TToken, TIdentity> {
    identity: TIdentity;
    identityType: string;
    token: TToken;
    context: TContext;
}

interface Config<TContext, TToken, TIdentity> extends CognitoConfig {
    getIdentity?(params: GetIdentityParams<TContext, TToken, TIdentity>): TIdentity;
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

    const { getIdentity } = config;

    return [
        new ContextPlugin<TContext>(context => {
            // Register admin user installer
            AdminUserInstallerFeature.register(context.container);

            context.security.addAuthenticator(async token => {
                const tokenObj = await cognitoAuthenticator<TToken>(token);
                if (!tokenObj) {
                    return null;
                }

                let identity = {
                    id: tokenObj["custom:id"] || tokenObj.sub,
                    type: "admin",
                    displayName: `${tokenObj.given_name} ${tokenObj.family_name}`,
                    profile: {
                        email: tokenObj.email,
                        firstName: tokenObj.given_name,
                        lastName: tokenObj.family_name
                    }
                } as unknown as TIdentity;

                if (getIdentity) {
                    identity = getIdentity({
                        identity,
                        identityType: "admin",
                        token: tokenObj,
                        context
                    });
                }

                return identity;
            });

            const teams = context.wcp.canUseTeams();
            context.plugins.register(adminUsersGqlPlugins({ teams }));
        })
    ];
};
