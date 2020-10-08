import { createHandler } from "@webiny/handler-aws";
import headlessCmsHandler from "@webiny/api-headless-cms/content";
import dbProxy from "@webiny/api-plugin-commodo-db-proxy";
import i18nServicePlugins from "@webiny/api-i18n/plugins/service";
import dataManagerPlugins from "@webiny/api-headless-cms/dataManager/client";
import settingsManagerPlugins from "@webiny/api-settings-manager/client";
import securityPlugins from "@webiny/api-security/authenticator";
import permissionsManager from "@webiny/api-security-permissions-manager/client";
import cognitoAuthentication from "@webiny/api-plugin-security-cognito/authentication";

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
    dataManagerPlugins({ dataManagerFunction: process.env.CMS_DATA_MANAGER_FUNCTION })
);
