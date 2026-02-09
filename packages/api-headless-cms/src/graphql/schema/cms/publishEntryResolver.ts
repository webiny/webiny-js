import type { CmsContext } from "~/types/index.js";
import type { ApiEndpoint } from "~/types/index.js";
import type { ExecutionResult } from "graphql";
import { getModel, getErrorMessage } from "./helpers.js";

export interface PublishEntryArgs {
    modelId: string;
    id: string;
}

export const createPublishEntryResolver = () => {
    return async ({ args, context }: { args: PublishEntryArgs; context: CmsContext }) => {
        const { modelId, id } = args;

        try {
            const model = await getModel(context, modelId);

            // Use manage API for publishing entries.
            const apiType: ApiEndpoint = "manage";
            const executeSchema = await context.cms.getExecutableSchema(apiType);

            const query = /* GraphQL */ `
                mutation Publish${model.singularApiName}($revision: ID!) {
                    publish${model.singularApiName}(revision: $revision) {
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
                variables: { revision: id }
            })) as ExecutionResult;

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
