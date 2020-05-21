import { createHandler } from "@webiny/handler";
import headlessCmsHandler from "@webiny/api-headless-cms/handler";
import dbProxy from "@webiny/api-plugin-commodo-db-proxy";
import securityServicePlugins from "@webiny/api-security/plugins/service";
import i18nServicePlugins from "@webiny/api-i18n/plugins/service";
import dataManagerPlugins from "@webiny/api-headless-cms/dataManager/client";

export const handler = createHandler(
    dbProxy({ functionName: process.env.DB_PROXY_FUNCTION }),
    securityServicePlugins({
        token: {
            expiresIn: process.env.JWT_TOKEN_EXPIRES_IN,
            secret: process.env.JWT_TOKEN_SECRET
        },
        validateAccessTokenFunction: process.env.VALIDATE_ACCESS_TOKEN_FUNCTION
    }),
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
    dataManagerPlugins({ dataManagerFunction: process.env.CMS_DATA_MANAGER_FUNCTION })
);
