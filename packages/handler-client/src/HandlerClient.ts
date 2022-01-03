import {
    HandlerClientPlugin,
    HandlerClientHandlerPlugin,
    InvokeArgs,
    ClientContext
} from "./types";
import Error from "@webiny/error";

class HandlerClient {
    private readonly plugin: HandlerClientPlugin;
    constructor(context: ClientContext) {
        this.plugin = context.plugins.byName<HandlerClientPlugin>("handler-client");
        if (!this.plugin) {
            // If not specified, use a fallback plugin that fetches different handlers via plugins.
            // This might also be useful for testing purposes.
            this.plugin = {
                type: "handler-client",
                name: "handler-client",
                async invoke({ name, payload, await: useAwait }) {
                    const plugin = context.plugins.byName<HandlerClientHandlerPlugin>(name);
                    if (!plugin) {
                        throw new Error(`Could not find "${name}" handler plugin.`);
                    }

                    const promise = plugin.invoke(payload);
                    if (useAwait === false) {
                        return null;
                    }

                    return promise;
                }
            };
        }
    }

    invoke<TInvokeArgsPayload = any, TResponse = any>(
        params: InvokeArgs<TInvokeArgsPayload>
    ): Promise<TResponse> {
        try {
            return this.plugin.invoke(params);
        } catch (e) {
            throw new Error(
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
