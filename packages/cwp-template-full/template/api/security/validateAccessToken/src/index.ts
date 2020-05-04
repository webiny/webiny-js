import { createHandler } from "@webiny/handler";
import validateAccessToken from "@webiny/api-security/validateAccessToken";
import dbProxy from "@webiny/api-plugin-commodo-db-proxy";

declare const DB_PROXY_OPTIONS: any;

export const handler = createHandler(dbProxy(DB_PROXY_OPTIONS), validateAccessToken());
