import { HandlerContext } from "@webiny/handler/types";
import { HandlerClientPlugin, InvokeParams } from "./types";

class HandlerClient {
    plugin: HandlerClientPlugin;
    constructor(context: HandlerContext) {
        this.plugin = context.plugins.byName<HandlerClientPlugin>("handler-client");
        if (!this.plugin) {
            throw new Error(
                `Couldn't construct HandlerClient - "handler-client-invoke" plugin not found.`
            );
        }
    }

    invoke(params: InvokeParams) {
        return this.plugin.invoke(params);
    }
}

export default HandlerClient;
