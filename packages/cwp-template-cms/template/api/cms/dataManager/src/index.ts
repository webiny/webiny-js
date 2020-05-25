import { createHandler } from "@webiny/handler";
import dataManager from "@webiny/api-headless-cms/dataManager/handler";
import mongodb from "@webiny/api-plugin-commodo-mongodb";
import i18nServicePlugins from "@webiny/api-i18n/plugins/service";

/**
 * In this lambda we're using `api-plugin-commodo-mongodb` instead of `api-plugin-commodo-db-proxy`.
 * We're processing potentially thousands of records and doing this via
 * DB Proxy function is far from optimal from both the performance and price standpoint.
 * By connecting to MongoDB directly, we're avoiding Lambda invocations and have a much better throughput.
 */

export const handler = createHandler(
    mongodb({ database: { server: process.env.MONGODB_SERVER, name: process.env.MONGODB_NAME } }),
    i18nServicePlugins({
        localesFunction: process.env.I18N_LOCALES_FUNCTION
    }),
    dataManager()
);
