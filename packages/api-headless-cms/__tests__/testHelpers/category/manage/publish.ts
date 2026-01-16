import type { CmsModel } from "~tests/types.js";
import { categoryFields } from "~tests/testHelpers/category/manage/fields.js";
import { ERROR_FIELDS, type IGraphQLErrorResponse } from "~tests/testHelpers/fields/index.js";
import type { ICategoryResponse } from "~tests/testHelpers/category/manage/types.js";

export interface IPublishCategoryMutationVariables {
    revision: string;
}

export interface IPublishCategoryMutationResponse {
    publishCategory: {
        data: ICategoryResponse | null;
        error: IGraphQLErrorResponse | null;
    };
}

export const publishCategoryMutation = (model: Pick<CmsModel, "singularApiName">) => {
    return /* GraphQL */ `
        mutation PublishCategory($revision: ID!) {
            publishCategory: publish${model.singularApiName}(revision: $revision) {
                data ${categoryFields}
                error ${ERROR_FIELDS}
            }
        }
    `;
};
