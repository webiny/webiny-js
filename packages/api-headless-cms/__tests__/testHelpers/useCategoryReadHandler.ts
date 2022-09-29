import { GraphQLHandlerParams, useGraphQLHandler } from "./useGraphQLHandler";

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

const getCategoryQuery = /* GraphQL */ `
    query GetCategory($where: CategoryGetWhereInput!) {
        getCategory(where: $where) {
            data {
                ${categoryFields}
            }
            ${errorFields}
        }
    }
`;

const listCategoriesQuery = /* GraphQL */ `
    query ListCategories(
        $where: CategoryListWhereInput
        $sort: [CategoryListSorter]
        $limit: Int
        $after: String
    ) {
        listCategories(where: $where, sort: $sort, limit: $limit, after: $after) {
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

export const useCategoryReadHandler = (params: GraphQLHandlerParams) => {
    const contentHandler = useGraphQLHandler(params);

    return {
        ...contentHandler,
        async getCategory(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getCategoryQuery, variables },
                headers
            });
        },
        async listCategories(variables = {}, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: listCategoriesQuery, variables },
                headers
            });
        }
    };
};
