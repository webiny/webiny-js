import { ContextPlugin } from "@webiny/handler";
import { SecurityContext, SecurityIdentity } from "@webiny/api-security/types";
import { createAuthenticator, Config as CognitoConfig } from "@webiny/api-cognito-authenticator";

export interface Config extends CognitoConfig {
    identityType: string;
    getIdentity?<TIdentity extends SecurityIdentity = SecurityIdentity>(params: {
        identityType: string;
        token: { [key: string]: any };
    }): TIdentity;
}

export default (config: Config) => {
    const cognitoAuthenticator = createAuthenticator({
        region: config.region,
        userPoolId: config.userPoolId
    });

    return new ContextPlugin<SecurityContext>(({ security }) => {
        security.addAuthenticator(async token => {
            const tokenObj = await cognitoAuthenticator(token);

            if (!tokenObj) {
                return;
            }

            if (typeof config.getIdentity === "function") {
                return config.getIdentity({ identityType: config.identityType, token: tokenObj });
            }

            return {
                id: tokenObj.sub,
                type: config.identityType,
                displayName: `${tokenObj.given_name} ${tokenObj.family_name}`,
                email: tokenObj.email,
                firstName: tokenObj.given_name,
                lastName: tokenObj.family_name
            };
        });
    });
};
