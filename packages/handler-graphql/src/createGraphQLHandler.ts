import { toBoolean } from "@webiny/stdlib";
import type { GraphQLSchema } from "graphql";
import type { Context } from "@webiny/handler";
import { RoutePlugin } from "@webiny/handler";
import WebinyError from "@webiny/error";
import type { Plugin } from "@webiny/plugins/types.js";
import type { GraphQLRequestBody, HandlerGraphQLOptions } from "./types.js";
import { createGraphQLSchema, getSchemaPlugins } from "./createGraphQLSchema.js";
import debugPlugins from "./debugPlugins.js";
import { processRequestBody } from "./processRequestBody.js";
import { createRequestBody } from "~/createRequestBody.js";
import {
    isJsonContentType,
    replyInvalidRequestBody,
    replyUnsupportedMediaType
} from "~/jsonContentType.js";

const DEFAULT_CACHE_MAX_AGE = 30758400; // 1 year

const createCacheKey = (context: Context) => {
    const plugins = getSchemaPlugins(context);
    // TODO: in the near future, we have to assign a fixed name to every
    // TODO: GraphQLSchema plugin, to be able to create a reliable cache key.

    // TODO: `getCurrentTenant` should be injected as a parameter.
    // @ts-expect-error TODO: We should not be accessing `context` like this here.
    const tenant = context.tenancy?.getCurrentTenant();

    return [tenant ? `tenant:${tenant.id}` : null, plugins.length.toString()]
        .filter(Boolean)
        .join("#");
};

/**
 * `includeDetails` controls `stack` and `data`. Logs always get them; a response only gets them
 * when DEBUG is on, so internals (file paths, schema details) are not exposed to callers.
 */
const formatErrorPayload = (error: Error, includeDetails = true): string => {
    if (error instanceof WebinyError) {
        return JSON.stringify({
            type: "CoreGraphQLWebinyError",
            message: error.message,
            code: error.code,
            data: includeDetails ? error.data : null,
            stack: includeDetails ? error.stack : null
        });
    }

    return JSON.stringify({
        type: "Error",
        name: error.name,
        message: error.message,
        stack: includeDetails ? error.stack : null
    });
};

export default (options: HandlerGraphQLOptions = {}): Plugin[] => {
    let schema: GraphQLSchema | undefined = undefined;
    let cacheKey: string | undefined = undefined;

    const debug = toBoolean(options.debug);

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
            if (!isJsonContentType(request)) {
                return replyUnsupportedMediaType(reply);
            }
            const contextCacheKey = createCacheKey(context as Context);
            if (!schema || cacheKey !== contextCacheKey) {
                try {
                    schema = await createGraphQLSchema(context);
                    cacheKey = contextCacheKey;
                } catch (ex) {
                    console.error(`Error while building the GraphQL schema.`);
                    console.error(formatErrorPayload(ex));
                    return reply
                        .code(500)
                        .send(formatErrorPayload(ex, process.env.DEBUG === "true"));
                }
            }
            let body: GraphQLRequestBody | GraphQLRequestBody[];
            try {
                body = createRequestBody(request.body);
            } catch (ex) {
                console.error(`Error while creating the body request.`);
                console.error(formatErrorPayload(ex));
                const invalidRequestReply = replyInvalidRequestBody(reply, ex);
                if (invalidRequestReply) {
                    return invalidRequestReply;
                }
                throw ex;
            }
            try {
                const result = await processRequestBody(body, schema, context);
                /**
                 * IMPORTANT! Do not send anything if reply was already sent.
                 */
                if (reply.sent) {
                    console.warn("Reply already sent, cannot send the result (handler-graphql).");
                    return reply;
                }
                return reply.status(200).send(result);
            } catch (ex) {
                console.error(`Error while processing the body request.`);
                console.error(formatErrorPayload(ex));
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
