import { createHandler } from "@webiny/handler";
import dbProxyPlugins from "@webiny/api-plugin-commodo-db-proxy";
import settingsManagerPlugins from "@webiny/api-settings-manager/handler";

export const handler = createHandler(
    dbProxyPlugins({ functionName: process.env.DB_PROXY_FUNCTION }),
    settingsManagerPlugins()
);
