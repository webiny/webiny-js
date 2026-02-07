import type { CmsContext } from "~/types/index.js";
import type { ApiEndpoint } from "~/types/index.js";
import type { GraphQLFieldResolver } from "graphql";
import type { CreateEntryArgs, UpdateEntryArgs } from "./types.js";
import { getModel, getErrorMessage } from "./helpers.js";

export const createCreateEntryResolver = (): GraphQLFieldResolver<
    any,
    CmsContext,
    CreateEntryArgs
> => {
    return async (_, args, context) => {
        const { modelId, values } = args;

        try {
            const model = await getModel(context, modelId);

            // Use manage API for creating entries.
            const apiType: ApiEndpoint = "manage";
            const executeSchema = await context.cms.getExecutableSchema(apiType);

            const query = `
                mutation Create${model.singularApiName}($data: ${model.singularApiName}Input!) {
                    create${model.singularApiName}(data: $data) {
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

            const result = await executeSchema({ query, variables: { data: values } });

            return result.data?.[`create${model.singularApiName}`] || { data: null, error: null };
        } catch (error) {
            return {
                data: null,
                error: {
                    message: getErrorMessage(error, "Failed to create entry"),
                    code: "CREATE_ENTRY_ERROR"
                }
            };
        }
    };
};

export const createUpdateEntryResolver = (): GraphQLFieldResolver<
    any,
    CmsContext,
    UpdateEntryArgs
> => {
    return async (_, args, context) => {
        const { modelId, id, values } = args;

        try {
            const model = await getModel(context, modelId);

            // Use manage API for updating entries.
            const apiType: ApiEndpoint = "manage";
            const executeSchema = await context.cms.getExecutableSchema(apiType);

            const query = `
                mutation Update${model.singularApiName}($revision: ID!, $data: ${model.singularApiName}Input!) {
                    update${model.singularApiName}(revision: $revision, data: $data) {
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

            const result = await executeSchema({
                query,
                variables: { revision: id, data: values }
            });

            return result.data?.[`update${model.singularApiName}`] || { data: null, error: null };
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
