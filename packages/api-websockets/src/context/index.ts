import { ContextPlugin } from "@webiny/handler";
import type { Context } from "~/types.js";
import { WebsocketsContext as WebsocketsImplementation } from "./WebsocketsContext.js";
import { WebsocketsConnectionRegistry } from "~/registry/index.js";
import { WebsocketsTransport } from "~/transport/index.js";
import { WebsocketService } from "~/features/WebsocketService/abstractions.js";

export type * from "./abstractions/IWebsocketsContext.js";

export const createWebsocketsContext = () => {
    const plugin = new ContextPlugin<Context>(async context => {
        /**
         * TODO Find a better way to send the documentClient to the registry.
         */
        // @ts-expect-error
        const documentClient = context.db.driver.documentClient;
        const registry = new WebsocketsConnectionRegistry(documentClient);
        const transport = new WebsocketsTransport();
        context.websockets = new WebsocketsImplementation(registry, transport);

        context.container.registerInstance(WebsocketService, context.websockets);
    });

    plugin.name = "websockets.context";

    return plugin;
};
