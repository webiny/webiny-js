import { useGraphQLHandler, GraphQLHandlerParams } from "./useGraphQLHandler";

const fields = `
    id
    entryId
    createdOn
    savedOn
    createdBy {
        id
        displayName
        type
    }
    ownedBy {
        id
        displayName
        type
    }
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
        }
    }
    # user defined fields
    title
    body
    categories {
        modelId
        entryId
        id
    }
    category {
        modelId
        entryId
        id
    }
`;

const errorFields = `
    error {
        code
        message
        data
    }
`;

const getArticleQuery = /* GraphQL */ `
    query GetArticle($revision: ID!) {
        getArticle(revision: $revision) {
            data {
                ${fields}
            }
            ${errorFields}
        }
    }
`;

const getArticlesByIdsQuery = /* GraphQL */ `
    query GetArticles($revisions: [ID!]!) {
        getArticlesByIds(revisions: $revisions) {
            data {
                ${fields}
            }
            ${errorFields}
        }
    }
`;

const listArticlesQuery = /* GraphQL */ `
    query ListArticles(
        $where: ArticleListWhereInput
        $sort: [ArticleListSorter]
        $limit: Int
        $after: String
    ) {
        listArticles(where: $where, sort: $sort, limit: $limit, after: $after) {
            data {
                ${fields}
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

const createArticleMutation = /* GraphQL */ `
    mutation CreateArticle($data: ArticleInput!) {
        createArticle(data: $data) {
            data {
                ${fields}
            }
            ${errorFields}
        }
    }
`;

const createArticleFromMutation = /* GraphQL */ `
    mutation CreateArticleFrom($revision: ID!) {
        createArticleFrom(revision: $revision) {
            data {
                ${fields}
            }
            ${errorFields}
        }
    }
`;

const updateArticleMutation = /* GraphQL */ `
    mutation UpdateArticle($revision: ID!, $data: ArticleInput!) {
        updateArticle(revision: $revision, data: $data) {
            data {
                ${fields}
            }
            ${errorFields}
        }
    }
`;

const deleteArticleMutation = /* GraphQL */ `
    mutation DeleteArticle($revision: ID!) {
        deleteArticle(revision: $revision) {
            data
            ${errorFields}
        }
    }
`;

const publishArticleMutation = /* GraphQL */ `
    mutation PublishArticle($revision: ID!) {
        publishArticle(revision: $revision) {
            data {
                ${fields}
            }
            ${errorFields}
        }
    }
`;

const unpublishArticleMutation = /* GraphQL */ `
    mutation UnpublishArticle($revision: ID!) {
        unpublishArticle(revision: $revision) {
            data {
                ${fields}
            }
            ${errorFields}
        }
    }
`;

export const useArticleManageHandler = (
    params: Omit<GraphQLHandlerParams, "createHeadlessCmsApp">
) => {
    const contentHandler = useGraphQLHandler(params);

    return {
        ...contentHandler,
        async getArticle(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getArticleQuery, variables },
                headers
            });
        },
        async getArticlesByIds(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getArticlesByIdsQuery, variables },
                headers
            });
        },
        async listArticles(variables = {}, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: listArticlesQuery, variables },
                headers
            });
        },
        async createArticle(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createArticleMutation, variables },
                headers
            });
        },
        async createArticleFrom(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createArticleFromMutation, variables },
                headers
            });
        },
        async updateArticle(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: updateArticleMutation,
                    variables
                },
                headers
            });
        },
        async deleteArticle(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: deleteArticleMutation,
                    variables
                },
                headers
            });
        },
        async publishArticle(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: publishArticleMutation,
                    variables
                },
                headers
            });
        },
        async unpublishArticle(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: unpublishArticleMutation,
                    variables
                },
                headers
            });
        }
    };
};
