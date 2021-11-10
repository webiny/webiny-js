import { useContentGqlHandler } from "./useContentGqlHandler";
import { GQLHandlerCallableParams } from "./useGqlHandler";

const reviewFields = `
    id
    createdOn
    savedOn
    text
    product {
        id
        title
    }
    author {
        id
        fullName
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
    query GetReview($where: ReviewGetWhereInput!) {
        getReview(where: $where) {
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

export const useReviewReadHandler = (
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
        async listReviews(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: listReviewsQuery, variables },
                headers
            });
        }
    };
};
