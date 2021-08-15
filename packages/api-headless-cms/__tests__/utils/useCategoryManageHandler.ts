import { useContentGqlHandler } from "./useContentGqlHandler";
import { GQLHandlerCallableArgs } from "./useGqlHandler";
import { Plugin } from "@webiny/plugins/types";

const categoryFields = `
    id
    entryId
    createdOn
    createdBy {
        id
        displayName
        type
    }
    savedOn
    meta {
        title
        modelId
        version
        locked
        publishedOn
        status
        revisions {
            id
            title
            slug
        }
    }
    # user defined fields
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
    query GetCategory($revision: ID!) {
        getCategory(revision: $revision) {
            data {
                ${categoryFields}
            }
            ${errorFields}
        }
    }
`;

const getCategoriesByIdsQuery = /* GraphQL */ `
    query GetCategories($revisions: [ID!]!) {
        getCategoriesByIds(revisions: $revisions) {
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
                ${categoryFields}
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

const createCategoryMutation = /* GraphQL */ `
    mutation CreateCategory($data: CategoryInput!) {
        createCategory(data: $data) {
            data {
                ${categoryFields}
            }
            ${errorFields}
        }
    }
`;

const createCategoryFromMutation = /* GraphQL */ `
    mutation CreateCategoryFrom($revision: ID!) {
        createCategoryFrom(revision: $revision) {
            data {
                ${categoryFields}
            }
            ${errorFields}
        }
    }
`;

const updateCategoryMutation = /* GraphQL */ `
    mutation UpdateCategory($revision: ID!, $data: CategoryInput!) {
        updateCategory(revision: $revision, data: $data) {
            data {
                ${categoryFields}
            }
            ${errorFields}
        }
    }
`;

const deleteCategoryMutation = /* GraphQL */ `
    mutation DeleteCategory($revision: ID!) {
        deleteCategory(revision: $revision) {
            data
            ${errorFields}
        }
    }
`;

const publishCategoryMutation = /* GraphQL */ `
    mutation PublishCategory($revision: ID!) {
        publishCategory(revision: $revision) {
            data {
                ${categoryFields}
            }
            ${errorFields}
        }
    }
`;

const unpublishCategoryMutation = /* GraphQL */ `
    mutation UnpublishCategory($revision: ID!) {
        unpublishCategory(revision: $revision) {
            data {
                ${categoryFields}
            }
            ${errorFields}
        }
    }
`;

const requestCategoryChangesMutation = /* GraphQL */ `
    mutation RequestCategoryChanges($revision: ID!) {
        requestCategoryChanges(revision: $revision) {
            data {
                ${categoryFields}
            }
            ${errorFields}
        }
    }
`;

const requestCategoryReviewMutation = /* GraphQL */ `
    mutation RequestCategoryReview($revision: ID!) {
        requestCategoryReview(revision: $revision) {
            data {
                ${categoryFields}
            }
            ${errorFields}
        }
    }
`;

export const useCategoryManageHandler = (
    options: GQLHandlerCallableArgs,
    plugins: Plugin[] = []
) => {
    const contentHandler = useContentGqlHandler(options, plugins);

    return {
        ...contentHandler,
        async getCategory(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getCategoryQuery, variables },
                headers
            });
        },
        async getCategoriesByIds(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getCategoriesByIdsQuery, variables },
                headers
            });
        },
        async listCategories(variables = {}, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: listCategoriesQuery, variables },
                headers
            });
        },
        async createCategory(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createCategoryMutation, variables },
                headers
            });
        },
        async createCategoryFrom(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createCategoryFromMutation, variables },
                headers
            });
        },
        async updateCategory(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: updateCategoryMutation,
                    variables
                },
                headers
            });
        },
        async deleteCategory(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: deleteCategoryMutation,
                    variables
                },
                headers
            });
        },
        async publishCategory(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: publishCategoryMutation,
                    variables
                },
                headers
            });
        },
        async unpublishCategory(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: unpublishCategoryMutation,
                    variables
                },
                headers
            });
        },
        async requestCategoryChanges(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: requestCategoryChangesMutation,
                    variables
                },
                headers
            });
        },
        async requestCategoryReview(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: requestCategoryReviewMutation,
                    variables
                },
                headers
            });
        }
    };
};
