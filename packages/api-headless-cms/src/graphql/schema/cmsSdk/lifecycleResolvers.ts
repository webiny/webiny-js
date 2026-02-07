import type { CmsContext } from "~/types/index.js";
import type { ApiEndpoint } from "~/types/index.js";
import type { GraphQLFieldResolver } from "graphql";
import type { DeleteEntryArgs, PublishEntryArgs, UnpublishEntryArgs } from "./types.js";
import { getModel, getErrorMessage } from "./helpers.js";

export const createDeleteEntryResolver = (): GraphQLFieldResolver<
    any,
    CmsContext,
    DeleteEntryArgs
> => {
    return async (_, args, context) => {
        const { modelId, id, permanent = false } = args;

        try {
            const model = await getModel(context, modelId);

            // Use manage API for deleting entries.
            const apiType: ApiEndpoint = "manage";
            const executeSchema = await context.cms.getExecutableSchema(apiType);

            const query = `
                mutation Delete${model.singularApiName}($revision: ID!, $options: CmsDeleteEntryOptions) {
                    delete${model.singularApiName}(revision: $revision, options: $options) {
                        data
                        error {
                            message
                            code
                        }
                    }
                }
            `;

            const result = await executeSchema({
                query,
                variables: {
                    revision: id,
                    options: { permanently: permanent }
                }
            });

            return result.data?.[`delete${model.singularApiName}`] || { data: false, error: null };
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

            const query = `
                mutation Unpublish${model.singularApiName}($revision: ID!) {
                    unpublish${model.singularApiName}(revision: $revision) {
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

            return result.data?.[`unpublish${model.singularApiName}`] || { data: null, error: null };
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
