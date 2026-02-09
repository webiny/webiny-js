import type { CmsContext } from "~/types/index.js";
import type { ApiEndpoint } from "~/types/index.js";
import type { ExecutionResult } from "graphql";
import { getModel, getErrorMessage } from "./helpers.js";

export interface CreateEntryArgs {
    modelId: string;
    values: Record<string, unknown>;
}

export const createCreateEntryResolver = () => {
    return async ({ args, context }: { args: CreateEntryArgs; context: CmsContext }) => {
        const { modelId, values } = args;

        try {
            const model = await getModel(context, modelId);

            // Use manage API for creating entries.
            const apiType: ApiEndpoint = "manage";
            const executeSchema = await context.cms.getExecutableSchema(apiType);

            const query = /* GraphQL */ `
                mutation Create${model.singularApiName}($data: ${model.singularApiName}Input!) {
                    create${model.singularApiName}(data: $data) {
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
                variables: { data: values }
            })) as ExecutionResult;

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
