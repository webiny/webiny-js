import { CmsModel } from "~/types";
import { GraphQLHandlerParams, useGraphQLHandler } from "./useGraphQLHandler";
import { getCmsModel } from "~tests/contentAPI/mocks/contentModels";

const authorFields = `
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
            fullName
        }
    }
    # user defined fields
    fullName
`;

const errorFields = `
    error {
        code
        message
        data
    }
`;

const getAuthorQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query GetAuthor($revision: ID!) {
            getAuthor: get${model.singularApiName}(revision: $revision) {
            data {
                ${authorFields}
            }
            ${errorFields}
        }
        }
    `;
};

const getAuthorsByIdsQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query GetAuthors($revisions: [ID!]!) {
            getAuthorsByIds: get${model.pluralApiName}ByIds(revisions: $revisions) {
                data {
                    ${authorFields}
                }
                ${errorFields}
            }
        }
    `;
};

const listAuthorsQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query ListAuthors(
            $where: ${model.singularApiName}ListWhereInput
        $sort: [${model.singularApiName}ListSorter]
        $limit: Int
        $after: String
        ) {
        listAuthors: list${model.pluralApiName}(where: $where, sort: $sort, limit: $limit, after: $after) {
        data {
        ${authorFields}
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

const createAuthorMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation CreateAuthor($data: ${model.singularApiName}Input!) {
        createAuthor: create${model.singularApiName}(data: $data) {
        data {
        ${authorFields}
        }
        ${errorFields}
        }
        }
    `;
};

const createAuthorFromMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation CreateAuthorFrom($revision: ID!) {
            createAuthorFrom: create${model.singularApiName}From(revision: $revision) {
                data {
                    ${authorFields}
                }
                ${errorFields}
            }
        }
    `;
};

const updateAuthorMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation UpdateAuthor($revision: ID!, $data: ${model.singularApiName}Input!) {
        updateAuthor: update${model.singularApiName}(revision: $revision, data: $data) {
        data {
        ${authorFields}
        }
        ${errorFields}
        }
        }
    `;
};

const deleteAuthorMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation DeleteAuthor($revision: ID!) {
            deleteAuthor: delete${model.singularApiName}(revision: $revision) {
            data
            ${errorFields}
        }
        }
    `;
};

const publishAuthorMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation PublishAuthor($revision: ID!) {
            publishAuthor: publish${model.singularApiName}(revision: $revision) {
            data {
                ${authorFields}
            }
            ${errorFields}
        }
        }
    `;
};

const unpublishAuthorMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation UnpublishAuthor($revision: ID!) {
            unpublishAuthor: unpublish${model.singularApiName}(revision: $revision) {
            data {
                ${authorFields}
            }
            ${errorFields}
        }
        }
    `;
};

export const useAuthorManageHandler = (params: GraphQLHandlerParams) => {
    const contentHandler = useGraphQLHandler(params);

    const model = getCmsModel("author");

    return {
        ...contentHandler,
        async getAuthor(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getAuthorQuery(model), variables },
                headers
            });
        },
        async getAuthorsByIds(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getAuthorsByIdsQuery(model), variables },
                headers
            });
        },
        async listAuthors(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: listAuthorsQuery(model), variables },
                headers
            });
        },
        async createAuthor(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createAuthorMutation(model), variables },
                headers
            });
        },
        async createAuthorFrom(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createAuthorFromMutation(model), variables },
                headers
            });
        },
        async updateAuthor(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: updateAuthorMutation(model),
                    variables
                },
                headers
            });
        },
        async deleteAuthor(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: deleteAuthorMutation(model),
                    variables
                },
                headers
            });
        },
        async publishAuthor(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: publishAuthorMutation(model),
                    variables
                },
                headers
            });
        },
        async unpublishAuthor(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: unpublishAuthorMutation(model),
                    variables
                },
                headers
            });
        }
    };
};
