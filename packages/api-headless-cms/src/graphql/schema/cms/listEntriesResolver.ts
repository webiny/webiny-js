import type { CmsContext, ApiEndpoint } from "~/types/index.js";
import type { ExecutionResult } from "graphql";
import {
    getModel,
    getErrorMessage,
    buildFieldsSelection,
    transformSortToArray,
    transformWhereToNested
} from "./helpers.js";
import { CmsSchemaExecutor } from "~/graphql/CmsSchemaExecutor.js";

export interface ListEntriesArgs {
    modelId: string;
    where?: Record<string, unknown>;
    sort?: Record<string, unknown> | string[];
    limit?: number;
    after?: string;
    search?: string;
    fields: string[];
    preview?: boolean;
}

export const createListEntriesResolver = () => {
    return async ({ args, context }: { args: ListEntriesArgs; context: CmsContext }) => {
        const { modelId, where, sort, limit, after, search, fields, preview = false } = args;

        try {
            const model = await getModel(context, modelId);

            // Determine which API to use based on the preview flag.
            // preview=true -> preview API, preview=false -> read API
            const apiType: ApiEndpoint = preview ? "preview" : "read";

            const fieldsSelection = buildFieldsSelection(fields);

            // Transform sort to array format expected by the underlying GraphQL schema.
            // Handles both object format {createdOn: "desc"} and array format ["createdOn_DESC"].
            const transformedSort = transformSortToArray(sort);

            // Transform dot-notation where keys (e.g. "values.name") into nested objects
            // (e.g. { values: { name: ... } }) so they match the typed ListWhereInput.
            const transformedWhere = transformWhereToNested(where);

            const query = /* GraphQL */ `
                query List${model.pluralApiName}(
                    $where: ${model.singularApiName}ListWhereInput
                    $sort: [${model.singularApiName}ListSorter!]
                    $limit: Int
                    $after: String
                    $search: String
                ) {
                    list${model.pluralApiName}(
                        where: $where
                        sort: $sort
                        limit: $limit
                        after: $after
                        search: $search
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

            const result = (await context.container.resolve(CmsSchemaExecutor).execute(apiType, {
                query,
                variables: { where: transformedWhere, sort: transformedSort, limit, after, search }
            })) as ExecutionResult;

            if (result.errors && result.errors.length > 0) {
                return {
                    data: [],
                    meta: { cursor: null, hasMoreItems: false, totalCount: 0 },
                    error: {
                        message: result.errors.map(e => e.message).join("; "),
                        code: "LIST_ENTRIES_ERROR"
                    }
                };
            }

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
