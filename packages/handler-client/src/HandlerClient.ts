import {
    HandlerClientPlugin,
    HandlerClientHandlerPlugin,
    InvokeArgs,
    ClientContext
} from "./types";
import WebinyError from "@webiny/error";

const getHandlerClientPlugin = (context: ClientContext): HandlerClientPlugin => {
    const plugin = context.plugins.byName<HandlerClientPlugin>("handler-client");
    if (plugin) {
        return plugin;
    }
    // If not specified, use a fallback plugin that fetches different handlers via plugins.
    // This might also be useful for testing purposes.
    return {
        type: "handler-client",
        name: "handler-client",
        async invoke({ name, payload, await: useAwait }) {
            const plugin = context.plugins.byName<HandlerClientHandlerPlugin>(name);
            if (!plugin) {
                throw new WebinyError(`Could not find "${name}" handler plugin.`);
            }

            const promise = plugin.invoke(payload);
            if (useAwait === false) {
                return null;
            }

            return promise;
        }
    };
};

class HandlerClient {
    private readonly plugin: HandlerClientPlugin;
    constructor(context: ClientContext) {
        this.plugin = getHandlerClientPlugin(context);
    }

    invoke<TInvokeArgsPayload = any, TResponse = any>(
        params: InvokeArgs<TInvokeArgsPayload>
    ): Promise<TResponse> {
        try {
            return this.plugin.invoke(params);
        } catch (e) {
            throw new WebinyError(
                `An error occurred while trying to invoke another handler with the following params: ${JSON.stringify(
                    params,
                    null,
                    2
                )}`
            );
        }
    }
}

export default HandlerClient;
