import { createHandler } from "@webiny/handler";
import dbProxyPlugins from "@webiny/api-plugin-commodo-db-proxy";
import permissionsManagerPlugins from "@webiny/api-security-permissions-manager/handler";
import userManagerPlugins from "@webiny/api-security-user-management/permissionsManager";

export const handler = createHandler(
    dbProxyPlugins({ functionName: process.env.DB_PROXY_FUNCTION }),
    permissionsManagerPlugins(),
    userManagerPlugins()
);
