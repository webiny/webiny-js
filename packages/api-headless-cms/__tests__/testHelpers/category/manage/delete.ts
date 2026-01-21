import type { CmsModel } from "~/types/index.js";
import type { ICategoryResponseValues } from "./types.js";
import { ERROR_FIELDS, type IGraphQLErrorResponse } from "~tests/testHelpers/fields/index.js";
import type { IManageQueryBaseResponse } from "~tests/testHelpers/types.js";

export interface IDeleteCategoryMutationVariablesOptions {
    force?: boolean;
    permanently?: boolean;
}

export interface IDeleteCategoryMutationVariables {
    revision: string;
    options?: IDeleteCategoryMutationVariablesOptions;
}

export interface IDeleteCategoryMutationResponse {
    deleteCategory: {
        data: IManageQueryBaseResponse<ICategoryResponseValues> | null;
        error: IGraphQLErrorResponse | null;
    };
}

export const deleteCategoryMutation = (model: Pick<CmsModel, "singularApiName">) => {
    return /* GraphQL */ `
        mutation DeleteCategory($revision: ID!, $options: CmsDeleteEntryOptions) {
            deleteCategory: delete${model.singularApiName}(revision: $revision, options: $options) {
                data
                error ${ERROR_FIELDS}
            }
        }
    `;
};
