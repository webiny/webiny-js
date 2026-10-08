import type { TestCmsModel } from "~tests/types.js";
import { categoryFields } from "~tests/testHelpers/category/manage/fields.js";
import { ERROR_FIELDS, type IGraphQLErrorResponse } from "~tests/testHelpers/fields/index.js";
import type { ICategoryResponseValues } from "~tests/testHelpers/category/manage/types.js";
import type { IManageQueryBaseResponse } from "~tests/testHelpers/types.js";

export interface IDuplicateCategoryMutationVariables {
    revision: string;
}

export interface IDuplicateCategoryMutationResponse {
    duplicateCategory: {
        data: IManageQueryBaseResponse<ICategoryResponseValues> | null;
        error: IGraphQLErrorResponse | null;
    };
}

export const duplicateCategoryMutation = (model: Pick<TestCmsModel, "singularApiName">) => {
    return /* GraphQL */ `
        mutation DuplicateCategory($revision: ID!) {
            duplicateCategory: duplicate${model.singularApiName}(revision: $revision) {
                data ${categoryFields}
                error ${ERROR_FIELDS}
            }
        }
    `;
};
