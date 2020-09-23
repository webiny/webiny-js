import { HandlerPlugin } from "@webiny/handler/types";
import { HandlerHttpContext } from "@webiny/handler-http/types";
import { HandlerClientContext } from "@webiny/handler-client/types";
import { HandlerApolloGatewayOptions } from "./types";
import getHandler from "./utils/getHandler";
import buildCorsHeaders from "./utils/buildCorsHeaders";

const plugins = (
    options: HandlerApolloGatewayOptions
): HandlerPlugin<HandlerHttpContext, HandlerClientContext> => ({
    name: "handler-apollo-gateway",
    type: "handler",
    async handle(context, next) {
        const { http } = context;
        if (!http) {
            return next();
        }

        if (http.method === "OPTIONS") {
            return http.response({
                statusCode: 204,
                headers: buildCorsHeaders()
            });
        }

        if (http.method === "POST") {
            const handler = await getHandler(context, options);
            return await handler(context);
        }

        return next();
    }
});

export default plugins;
