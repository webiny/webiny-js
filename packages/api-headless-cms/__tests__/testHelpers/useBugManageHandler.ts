import { GraphQLHandlerParams, useGraphQLHandler } from "./useGraphQLHandler";

const bugFields = `
    id
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
    }
    # user defined fields
    name
    bugType
    bugValue
    bugFixed
`;

const errorFields = `
    error {
        code
        message
        data
    }
`;

const getBugQuery = /* GraphQL */ `
    query GetBug($revision: ID!) {
        getBug(revision: $revision) {
            data {
                ${bugFields}
            }
            ${errorFields}
        }
    }
`;

const getBugsByIdsQuery = /* GraphQL */ `
    query GetBugs($revisions: [ID!]!) {
        getBugsByIds(revisions: $revisions) {
            data {
                ${bugFields}
            }
            ${errorFields}
        }
    }
`;

const listBugsQuery = /* GraphQL */ `
    query ListBugs(
        $where: BugListWhereInput
        $sort: [BugListSorter]
        $limit: Int
        $after: String
    ) {
        listBugs(where: $where, sort: $sort, limit: $limit, after: $after) {
            data {
                ${bugFields}
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

const createBugMutation = /* GraphQL */ `
    mutation CreateBug($data: BugInput!) {
        createBug(data: $data) {
            data {
                ${bugFields}
            }
            ${errorFields}
        }
    }
`;

const createBugFromMutation = /* GraphQL */ `
    mutation CreateBugFrom($revision: ID!) {
        createBugFrom(revision: $revision) {
            data {
                ${bugFields}
            }
            ${errorFields}
        }
    }
`;

const updateBugMutation = /* GraphQL */ `
    mutation UpdateBug($revision: ID!, $data: BugInput!) {
        updateBug(revision: $revision, data: $data) {
            data {
                ${bugFields}
            }
            ${errorFields}
        }
    }
`;

const deleteBugMutation = /* GraphQL */ `
    mutation DeleteBug($revision: ID!) {
        deleteBug(revision: $revision) {
            data
            ${errorFields}
        }
    }
`;

const publishBugMutation = /* GraphQL */ `
    mutation PublishBug($revision: ID!) {
        publishBug(revision: $revision) {
            data {
                ${bugFields}
            }
            ${errorFields}
        }
    }
`;

const unpublishBugMutation = /* GraphQL */ `
    mutation UnpublishBug($revision: ID!) {
        unpublishBug(revision: $revision) {
            data {
                ${bugFields}
            }
            ${errorFields}
        }
    }
`;

export const useBugManageHandler = (params: GraphQLHandlerParams) => {
    const contentHandler = useGraphQLHandler(params);

    return {
        ...contentHandler,
        async getBug(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getBugQuery, variables },
                headers
            });
        },
        async getBugsByIds(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getBugsByIdsQuery, variables },
                headers
            });
        },
        async listBugs(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: listBugsQuery, variables },
                headers
            });
        },
        async createBug(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createBugMutation, variables },
                headers
            });
        },
        async createBugFrom(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createBugFromMutation, variables },
                headers
            });
        },
        async updateBug(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: updateBugMutation,
                    variables
                },
                headers
            });
        },
        async deleteBug(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: deleteBugMutation,
                    variables
                },
                headers
            });
        },
        async publishBug(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: publishBugMutation,
                    variables
                },
                headers
            });
        },
        async unpublishBug(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: unpublishBugMutation,
                    variables
                },
                headers
            });
        }
    };
};
