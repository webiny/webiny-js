import type { CmsModel } from "~/types/index.js";
import type { ICategoryInput, ICategoryResponse } from "./types.js";
import { categoryFields } from "./fields.js";
import { ERROR_FIELDS, type IGraphQLErrorResponse } from "~tests/testHelpers/fields/index.js";

export interface ICreateCategoryMutationVariables {
    data: ICategoryInput;
}

export interface ICreateCategoryMutationResponse {
    createCategory: {
        data: ICategoryResponse | null;
        error: IGraphQLErrorResponse | null;
    };
}

export const createCategoryMutation = (model: Pick<CmsModel, "singularApiName">) => {
    return /* GraphQL */ `
        mutation CreateCategory($data: ${model.singularApiName}Input!) {
            createCategory: create${model.singularApiName}(data: $data) {
                data ${categoryFields}
                error ${ERROR_FIELDS}
            }
        }
    `;
};
