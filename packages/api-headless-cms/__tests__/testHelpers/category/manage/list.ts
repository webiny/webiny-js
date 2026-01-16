import type { CmsEntryListParams, CmsModel } from "~/types/index.js";
import type { ICategoryResponse } from "~tests/testHelpers/category/manage/types.js";
import {
    ERROR_FIELDS,
    type IGraphQLErrorResponse,
    type IGraphQLMetaResponse,
    META_FIELDS
} from "~tests/testHelpers/fields/index.js";
import { categoryFields } from "./fields.js";

export interface IListCategoriesQueryVariables {
    where?: CmsEntryListParams | null
    sort?: string[];
    limit?: number;
    after?: string;
}

export interface IListCategoriesQueryResponse {
    listCategories: {
        data: ICategoryResponse[] | null;
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
        ) {
            listCategories: list${model.pluralApiName}(where: $where, sort: $sort, limit: $limit, after: $after) {
                data ${categoryFields}
                meta ${META_FIELDS}
                error ${ERROR_FIELDS}
            }
        }
    `;
};
