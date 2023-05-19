import { ContextPlugin } from "@webiny/api";
import { SecurityContext, SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import {
    createAuthenticator,
    Config as CognitoConfig,
    TokenData
} from "@webiny/api-cognito-authenticator";

interface GetIdentityParams<TContext, TToken> {
    identityType: string;
    token: TToken;
    context: TContext;
}

interface GetPermissionsParams<TContext> {
    context: TContext;
}

interface Config<TContext, TToken, TIdentity> extends CognitoConfig {
    identityType: string;
    getIdentity?(params: GetIdentityParams<TContext, TToken>): TIdentity;
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
    TContext extends SecurityContext = SecurityContext,
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

    return new ContextPlugin<TContext>(context => {
        context.security.addAuthenticator(async token => {
            const tokenObj = await cognitoAuthenticator<TToken>(token);

            if (!tokenObj) {
                return null;
            }

            if (typeof getIdentity === "function") {
                return getIdentity({
                    identityType: config.identityType,
                    token: tokenObj,
                    context
                });
            }

            return {
                id: tokenObj["custom:id"] || tokenObj.sub,
                type: config.identityType,
                displayName: `${tokenObj.given_name} ${tokenObj.family_name}`,
                email: tokenObj.email,
                firstName: tokenObj.given_name,
                lastName: tokenObj.family_name
            };
        });

        if (getPermissions) {
            context.security.addAuthorizer(async () => {
                return getPermissions({ context });
            });
        }
    });
};

export default createCognito;
