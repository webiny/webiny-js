import { ContextPlugin } from "@webiny/api";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import {
    createAuthenticator,
    Config as CognitoConfig,
    TokenData
} from "@webiny/api-cognito-authenticator";
import { createGroupAuthorizer } from "~/createGroupAuthorizer";
import { CoreContext } from "~/types";
import { createAdminUsersHooks } from "./createAdminUsersHooks";
import adminUsersGqlPlugins from "./graphql/user.gql";
import installGqlPlugins from "./graphql/install.gql";

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
    TContext extends CoreContext = CoreContext,
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

    return [
        new ContextPlugin<TContext>(context => {
            context.security.addAuthenticator(async token => {
                const tokenObj = await cognitoAuthenticator<TToken>(token);

                if (!tokenObj) {
                    return null;
                }

                const defaultIdentity = {
                    id: tokenObj["custom:id"] || tokenObj.sub,
                    type: config.identityType,
                    displayName: `${tokenObj.given_name} ${tokenObj.family_name}`,
                    email: tokenObj.email,
                    firstName: tokenObj.given_name,
                    lastName: tokenObj.family_name
                } as unknown as TIdentity;

                if (typeof getIdentity === "function") {
                    const customIdentity = getIdentity({
                        identity: defaultIdentity,
                        identityType: config.identityType,
                        token: tokenObj,
                        context
                    });

                    if (customIdentity.group) {
                        context.security.addAuthorizer(
                            createGroupAuthorizer(context, customIdentity.group)
                        );
                    }

                    return customIdentity;
                }

                return defaultIdentity;
            });

            if (getPermissions) {
                context.security.addAuthorizer(async () => {
                    return getPermissions({ context });
                });
            }

            const teams = context.wcp.canUseTeams();
            context.plugins.register(adminUsersGqlPlugins({ teams }));
        }),
        installGqlPlugins,
        createAdminUsersHooks()
    ];
};
