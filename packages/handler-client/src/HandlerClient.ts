import { Context } from "@webiny/handler/types";
import { HandlerClientPlugin, InvokeArgs } from "./types";

class HandlerClient {
    plugin: HandlerClientPlugin;
    constructor(context: Context) {
        this.plugin = context.plugins.byName<HandlerClientPlugin>("handler-client");
        if (!this.plugin) {
            throw new Error(
                `Couldn't construct HandlerClient - "handler-client-invoke" plugin not found.`
            );
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
