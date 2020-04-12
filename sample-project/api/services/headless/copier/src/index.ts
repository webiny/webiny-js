import { createHandler } from "@webiny/http-handler";
import copyEnvironment from "@webiny/api-headless-cms/copyEnvironment";
import dbProxy from "@webiny/api-plugin-commodo-db-proxy";

declare const DB_PROXY_OPTIONS: any;

export const handler = createHandler(dbProxy(DB_PROXY_OPTIONS), copyEnvironment());
