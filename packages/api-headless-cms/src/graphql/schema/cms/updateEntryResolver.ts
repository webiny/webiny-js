import type { CmsContext } from "~/types/index.js";
import type { ApiEndpoint } from "~/types/index.js";
import type { GraphQLFieldResolver, ExecutionResult } from "graphql";
import { getModel, getErrorMessage } from "./helpers.js";

export interface UpdateEntryArgs {
    modelId: string;
    id: string;
    values: Record<string, unknown>;
}

export const createUpdateEntryResolver = (): GraphQLFieldResolver<
    any,
    CmsContext,
    UpdateEntryArgs
> => {
    return async (_, args, context) => {
        const { modelId, id, values } = args;

        try {
            const model = await getModel(context, modelId);

            // Use manage API for updating entries.
            const apiType: ApiEndpoint = "manage";
            const executeSchema = await context.cms.getExecutableSchema(apiType);

            const query = /* GraphQL */ `
                mutation Update${model.singularApiName}($revision: ID!, $data: ${model.singularApiName}Input!) {
                    update${model.singularApiName}(revision: $revision, data: $data) {
                        data {
                            id
                            entryId
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
                variables: { revision: id, data: values }
            })) as ExecutionResult;

            const operationName = `update${model.singularApiName}`;
            return result.data?.[operationName] || { data: null, error: null };
        } catch (error) {
            return {
                data: null,
                error: {
                    message: getErrorMessage(error, "Failed to update entry"),
                    code: "UPDATE_ENTRY_ERROR"
                }
            };
        }
    };
};
