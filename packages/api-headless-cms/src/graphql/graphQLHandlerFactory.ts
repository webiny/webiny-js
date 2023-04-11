import WebinyError from "@webiny/error";
// @ts-ignore `code-frame` has no types
import codeFrame from "code-frame";
import debugPlugins from "@webiny/handler-graphql/debugPlugins";
import processRequestBody from "@webiny/handler-graphql/processRequestBody";
import { ExecutionResult, GraphQLSchema } from "graphql";
import { ApiEndpoint, CmsContext } from "~/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { NotAuthorizedError } from "@webiny/api-security";
import { PluginCollection } from "@webiny/plugins/types";
import { GraphQLRequestBody } from "@webiny/handler-graphql/types";
import { RoutePlugin } from "@webiny/handler";
import { generateSchema } from "~/graphql/generateSchema";
import { Tenant } from "@webiny/api-tenancy/types";

interface SchemaCache {
    key: string;
    schema: GraphQLSchema;
}

interface GetSchemaParams {
    context: CmsContext;
    type: ApiEndpoint;
    getLastModifiedTime: () => Promise<Date | null>;
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
}

const createRequestBody = (body: unknown): GraphQLRequestBody | GraphQLRequestBody[] => {
    /**
     * We are trusting that the body payload is correct.
     * The `processRequestBody` will fail if it is not.
     */
    return typeof body === "string" ? JSON.parse(body) : body;
};

const schemaList = new Map<string, SchemaCache>();

/**
 * Method generates cache ID based on:
 * - tenant
 * - endpoint type
 * - locale
 */
type GenerateCacheIdParams = Pick<GetSchemaParams, "getTenant" | "getLocale" | "type">;
const generateCacheId = (params: GenerateCacheIdParams): string => {
    const { getTenant, type, getLocale } = params;
    return [`tenant:${getTenant().id}`, `endpoint:${type}`, `locale:${getLocale().code}`].join("#");
};
/**
 * Method generates cache key based on last model change time.
 * Or sets "unknown" - possible when no models in database.
 */
type GenerateCacheKeyParams = Pick<GetSchemaParams, "getLastModifiedTime">;
const generateCacheKey = async (params: GenerateCacheKeyParams): Promise<string> => {
    const { getLastModifiedTime } = params;
    const lastModelChange = await getLastModifiedTime();
    if (!lastModelChange) {
        return "unknown";
    }
    return lastModelChange.toISOString();
};

/**
 * Gets an existing schema or rewrites existing one or creates a completely new one
 * depending on the schemaId created from type and locale parameters
 */
const getSchema = async (params: GetSchemaParams): Promise<GraphQLSchema> => {
    const { context } = params;

    const cacheId = generateCacheId(params);

    const cacheKey = await generateCacheKey(params);
    const cachedSchema = schemaList.get(cacheId);
    if (cachedSchema?.key === cacheKey) {
        return cachedSchema.schema;
    }

    /**
     * We need all the API models.
     * Private models are hidden in the GraphQL, so filter them out.
     */
    const models = await context.security.withoutAuthorization(async () => {
        return (await context.cms.listModels()).filter(model => {
            return model.isPrivate !== true;
        });
    });
    try {
        const schema = await generateSchema({
            ...params,
            models
        });
        schemaList.set(cacheId, {
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

        const getTenant = () => {
            return context.tenancy.getCurrentTenant();
        };

        const getLastModifiedTime = async () => {
            return context.cms.getModelLastChange();
        };

        const schema = await context.benchmark.measure(
            "headlessCms.graphql.getSchema",
            async () => {
                try {
                    return await getSchema({
                        context,
                        getTenant,
                        getLastModifiedTime,
                        getLocale: () => {
                            return context.cms.getLocale();
                        },
                        type: context.cms.type as ApiEndpoint
                    });
                } catch (ex) {
                    console.error(`Error while generating the schema.`);
                    console.error(formatErrorPayload(ex));
                    throw ex;
                }
            }
        );

        const body = await context.benchmark.measure(
            "headlessCms.graphql.createRequestBody",
            async () => {
                try {
                    return createRequestBody(request.body);
                } catch (ex) {
                    console.error(`Error while creating the body request.`);
                    console.error(formatErrorPayload(ex));
                    throw ex;
                }
            }
        );

        /**
         * We need to store the processRequestBody result in a variable and output it after the measurement.
         * Otherwise, the measurement will not be shown in the output.
         */
        let result: ExecutionResult[] | ExecutionResult | null = null;

        await context.benchmark.measure("headlessCms.graphql.processRequestBody", async () => {
            try {
                result = await processRequestBody(body, schema, context);
            } catch (ex) {
                console.error(`Error while processing the body request.`);
                console.error(formatErrorPayload(ex));
                throw ex;
            }
        });

        return reply.code(200).send(result);
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
