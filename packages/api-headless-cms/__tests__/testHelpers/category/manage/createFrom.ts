import type { CmsModel } from "~tests/types.js";
import { categoryFields } from "~tests/testHelpers/category/manage/fields.js";
import { ERROR_FIELDS, type IGraphQLErrorResponse } from "~tests/testHelpers/fields/index.js";
import type {
    ICategoryInput,
    ICategoryResponseValues
} from "~tests/testHelpers/category/manage/types.js";
import type { IManageQueryBaseResponse } from "~tests/testHelpers/types.js";

export interface ICreateCategoryFromMutationVariables {
    revision: string;
    data?: ICategoryInput;
}

export interface ICreateCategoryFromMutationResponse {
    createCategoryFrom: {
        data: IManageQueryBaseResponse<ICategoryResponseValues> | null;
        error: IGraphQLErrorResponse | null;
    };
}

export const createCategoryFromMutation = (model: Pick<CmsModel, "singularApiName">) => {
    return /* GraphQL */ `
        mutation CreateCategoryFrom($revision: ID!, $data: ${model.singularApiName}Input) {
            createCategoryFrom: create${model.singularApiName}From(revision: $revision, data: $data) {
                data ${categoryFields}
                error ${ERROR_FIELDS}
            }
        }
    `;
};
