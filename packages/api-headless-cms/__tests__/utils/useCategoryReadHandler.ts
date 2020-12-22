import { useContentGqlHandler } from "./useContentGqlHandler";

const categoryFields = `
    id
    createdOn
    savedOn
    title
    slug
`;

const errorFields = `
    error {
        code
        message
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

export const useCategoryReadHandler = options => {
    const contentHandler = useContentGqlHandler(options);

    return {
        ...contentHandler,
        async getCategory(variables) {
            return await contentHandler.invoke({
                body: { query: getCategoryQuery, variables }
            });
        },
        async listCategories(variables = {}) {
            return await contentHandler.invoke({
                body: { query: listCategoriesQuery, variables }
            });
        }
    };
};
