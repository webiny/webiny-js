import { codeFrameColumns } from "@babel/code-frame";
import WebinyError from "@webiny/error";
import { generateSchema } from "./generateSchema";
import { ApiEndpoint, CmsContext } from "~/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { GraphQLSchema } from "graphql";
import { generateCacheId } from "./getSchema/generateCacheId";
import { generateCacheKey } from "./getSchema/generateCacheKey";

interface SchemaCache {
    key: string;
    schema: GraphQLSchema;
}

interface GetSchemaParams {
    context: CmsContext;
    type: ApiEndpoint;
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
}

const schemaList = new Map<string, SchemaCache>();

/**
 * Gets an existing schema or rewrites existing one or creates a completely new one
 * depending on the schemaId created from type and locale parameters
 */
export const getSchema = async (params: GetSchemaParams): Promise<GraphQLSchema> => {
    const { context } = params;

    /**
     * We need all the API models.
     * Private models are hidden in the GraphQL, so filter them out.
     */
    const models = await context.security.withoutAuthorization(async () => {
        return (await context.cms.listModels()).filter(model => {
            return model.isPrivate !== true;
        });
    });

    const cacheId = generateCacheId(params);

    const cacheKey = await generateCacheKey({ ...params, models });
    const cachedSchema = schemaList.get(cacheId);
    if (cachedSchema?.key === cacheKey) {
        return cachedSchema.schema;
    }

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
                    endpoint: context.cms.type
                }
            });
        }
        const [location] = err.locations;

        throw new WebinyError({
            code: "INVALID_GRAPHQL_SCHEMA",
            message: err.message,
            data: {
                invalidSegment: codeFrameColumns(err.source.body, {
                    start: {
                        line: location.line,
                        column: location.column
                    }
                })
            }
        });
    }
};
