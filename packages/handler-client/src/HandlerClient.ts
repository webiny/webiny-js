import { Context } from "@webiny/handler/types";
import { HandlerClientPlugin, InvokeArgs, InvokeResult } from "./types";

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

    invoke<T = InvokeResult>(params: InvokeArgs): Promise<T> {
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
