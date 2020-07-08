import { createHandler } from "@webiny/handler";
import locales from "@webiny/api-i18n/locales";
import dbProxy from "@webiny/api-plugin-commodo-db-proxy";

export const handler = createHandler(
    dbProxy({ functionName: process.env.DB_PROXY_FUNCTION }),
    locales()
);
