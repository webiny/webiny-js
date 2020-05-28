import { createHandler } from "@webiny/handler";
import settings from "@webiny/api-files/settings";
import dbProxy from "@webiny/api-plugin-commodo-db-proxy";

export const handler = createHandler(
    dbProxy({ functionName: process.env.DB_PROXY_FUNCTION }),
    settings()
);
