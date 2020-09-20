import { HandlerHttpContext } from "@webiny/handler-http/types";

export default () => ({
    type: "context",
    apply(context: HandlerHttpContext) {
        context.http = null;
    }
});
