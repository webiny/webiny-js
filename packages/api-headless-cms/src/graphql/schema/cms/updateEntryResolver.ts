import type { CmsContext } from "~/types/index.js";
import type { ApiEndpoint } from "~/types/index.js";
import type { ExecutionResult } from "graphql";
import {
    getModel,
    getErrorMessage,
    buildFieldsSelection,
    transformFieldErrors
} from "./helpers.js";

export interface UpdateEntryRevisionArgs {
    modelId: string;
    revisionId: string;
    data: Record<string, unknown>;
    fields: string[];
}

export const createUpdateEntryRevisionResolver = () => {
    return async ({ args, context }: { args: UpdateEntryRevisionArgs; context: CmsContext }) => {
        const { modelId, revisionId, data, fields } = args;

        try {
            const model = await getModel(context, modelId);

            // Use manage API for updating entries.
            const apiType: ApiEndpoint = "manage";
            const executeSchema = await context.cms.getExecutableSchema(apiType);

            const fieldsSelection = buildFieldsSelection(fields);

            const query = /* GraphQL */ `
                mutation Update${model.singularApiName}($revisionId: ID!, $data: ${model.singularApiName}Input!) {
                    update${model.singularApiName}(revision: $revisionId, data: $data) {
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
                variables: { revisionId, data }
            })) as ExecutionResult;

            if (result.errors && result.errors.length > 0) {
                return {
                    data: null,
                    error: {
                        message: transformFieldErrors(result.errors, fields),
                        code: "UPDATE_ENTRY_ERROR"
                    }
                };
            }

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
