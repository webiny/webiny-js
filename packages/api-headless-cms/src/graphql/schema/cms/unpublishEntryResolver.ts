import type { CmsContext } from "~/types/index.js";
import type { ApiEndpoint } from "~/types/index.js";
import type { GraphQLFieldResolver } from "graphql";
import { getModel, getErrorMessage } from "./helpers.js";

export interface UnpublishEntryArgs {
    modelId: string;
    id: string;
}

export const createUnpublishEntryResolver = (): GraphQLFieldResolver<
    any,
    CmsContext,
    UnpublishEntryArgs
> => {
    return async (_, args, context) => {
        const { modelId, id } = args;

        try {
            const model = await getModel(context, modelId);

            // Use manage API for unpublishing entries.
            const apiType: ApiEndpoint = "manage";
            const executeSchema = await context.cms.getExecutableSchema(apiType);

            const query = /* GraphQL */ `
                mutation Unpublish${model.singularApiName}($revision: ID!) {
                    unpublish${model.singularApiName}(revision: $revision) {
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

            const result = await executeSchema({ query, variables: { revision: id } });

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
