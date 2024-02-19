import { ContextPlugin } from "@webiny/handler";
import { Context } from "~/types";
import { SocketsContext } from "./SocketsContext";
import { SocketsConnectionRegistry } from "~/registry";
import { SocketsTransporter } from "~/transporter";

export * from "./SocketsContext";
export * from "./abstractions/ISocketsContext";

export const createSocketsContext = () => {
    return new ContextPlugin<Context>(async context => {
        /**
         * TODO Find a better way to send the documentClient to the registry.
         */
        // @ts-expect-error
        const documentClient = context.db.driver.documentClient;
        const registry = new SocketsConnectionRegistry(documentClient);
        const transporter = new SocketsTransporter();
        context.sockets = new SocketsContext(registry, transporter);
    });
};
