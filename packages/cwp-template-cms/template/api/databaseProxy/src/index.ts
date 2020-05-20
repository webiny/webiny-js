import { createHandler } from "@webiny/handler";
import databaseProxyHandler from "@webiny/api-plugin-commodo-db-proxy/handler";

export const handler = createHandler(
    databaseProxyHandler({
        logCollection: process.env.LOG_COLLECTION,
        server: process.env.MONGODB_SERVER,
        name: process.env.MONGODB_NAME
    })
);
