import { createHandler } from "@webiny/handler";
import apolloServerPlugins from "@webiny/handler-apollo-server";
import dbProxy from "@webiny/api-plugin-commodo-db-proxy";
import headlessCmsPlugins from "@webiny/api-headless-cms/plugins";
import dataManagerPlugins from "@webiny/api-headless-cms/dataManager/client";
import settingsManagerPlugins from "@webiny/api-settings-manager/client";
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
    securityAuthPlugins(),
    securityAuthJwtPlugins({
        expiresIn: process.env.JWT_TOKEN_EXPIRES_IN,
        secret: process.env.JWT_TOKEN_SECRET
    }),
    securityAuthPatPlugins({
        validateAccessTokenFunction: process.env.VALIDATE_ACCESS_TOKEN_FUNCTION
    }),
    headlessCmsPlugins(),
    dataManagerPlugins({ dataManagerFunction: process.env.CMS_DATA_MANAGER_FUNCTION })
);
