import { CmsModel } from "~/types";
import { GraphQLHandlerParams, useGraphQLHandler } from "./useGraphQLHandler";
import { getCmsModel } from "~tests/contentAPI/mocks/contentModels";

const categoryFields = `
    id
    entryId
    createdOn
    savedOn
    title
    slug
`;

const errorFields = `
    error {
        code
        message
        data
    }
`;

const getCategoryQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query GetCategory($where: ${model.singularApiName}GetWhereInput!) {
            getCategory: get${model.singularApiName}(where: $where) {
                data {
                    ${categoryFields}
                }
                ${errorFields}
            }
        }
    `;
};

const listCategoriesQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query ListCategories(
            $where: ${model.singularApiName}ListWhereInput
            $sort: [${model.singularApiName}ListSorter]
            $limit: Int
            $after: String
        ) {
            listCategories: list${model.pluralApiName}(where: $where, sort: $sort, limit: $limit, after: $after) {
                data {
                    id
                    createdOn
                    savedOn
                    title
                    slug
                }
                meta {
                    cursor
                    hasMoreItems
                    totalCount
                }
                ${errorFields}
            }
        }
    `;
};

export const useCategoryReadHandler = (params: GraphQLHandlerParams) => {
    const contentHandler = useGraphQLHandler(params);

    const model = getCmsModel("category");

    return {
        ...contentHandler,
        async getCategory(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getCategoryQuery(model), variables },
                headers
            });
        },
        async listCategories(variables = {}, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: listCategoriesQuery(model), variables },
                headers
            });
        }
    };
};
