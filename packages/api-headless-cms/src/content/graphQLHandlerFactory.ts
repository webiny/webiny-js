import { boolean } from "boolean";
import { GraphQLSchema } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { CmsContext } from "~/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { NotAuthorizedError, NotAuthorizedResponse } from "@webiny/api-security";
import { PluginCollection } from "@webiny/plugins/types";
import debugPlugins from "@webiny/handler-graphql/debugPlugins";
import processRequestBody from "@webiny/handler-graphql/processRequestBody";
import buildSchemaPlugins from "./plugins/buildSchemaPlugins";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { getWebinyVersionHeaders } from "@webiny/utils";
import { HttpObject } from "@webiny/handler-http/types";
import { HandlerPlugin } from "@webiny/handler/types";
import { GraphQLRequestBody } from "@webiny/handler-graphql/types";

export interface CreateGraphQLHandlerOptions {
    debug?: boolean;
}
interface SchemaCache {
    key: string;
    schema: GraphQLSchema;
}
interface Args {
    context: CmsContext;
    type: string;
    locale: I18NLocale;
}

const DEFAULT_HEADERS: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
    "Content-Type": "application/json",
    ...getWebinyVersionHeaders()
};

const DEFAULT_CACHE_MAX_AGE = 30758400; // 1 year

const OPTIONS_HEADERS: Record<string, string> = {
    "Access-Control-Max-Age": `${DEFAULT_CACHE_MAX_AGE}`,
    "Cache-Control": `public, max-age=${DEFAULT_CACHE_MAX_AGE}`
};

const respond = (http: HttpObject, result: unknown) => {
    return http.response({
        body: JSON.stringify(result),
        statusCode: 200,
        headers: DEFAULT_HEADERS
    });
};
const schemaList = new Map<string, SchemaCache>();

const generateCacheKey = async (args: Args): Promise<string> => {
    const { context, locale, type } = args;
    const lastModelChange = await context.cms.getModelLastChange();
    return [locale.code, type, lastModelChange.toISOString()].join("#");
};

const generateSchema = async (args: Args): Promise<GraphQLSchema> => {
    const { context } = args;

    context.plugins.register(await buildSchemaPlugins(context));
    /**
     * Really hard to type this to satisfy the makeExecutableSchema
     */
    // TODO @ts-refactor
    const typeDefs: any = [];
    const resolvers: any = [];

    // Get schema definitions from plugins
    const schemaPlugins = context.plugins.byType<GraphQLSchemaPlugin>(GraphQLSchemaPlugin.type);
    for (const pl of schemaPlugins) {
        typeDefs.push(pl.schema.typeDefs);
        resolvers.push(pl.schema.resolvers);
    }

    return makeExecutableSchema({
        typeDefs,
        resolvers
    });
};

// gets an existing schema or rewrites existing one or creates a completely new one
// depending on the schemaId created from type and locale parameters
const getSchema = async (args: Args): Promise<GraphQLSchema> => {
    const { context, type, locale } = args;
    const tenantId = context.tenancy.getCurrentTenant().id;
    const id = `${tenantId}#${type}#${locale.code}`;

    const cacheKey = await generateCacheKey(args);
    if (!schemaList.has(id)) {
        const schema = await generateSchema(args);

        schemaList.set(id, {
            key: cacheKey,
            schema
        });
        return schema;
    }
    /**
     * Safe to cast because check was done few lines up.
     */
    const cache = schemaList.get(id) as SchemaCache;
    if (cache.key === cacheKey) {
        return cache.schema;
    }
    const schema = await generateSchema(args);
    schemaList.set(id, {
        key: cacheKey,
        schema
    });
    return schema;
};

const checkEndpointAccess = async (context: CmsContext): Promise<void> => {
    const permission = await context.security.getPermission(`cms.endpoint.${context.cms.type}`);
    if (!permission) {
        throw new NotAuthorizedError({
            data: {
                reason: `Not allowed to access "${context.cms.type}" endpoint.`
            }
        });
    }
};

export const graphQLHandlerFactory = (
    options: CreateGraphQLHandlerOptions = {}
): PluginCollection => {
    const debug = boolean(options.debug);

    const handler: HandlerPlugin = {
        type: "handler",
        name: "handler-graphql-content-model",
        async handle(context: CmsContext, next) {
            const { http } = context;

            if (!http || !http.request) {
                return next();
            }

            const method = (http.request.method || "").toLowerCase();
            /**
             * In case of OPTIONS method we just return the headers since there is no need to go further.
             */
            if (method.toLowerCase() === "options") {
                return http.response({
                    statusCode: 204,
                    headers: {
                        ...DEFAULT_HEADERS,
                        ...OPTIONS_HEADERS
                    }
                });
            }
            /**
             * We expect, and allow, only POST method to access our GraphQL
             */
            if (method !== "post") {
                return next();
            }

            try {
                await checkEndpointAccess(context);
            } catch (ex) {
                return respond(http, new NotAuthorizedResponse(ex));
            }

            const schema = await getSchema({
                context,
                locale: context.cms.getLocale(),
                type: context.cms.type
            });

            const body: GraphQLRequestBody | GraphQLRequestBody[] = JSON.parse(http.request.body);

            const result = await processRequestBody(body, schema, context);
            return respond(http, result);
        }
    };

    return [...(debug ? debugPlugins() : []), handler, { type: "wcp-telemetry-tracker" }];
};
