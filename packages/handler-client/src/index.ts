import HandlerClient from "./HandlerClient";
import { ClientContext } from "~/types";

export default () => ({
    type: "context",
    name: "handler-client.context",
    async apply(context: ClientContext) {
        context.handlerClient = new HandlerClient(context);
    }
});
