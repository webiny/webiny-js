import HandlerClient from "./HandlerClient";
import { ClientContext } from "~/types";

export default () => ({
    type: "context",
    apply(context: ClientContext) {
        context.handlerClient = new HandlerClient(context);
    }
});
