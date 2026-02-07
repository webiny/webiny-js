import type { CmsSdkConfig, ListEntriesParams, ListEntriesResult } from "../types.js";
import { executeGraphQL } from "./executeGraphQL.js";

export async function listEntries(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    params: ListEntriesParams
): Promise<ListEntriesResult> {
    const {
        modelId,
        where,
        sort,
        limit = 10,
        after,
        include,
        exclude,
        excludeType,
        fields,
        preview
    } = params;

    const query = `
        query ListEntries(
            $modelId: String!
            $where: JSON
            $sort: JSON
            $limit: Int
            $after: String
            $include: [String!]
            $exclude: [String!]
            $excludeType: [String!]
            $fields: [String!]
            $preview: Boolean
        ) {
            cms {
                listEntries(
                    modelId: $modelId
                    where: $where
                    sort: $sort
                    limit: $limit
                    after: $after
                    include: $include
                    exclude: $exclude
                    excludeType: $excludeType
                    fields: $fields
                    preview: $preview
                ) {
                    data
                    meta {
                        cursor
                        hasMoreItems
                        totalCount
                    }
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

    const data = await executeGraphQL(config, fetchFn, query, {
        modelId,
        where,
        sort,
        limit,
        after,
        include,
        exclude,
        excludeType,
        fields,
        preview
    });

    if (data.cms.listEntries.error) {
        throw new Error(data.cms.listEntries.error.message);
    }

    return {
        items: data.cms.listEntries.data,
        meta: data.cms.listEntries.meta
    };
}
