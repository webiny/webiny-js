import { createHandler } from "@webiny/http-handler";

declare const APOLLO_HANDLER_OPTIONS: any;
declare const DB_PROXY_OPTIONS: any;
declare const SECURITY_OPTIONS: any;

export const handler = createHandler({
    param: 1,
    apollo: APOLLO_HANDLER_OPTIONS,
    dbProxy: DB_PROXY_OPTIONS,
    security: SECURITY_OPTIONS
});
