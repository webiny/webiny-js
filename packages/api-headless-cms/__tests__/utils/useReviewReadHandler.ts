import { useContentGqlHandler } from "./useContentGqlHandler";
import { GQLHandlerCallableArgsType } from "./useGqlHandler";

const reviewFields = `
    id
    createdOn
    savedOn
    text
    product {
        id
        title
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

export const useReviewReadHandler = (options: GQLHandlerCallableArgsType) => {
    const contentHandler = useContentGqlHandler(options);

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
