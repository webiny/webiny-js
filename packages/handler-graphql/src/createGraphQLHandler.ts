import { boolean } from "boolean";
import { HandlerGraphQLOptions } from "./types";
import { createGraphQLSchema } from "./createGraphQLSchema";
import { PluginCollection } from "@webiny/plugins/types";
import debugPlugins from "./debugPlugins";
import processRequestBody from "./processRequestBody";
import { getWebinyVersionHeaders } from "@webiny/utils";
import { GraphQLSchema } from "graphql";
import { RoutePlugin } from "@webiny/fastify";

const DEFAULT_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
    ...getWebinyVersionHeaders()
};

const DEFAULT_CACHE_MAX_AGE = 30758400; // 1 year

/**
 * TODO Until we figure out how to better convert incoming body, we will leave it as any.
 */
const createRequestBody = (body: any): any => {
    return typeof body === "string" ? JSON.parse(body) : body;
};

export default (options: HandlerGraphQLOptions = {}): PluginCollection => {
    let schema: GraphQLSchema | undefined = undefined;

    const debug = boolean(options.debug);

    return [
        ...(debug ? debugPlugins() : []),
        { type: "wcp-telemetry-tracker" },
        new RoutePlugin(async ({ onPost, onOptions, context }) => {
            onOptions("/graphql", async (_, reply) => {
                reply.statusCode = 204;
                reply.headers({
                    ...DEFAULT_HEADERS,
                    "Cache-Control": "public, max-age=" + DEFAULT_CACHE_MAX_AGE
                });
                reply.send({});

                return reply;
            });
            onPost("/graphql", async (request, reply) => {
                if (!schema) {
                    schema = createGraphQLSchema(context);
                }
                const body = createRequestBody(request.body);
                const result = await processRequestBody(body, schema, context);
                reply.statusCode = 200;
                reply.headers({
                    ...DEFAULT_HEADERS
                });
                reply.send(result);

                return reply;
            });
        })
    ];
};
