import { GraphQLSchema } from "graphql";
import { ApiEndpoint, CmsContext } from "~/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { NotAuthorizedError } from "@webiny/api-security";
import { PluginCollection } from "@webiny/plugins/types";
import debugPlugins from "@webiny/handler-graphql/debugPlugins";
import processRequestBody from "@webiny/handler-graphql/processRequestBody";
import { buildSchemaPlugins } from "./buildSchemaPlugins";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { GraphQLRequestBody } from "@webiny/handler-graphql/types";
import { RoutePlugin } from "@webiny/handler";
import WebinyError from "@webiny/error";
// @ts-ignore `code-frame` has no types
import codeFrame from "code-frame";
import { createExecutableSchema } from "~/graphql/createExecutableSchema";

interface SchemaCache {
    key: string;
    schema: GraphQLSchema;
}
interface GetSchemaParams {
    context: CmsContext;
    type: ApiEndpoint;
    locale: I18NLocale;
}

const createRequestBody = (body: unknown): GraphQLRequestBody | GraphQLRequestBody[] => {
    /**
     * We are trusting that the body payload is correct.
     * The `processRequestBody` will fail if it is not.
     */
    return typeof body === "string" ? JSON.parse(body) : body;
};

const schemaList = new Map<string, SchemaCache>();

const generateCacheKey = async (args: GetSchemaParams): Promise<string> => {
    const { context, locale, type } = args;
    const lastModelChange = await context.cms.getModelLastChange();
    return [locale.code, type, lastModelChange.toISOString()].join("#");
};

const generateSchema = async (args: GetSchemaParams): Promise<GraphQLSchema> => {
    const { context } = args;

    // Load model data
    context.security.disableAuthorization();
    const models = (await context.cms.listModels()).filter(model => model.isPrivate !== true);
    context.security.enableAuthorization();

    let generatedSchemaPlugins: GraphQLSchemaPlugin<CmsContext>[] = [];
    try {
        generatedSchemaPlugins = await buildSchemaPlugins({ context, models });
    } catch (ex) {
        console.log(`Error while building schema plugins.`);
        throw ex;
    }

    context.plugins.register(generatedSchemaPlugins);

    const schemaPlugins = context.plugins.byType<GraphQLSchemaPlugin>(GraphQLSchemaPlugin.type);
    return createExecutableSchema({
        plugins: schemaPlugins
    });
};

/**
 * Gets an existing schema or rewrites existing one or creates a completely new one
 * depending on the schemaId created from type and locale parameters
 */
const getSchema = async (params: GetSchemaParams): Promise<GraphQLSchema> => {
    const { context, type, locale } = params;
    const tenantId = context.tenancy.getCurrentTenant().id;
    const id = `${tenantId}#${type}#${locale.code}`;

    const cacheKey = await generateCacheKey(params);
    const cachedSchema = schemaList.get(id);
    if (cachedSchema?.key === cacheKey) {
        return cachedSchema.schema;
    }
    try {
        const schema = await generateSchema(params);
        schemaList.set(id, {
            key: cacheKey,
            schema
        });
        return schema;
    } catch (err) {
        if (!Array.isArray(err.locations)) {
            throw new WebinyError({
                message: err.message,
                code: err.code || "INVALID_GRAPHQL_SCHEMA_LOCATIONS",
                data: {
                    ...(err.data || {}),
                    locations: err.locations
                }
            });
        }
        const [location] = err.locations;

        throw new WebinyError({
            code: "INVALID_GRAPHQL_SCHEMA",
            message: err.message,
            data: {
                invalidSegment: codeFrame(err.source.body, location.line, location.column, {
                    frameSize: 15
                })
            }
        });
    }
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

const formatErrorPayload = (error: Error): string => {
    if (error instanceof WebinyError) {
        return JSON.stringify({
            type: "CmsGraphQLWebinyError",
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

export interface GraphQLHandlerFactoryParams {
    debug?: boolean;
}

const cmsRoutes = new RoutePlugin<CmsContext>(({ onPost, onOptions, context }) => {
    onPost("/cms/:type(^manage|preview|read$)/:locale", async (request, reply) => {
        try {
            await checkEndpointAccess(context);
        } catch (ex) {
            return reply.code(401).send({
                data: null,
                error: {
                    message: ex.message || "Not authorized!",
                    code: ex.code || "SECURITY_NOT_AUTHORIZED",
                    data: ex.data || null,
                    stack: null
                }
            });
        }

        let schema: GraphQLSchema;
        try {
            schema = await getSchema({
                context,
                locale: context.cms.getLocale(),
                type: context.cms.type as ApiEndpoint
            });
        } catch (ex) {
            console.log(`Error while generating the schema.`);
            console.log(formatErrorPayload(ex));
            throw ex;
        }

        let body: GraphQLRequestBody | GraphQLRequestBody[] = [];
        try {
            body = createRequestBody(request.body);
        } catch (ex) {
            console.log(`Error while creating the body request.`);
            console.log(formatErrorPayload(ex));
            throw ex;
        }

        try {
            const result = await processRequestBody(body, schema, context);
            return reply.code(200).send(result);
        } catch (ex) {
            console.log(`Error while processing the body request.`);
            console.log(formatErrorPayload(ex));
            throw ex;
        }
    });

    onOptions("/cms/:type(^manage|preview|read$)/:locale", async (_, reply) => {
        return reply.status(204).send({}).hijack();
    });
});

cmsRoutes.name = "headless-cms.graphql.route.default";

export const graphQLHandlerFactory = ({ debug }: GraphQLHandlerFactoryParams): PluginCollection => {
    return [
        ...(debug ? debugPlugins() : []),
        cmsRoutes,
        {
            type: "wcp-telemetry-tracker"
        }
    ];
};
