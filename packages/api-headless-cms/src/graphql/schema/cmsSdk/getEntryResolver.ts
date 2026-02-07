import type { CmsContext } from "~/types/index.js";
import type { ApiEndpoint } from "~/types/index.js";
import type { GraphQLFieldResolver } from "graphql";
import type { GetEntryArgs } from "./types.js";
import { getModel, getErrorMessage, buildFieldsSelection } from "./helpers.js";

export const createGetEntryResolver = (): GraphQLFieldResolver<any, CmsContext, GetEntryArgs> => {
    return async (_, args, context) => {
        const { modelId, where, fields } = args;

        try {
            const model = await getModel(context, modelId);

            // Determine which API to use based on the query.
            // For now, we'll use the read API for published content.
            const apiType: ApiEndpoint = "read";
            const executeSchema = await context.cms.getExecutableSchema(apiType);

            const fieldsSelection = buildFieldsSelection(fields);

            const query = `
                query Get${model.singularApiName}($where: ${model.singularApiName}GetWhereInput!) {
                    get${model.singularApiName}(where: $where) {
                        data {
                            ${fieldsSelection}
                        }
                        error {
                            message
                            code
                        }
                    }
                }
            `;

            const result = await executeSchema({ query, variables: { where } });

            return result.data?.[`get${model.singularApiName}`] || { data: null, error: null };
        } catch (error) {
            return {
                data: null,
                error: {
                    message: getErrorMessage(error, "Failed to get entry"),
                    code: "GET_ENTRY_ERROR"
                }
            };
        }
    };
};
