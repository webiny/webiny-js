import type { CmsModel } from "~tests/types.js";
import { categoryFields } from "~tests/testHelpers/category/manage/fields.js";
import { ERROR_FIELDS, type IGraphQLErrorResponse } from "~tests/testHelpers/fields/index.js";
import type { ICategoryResponseValues } from "~tests/testHelpers/category/manage/types.js";
import type { IManageQueryBaseResponse } from "~tests/testHelpers/types.js";

export interface IUnpublishCategoryMutationVariables {
    revision: string;
}

export interface IUnpublishCategoryMutationResponse {
    unpublishCategory: {
        data: IManageQueryBaseResponse<ICategoryResponseValues> | null;
        error: IGraphQLErrorResponse | null;
    };
}

export const unpublishCategoryMutation = (model: Pick<CmsModel, "singularApiName">) => {
    return /* GraphQL */ `
        mutation UnpublishCategory($revision: ID!) {
            unpublishCategory: unpublish${model.singularApiName}(revision: $revision) {
                data ${categoryFields}
                error ${ERROR_FIELDS}
            }
        }
    `;
};
