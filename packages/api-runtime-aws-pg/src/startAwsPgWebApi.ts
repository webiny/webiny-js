import { startWebinyWebApi } from "@webiny/api-runtime-aws";
import { storageConfig } from "./storageConfig.js";
import type { CreateAwsPgApiHandlerConfig } from "./storageConfig.js";

/**
 * Starts the HTTP server for the Lambda web function. Same storage as the Lambda handlers; only the
 * transport differs.
 */
export function startAwsPgWebApi(config: CreateAwsPgApiHandlerConfig) {
    return startWebinyWebApi(storageConfig(config));
}
