import type { CmsModel } from "~/types/index.js";
import type { ICategoryResponseValues } from "./types.js";
import { ERROR_FIELDS, type IGraphQLErrorResponse } from "~tests/testHelpers/fields/index.js";
import { categoryFields } from "~tests/testHelpers/category/manage/fields.js";
import type { IManageQueryBaseResponse } from "~tests/testHelpers/types.js";

export interface IDeleteCategoriesMutationVariables {
    entries: string[];
}

export interface IDeleteCategoriesMutationResponse {
    deleteCategories: {
        data: IManageQueryBaseResponse<ICategoryResponseValues>[] | null;
        error: IGraphQLErrorResponse | null;
    };
}

export const deleteCategoriesMutation = (model: Pick<CmsModel, "pluralApiName">) => {
    return /* GraphQL */ `
        mutation DeleteCategories($entries: [ID!]!) {
            deleteCategories: deleteMultiple${model.pluralApiName}(entries: $entries) {
                data ${categoryFields}
                error ${ERROR_FIELDS}
            }
        }
    `;
};
