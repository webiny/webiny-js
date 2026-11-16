import { startWebinyWebApi } from "@webiny/api-event-handler-aws";
import { storageConfig } from "./storageConfig.js";
import type { CreateAwsDdbOsApiHandlerConfig } from "./storageConfig.js";

/**
 * Starts the HTTP server for the Lambda web function. Same storage as the Lambda handlers; only the
 * transport differs.
 */
export function startAwsDdbOsWebApi(config: CreateAwsDdbOsApiHandlerConfig) {
    const baseConfig = storageConfig(config);
    return startWebinyWebApi(baseConfig);
}
