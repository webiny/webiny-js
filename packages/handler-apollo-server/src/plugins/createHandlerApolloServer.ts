import { HandlerPlugin, HandlerContext } from "@webiny/handler/types";
import { boolean } from "boolean";
import { CreateApolloHandlerPlugin, HandlerApolloServerOptions } from "../types";
import { HandlerHttpContext } from "@webiny/handler-http/types";
import buildCorsHeaders from "./../buildCorsHeaders";

export default (options: HandlerApolloServerOptions = {}): HandlerPlugin => ({
    type: "handler",
    name: "handler-apollo-server",
    async handle(context: HandlerContext & HandlerHttpContext, next) {
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
            try {
                const createApolloHandlerPlugin = context.plugins.byName<CreateApolloHandlerPlugin>(
                    "handler-apollo-server-create-handler"
                );

                if (!createApolloHandlerPlugin) {
                    throw Error(`"handler-apollo-server-create-handler" plugin is not configured!`);
                }

                const { handler } = await createApolloHandlerPlugin.create({
                    context,
                    options
                });

                // Will return the complete response, including "statusCode", "headers", and "body" fields.
                return handler(JSON.parse(http.body), context);
            } catch (e) {
                const report = {
                    error: {
                        name: e.constructor.name,
                        message: e.message,
                        stack: e.stack
                    }
                };

                console.log(
                    "[@webiny/handler-apollo-server] An error occurred:",
                    JSON.stringify(report, null, 2)
                );

                if (boolean(options.debug)) {
                    return context.http.response({
                        statusCode: 500,
                        body: JSON.stringify(report, null, 2),
                        headers: {
                            "Cache-Control": "no-store",
                            "Content-Type": "text/json"
                        }
                    });
                }

                throw e;
            }
        }

        return next();
    }
});
