import { createHandler } from "@webiny/handler";
import apolloServerPlugins from "@webiny/handler-apollo-server";
import dbProxyPlugins from "@webiny/api-plugin-commodo-db-proxy";
import settingsManagerPlugins from "@webiny/api-settings-manager/client";
import filesPlugins from "@webiny/api-files/plugins";
import filesResolvers from "@webiny/api-plugin-files-resolvers-mongodb";
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
    dbProxyPlugins({ functionName: process.env.DB_PROXY_FUNCTION }),
    settingsManagerPlugins({ functionName: process.env.SETTINGS_MANAGER_FUNCTION }),
    securityAuthPlugins(),
    securityAuthJwtPlugins({
        expiresIn: process.env.JWT_TOKEN_EXPIRES_IN,
        secret: process.env.JWT_TOKEN_SECRET
    }),
    securityAuthPatPlugins({
        validateAccessTokenFunction: process.env.VALIDATE_ACCESS_TOKEN_FUNCTION
    }),
    filesPlugins(),
    filesResolvers()
);
