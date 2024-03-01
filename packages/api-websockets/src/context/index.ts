import { ContextPlugin } from "@webiny/handler";
import { Context } from "~/types";
import { WebsocketsContext } from "./WebsocketsContext";
import { WebsocketsConnectionRegistry } from "~/registry";
import { WebsocketsTransport } from "~/transport";

export * from "./WebsocketsContext";
export * from "./abstractions/IWebsocketsContext";

export const createWebsocketsContext = () => {
    const plugin = new ContextPlugin<Context>(async context => {
        /**
         * TODO Find a better way to send the documentClient to the registry.
         */
        // @ts-expect-error
        const documentClient = context.db.driver.documentClient;
        const registry = new WebsocketsConnectionRegistry(documentClient);
        const transport = new WebsocketsTransport();
        context.websockets = new WebsocketsContext(registry, transport);
    });

    plugin.name = "websockets.context";

    return plugin;
};
