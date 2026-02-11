import type { CmsContext } from "~/types/index.js";
import type { ApiEndpoint } from "~/types/index.js";
import type { ExecutionResult } from "graphql";
import { getModel, getErrorMessage, buildFieldsSelection } from "./helpers.js";

export interface GetEntryByIdArgs {
    modelId: string;
    id: string;
    fields?: string[];
}

export const createGetEntryByIdResolver = () => {
    return async ({ args, context }: { args: GetEntryByIdArgs; context: CmsContext }) => {
        const { modelId, id, fields } = args;

        try {
            const model = await getModel(context, modelId);

            // Use manage API for getEntryById as it retrieves specific revisions.
            const apiType: ApiEndpoint = "manage";
            const executeSchema = await context.cms.getExecutableSchema(apiType);

            const fieldsSelection = buildFieldsSelection(fields);

            const query = /* GraphQL */ `
                query Get${model.singularApiName}ById($id: ID!) {
                    get${model.singularApiName}(where: { id: $id }) {
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
                variables: { id }
            })) as ExecutionResult;

            const operationName = `get${model.singularApiName}`;
            return result.data?.[operationName] || { data: null, error: null };
        } catch (error) {
            return {
                data: null,
                error: {
                    message: getErrorMessage(error, "Failed to get entry by ID"),
                    code: "GET_ENTRY_BY_ID_ERROR"
                }
            };
        }
    };
};
