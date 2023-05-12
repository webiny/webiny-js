import WebinyError from "@webiny/error";
import { HandlerClientHandlerPlugin, InvokeArgs, ClientContext } from "./types";
import { HandlerClientPlugin } from "~/HandlerClientPlugin";

const defaultPluginName = "handler-client";

const getPluginFetcher = (context: ClientContext): HandlerClientPlugin => {
    const pl = new HandlerClientPlugin({
        invoke: async params => {
            const { name, payload, await: useAwait } = params;
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
    });
    pl.name = defaultPluginName;
    return pl;
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

    public async invoke<TInvokeArgsPayload = any, TResponse = any>(
        params: InvokeArgs<TInvokeArgsPayload>
    ): Promise<TResponse> {
        let plugin: HandlerClientPlugin = this.plugin;
        if (plugin.canHandle && plugin.canHandle(params) === false) {
            plugin = this.default;
        }
        try {
            return await plugin.invoke(params);
        } catch (ex) {
            /**
             * We collect error that was caught and the description of the invoke, if any.
             */
            const data: Record<string, any> = {
                error: {
                    message: ex.message,
                    data: ex.data,
                    code: ex.code
                }
            };
            if (params.description) {
                data.description = params.description;
            }
            throw new WebinyError(
                `An error occurred while trying to invoke another handler with the following params: ${JSON.stringify(
                    params,
                    null,
                    2
                )}`,
                "INVOKE_ERROR",
                data
            );
        }
    }
}

export default HandlerClient;
