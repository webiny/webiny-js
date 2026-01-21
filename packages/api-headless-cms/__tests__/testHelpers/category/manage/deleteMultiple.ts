import type { CmsModel } from "~/types/index.js";
import { ERROR_FIELDS, type IGraphQLErrorResponse } from "~tests/testHelpers/fields/index.js";

export interface IDeleteCategoriesMutationVariables {
    entries: string[];
}

export interface IDeleteCategoriesMutationResponse {
    deleteCategories: {
        data: { id: string }[] | null;
        error: IGraphQLErrorResponse | null;
    };
}

export const deleteCategoriesMutation = (model: Pick<CmsModel, "pluralApiName">) => {
    return /* GraphQL */ `
        mutation DeleteCategories($entries: [ID!]!) {
            deleteCategories: deleteMultiple${model.pluralApiName}(entries: $entries) {
                data {
                    id
                }
                error ${ERROR_FIELDS}
            }
        }
    `;
};
