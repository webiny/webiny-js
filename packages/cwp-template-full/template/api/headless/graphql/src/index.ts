import { createHandler } from "@webiny/handler";
import apolloServerPlugins from "@webiny/handler-apollo-server";
import dbProxy from "@webiny/api-plugin-commodo-db-proxy";
import securityServicePlugins from "@webiny/api-security/plugins/service";
import headlessCmsPlugins from "@webiny/api-headless-cms/plugins";

declare const APOLLO_SERVER_OPTIONS: any;
declare const DB_PROXY_OPTIONS: any;
declare const SECURITY_OPTIONS: any;

export const handler = createHandler(
    apolloServerPlugins(APOLLO_SERVER_OPTIONS),
    dbProxy(DB_PROXY_OPTIONS),
    securityServicePlugins(SECURITY_OPTIONS),
    headlessCmsPlugins()
);
