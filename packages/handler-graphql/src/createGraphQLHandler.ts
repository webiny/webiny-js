import { HandlerPlugin, Context } from "@webiny/handler/types";
import { HttpContext } from "@webiny/handler-http/types";
import { createGraphQLSchema } from "./createGraphQLSchema";
import processRequestBody from "./processRequestBody";

const DEFAULT_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST"
};

export default (): HandlerPlugin => {
    let schema;

    return {
        type: "handler",
        name: "handler-graphql",
        async handle(context: Context & HttpContext, next) {
            const { http } = context;
            if (!http) {
                return next();
            }

            if (http.request.method === "OPTIONS") {
                return http.response({
                    statusCode: 204,
                    headers: DEFAULT_HEADERS
                });
            }

            if (http.request.method !== "POST") {
                return next();
            }

            if (!schema) {
                schema = createGraphQLSchema(context);
            }

            try {
                const body = JSON.parse(http.request.body);
                const result = await processRequestBody(body, schema, context);

                return http.response({
                    body: JSON.stringify(result),
                    statusCode: 200,
                    headers: DEFAULT_HEADERS
                });
            } catch (e) {
                const report = {
                    errors: [
                        {
                            message: e.message,
                            extensions: {
                                code: e.code,
                                name: e.constructor.name,
                                stack: e.stack
                            }
                        }
                    ]
                };

                console.log(
                    "[@webiny/handler-graphql] An error occurred:",
                    JSON.stringify(report, null, 2)
                );

                context.plugins.byType("handler-graphql-after-query").forEach(pl => {
                    pl.apply(report, context);
                });

                return context.http.response({
                    statusCode: 200,
                    body: JSON.stringify(report, null, 2),
                    headers: {
                        ...DEFAULT_HEADERS,
                        "Cache-Control": "no-store"
                    }
                });
            }
        }
    };
};
