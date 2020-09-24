import { createHandler } from "@webiny/handler";
import apolloServerPlugins from "@webiny/handler-apollo-server";
import dbProxyPlugins from "@webiny/api-plugin-commodo-db-proxy";
import settingsManagerPlugins from "@webiny/api-settings-manager/client";
import filesPlugins from "@webiny/api-file-manager/plugins";
import filesResolvers from "@webiny/api-plugin-files-resolvers-mongodb";
import securityPlugins from "@webiny/api-security/authenticator";
import permissionsManager from "@webiny/api-security-permissions-manager/client";
import cognitoAuthentication from "@webiny/api-plugin-security-cognito/authentication";

export const handler = createHandler(
    apolloServerPlugins({
        debug: process.env.DEBUG,
        server: {
            introspection: process.env.GRAPHQL_INTROSPECTION,
            playground: process.env.GRAPHQL_PLAYGROUND
        }
    }),
    dbProxyPlugins({ functionName: process.env.DB_PROXY_FUNCTION }),
    settingsManagerPlugins({ functionName: process.env.SETTINGS_MANAGER_FUNCTION }),
    // Adds a context plugin to process `security` plugins for authentication
    securityPlugins(),
    // Adds a Permissions Manager plugins for authorization
    permissionsManager({ functionName: process.env.PERMISSIONS_MANAGER_FUNCTION }),
    // Add Cognito plugins for authentication
    cognitoAuthentication({
        region: process.env.COGNITO_REGION,
        userPoolId: process.env.COGNITO_USER_POOL_ID,
        identityType: "admin"
    }),
    filesPlugins(),
    filesResolvers()
);
