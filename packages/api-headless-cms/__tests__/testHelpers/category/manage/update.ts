import type { TestCmsModel } from "~tests/types.js";
import { categoryFields } from "~tests/testHelpers/category/manage/fields.js";
import { ERROR_FIELDS, type IGraphQLErrorResponse } from "~tests/testHelpers/fields/index.js";
import type {
    ICategoryInput,
    ICategoryResponseValues
} from "~tests/testHelpers/category/manage/types.js";
import type { IManageQueryBaseResponse } from "~tests/testHelpers/types.js";

export interface IUpdateCategoryMutationVariables {
    revision: string;
    data?: Partial<ICategoryInput>;
}

export interface IUpdateCategoryMutationResponse {
    updateCategory: {
        data: IManageQueryBaseResponse<ICategoryResponseValues> | null;
        error: IGraphQLErrorResponse | null;
    };
}

export const updateCategoryMutation = (model: Pick<TestCmsModel, "singularApiName">) => {
    return /* GraphQL */ `
        mutation UpdateCategory($revision: ID!, $data: ${model.singularApiName}Input!) {
            updateCategory: update${model.singularApiName}(revision: $revision, data: $data) {
                data ${categoryFields}
                error ${ERROR_FIELDS}
            }
        }
    `;
};
