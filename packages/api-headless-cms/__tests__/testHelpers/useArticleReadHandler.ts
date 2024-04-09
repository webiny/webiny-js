import { GraphQLHandlerParams, useGraphQLHandler } from "./useGraphQLHandler";
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
    title
    body
    categories {
        id
        entryId
        modelId
        title
    }
    category {
        id
        entryId
        modelId
        title
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
        query GetArticle($where: ${model.singularApiName}GetWhereInput!) {
            getArticle: get${model.singularApiName}(where: $where) {
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

const addPopulate = (fields: string) => {
    return fields
        .replace("categories {", "categories(populate: false) {")
        .replace("category {", "category(populate: false) {");
};
const listArticlesWithoutReferencesQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query ListArticles(
            $where: ${model.singularApiName}ListWhereInput
            $sort: [${model.singularApiName}ListSorter!]
            $limit: Int
            $after: String
        ) {
            listArticles: list${
                model.pluralApiName
            }(where: $where, sort: $sort, limit: $limit, after: $after) {
                data {
                    ${addPopulate(fields)}
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

export const useArticleReadHandler = (params: GraphQLHandlerParams) => {
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
        async listArticles(variables = {}, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: listArticlesQuery(model), variables },
                headers
            });
        },
        async listArticlesWithoutReferences(variables = {}, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: listArticlesWithoutReferencesQuery(model), variables },
                headers
            });
        }
    };
};
