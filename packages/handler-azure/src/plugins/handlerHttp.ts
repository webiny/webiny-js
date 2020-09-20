import { HandlerHttpContext } from "@webiny/handler-http/types";
import { HandlerContext } from "@webiny/handler/types";
import { HandlerArgsContext } from "@webiny/handler-args/types";

export default {
    type: "context",
    apply(context: HandlerContext & HandlerHttpContext & HandlerArgsContext) {
        // TODO: invocationArgs
        const { invocationArgs: args } = context;

        context.http = {
            headers: args.headers,
            query: args.queryStringParameters,
            body: args.body,
            path: args.pathParameters,
            cookies: args.cookies
        };
    }
};
