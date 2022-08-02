import { ArgsContext } from "@webiny/handler-args-old/types";
import { Context } from "@webiny/handler-old/types";

export default {
    type: "context",
    apply(context: Context & ArgsContext) {
        const [event] = context.args;
        context.invocationArgs = event;
    }
};
