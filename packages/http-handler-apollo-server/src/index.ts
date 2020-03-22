import { createResponse } from "@webiny/http-handler";
import { HttpHandlerPlugin } from "@webiny/http-handler/types";
import { boolean } from "boolean";
import createHandler from "./createHandler";

let apolloHandler;

type HttpHandlerApolloServerOptions = {
    debug?: boolean | number | string;
};

export default ({ debug }: HttpHandlerApolloServerOptions = {}): HttpHandlerPlugin => ({
    type: "handler",
    name: "handler-apollo-server",
    canHandle({ args }) {
        const [event] = args;
        return event.httpMethod === "POST" || event.httpMethod === "GET";
    },
    async handle({ args, context }) {
        const [event] = args;
        try {
            if (!apolloHandler) {
                const { handler } = await createHandler({ plugins: context.plugins });
                apolloHandler = handler;
            }

            // Will return the complete response, including "statusCode", "headers", and "body" fields.
            return await apolloHandler(event, context);
        } catch (e) {
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
                "[@webiny/http-handler-apollo-server] An error occurred:",
                JSON.stringify(report, null, 2)
            );

            if (boolean(debug)) {
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
