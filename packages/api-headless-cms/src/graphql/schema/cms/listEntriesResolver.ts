import type { CmsContext } from "~/types/index.js";
import type { ApiEndpoint } from "~/types/index.js";
import type { ExecutionResult } from "graphql";
import {
    getModel,
    getErrorMessage,
    buildFieldsSelection,
    transformSortToArray
} from "./helpers.js";

export interface ListEntriesArgs {
    modelId: string;
    where?: Record<string, unknown>;
    sort?: Record<string, unknown> | string[];
    limit?: number;
    after?: string;
    fields: string[];
    preview?: boolean;
}

export const createListEntriesResolver = () => {
    return async ({ args, context }: { args: ListEntriesArgs; context: CmsContext }) => {
        const { modelId, where, sort, limit, after, fields, preview = false } = args;

        try {
            const model = await getModel(context, modelId);

            // Determine which API to use based on the preview flag.
            // preview=true -> preview API, preview=false -> read API
            const apiType: ApiEndpoint = preview ? "preview" : "read";
            const executeSchema = await context.cms.getExecutableSchema(apiType);

            const fieldsSelection = buildFieldsSelection(fields);

            // Transform sort to array format expected by the underlying GraphQL schema.
            // Handles both object format {createdOn: "desc"} and array format ["createdOn_DESC"].
            const transformedSort = transformSortToArray(sort);

            const query = /* GraphQL */ `
                query List${model.pluralApiName}(
                    $where: ${model.singularApiName}ListWhereInput
                    $sort: [${model.singularApiName}ListSorter!]
                    $limit: Int
                    $after: String
                ) {
                    list${model.pluralApiName}(
                        where: $where
                        sort: $sort
                        limit: $limit
                        after: $after
                    ) {
                        data {
                            ${fieldsSelection}
                        }
                        meta {
                            cursor
                            hasMoreItems
                            totalCount
                        }
                        error {
                            message
                            code
                            data
                        }
                    }
                }
            `;

            const result = (await executeSchema({
                query,
                variables: { where, sort: transformedSort, limit, after }
            })) as ExecutionResult;

            const operationName = `list${model.pluralApiName}`;
            return (
                result.data?.[operationName] || {
                    data: [],
                    meta: { cursor: null, hasMoreItems: false, totalCount: 0 },
                    error: null
                }
            );
        } catch (error) {
            return {
                data: [],
                meta: { cursor: null, hasMoreItems: false, totalCount: 0 },
                error: {
                    message: getErrorMessage(error, "Failed to list entries"),
                    code: "LIST_ENTRIES_ERROR"
                }
            };
        }
    };
};
