import { createHandler } from "@webiny/http-handler";
import httpHandlerApolloServerPlugins from "@webiny/http-handler-apollo-server";
import createApolloHandlerPlugins from "@webiny/api-plugin-create-apollo-handler";
import securityServicePlugins from "@webiny/api-security/plugins/service";
import dbProxy from "@webiny/api-plugin-commodo-db-proxy";
import i18nPlugins from "@webiny/api-i18n/plugins";

declare const APOLLO_HANDLER_OPTIONS: any;
declare const HTTP_HANDLER_APOLLO_SERVER_OPTIONS: any;
declare const DB_PROXY_OPTIONS: any;
declare const SECURITY_OPTIONS: any;

export const handler = createHandler(
    httpHandlerApolloServerPlugins(HTTP_HANDLER_APOLLO_SERVER_OPTIONS),
    createApolloHandlerPlugins(APOLLO_HANDLER_OPTIONS),
    dbProxy(DB_PROXY_OPTIONS),
    securityServicePlugins(SECURITY_OPTIONS),
    i18nPlugins()
);
