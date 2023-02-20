import { boolean } from "boolean";
import { GraphQLSchema } from "graphql";
import { RoutePlugin } from "@webiny/handler";
import WebinyError from "@webiny/error";
import { PluginCollection } from "@webiny/plugins/types";
import { GraphQLRequestBody, HandlerGraphQLOptions } from "./types";
import { createGraphQLSchema } from "./createGraphQLSchema";
import debugPlugins from "./debugPlugins";
import processRequestBody from "./processRequestBody";

const DEFAULT_CACHE_MAX_AGE = 30758400; // 1 year

const createRequestBody = (body: unknown): GraphQLRequestBody | GraphQLRequestBody[] => {
    /**
     * We are trusting that the body payload is correct.
     * The `processRequestBody` will fail if it is not.
     */
    return typeof body === "string" ? JSON.parse(body) : body;
};

const formatErrorPayload = (error: Error): string => {
    if (error instanceof WebinyError) {
        return JSON.stringify({
            type: "CoreGraphQLWebinyError",
            message: error.message,
            code: error.code,
            data: error.data
        });
    }

    return JSON.stringify({
        type: "Error",
        name: error.name,
        message: error.message,
        stack: error.stack
    });
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
                .send({})
                .hijack();
        });
        onPost(path, async (request, reply) => {
            if (!schema) {
                try {
                    schema = createGraphQLSchema(context);
                } catch (ex) {
                    return reply.code(500).send(formatErrorPayload(ex));
                }
            }
            let body: GraphQLRequestBody | GraphQLRequestBody[];
            try {
                body = createRequestBody(request.body);
            } catch (ex) {
                console.log(`Error while creating the body request.`);
                console.log(formatErrorPayload(ex));
                throw ex;
            }
            try {
                const result = await processRequestBody(body, schema, context);
                return reply.status(200).send(result);
            } catch (ex) {
                console.log(`Error while processing the body request.`);
                console.log(formatErrorPayload(ex));
                throw ex;
            }
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
