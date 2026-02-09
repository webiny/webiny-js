import type { CmsContext } from "~/types/index.js";
import type { ApiEndpoint } from "~/types/index.js";
import type { GraphQLFieldResolver, ExecutionResult } from "graphql";
import { getModel, getErrorMessage } from "./helpers.js";

export interface DeleteEntryArgs {
    modelId: string;
    id: string;
    permanent?: boolean;
}

export const createDeleteEntryResolver = (): GraphQLFieldResolver<
    any,
    CmsContext,
    DeleteEntryArgs
> => {
    return async (_, args, context) => {
        const { modelId, id, permanent = false } = args;

        try {
            const model = await getModel(context, modelId);

            // Use manage API for deleting entries.
            const apiType: ApiEndpoint = "manage";
            const executeSchema = await context.cms.getExecutableSchema(apiType);

            const query = /* GraphQL */ `
                mutation Delete${model.singularApiName}($revision: ID!, $options: CmsDeleteEntryOptions) {
                    delete${model.singularApiName}(revision: $revision, options: $options) {
                        data
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
                variables: {
                    revision: id,
                    options: { permanently: permanent }
                }
            })) as ExecutionResult;

            const operationName = `delete${model.singularApiName}`;
            return result.data?.[operationName] || { data: false, error: null };
        } catch (error) {
            return {
                data: false,
                error: {
                    message: getErrorMessage(error, "Failed to delete entry"),
                    code: "DELETE_ENTRY_ERROR"
                }
            };
        }
    };
};
