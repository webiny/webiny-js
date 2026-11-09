import { startWebinyWebApi } from "@webiny/api-event-handler-aws";
import type { CreateAwsDdbApiHandlerConfig } from "./createWebinyApiHandler.js";
import { registerRootStorage } from "./registerRootStorage.js";

/**
 * Starts the HTTP server for the Lambda web function. Same storage as the Lambda handlers; only the
 * transport differs.
 */
export function startAwsDdbWebApi(config: CreateAwsDdbApiHandlerConfig) {
    return startWebinyWebApi({ ...config, registerRootStorage });
}
