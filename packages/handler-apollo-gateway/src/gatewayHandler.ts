import { HandlerContext, HandlerPlugin } from "@webiny/handler/types";
import { HandlerHttpContext } from "@webiny/handler-http/types";
import { HandlerClientContext } from "@webiny/handler-client/types";
import { HandlerApolloGatewayOptions } from "./types";
import getHandler from "./utils/getHandler";

type Context = HandlerContext & HandlerHttpContext & HandlerClientContext;

const plugins = (options: HandlerApolloGatewayOptions): HandlerPlugin => ({
    name: "handler-apollo-gateway",
    type: "handler",
    async handle(context: Context, next) {
        if (!context.http) {
            return next();
        }

        if (!["POST", "GET", "OPTIONS"].includes(context.http.method)) {
            return next();
        }

        const handler = await getHandler(context, options);

        return await handler(context);
    }
});

export default plugins;
