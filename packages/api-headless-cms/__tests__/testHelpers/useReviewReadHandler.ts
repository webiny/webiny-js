import { GraphQLHandlerParams, useGraphQLHandler } from "./useGraphQLHandler";
import { CmsModel } from "~/types";
import { getCmsModel } from "~tests/contentAPI/mocks/contentModels";

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

const getReviewQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query GetReview($where: ${model.singularApiName}GetWhereInput!) {
            getReview: get${model.singularApiName}(where: $where) {
                data {
                    ${reviewFields}
                }
                ${errorFields}
            }
        }
    `;
};

const listReviewsQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query ListReviews(
            $where: ${model.singularApiName}ListWhereInput
            $sort: [${model.singularApiName}ListSorter]
            $limit: Int
            $after: String
        ) {
            listReviews: list${model.pluralApiName}(where: $where, sort: $sort, limit: $limit, after: $after) {
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
};

export const useReviewReadHandler = (params: GraphQLHandlerParams) => {
    const contentHandler = useGraphQLHandler(params);

    const model = getCmsModel("review");
    return {
        ...contentHandler,
        async getReview(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getReviewQuery(model), variables },
                headers
            });
        },
        async listReviews(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: listReviewsQuery(model), variables },
                headers
            });
        }
    };
};
