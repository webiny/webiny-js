import { boolean } from "boolean";
import { GraphQLSchema } from "graphql";
import { Context, RoutePlugin } from "@webiny/handler";
import WebinyError from "@webiny/error";
import { Plugin } from "@webiny/plugins/types";
import { GraphQLRequestBody, HandlerGraphQLOptions } from "./types";
import { createGraphQLSchema, getSchemaPlugins } from "./createGraphQLSchema";
import debugPlugins from "./debugPlugins";
import { processRequestBody } from "./processRequestBody";

const DEFAULT_CACHE_MAX_AGE = 30758400; // 1 year

const createCacheKey = (context: Context) => {
    const plugins = getSchemaPlugins(context);
    // TODO: in the near future, we have to assign a fixed name to every
    // TODO: GraphQLSchema plugin, to be able to create a reliable cache key.

    // TODO: `getCurrentTenant` should be injected as a parameter.
    // @ts-expect-error TODO: We should not be accessing `context` like this here.
    const tenant = context.tenancy?.getCurrentTenant();

    // TODO: `getContentLocale` should be injected as a parameter.
    // @ts-expect-error TODO: We should not be accessing `context` like this here.
    const contentLocale = context.i18n?.getContentLocale();

    return [
        tenant ? `tenant:${tenant.id}` : null,
        contentLocale ? `locale:${contentLocale.code}` : null,
        plugins.length.toString()
    ]
        .filter(Boolean)
        .join("#");
};

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

export default (options: HandlerGraphQLOptions = {}): Plugin[] => {
    let schema: GraphQLSchema | undefined = undefined;
    let cacheKey: string | undefined = undefined;

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
            const contextCacheKey = createCacheKey(context as Context);
            if (!schema || cacheKey !== contextCacheKey) {
                try {
                    schema = createGraphQLSchema(context);
                    cacheKey = contextCacheKey;
                } catch (ex) {
                    return reply.code(500).send(formatErrorPayload(ex));
                }
            }
            let body: GraphQLRequestBody | GraphQLRequestBody[];
            try {
                body = createRequestBody(request.body);
            } catch (ex) {
                console.error(`Error while creating the body request.`);
                console.error(formatErrorPayload(ex));
                throw ex;
            }
            try {
                const result = await processRequestBody(body, schema, context);
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
