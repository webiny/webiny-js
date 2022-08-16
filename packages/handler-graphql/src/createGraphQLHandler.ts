import { boolean } from "boolean";
import { HandlerGraphQLOptions } from "./types";
import { createGraphQLSchema } from "./createGraphQLSchema";
import { PluginCollection } from "@webiny/plugins/types";
import debugPlugins from "./debugPlugins";
import processRequestBody from "./processRequestBody";
import { GraphQLSchema } from "graphql";
import { RoutePlugin } from "@webiny/handler";

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

    const path = options?.path || "/graphql";

    const route = new RoutePlugin(async ({ onPost, onOptions, context }) => {
        onOptions(path, async (_, reply) => {
            return reply
                .status(204)
                .headers({
                    "Cache-Control": `public, max-age=${DEFAULT_CACHE_MAX_AGE}`
                })
                .send({});
        });
        onPost(path, async (request, reply) => {
            if (!schema) {
                schema = createGraphQLSchema(context);
            }
            const body = createRequestBody(request.body);
            const result = await processRequestBody(body, schema, context);
            return reply.status(200).send(result);
        });
    });

    route.name = "handler.graphql.route.default";

    return [
        ...(debug ? debugPlugins() : []),
        {
            type: "wcp-telemetry-tracker"
        },
        route
    ];
};
