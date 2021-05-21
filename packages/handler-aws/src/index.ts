import defaultHandlerClient from "@webiny/handler-client";
import defaultHandlerHttp from "@webiny/handler-http";
import { HandlerHttpOptions } from "@webiny/handler-http/types";
import defaultHandlerArgs from "@webiny/handler-args";
import { createHandler as createDefaultHandler } from "@webiny/handler";
import handlerClient from "./plugins/handlerClient";
import handlerHttp from "./plugins/handlerHttp";

type CreateHandlerOptions = {
    plugins: any[];
    http?: HandlerHttpOptions;
};
/**
 * To avoid braking changes, the "createHandler" function supports two signature:
 *  1. A list of plugins.       (backwards-compatible)
 *  2. A single argument of type `CreateHandlerOptions`.
 *
 * @param {Array | CreateHandlerOptions} args - The list of plugins or object of type `CreateHandlerOptions`.
 */
export const createHandler = (...args) => {
    let plugins = args;

    const createHandlerOptions: CreateHandlerOptions = args[0];
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
