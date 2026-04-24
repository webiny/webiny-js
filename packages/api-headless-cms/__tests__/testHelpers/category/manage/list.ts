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

export interface IListCategoriesQueryVariables extends CmsEntryListParams {}

export interface IListCategoriesQueryResponse {
    listCategories: {
        data: IManageQueryBaseResponse<ICategoryResponseValues>[] | null;
        meta: IGraphQLMetaResponse | null;
        error: IGraphQLErrorResponse | null;
    };
}

export const listCategoriesQuery = (model: Pick<CmsModel, "singularApiName" | "pluralApiName">) => {
    return /* GraphQL */ `
        query ListCategories(
            $where: ${model.singularApiName}ListWhereInput
            $sort: [${model.singularApiName}ListSorter]
            $limit: Int
            $after: String
            $search: String
        ) {
            listCategories: list${model.pluralApiName}(where: $where, sort: $sort, limit: $limit, after: $after, search: $search) {
                data ${categoryFields}
                meta ${META_FIELDS}
                error ${ERROR_FIELDS}
            }
        }
    `;
};
