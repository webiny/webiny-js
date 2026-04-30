import type { CmsContext } from "~/types/index.js";
import type { ApiEndpoint } from "~/types/index.js";
import type { ExecutionResult } from "graphql";
import { getModel, getErrorMessage, buildFieldsSelection } from "./helpers.js";

export interface CreateEntryArgs {
    modelId: string;
    data: Record<string, unknown>;
    fields: string[];
}

export const createCreateEntryResolver = () => {
    return async ({ args, context }: { args: CreateEntryArgs; context: CmsContext }) => {
        const { modelId, data, fields } = args;

        try {
            const model = await getModel(context, modelId);

            // Use manage API for creating entries.
            const apiType: ApiEndpoint = "manage";
            const executeSchema = await context.cms.getExecutableSchema(apiType);

            const fieldsSelection = buildFieldsSelection(fields);

            const query = /* GraphQL */ `
                mutation Create${model.singularApiName}($data: ${model.singularApiName}Input!) {
                    create${model.singularApiName}(data: $data) {
                        data {
                            ${fieldsSelection}
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
                variables: { data }
            })) as ExecutionResult;

            if (result.errors && result.errors.length > 0) {
                return {
                    data: null,
                    error: {
                        message: result.errors.map(e => e.message).join("; "),
                        code: "CREATE_ENTRY_ERROR"
                    }
                };
            }

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
