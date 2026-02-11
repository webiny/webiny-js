import type { CmsContext } from "~/types/index.js";
import type { ApiEndpoint } from "~/types/index.js";
import type { ExecutionResult } from "graphql";
import { getModel, getErrorMessage, buildFieldsSelection } from "./helpers.js";

export interface UpdateEntryArgs {
    modelId: string;
    id: string;
    data: Record<string, unknown>;
    fields?: string[];
}

export const createUpdateEntryResolver = () => {
    return async ({ args, context }: { args: UpdateEntryArgs; context: CmsContext }) => {
        const { modelId, id, data, fields } = args;

        try {
            const model = await getModel(context, modelId);

            // Use manage API for updating entries.
            const apiType: ApiEndpoint = "manage";
            const executeSchema = await context.cms.getExecutableSchema(apiType);

            const fieldsSelection = buildFieldsSelection(fields);

            const query = /* GraphQL */ `
                mutation Update${model.singularApiName}($revision: ID!, $data: ${model.singularApiName}Input!) {
                    update${model.singularApiName}(revision: $revision, data: $data) {
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
                variables: { revision: id, data }
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
