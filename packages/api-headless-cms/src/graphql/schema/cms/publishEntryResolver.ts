import type { CmsContext } from "~/types/index.js";
import type { ApiEndpoint } from "~/types/index.js";
import type { ExecutionResult } from "graphql";
import {
    getModel,
    getErrorMessage,
    buildFieldsSelection,
    transformFieldErrors
} from "./helpers.js";

export interface PublishEntryRevisionArgs {
    modelId: string;
    revisionId: string;
    fields: string[];
}

export const createPublishEntryRevisionResolver = () => {
    return async ({ args, context }: { args: PublishEntryRevisionArgs; context: CmsContext }) => {
        const { modelId, revisionId, fields } = args;

        try {
            const model = await getModel(context, modelId);

            // Use manage API for publishing entries.
            const apiType: ApiEndpoint = "manage";
            const executeSchema = await context.cms.getExecutableSchema(apiType);

            const fieldsSelection = buildFieldsSelection(fields);

            const query = /* GraphQL */ `
                mutation Publish${model.singularApiName}($revisionId: ID!) {
                    publish${model.singularApiName}(revision: $revisionId) {
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

            if (result.errors && result.errors.length > 0) {
                return {
                    data: null,
                    error: {
                        message: transformFieldErrors(result.errors, fields),
                        code: "PUBLISH_ENTRY_ERROR"
                    }
                };
            }

            const operationName = `publish${model.singularApiName}`;
            return result.data?.[operationName] || { data: null, error: null };
        } catch (error) {
            return {
                data: null,
                error: {
                    message: getErrorMessage(error, "Failed to publish entry"),
                    code: "PUBLISH_ENTRY_ERROR"
                }
            };
        }
    };
};
