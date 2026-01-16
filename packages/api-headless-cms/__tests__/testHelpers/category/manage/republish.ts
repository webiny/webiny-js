import type { CmsModel } from "~tests/types.js";
import { categoryFields } from "~tests/testHelpers/category/manage/fields.js";
import { ERROR_FIELDS, type IGraphQLErrorResponse } from "~tests/testHelpers/fields/index.js";
import type { ICategoryResponse } from "~tests/testHelpers/category/manage/types.js";

export interface IRepublishCategoryMutationVariables {
    revision: string;
}

export interface IRepublishCategoryMutationResponse {
    republishCategory: {
        data: ICategoryResponse | null;
        error: IGraphQLErrorResponse | null;
    };
}

export const republishCategoryMutation = (model: Pick<CmsModel, "singularApiName">) => {
    return /* GraphQL */ `
        mutation RepublishCategory($revision: ID!) {
            republishCategory: republish${model.singularApiName}(revision: $revision) {
                data ${categoryFields}
                error ${ERROR_FIELDS}
            }
        }
    `;
};
