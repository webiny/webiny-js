import HandlerClient from "./HandlerClient";
import { Context } from "@webiny/handler/types";

export default () => ({
    type: "context",
    apply(context: Context) {
        context.handlerClient = new HandlerClient(context);
    }
});
