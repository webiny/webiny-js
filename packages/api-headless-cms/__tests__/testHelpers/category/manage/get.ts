import type { CmsEntryStatus, CmsModel } from "~/types/index.js";
import { categoryFields } from "./fields.js";
import type { ICategoryResponse } from "~tests/testHelpers/category/manage/types.js";
import { ERROR_FIELDS, type IGraphQLErrorResponse } from "~tests/testHelpers/fields/index.js";

export interface IGetCategoryQueryVariables {
    revision?: string;
    entryId?: string;
    status?: CmsEntryStatus;
}

export interface IGetCategoryQueryResponse {
    getCategory: {
        data: ICategoryResponse | null;
        error: IGraphQLErrorResponse | null;
    };
}

export const getCategoryQuery = (model: Pick<CmsModel, "singularApiName">) => {
    return /* GraphQL */ `
        query GetCategory($revision: ID, $entryId: ID, $status: CmsEntryStatusType) {
            getCategory: get${model.singularApiName}(revision: $revision, entryId: $entryId, status: $status) {
                data ${categoryFields}
                error ${ERROR_FIELDS}
            }
        }
    `;
};
