import { useGraphQLHandler, GraphQLHandlerParams } from "./useGraphQLHandler";
import { CmsModel } from "~/types";
import { getCmsModel } from "~tests/contentAPI/mocks/contentModels";

const fields = `
    id
    entryId
    createdOn
    modifiedOn
    savedOn
    firstPublishedOn
    lastPublishedOn
    createdBy {
        id
        displayName
        type
    }
    meta {
        title
        modelId
        version
        locked
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

const getArticleQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query GetArticle($revision: ID!) {
            getArticle: get${model.singularApiName}(revision: $revision) {
                data {
                    ${fields}
                }
                ${errorFields}
            }
        }
    `;
};

const getArticlesByIdsQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query GetArticles($revisions: [ID!]!) {
            getArticlesByIds: get${model.pluralApiName}ByIds(revisions: $revisions) {
                data {
                    ${fields}
                }
                ${errorFields}
            }
        }
    `;
};

const listArticlesQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query ListArticles(
            $where: ${model.singularApiName}ListWhereInput
            $sort: [${model.singularApiName}ListSorter]
            $limit: Int
            $after: String
        ) {
            listArticles: list${model.pluralApiName}(where: $where, sort: $sort, limit: $limit, after: $after) {
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
};

const createArticleMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation CreateArticle($data: ${model.singularApiName}Input!) {
            createArticle: create${model.singularApiName}(data: $data) {
                data {
                    ${fields}
                }
                ${errorFields}
            }
        }
    `;
};

const createArticleFromMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation CreateArticleFrom($revision: ID!) {
            createArticleFrom: create${model.singularApiName}From(revision: $revision) {
                data {
                    ${fields}
                }
                ${errorFields}
            }
        }
    `;
};

const updateArticleMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation UpdateArticle($revision: ID!, $data: ArticleInput!) {
            updateArticle: update${model.singularApiName}(revision: $revision, data: $data) {
                data {
                    ${fields}
                }
                ${errorFields}
            }
        }
    `;
};

const deleteArticleMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation DeleteArticle($revision: ID!) {
            deleteArticle: delete${model.singularApiName}(revision: $revision) {
                data
                ${errorFields}
            }
        }
    `;
};

const publishArticleMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation PublishArticle($revision: ID!) {
            publishArticle: publish${model.singularApiName}(revision: $revision) {
                data {
                    ${fields}
                }
                ${errorFields}
            }
        }
    `;
};

const unpublishArticleMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation UnpublishArticle($revision: ID!) {
            unpublishArticle: unpublish${model.singularApiName}(revision: $revision) {
                data {
                    ${fields}
                }
                ${errorFields}
            }
        }
    `;
};

export const useArticleManageHandler = (
    params: Omit<GraphQLHandlerParams, "createHeadlessCmsApp">
) => {
    const contentHandler = useGraphQLHandler(params);

    const model = getCmsModel("article");

    return {
        ...contentHandler,
        async getArticle(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getArticleQuery(model), variables },
                headers
            });
        },
        async getArticlesByIds(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getArticlesByIdsQuery(model), variables },
                headers
            });
        },
        async listArticles(variables = {}, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: listArticlesQuery(model), variables },
                headers
            });
        },
        async createArticle(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createArticleMutation(model), variables },
                headers
            });
        },
        async createArticleFrom(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createArticleFromMutation(model), variables },
                headers
            });
        },
        async updateArticle(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: updateArticleMutation(model),
                    variables
                },
                headers
            });
        },
        async deleteArticle(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: deleteArticleMutation(model),
                    variables
                },
                headers
            });
        },
        async publishArticle(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: publishArticleMutation(model),
                    variables
                },
                headers
            });
        },
        async unpublishArticle(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: unpublishArticleMutation(model),
                    variables
                },
                headers
            });
        }
    };
};
