import { GraphQLHandlerParams, useGraphQLHandler } from "./useGraphQLHandler";

const authorFields = `
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

const getAuthorQuery = /* GraphQL */ `
    query GetAuthor($revision: ID!) {
        getAuthor(revision: $revision) {
            data {
                ${authorFields}
            }
            ${errorFields}
        }
    }
`;

const getAuthorsByIdsQuery = /* GraphQL */ `
    query GetAuthors($revisions: [ID!]!) {
        getAuthorsByIds(revisions: $revisions) {
            data {
                ${authorFields}
            }
            ${errorFields}
        }
    }
`;

const listAuthorsQuery = /* GraphQL */ `
    query ListAuthors(
        $where: AuthorListWhereInput
        $sort: [AuthorListSorter]
        $limit: Int
        $after: String
    ) {
        listAuthors(where: $where, sort: $sort, limit: $limit, after: $after) {
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

const createAuthorMutation = /* GraphQL */ `
    mutation CreateAuthor($data: AuthorInput!) {
        createAuthor(data: $data) {
            data {
                ${authorFields}
            }
            ${errorFields}
        }
    }
`;

const createAuthorFromMutation = /* GraphQL */ `
    mutation CreateAuthorFrom($revision: ID!) {
        createAuthorFrom(revision: $revision) {
            data {
                ${authorFields}
            }
            ${errorFields}
        }
    }
`;

const updateAuthorMutation = /* GraphQL */ `
    mutation UpdateAuthor($revision: ID!, $data: AuthorInput!) {
        updateAuthor(revision: $revision, data: $data) {
            data {
                ${authorFields}
            }
            ${errorFields}
        }
    }
`;

const deleteAuthorMutation = /* GraphQL */ `
    mutation DeleteAuthor($revision: ID!) {
        deleteAuthor(revision: $revision) {
            data
            ${errorFields}
        }
    }
`;

const publishAuthorMutation = /* GraphQL */ `
    mutation PublishAuthor($revision: ID!) {
        publishAuthor(revision: $revision) {
            data {
                ${authorFields}
            }
            ${errorFields}
        }
    }
`;

const unpublishAuthorMutation = /* GraphQL */ `
    mutation UnpublishAuthor($revision: ID!) {
        unpublishAuthor(revision: $revision) {
            data {
                ${authorFields}
            }
            ${errorFields}
        }
    }
`;

export const useAuthorManageHandler = (params: GraphQLHandlerParams) => {
    const contentHandler = useGraphQLHandler(params);

    return {
        ...contentHandler,
        async getAuthor(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getAuthorQuery, variables },
                headers
            });
        },
        async getAuthorsByIds(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getAuthorsByIdsQuery, variables },
                headers
            });
        },
        async listAuthors(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: listAuthorsQuery, variables },
                headers
            });
        },
        async createAuthor(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createAuthorMutation, variables },
                headers
            });
        },
        async createAuthorFrom(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createAuthorFromMutation, variables },
                headers
            });
        },
        async updateAuthor(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: updateAuthorMutation,
                    variables
                },
                headers
            });
        },
        async deleteAuthor(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: deleteAuthorMutation,
                    variables
                },
                headers
            });
        },
        async publishAuthor(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: publishAuthorMutation,
                    variables
                },
                headers
            });
        },
        async unpublishAuthor(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: unpublishAuthorMutation,
                    variables
                },
                headers
            });
        }
    };
};
