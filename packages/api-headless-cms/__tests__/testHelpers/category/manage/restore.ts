import type { CmsModel } from "~tests/types.js";
import { categoryFields } from "~tests/testHelpers/category/manage/fields.js";
import { ERROR_FIELDS, type IGraphQLErrorResponse } from "~tests/testHelpers/fields/index.js";
import type { ICategoryResponseValues } from "~tests/testHelpers/category/manage/types.js";
import type { IManageQueryBaseResponse } from "~tests/testHelpers/types.js";

export interface IRestoreCategoryMutationVariables {
    revision: string;
}

export interface IRestoreCategoryMutationResponse {
    restoreCategory: {
        data: IManageQueryBaseResponse<ICategoryResponseValues> | null;
        error: IGraphQLErrorResponse | null;
    };
}

export const restoreCategoryFromBinMutation = (model: Pick<CmsModel, "singularApiName">) => {
    return /* GraphQL */ `
        mutation RestoreCategoryFromBin($revision: ID!) {
            restoreCategoryFromBin: restore${model.singularApiName}FromBin(revision: $revision) {
                data ${categoryFields}
                error ${ERROR_FIELDS}
            }
        }
    `;
};
