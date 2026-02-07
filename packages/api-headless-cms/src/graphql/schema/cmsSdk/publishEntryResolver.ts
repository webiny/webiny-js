import type { CmsContext } from "~/types/index.js";
import type { ApiEndpoint } from "~/types/index.js";
import type { GraphQLFieldResolver } from "graphql";
import { getModel, getErrorMessage } from "./helpers.js";

export interface PublishEntryArgs {
    modelId: string;
    id: string;
}

export const createPublishEntryResolver = (): GraphQLFieldResolver<
    any,
    CmsContext,
    PublishEntryArgs
> => {
    return async (_, args, context) => {
        const { modelId, id } = args;

        try {
            const model = await getModel(context, modelId);

            // Use manage API for publishing entries.
            const apiType: ApiEndpoint = "manage";
            const executeSchema = await context.cms.getExecutableSchema(apiType);

            const query = `
                mutation Publish${model.singularApiName}($revision: ID!) {
                    publish${model.singularApiName}(revision: $revision) {
                        data {
                            id
                            entryId
                        }
                        error {
                            message
                            code
                        }
                    }
                }
            `;

            const result = await executeSchema({ query, variables: { revision: id } });

            return result.data?.[`publish${model.singularApiName}`] || { data: null, error: null };
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
