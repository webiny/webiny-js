import { createHandler } from "@webiny/handler";
import headlessCmsHandler from "@webiny/api-headless-cms/content";
import dbProxy from "@webiny/api-plugin-commodo-db-proxy";
import i18nServicePlugins from "@webiny/api-i18n/plugins/service";
import dataManagerPlugins from "@webiny/api-headless-cms/dataManager/client";
import settingsManagerPlugins from "@webiny/api-settings-manager/client";
import securityAuthPlugins from "@webiny/api-security/plugins/auth";
import securityAuthJwtPlugins from "@webiny/api-security/plugins/auth/jwt";
import securityAuthPatPlugins from "@webiny/api-security/plugins/auth/pat";

export const handler = createHandler(
    dbProxy({ functionName: process.env.DB_PROXY_FUNCTION }),
    settingsManagerPlugins({ functionName: process.env.SETTINGS_MANAGER_FUNCTION }),
    i18nServicePlugins({
        localesFunction: process.env.I18N_LOCALES_FUNCTION
    }),
    headlessCmsHandler({
        debug: process.env.DEBUG,
        server: {
            introspection: process.env.GRAPHQL_INTROSPECTION,
            playground: process.env.GRAPHQL_PLAYGROUND
        }
    }),
    securityAuthPlugins(),
    securityAuthJwtPlugins({
        expiresIn: process.env.JWT_TOKEN_EXPIRES_IN,
        secret: process.env.JWT_TOKEN_SECRET
    }),
    securityAuthPatPlugins({
        validateAccessTokenFunction: process.env.VALIDATE_ACCESS_TOKEN_FUNCTION
    }),
    dataManagerPlugins({ dataManagerFunction: process.env.CMS_DATA_MANAGER_FUNCTION })
);
