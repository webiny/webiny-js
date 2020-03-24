import { createHandler } from "@webiny/http-handler";
import headlessCmsHttpHandlerApolloServerPlugins from "@webiny/api-headless-cms/handler";
import securityService from "@webiny/api-security/plugins/service";
import dbProxy from "@webiny/api-plugin-commodo-db-proxy";
import i18nPlugins from "@webiny/api-i18n/plugins/service";

declare const HTTP_HANDLER_APOLLO_SERVER_OPTIONS: any;
declare const DB_PROXY_OPTIONS: any;
declare const SECURITY_OPTIONS: any;

export const handler = createHandler(
    headlessCmsHttpHandlerApolloServerPlugins(HTTP_HANDLER_APOLLO_SERVER_OPTIONS),
    dbProxy(DB_PROXY_OPTIONS),
    securityService(SECURITY_OPTIONS),
    i18nPlugins()
);
