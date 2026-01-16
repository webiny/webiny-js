import type { CmsEntryListParams, CmsModel } from "~/types/index.js";
import type { ICategoryResponseValues } from "~tests/testHelpers/category/manage/types.js";
import {
    ERROR_FIELDS,
    type IGraphQLErrorResponse,
    type IGraphQLMetaResponse,
    META_FIELDS
} from "~tests/testHelpers/fields/index.js";
import { categoryFields } from "./fields.js";
import type { IManageQueryBaseResponse } from "~tests/testHelpers/types.js";

export interface IListDeletedCategoriesQueryVariables extends CmsEntryListParams {}

export interface IListDeletedCategoriesQueryResponse {
    listDeletedCategories: {
        data: IManageQueryBaseResponse<ICategoryResponseValues>[] | null;
        meta: IGraphQLMetaResponse | null;
        error: IGraphQLErrorResponse | null;
    };
}

export const listDeletedCategoriesQuery = (
    model: Pick<CmsModel, "singularApiName" | "pluralApiName">
) => {
    return /* GraphQL */ `
        query ListDeletedCategories(
            $where: ${model.singularApiName}ListWhereInput
            $sort: [${model.singularApiName}ListSorter]
            $limit: Int
            $after: String
        ) {
            listDeletedCategories: listDeleted${model.pluralApiName}(where: $where, sort: $sort, limit: $limit, after: $after) {
                data ${categoryFields}
                meta ${META_FIELDS}
                error ${ERROR_FIELDS}
            }
        }
    `;
};
