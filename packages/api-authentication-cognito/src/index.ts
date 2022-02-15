import { AuthenticationContext, Identity } from "@webiny/api-authentication/types";
import { ContextPlugin } from "@webiny/handler";
import { createAuthenticator, Config as CognitoConfig } from "@webiny/api-cognito-authenticator";

export type GetIdentity<TIdentity extends Identity = Identity> = (params: {
    identityType: string;
    token: { [key: string]: any };
}) => TIdentity;

export interface Config extends CognitoConfig {
    identityType: string;
    getIdentity?: GetIdentity;
}

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

            // We ensure `undefined` doesn't end up in the `displayName` property.
            // If first name and last name is not present, we end up with an empty string.
            const firstName = tokenObj.given_name || "";
            const lastName = tokenObj.family_name || "";
            const displayName = `${firstName} ${lastName}`.trim();

            return {
                id: tokenObj.sub,
                type: config.identityType,
                displayName,
                email: tokenObj.email,
                firstName,
                lastName
            };
        });
    });
};
