import { createHandler } from "@webiny/http-handler";
import httpHandlerApolloServerPlugins from "@webiny/http-handler-apollo-server";
import dbProxy from "@webiny/api-plugin-commodo-db-proxy";
import securityServicePlugins from "@webiny/api-security/plugins/service";
import googleTagManagerPlugins from "@webiny/api-google-tag-manager";
import cookiePolicyPlugins from "@webiny/api-cookie-policy";
import mailchimpPlugins from "@webiny/api-mailchimp";
import pageBuilderResolvers from "@webiny/api-plugin-page-builder-resolvers-mongodb";
import pageBuilderPlugins from "@webiny/api-page-builder/plugins";
import useSsrCacheTagsPlugins from "@webiny/api-page-builder/plugins/useSsrCacheTags";

declare const HTTP_HANDLER_APOLLO_SERVER_OPTIONS: any;
declare const DB_PROXY_OPTIONS: any;
declare const SECURITY_OPTIONS: any;

export const handler = createHandler(
    httpHandlerApolloServerPlugins(HTTP_HANDLER_APOLLO_SERVER_OPTIONS),
    dbProxy(DB_PROXY_OPTIONS),
    securityServicePlugins(SECURITY_OPTIONS),
    pageBuilderPlugins({}),
    useSsrCacheTagsPlugins(),
    pageBuilderResolvers(),
    googleTagManagerPlugins(),
    mailchimpPlugins(),
    cookiePolicyPlugins()
);
