import { CmsModel } from "~/types";
import { GraphQLHandlerParams, useGraphQLHandler } from "./useGraphQLHandler";
import { getCmsModel } from "~tests/contentAPI/mocks/contentModels";

const reviewFields = `
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

const getReviewQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query GetReview($revision: ID!) {
            getReview: get${model.singularApiName}(revision: $revision) {
                data {
                    ${reviewFields}
                }
                ${errorFields}
            }
        }
    `;
};

const getReviewsByIdsQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query GetReviews($revisions: [ID!]!) {
            getReviewsByIds: get${model.pluralApiName}ByIds(revisions: $revisions) {
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

const createReviewMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation CreateReview($data: ${model.singularApiName}Input!) {
            createReview: create${model.singularApiName}(data: $data) {
                data {
                    ${reviewFields}
                }
                ${errorFields}
            }
        }
    `;
};

const createReviewFromMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation CreateReviewFrom($revision: ID!) {
            createReviewFrom: create${model.singularApiName}From(revision: $revision) {
                data {
                    ${reviewFields}
                }
                ${errorFields}
            }
        }
    `;
};

const updateReviewMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation UpdateReview($revision: ID!, $data: ${model.singularApiName}Input!) {
            updateReview: update${model.singularApiName}(revision: $revision, data: $data) {
                data {
                    ${reviewFields}
                }
                ${errorFields}
            }
        }
    `;
};

const deleteReviewMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation DeleteReview($revision: ID!) {
            deleteReview: delete${model.singularApiName}(revision: $revision) {
                data
                ${errorFields}
            }
        }
    `;
};

const publishReviewMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation PublishReview($revision: ID!) {
            publishReview: publish${model.singularApiName}(revision: $revision) {
                data {
                    ${reviewFields}
                }
                ${errorFields}
            }
        }
    `;
};

const unpublishReviewMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation UnpublishReview($revision: ID!) {
            unpublishReview: unpublish${model.singularApiName}(revision: $revision) {
                data {
                    ${reviewFields}
                }
                ${errorFields}
            }
        }
    `;
};

export const useReviewManageHandler = (params: GraphQLHandlerParams) => {
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
        async getReviewsByIds(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getReviewsByIdsQuery(model), variables },
                headers
            });
        },
        async listReviews(variables = {}, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: listReviewsQuery(model), variables },
                headers
            });
        },
        async createReview(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createReviewMutation(model), variables },
                headers
            });
        },
        async createReviewFrom(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createReviewFromMutation(model), variables },
                headers
            });
        },
        async updateReview(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: updateReviewMutation(model),
                    variables
                },
                headers
            });
        },
        async deleteReview(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: deleteReviewMutation(model),
                    variables
                },
                headers
            });
        },
        async publishReview(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: publishReviewMutation(model),
                    variables
                },
                headers
            });
        },
        async unpublishReview(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: unpublishReviewMutation(model),
                    variables
                },
                headers
            });
        }
    };
};
