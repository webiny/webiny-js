import type { CmsContext } from "~/types/index.js";
import type { ApiEndpoint } from "~/types/index.js";
import type { ExecutionResult } from "graphql";
import { getModel, getErrorMessage, buildFieldsSelection } from "./helpers.js";

export interface UnpublishEntryRevisionArgs {
    modelId: string;
    revisionId: string;
    fields: string[];
}

export const createUnpublishEntryRevisionResolver = () => {
    return async ({ args, context }: { args: UnpublishEntryRevisionArgs; context: CmsContext }) => {
        const { modelId, revisionId, fields } = args;

        try {
            const model = await getModel(context, modelId);

            // Use manage API for unpublishing entries.
            const apiType: ApiEndpoint = "manage";
            const executeSchema = await context.cms.getExecutableSchema(apiType);

            const fieldsSelection = buildFieldsSelection(fields);

            const query = /* GraphQL */ `
                mutation Unpublish${model.singularApiName}($revisionId: ID!) {
                    unpublish${model.singularApiName}(revision: $revisionId) {
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
                variables: { revisionId }
            })) as ExecutionResult;

            const operationName = `unpublish${model.singularApiName}`;
            return result.data?.[operationName] || { data: null, error: null };
        } catch (error) {
            return {
                data: null,
                error: {
                    message: getErrorMessage(error, "Failed to unpublish entry"),
                    code: "UNPUBLISH_ENTRY_ERROR"
                }
            };
        }
    };
};
