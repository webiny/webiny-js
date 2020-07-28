import { createHandler } from "@webiny/handler";
import apolloServerPlugins from "@webiny/handler-apollo-server";
import dbProxy from "@webiny/api-plugin-commodo-db-proxy";
import settingsManagerPlugins from "@webiny/api-settings-manager/client";
import cognitoPlugins from "@webiny/api-plugin-security-cognito";
import securityPlugins from "@webiny/api-security/plugins";
import securityAuthPlugins from "@webiny/api-security/plugins/auth";
import securityAuthJwtPlugins from "@webiny/api-security/plugins/auth/jwt";
import securityAuthPatPlugins from "@webiny/api-security/plugins/auth/pat";

export const handler = createHandler(
    apolloServerPlugins({
        debug: process.env.DEBUG,
        server: {
            introspection: process.env.GRAPHQL_INTROSPECTION,
            playground: process.env.GRAPHQL_PLAYGROUND
        }
    }),
    dbProxy({ functionName: process.env.DB_PROXY_FUNCTION }),
    settingsManagerPlugins({ functionName: process.env.SETTINGS_MANAGER_FUNCTION }),
    securityPlugins(),
    securityAuthPlugins(),
    securityAuthJwtPlugins({
        expiresIn: process.env.JWT_TOKEN_EXPIRES_IN,
        secret: process.env.JWT_TOKEN_SECRET
    }),
    securityAuthPatPlugins({
        validateAccessTokenFunction: process.env.VALIDATE_ACCESS_TOKEN_FUNCTION
    }),
    cognitoPlugins({
        region: process.env.COGNITO_REGION,
        userPoolId: process.env.COGNITO_USER_POOL_ID
    })
);


