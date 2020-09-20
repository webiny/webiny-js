import { createResponse } from "@webiny/handler";
import { HandlerPlugin, HandlerContext } from "@webiny/handler/types";
import { boolean } from "boolean";
import { CreateApolloHandlerPlugin, HandlerApolloServerOptions } from "../types";
import { HandlerHttpContext } from "@webiny/handler-http/types";

export default (options: HandlerApolloServerOptions = {}): HandlerPlugin => ({
    type: "handler",
    name: "handler-apollo-server",
    async handle(context: HandlerContext & HandlerHttpContext, next) {
        const event = context.invocationArgs;

        if (!["POST", "GET", "OPTIONS"].includes(context.http.method)) {
            return next();
        }

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
            return await handler(event, context);
        } catch (e) {
            // TODO: this is weird, test this out.
            const { ...requestContext } = event.requestContext;
            const report = {
                requestContext,
                context,
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
                return createResponse({
                    statusCode: 500,
                    type: "text/json",
                    body: JSON.stringify(report, null, 2),
                    headers: {
                        "Cache-Control": "no-store"
                    }
                });
            }

            throw e;
        }
    }
});
