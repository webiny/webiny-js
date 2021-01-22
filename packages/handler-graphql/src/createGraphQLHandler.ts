import { HandlerPlugin, Context } from "@webiny/handler/types";
import { HttpContext } from "@webiny/handler-http/types";
import { boolean } from "boolean";
import { HandlerGraphQLOptions } from "./types";
import { createGraphQLSchema } from "./createGraphQLSchema";
import { PluginCollection } from "@webiny/plugins/types";
import debugPlugins from "./debugPlugins";
import processRequestBody from "./processRequestBody";

const DEFAULT_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST"
};

export default (options: HandlerGraphQLOptions = {}): PluginCollection => {
    let schema;

    const debug = boolean(options.debug);

    return [
        ...(debug ? debugPlugins() : []),
        {
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
                        error: {
                            name: e.constructor.name,
                            message: e.message,
                            stack: e.stack
                        }
                    };

                    console.log(
                        "[@webiny/handler-graphql] An error occurred:",
                        JSON.stringify(report, null, 2)
                    );

                    if (debug) {
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
        } as HandlerPlugin
    ];
};
