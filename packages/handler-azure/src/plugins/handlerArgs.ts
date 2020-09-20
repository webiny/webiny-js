import { HandlerArgsContext } from "@webiny/handler-args/types";
import { HandlerContext } from "@webiny/handler/types";

export default {
    type: "context",
    apply(context: HandlerContext & HandlerArgsContext) {
        const [event] = context.args;
        context.invocationArgs = event;
    }
};
