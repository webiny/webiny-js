import { HandlerHttpContext } from "@webiny/handler-http/types";
import { HandlerContext } from "@webiny/handler/types";

export default {
    type: "context",
    apply(context: HandlerContext & HandlerHttpContext) {
        const [event] = context.args;
        context.http = {
            headers: event.headers,
            query: event.queryStringParameters,
            body: event.body,
            path: event.pathParameters,
            cookies: {}
        };
    }
};
