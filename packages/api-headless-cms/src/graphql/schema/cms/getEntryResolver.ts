import type { CmsContext } from "~/types/index.js";
import type { ApiEndpoint } from "~/types/index.js";
import type { GraphQLFieldResolver } from "graphql";
import { getModel, getErrorMessage, buildFieldsSelection } from "./helpers.js";

export interface GetEntryArgs {
    modelId: string;
    where: Record<string, unknown>;
    fields?: string[];
    preview?: boolean;
}

export const createGetEntryResolver = (): GraphQLFieldResolver<any, CmsContext, GetEntryArgs> => {
    return async (_, args, context) => {
        const { modelId, where, fields, preview = false } = args;

        try {
            const model = await getModel(context, modelId);

            // Determine which API to use based on the preview flag.
            // preview=true -> preview API, preview=false -> read API
            const apiType: ApiEndpoint = preview ? "preview" : "read";
            const executeSchema = await context.cms.getExecutableSchema(apiType);

            const fieldsSelection = buildFieldsSelection(fields);

            const query = /* GraphQL */ `
                query Get${model.singularApiName}($where: ${model.singularApiName}GetWhereInput!) {
                    get${model.singularApiName}(where: $where) {
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

            const result = await executeSchema({ query, variables: { where } });

            const operationName = `get${model.singularApiName}`;
            return (result.data as any)?.[operationName] || { data: null, error: null };
        } catch (error) {
            return {
                data: null,
                error: {
                    message: getErrorMessage(error, "Failed to get entry"),
                    code: "GET_ENTRY_ERROR"
                }
            };
        }
    };
};
