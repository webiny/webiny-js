import { GraphQLHandlerParams, useGraphQLHandler } from "./useGraphQLHandler";

const fruitFields = `
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
            name
        }
    }
    # user defined fields
    name
    numbers
    email
    url
    lowerCase
    upperCase
    date
    dateTime
    dateTimeZ
    time
    rating
    isSomething
    description
    slug
`;

const errorFields = `
    error {
        code
        message
        data
    }
`;

const getFruitQuery = /* GraphQL */ `
    query GetFruit($revision: ID!) {
        getFruit(revision: $revision) {
            data {
                ${fruitFields}
            }
            ${errorFields}
        }
    }
`;

const getFruitsByIdsQuery = /* GraphQL */ `
    query GetFruits($revisions: [ID!]!) {
        getFruitsByIds(revisions: $revisions) {
            data {
                ${fruitFields}
            }
            ${errorFields}
        }
    }
`;

const listFruitsQuery = /* GraphQL */ `
    query ListFruits(
        $where: FruitListWhereInput
        $sort: [FruitListSorter]
        $limit: Int
        $after: String
    ) {
        listFruits(where: $where, sort: $sort, limit: $limit, after: $after) {
            data {
                ${fruitFields}
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

const createFruitMutation = /* GraphQL */ `
    mutation CreateFruit($data: FruitInput!) {
        createFruit(data: $data) {
            data {
                ${fruitFields}
            }
            ${errorFields}
        }
    }
`;

const createFruitFromMutation = /* GraphQL */ `
    mutation CreateFruitFrom($revision: ID!) {
        createFruitFrom(revision: $revision) {
            data {
                ${fruitFields}
            }
            ${errorFields}
        }
    }
`;

const updateFruitMutation = /* GraphQL */ `
    mutation UpdateFruit($revision: ID!, $data: FruitInput!) {
        updateFruit(revision: $revision, data: $data) {
            data {
                ${fruitFields}
            }
            ${errorFields}
        }
    }
`;

const deleteFruitMutation = /* GraphQL */ `
    mutation DeleteFruit($revision: ID!) {
        deleteFruit(revision: $revision) {
            data
            ${errorFields}
        }
    }
`;

const publishFruitMutation = /* GraphQL */ `
    mutation PublishFruit($revision: ID!) {
        publishFruit(revision: $revision) {
            data {
                ${fruitFields}
            }
            ${errorFields}
        }
    }
`;

const unpublishFruitMutation = /* GraphQL */ `
    mutation UnpublishFruit($revision: ID!) {
        unpublishFruit(revision: $revision) {
            data {
                ${fruitFields}
            }
            ${errorFields}
        }
    }
`;

export const useFruitManageHandler = (params: GraphQLHandlerParams) => {
    const contentHandler = useGraphQLHandler(params);

    return {
        ...contentHandler,
        async getFruit(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getFruitQuery, variables },
                headers
            });
        },
        async getFruitsByIds(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getFruitsByIdsQuery, variables },
                headers
            });
        },
        async listFruits(variables = {}, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: listFruitsQuery, variables },
                headers
            });
        },
        async createFruit(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createFruitMutation, variables },
                headers
            });
        },
        async createFruitFrom(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createFruitFromMutation, variables },
                headers
            });
        },
        async updateFruit(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: updateFruitMutation,
                    variables
                },
                headers
            });
        },
        async deleteFruit(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: deleteFruitMutation,
                    variables
                },
                headers
            });
        },
        async publishFruit(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: publishFruitMutation,
                    variables
                },
                headers
            });
        },
        async unpublishFruit(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: unpublishFruitMutation,
                    variables
                },
                headers
            });
        }
    };
};
