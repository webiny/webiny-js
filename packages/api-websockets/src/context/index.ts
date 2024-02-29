import { ContextPlugin } from "@webiny/handler";
import { Context } from "~/types";
import { WebsocketsContext } from "./WebsocketsContext";
import { WebsocketsConnectionRegistry } from "~/registry";
import { WebsocketsTransporter } from "~/transporter";

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
        const transporter = new WebsocketsTransporter();
        context.websockets = new WebsocketsContext(registry, transporter);
    });

    plugin.name = "websockets.context";

    return plugin;
};
