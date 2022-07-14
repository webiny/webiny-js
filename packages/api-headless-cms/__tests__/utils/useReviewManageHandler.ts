import { GraphQLHandlerParams, useGraphQLHandler } from "./useGraphQLHandler";

const reviewFields = `
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
            text
        }
    }
    # user defined fields
    text
    product {
        modelId
        entryId
        id
    }
    author {
        modelId
        entryId
        id
    }
    rating
`;

const errorFields = `
    error {
        code
        message
        data
    }
`;

const getReviewQuery = /* GraphQL */ `
    query GetReview($revision: ID!) {
        getReview(revision: $revision) {
            data {
                ${reviewFields}
            }
            ${errorFields}
        }
    }
`;

const getReviewsByIdsQuery = /* GraphQL */ `
    query GetReviews($revisions: [ID!]!) {
        getReviewsByIds(revisions: $revisions) {
            data {
                ${reviewFields}
            }
            ${errorFields}
        }
    }
`;

const listReviewsQuery = /* GraphQL */ `
    query ListReviews(
        $where: ReviewListWhereInput
        $sort: [ReviewListSorter]
        $limit: Int
        $after: String
    ) {
        listReviews(where: $where, sort: $sort, limit: $limit, after: $after) {
            data {
                ${reviewFields}
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

const createReviewMutation = /* GraphQL */ `
    mutation CreateReview($data: ReviewInput!) {
        createReview(data: $data) {
            data {
                ${reviewFields}
            }
            ${errorFields}
        }
    }
`;

const createReviewFromMutation = /* GraphQL */ `
    mutation CreateReviewFrom($revision: ID!) {
        createReviewFrom(revision: $revision) {
            data {
                ${reviewFields}
            }
            ${errorFields}
        }
    }
`;

const updateReviewMutation = /* GraphQL */ `
    mutation UpdateReview($revision: ID!, $data: ReviewInput!) {
        updateReview(revision: $revision, data: $data) {
            data {
                ${reviewFields}
            }
            ${errorFields}
        }
    }
`;

const deleteReviewMutation = /* GraphQL */ `
    mutation DeleteReview($revision: ID!) {
        deleteReview(revision: $revision) {
            data
            ${errorFields}
        }
    }
`;

const publishReviewMutation = /* GraphQL */ `
    mutation PublishReview($revision: ID!) {
        publishReview(revision: $revision) {
            data {
                ${reviewFields}
            }
            ${errorFields}
        }
    }
`;

const unpublishReviewMutation = /* GraphQL */ `
    mutation UnpublishReview($revision: ID!) {
        unpublishReview(revision: $revision) {
            data {
                ${reviewFields}
            }
            ${errorFields}
        }
    }
`;

export const useReviewManageHandler = (params: GraphQLHandlerParams) => {
    const contentHandler = useGraphQLHandler(params);

    return {
        ...contentHandler,
        async getReview(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getReviewQuery, variables },
                headers
            });
        },
        async getReviewsByIds(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getReviewsByIdsQuery, variables },
                headers
            });
        },
        async listReviews(variables = {}, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: listReviewsQuery, variables },
                headers
            });
        },
        async createReview(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createReviewMutation, variables },
                headers
            });
        },
        async createReviewFrom(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createReviewFromMutation, variables },
                headers
            });
        },
        async updateReview(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: updateReviewMutation,
                    variables
                },
                headers
            });
        },
        async deleteReview(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: deleteReviewMutation,
                    variables
                },
                headers
            });
        },
        async publishReview(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: publishReviewMutation,
                    variables
                },
                headers
            });
        },
        async unpublishReview(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: unpublishReviewMutation,
                    variables
                },
                headers
            });
        }
    };
};
