// @ts-expect-error `code-frame` has no types
import codeFrame from "code-frame";
import WebinyError from "@webiny/error";
import { generateSchema } from "./generateSchema";
import { ApiEndpoint, CmsContext, CmsModel } from "~/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { GraphQLSchema } from "graphql";
import crypto from "crypto";

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
interface GenerateCacheKeyParams {
    models: Pick<CmsModel, "modelId" | "singularApiName" | "pluralApiName" | "savedOn">[];
}
const generateCacheKey = async (params: GenerateCacheKeyParams): Promise<string> => {
    const { models } = params;

    const keys: string[] = [];
    for (const model of models) {
        const savedOn = model.savedOn;
        const value =
            // @ts-expect-error
            savedOn instanceof Date || savedOn?.toISOString
                ? // @ts-expect-error
                  savedOn.toISOString()
                : savedOn || "unknown";
        keys.push(model.modelId, model.singularApiName, model.pluralApiName, value);
    }
    const key = keys.join("#");

    const hash = crypto.createHash("sha1");
    hash.update(key);
    return hash.digest("hex");
};

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
                invalidSegment: codeFrame(err.source.body, location.line, location.column, {
                    frameSize: 15
                })
            }
        });
    }
};
