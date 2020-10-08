import { createHandler } from "@webiny/handler-aws";
import dataManager from "@webiny/api-headless-cms/dataManager/handler";
import dbProxyPlugins from "@webiny/api-plugin-commodo-db-proxy";
import i18nServicePlugins from "@webiny/api-i18n/plugins/service";
import { CmsDataManagerEntryHookPlugin } from "@webiny/api-headless-cms/dataManager/types";

/**
 * In this lambda we're using `api-plugin-commodo-mongodb` instead of `api-plugin-commodo-db-proxy`.
 * We're processing potentially thousands of records and doing this via
 * DB Proxy function is far from optimal from both the performance and price standpoint.
 * By connecting to MongoDB directly, we're avoiding Lambda invocations and have a much better throughput.
 */

export const handler = createHandler(
    dbProxyPlugins({ functionName: process.env.DB_PROXY_FUNCTION }),
    i18nServicePlugins({
        localesFunction: process.env.I18N_LOCALES_FUNCTION
    }),
    dataManager(),
    {
        type: "cms-data-manager-entry-hook",
        // eslint-disable-next-line
        async hook(params, context) {
            // Process the hook however you want :)
            // See `CmsDataManagerEntryHookPlugin` type for available hook parameters
        }
    } as CmsDataManagerEntryHookPlugin
);
