import {
    HandlerClientPlugin,
    HandlerClientHandlerPlugin,
    InvokeArgs,
    ClientContext
} from "./types";
import WebinyError from "@webiny/error";

const defaultPluginName = "handler-client";

const getPluginFetcher = (context: ClientContext): HandlerClientPlugin => {
    return {
        type: "handler-client",
        name: defaultPluginName,
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

const getHandlerClientPlugin = (context: ClientContext): HandlerClientPlugin => {
    const plugin = context.plugins.byName<HandlerClientPlugin>("handler-client");
    if (plugin) {
        return plugin;
    }
    // If not specified, use a fallback plugin that fetches different handlers via plugins.
    // This might also be useful for testing purposes.
    return getPluginFetcher(context);
};

class HandlerClient {
    private readonly plugin: HandlerClientPlugin;
    /**
     * We need the default plugin to later on fetch another plugin than initially selected.
     * If name of the required plugin is not the default one, fetch new one.
     */
    private readonly default: HandlerClientPlugin;

    constructor(context: ClientContext) {
        this.plugin = getHandlerClientPlugin(context);
        this.default = getPluginFetcher(context);
    }

    invoke<TInvokeArgsPayload = any, TResponse = any>(
        params: InvokeArgs<TInvokeArgsPayload>
    ): Promise<TResponse> {
        let plugin: HandlerClientPlugin = this.plugin;
        if (this.plugin.name !== params.name) {
            plugin = this.default;
        }
        try {
            return plugin.invoke(params);
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
