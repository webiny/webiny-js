import type { CmsEntryListParams, CmsModel } from "~/types/index.js";
import type { ICategoryResponse } from "~tests/testHelpers/category/manage/types.js";
import { categoryFields } from "./fields.js";
import { ERROR_FIELDS, type IGraphQLErrorResponse } from "~tests/testHelpers/fields/index.js";

export interface IGetCategoriesByIdsQueryVariables extends Partial<CmsEntryListParams> {}

export interface IGetCategoriesByIdsQueryResponse {
    getCategoriesByIds: {
        data: ICategoryResponse[] | null;
        error: IGraphQLErrorResponse | null;
    };
}

export const getCategoriesByIdsQuery = (model: Pick<CmsModel, "pluralApiName">) => {
    return /* GraphQL */ `
        query GetCategories($revisions: [ID!]!) {
            getCategoriesByIds: get${model.pluralApiName}ByIds(revisions: $revisions) {
                data ${categoryFields}
                error ${ERROR_FIELDS}
            }
        }
    `;
};
