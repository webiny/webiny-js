import type { CmsModel } from "~tests/types.js";
import { categoryFields } from "~tests/testHelpers/category/manage/fields.js";
import { ERROR_FIELDS, type IGraphQLErrorResponse } from "~tests/testHelpers/fields/index.js";
import type { ICategoryInput, ICategoryResponse } from "~tests/testHelpers/category/manage/types.js";

export interface IUpdateCategoryMutationVariables {
    revision: string;
    data?: ICategoryInput;
}

export interface IUpdateCategoryMutationResponse {
    updateCategory: {
        data: ICategoryResponse | null;
        error: IGraphQLErrorResponse | null;
    };
}

export const updateCategoryMutation = (model: Pick<CmsModel, "singularApiName">) => {
    return /* GraphQL */ `
        mutation UpdateCategory($revision: ID!, $data: ${model.singularApiName}Input!) {
            updateCategory: update${model.singularApiName}(revision: $revision, data: $data) {
                data ${categoryFields}
                error ${ERROR_FIELDS}
            }
        }
    `;
};
