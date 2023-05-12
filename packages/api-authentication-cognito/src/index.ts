import { AuthenticationContext, Identity } from "@webiny/api-authentication/types";
import { ContextPlugin } from "@webiny/api";
import { createAuthenticator, Config as CognitoConfig } from "@webiny/api-cognito-authenticator";

export type GetIdentity<TIdentity extends Identity = Identity> = (params: {
    identityType: string;
    token: { [key: string]: any };
}) => TIdentity;

export interface Config extends CognitoConfig {
    identityType: string;
    getIdentity?: GetIdentity;
}

export const getIdentity: GetIdentity = ({ identityType, token }) => {
    // We ensure `undefined` doesn't end up in the `displayName` property.
    // If first name and last name is not present, we end up with an empty string.
    const {
        given_name = null,
        family_name = null,
        email = null,
        preferred_username = null
    } = token;

    const displayName = [given_name, family_name].filter(Boolean).join(" ").trim() || null;

    return {
        id: token["custom:id"] || token["sub"] || null,
        type: identityType,
        displayName,
        email: preferred_username || email,
        firstName: given_name,
        lastName: family_name
    };
};

export default (config: Config) => {
    const cognitoAuthenticator = createAuthenticator({
        region: config.region,
        userPoolId: config.userPoolId
    });

    return new ContextPlugin<AuthenticationContext>(({ authentication }) => {
        authentication.addAuthenticator(async token => {
            const tokenObj = await cognitoAuthenticator(token);

            if (!tokenObj) {
                return null;
            }

            if (typeof config.getIdentity === "function") {
                return config.getIdentity({ identityType: config.identityType, token: tokenObj });
            }

            return getIdentity({ identityType: config.identityType, token: tokenObj });
        });
    });
};
