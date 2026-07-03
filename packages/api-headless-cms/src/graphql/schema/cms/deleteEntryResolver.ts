import type { CmsContext, ApiEndpoint } from "~/types/index.js";
import type { ExecutionResult } from "graphql";
import { getModel, getErrorMessage } from "./helpers.js";
import { CmsSchemaExecutor } from "~/graphql/CmsSchemaExecutor.js";

export interface DeleteEntryRevisionArgs {
    modelId: string;
    revisionId: string;
    permanent?: boolean;
}

export const createDeleteEntryRevisionResolver = () => {
    return async ({ args, context }: { args: DeleteEntryRevisionArgs; context: CmsContext }) => {
        const { modelId, revisionId, permanent = false } = args;

        try {
            const model = await getModel(context, modelId);

            // Use manage API for deleting entries.
            const apiType: ApiEndpoint = "manage";

            const query = /* GraphQL */ `
                mutation Delete${model.singularApiName}($revisionId: ID!, $options: CmsDeleteEntryOptions) {
                    delete${model.singularApiName}(revision: $revisionId, options: $options) {
                        data
                        error {
                            message
                            code
                            data
                        }
                    }
                }
            `;

            const result = (await context.container.resolve(CmsSchemaExecutor).execute(apiType, {
                query,
                variables: { revisionId, options: { permanently: permanent } }
            })) as ExecutionResult;

            if (result.errors && result.errors.length > 0) {
                return {
                    data: false,
                    error: {
                        message: result.errors.map(e => e.message).join("; "),
                        code: "DELETE_ENTRY_ERROR"
                    }
                };
            }

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
