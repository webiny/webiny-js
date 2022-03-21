import { HandlerPlugin, Context } from "@webiny/handler/types";
import { HttpContext } from "@webiny/handler-http/types";
import { boolean } from "boolean";
import { HandlerGraphQLOptions } from "./types";
import { createGraphQLSchema } from "./createGraphQLSchema";
import { PluginCollection } from "@webiny/plugins/types";
import debugPlugins from "./debugPlugins";
import processRequestBody from "./processRequestBody";
import { getWebinyVersionHeaders } from "@webiny/utils";
import { GraphQLSchema } from "graphql";

const DEFAULT_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
    ...getWebinyVersionHeaders()
};

const DEFAULT_CACHE_MAX_AGE = 30758400; // 1 year

export default (options: HandlerGraphQLOptions = {}): PluginCollection => {
    let schema: GraphQLSchema | undefined = undefined;

    const debug = boolean(options.debug);

    return [
        ...(debug ? debugPlugins() : []),
        { type: "wcp-telemetry-tracker" },
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
                        headers: {
                            ...DEFAULT_HEADERS,
                            "Cache-Control": "public, max-age=" + DEFAULT_CACHE_MAX_AGE
                        }
                    });
                }

                if (http.request.method !== "POST") {
                    return next();
                }

                if (!schema) {
                    schema = createGraphQLSchema(context);
                }

                const body = JSON.parse(http.request.body);
                const result = await processRequestBody(body, schema, context);

                return http.response({
                    body: JSON.stringify(result),
                    statusCode: 200,
                    headers: DEFAULT_HEADERS
                });
            }
        } as HandlerPlugin
    ];
};
