import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, GraphQLError, NetworkError } from "../../errors.js";
import type { CmsEntryValues, CmsEntryData } from "./cmsTypes.js";

export interface GetEntryWhere {
    id?: string;
    entryId?: string;
    values?: Record<string, unknown>;
}

export interface GetEntryParams {
    modelId: string;
    where: GetEntryWhere;
    fields: string[];
    preview?: boolean;
}

/**
 * Retrieves a single entry from the CMS.
 *
 * @template TValues - Type of the entry values object
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for retrieving the entry
 * @param params.modelId - The model ID of the entry to retrieve
 * @param params.where - Where conditions to filter the entry. Can filter by id, entryId, or values
 * @param params.where.id - The revision ID (e.g., "123#0001")
 * @param params.where.entryId - The entry ID (e.g., "123")
 * @param params.where.values - Filter by entry values
 * @param params.fields - Fields to include in the response. Use "values." prefix for entry values (e.g., "values.author.name") or specify top-level fields like "createdOn"
 * @param params.preview - When true, uses preview API to access unpublished/draft content. When false (default), uses read API for published content only.
 * @returns Result containing the entry data or an error
 */
export async function getEntry<TValues extends CmsEntryValues = CmsEntryValues>(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    params: GetEntryParams
): Promise<Result<CmsEntryData<TValues>, HttpError | GraphQLError | NetworkError>> {
    const { modelId, where, fields, preview } = params;

    const { executeGraphQL } = await import("../executeGraphQL.js");

    const query = `
        query GetEntry($modelId: ID!, $where: JSON!, $fields: [String!]!, $preview: Boolean) {
            cms {
                getEntry(modelId: $modelId, where: $where, fields: $fields, preview: $preview) {
                    data
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

    const result = await executeGraphQL(config, fetchFn, query, {
        modelId,
        where,
        fields,
        preview
    });

    if (result.isFail()) {
        return Result.fail(result.error);
    }

    const responseData = result.value;

    if (responseData.cms.getEntry.error) {
        const { GraphQLError } = await import("../../errors.js");
        return Result.fail(
            new GraphQLError(
                responseData.cms.getEntry.error.message,
                responseData.cms.getEntry.error.code
            )
        );
    }

    return Result.ok(responseData.cms.getEntry.data);
}
