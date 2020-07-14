import { createHandler } from "@webiny/handler";
import apolloServerPlugins from "@webiny/handler-apollo-server";
import dbProxy from "@webiny/api-plugin-commodo-db-proxy";
import settingsManagerPlugins from "@webiny/api-settings-manager/client";
import securityPlugins from "@webiny/api-security/plugins";
import cognitoPlugins from "@webiny/api-plugin-security-cognito";

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
    securityAuthenticationPlugins(), // context da
    securityAuthJwtPlugins({ // ovdje je has-scope plugin + authN
        secret: JWT_TOKEN_SIGN_SECRET
    }),
    securityAuthPatPlugins({ // ovdje je has-scope plugin + authN
        secret: JWT_TOKEN_SIGN_SECRET
    }),
    securityAuthAccessTokensPlugins({ // ovdje je has-scope plugin + authN
        secret: JWT_TOKEN_SIGN_SECRET
    }),
    cognitoPlugins({
        region: process.env.COGNITO_REGION,
        userPoolId: process.env.COGNITO_USER_POOL_ID
    })
);


