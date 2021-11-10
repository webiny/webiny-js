import { useContentGqlHandler } from "./useContentGqlHandler";
import { GQLHandlerCallableParams } from "./useGqlHandler";

const reviewFields = `
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
    }
    author {
        modelId
        entryId
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

export const useReviewManageHandler = (
    params: Omit<GQLHandlerCallableParams, "createHeadlessCmsApp">
) => {
    const contentHandler = useContentGqlHandler(params);

    return {
        ...contentHandler,
        async getReview(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getReviewQuery, variables },
                headers
            });
        },
        async getReviewsByIds(variables, headers: Record<string, any> = {}) {
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
        async createReview(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createReviewMutation, variables },
                headers
            });
        },
        async createReviewFrom(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createReviewFromMutation, variables },
                headers
            });
        },
        async updateReview(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: updateReviewMutation,
                    variables
                },
                headers
            });
        },
        async deleteReview(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: deleteReviewMutation,
                    variables
                },
                headers
            });
        },
        async publishReview(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: publishReviewMutation,
                    variables
                },
                headers
            });
        },
        async unpublishReview(variables, headers: Record<string, any> = {}) {
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
