import { createHandler } from "@webiny/handler";
import apolloServerPlugins from "@webiny/handler-apollo-server";
import dbProxy from "@webiny/api-plugin-commodo-db-proxy";
import securityServicePlugins from "@webiny/api-security/plugins/service";
import googleTagManagerPlugins from "@webiny/api-google-tag-manager";
import cookiePolicyPlugins from "@webiny/api-cookie-policy";
import mailchimpPlugins from "@webiny/api-mailchimp";
import pageBuilderResolvers from "@webiny/api-plugin-page-builder-resolvers-mongodb";
import pageBuilderPlugins from "@webiny/api-page-builder/plugins";
import useSsrCacheTagsPlugins from "@webiny/api-page-builder/plugins/useSsrCacheTags";
import settingsManagerPlugins from "@webiny/api-settings-manager/client";

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
    securityServicePlugins({
        token: {
            expiresIn: process.env.JWT_TOKEN_EXPIRES_IN,
            secret: process.env.JWT_TOKEN_SECRET
        },
        validateAccessTokenFunction: process.env.VALIDATE_ACCESS_TOKEN_FUNCTION
    }),
    pageBuilderPlugins(),
    useSsrCacheTagsPlugins(),
    pageBuilderResolvers(),
    googleTagManagerPlugins(),
    mailchimpPlugins(),
    cookiePolicyPlugins()
);
