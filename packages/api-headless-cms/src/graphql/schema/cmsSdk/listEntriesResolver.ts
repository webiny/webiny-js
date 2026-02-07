import type { CmsContext } from "~/types/index.js";
import type { ApiEndpoint } from "~/types/index.js";
import type { GraphQLFieldResolver } from "graphql";
import type { ListEntriesArgs } from "./types.js";
import { getModel, getErrorMessage, buildFieldsSelection } from "./helpers.js";

export const createListEntriesResolver = (): GraphQLFieldResolver<
    any,
    CmsContext,
    ListEntriesArgs
> => {
    return async (_, args, context) => {
        const { modelId, where, sort, limit, after, fields } = args;

        try {
            const model = await getModel(context, modelId);

            // Use read API for listing published content.
            const apiType: ApiEndpoint = "read";
            const executeSchema = await context.cms.getExecutableSchema(apiType);

            const fieldsSelection = buildFieldsSelection(fields);

            const query = `
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
                        }
                    }
                }
            `;

            const result = await executeSchema({
                query,
                variables: { where, sort, limit, after }
            });

            return (
                result.data?.[`list${model.pluralApiName}`] || {
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
