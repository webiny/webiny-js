import HandlerClient from "./HandlerClient";
import { ClientContext } from "~/types";

export * from "./HandlerClientPlugin";

export const createHandlerClient = () => ({
    type: "context",
    name: "handler-client.context",
    async apply(context: ClientContext) {
        context.handlerClient = new HandlerClient(context);
    }
});
