import { createResponse } from "@webiny/http-handler";
import { HttpHandlerPlugin } from "@webiny/http-handler/types";
import { boolean } from "boolean";
import { CreateApolloHandlerPlugin, HttpHandlerApolloServerOptions } from "./../types";

export default (options: HttpHandlerApolloServerOptions = {}): HttpHandlerPlugin => ({
    type: "handler",
    name: "handler-apollo-server",
    canHandle({ args }) {
        const [event] = args;
        return (
            event.httpMethod === "POST" ||
            event.httpMethod === "GET" ||
            event.httpMethod === "OPTIONS"
        );
    },
    async handle({ args, context }) {
        const [event, handlerContext] = args;
        try {
            const createApolloHandlerPlugin = context.plugins.byName<CreateApolloHandlerPlugin>(
                "handler-apollo-server-create-handler"
            );

            if (!createApolloHandlerPlugin) {
                throw Error(`"handler-apollo-server-create-handler" plugin is not configured!`);
            }

            const { handler } = await createApolloHandlerPlugin.create({
                args,
                context,
                options
            });

            // Will return the complete response, including "statusCode", "headers", and "body" fields.
            return await handler(event, context);
        } catch (e) {
            const { ...requestContext } = event.requestContext;
            const report = {
                requestContext,
                context: handlerContext,
                error: {
                    name: e.constructor.name,
                    message: e.message,
                    stack: e.stack
                }
            };

            console.log(
                "[@webiny/http-handler-apollo-server] An error occurred:",
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
