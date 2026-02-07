import type { CmsContext } from "~/types/index.js";
import type { ApiEndpoint } from "~/types/index.js";
import type { GraphQLFieldResolver } from "graphql";
import { getModel, getErrorMessage } from "./helpers.js";

export interface CreateEntryArgs {
    modelId: string;
    values: Record<string, unknown>;
}

export const createCreateEntryResolver = (): GraphQLFieldResolver<
    any,
    CmsContext,
    CreateEntryArgs
> => {
    return async (_, args, context) => {
        const { modelId, values } = args;

        try {
            const model = await getModel(context, modelId);

            // Use manage API for creating entries.
            const apiType: ApiEndpoint = "manage";
            const executeSchema = await context.cms.getExecutableSchema(apiType);

            const query = `
                mutation Create${model.singularApiName}($data: ${model.singularApiName}Input!) {
                    create${model.singularApiName}(data: $data) {
                        data {
                            id
                            entryId
                            values
                        }
                        error {
                            message
                            code
                            data
                        }
                    }
                }
            `;

            const result = await executeSchema({ query, variables: { data: values } });

            const operationName = `create${model.singularApiName}`;
            return result.data?.[operationName] || { data: null, error: null };
        } catch (error) {
            return {
                data: null,
                error: {
                    message: getErrorMessage(error, "Failed to create entry"),
                    code: "CREATE_ENTRY_ERROR"
                }
            };
        }
    };
};
