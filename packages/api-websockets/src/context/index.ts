import { ContextPlugin } from "@webiny/handler";
import type { Context } from "~/types.js";
import { WebsocketsContext as WebsocketsImplementation } from "./WebsocketsContext.js";
import { WebsocketService } from "~/features/WebsocketService/abstractions.js";
import { ConnectionRegistry } from "~/features/ConnectionRegistry/abstractions.js";
import { Transport } from "~/features/Transport/abstractions.js";

export type * from "./abstractions/IWebsocketsContext.js";

export const createWebsocketsContext = () => {
    const plugin = new ContextPlugin<Context>(async context => {
        const registry = context.container.resolve(ConnectionRegistry);
        const transport = context.container.resolve(Transport);
        context.websockets = new WebsocketsImplementation(registry, transport);

        context.container.registerInstance(WebsocketService, context.websockets);
    });

    plugin.name = "websockets.context";

    return plugin;
};
