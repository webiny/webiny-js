import { GraphQLSchema } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { I18NLocale } from "@webiny/api-i18n/types";
import { NotAuthorizedError } from "@webiny/api-security";
import { PluginCollection } from "@webiny/plugins/types";
import processRequestBody from "@webiny/handler-graphql/processRequestBody";
import buildSchemaPlugins from "./plugins/buildSchemaPlugins";
import { CmsContext } from "../types";

interface SchemaCache {
    key: string;
    schema: GraphQLSchema;
}
interface Args {
    context: CmsContext;
    type: string;
    locale: I18NLocale;
}
interface ParsedBody {
    query: string;
    variables: any;
    operationName: string;
}

const DEFAULT_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
    "Content-Type": "application/json"
};

const respond = (http, result: unknown) => {
    return http.response({
        body: JSON.stringify(result),
        statusCode: 200,
        headers: DEFAULT_HEADERS
    });
};
const schemaList = new Map<string, SchemaCache>();

const generateCacheKey = async (args: Args): Promise<string> => {
    const { context, locale, type } = args;
    const lastModelChange = await context.cms.settings.getContentModelLastChange();
    return [locale.code, type, lastModelChange.toISOString()].join("#");
};

const generateSchema = async (args: Args): Promise<GraphQLSchema> => {
    const { context } = args;

    const schemaPlugins = await buildSchemaPlugins(context);

    const typeDefs = [];
    const resolvers = [];

    // Get schema definitions from plugins
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
    const tenantId = context.security.getTenant().id;
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
    const cache = schemaList.get(id);
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

export const graphQLHandlerFactory = (): PluginCollection => {
    return [
        {
            type: "handler",
            name: "handler-graphql-content-model",
            async handle(context: CmsContext, next) {
                const { http } = context;

                if (!http || !http.request || !http.request.path || !http.request.path.parameters) {
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

                try {
                    await checkEndpointAccess(context);
                } catch (ex) {
                    const result = {
                        data: null,
                        errors: [
                            { message: ex.data.reason || ex.message, extensions: { code: ex.code } }
                        ]
                    };

                    context.plugins.byType("handler-graphql-after-query").forEach(pl => {
                        pl.apply(result, context);
                    });

                    return respond(http, result);
                }

                try {
                    const schema = await getSchema({
                        context,
                        locale: context.cms.getLocale(),
                        type: context.cms.type
                    });

                    const body: ParsedBody | ParsedBody[] = JSON.parse(http.request.body);

                    const result = await processRequestBody(body, schema, context);
                    
                    return respond(http, result);
                } catch (ex) {
                    const report = {
                        errors: [
                            {
                                message: ex.message,
                                extensions: {
                                    name: ex.constructor.name,
                                    code: ex.code,
                                    data: ex.data || {},
                                    stack: ex.stack
                                }
                            }
                        ]
                    };
                    
                    context.plugins.byType("handler-graphql-after-query").forEach(pl => {
                        pl.apply(report, context);
                    });

                    const body = JSON.stringify(report);

                    console.log("[@webiny/api-headless-cms] An error occurred: ", body);

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
        }
    ];
};
