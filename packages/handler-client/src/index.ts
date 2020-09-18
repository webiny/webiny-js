import HandlerClient from "./HandlerClient";
import { HandlerContext } from "@webiny/handler/types";

export default {
    type: "context",
    apply(context: HandlerContext) {
        context.handlerClient = new HandlerClient(context);
    }
};
