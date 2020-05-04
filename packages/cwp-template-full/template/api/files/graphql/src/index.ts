import { createHandler } from "@webiny/handler";
import apolloServerHandler from "@webiny/handler-apollo-server";
import dbProxy from "@webiny/api-plugin-commodo-db-proxy";
import securityServicePlugins from "@webiny/api-security/plugins/service";
import filesPlugins from "@webiny/api-files/plugins";
import filesResolvers from "@webiny/api-plugin-files-resolvers-mongodb";

declare const APOLLO_SERVER_OPTIONS: any;
declare const DB_PROXY_OPTIONS: any;
declare const SECURITY_OPTIONS: any;

export const handler = createHandler(
    apolloServerHandler(APOLLO_SERVER_OPTIONS),
    dbProxy(DB_PROXY_OPTIONS),
    securityServicePlugins(SECURITY_OPTIONS),
    filesPlugins(),
    filesResolvers()
);
