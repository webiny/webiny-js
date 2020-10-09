import { HandlerPlugin } from "@webiny/handler/types";
import { HandlerHttpContext } from "@webiny/handler-http/types";
import { HandlerClientContext } from "@webiny/handler-client/types";
import { HandlerApolloGatewayOptions } from "./types";
import getHandler from "./utils/getHandler";
import { boolean } from "boolean";

const DEFAULT_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST"
};

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
                headers: DEFAULT_HEADERS
            });
        }

        if (http.method === "POST") {
            const handler = await getHandler(context, options);

            try {
                const query = JSON.parse(http.body);
                const { graphqlResponse } = await handler(query, context);

                return http.response({
                    body: graphqlResponse,
                    statusCode: 200,
                    headers: DEFAULT_HEADERS
                });
            } catch (e) {
                const report = {
                    error: {
                        name: e.constructor.name,
                        message: e.message,
                        stack: e.stack
                    }
                };

                console.log(
                    "[@webiny/handler-apollo-gateway] An error occurred:",
                    JSON.stringify(report, null, 2)
                );

                if (boolean(options.debug)) {
                    return context.http.response({
                        statusCode: 500,
                        body: JSON.stringify(report, null, 2),
                        headers: {
                            ...DEFAULT_HEADERS,
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

export default plugins;
