import { ArgsContext } from "@webiny/handler-args/types";
import { Context } from "@webiny/handler/types";

export default {
    type: "context",
    apply(context: Context & ArgsContext) {
        const [event] = context.args;
        context.invocationArgs = event;
    }
};
