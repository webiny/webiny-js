import defaultHandlerClient from "@webiny/handler-client";
import defaultHandlerHttp from "@webiny/handler-http-old";
import { HandlerHttpOptions } from "@webiny/handler-http-old/types";
import defaultHandlerArgs from "@webiny/handler-args-old";
import { createHandler as createDefaultHandler } from "@webiny/handler-old";
import { PluginCollection } from "@webiny/plugins/types";
import handlerClient from "./plugins/handlerClient";
import handlerHttp from "./plugins/handlerHttp";

interface CreateAwsHandlerOptions {
    plugins: PluginCollection;
    http?: HandlerHttpOptions;
}

interface CreateAwsHandler {
    (...plugins: PluginCollection): Function;
    (params: CreateAwsHandlerOptions): Function;
}

/**
 * To avoid braking changes, the "createHandler" function supports two signature:
 *  1. A list of plugins.       (backwards-compatible)
 *  2. A single argument of type `CreateHandlerOptions`.
 *
 * @param {Array | CreateAwsHandlerOptions} args - The list of plugins or object of type `CreateHandlerOptions`.
 */
export const createHandler: CreateAwsHandler = (...args: any) => {
    let plugins = args;

    const createHandlerOptions: CreateAwsHandlerOptions =
        args[0] as unknown as CreateAwsHandlerOptions;
    if (createHandlerOptions && Array.isArray(createHandlerOptions.plugins)) {
        plugins = createHandlerOptions.plugins;
    }

    return createDefaultHandler(
        defaultHandlerClient(),
        defaultHandlerArgs(),
        defaultHandlerHttp(createHandlerOptions && createHandlerOptions.http),
        handlerClient,
        handlerHttp,
        ...plugins
    );
};
