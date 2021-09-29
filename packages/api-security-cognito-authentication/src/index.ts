import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { SecurityContext } from "@webiny/api-security/types";
import { authenticator, Config } from "./authenticator";
import { AuthenticationContext } from "@webiny/api-authentication/types";

type Context = SecurityContext & AuthenticationContext;

export default (config: Config) => {
    const cognitoAuthenticator = authenticator(config);

    // In real life projects, developers will have either `security` OR `authentication`, never both.
    // Adding these checks makes this Cognito authentication plugin work with both setups.
    return new ContextPlugin<Context>(({ security, authentication }) => {
        if (authentication) {
            authentication.addAuthenticator(cognitoAuthenticator);
        }

        if (security) {
            security.addAuthenticator(cognitoAuthenticator);
        }
    });
};
