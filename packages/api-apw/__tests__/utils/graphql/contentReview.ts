const ERROR_FIELDS = `{
    message
    code
    data
}`;

const getDataFields = (fields = "") => `{
    id
    createdOn
    savedOn
    createdBy {
        id
        displayName
        type
    }
    steps {
        status
        slug
    }
    changeRequested {
        title
        body
        resolved
        media
        comments {
            body
            author
        }
    }
    ${fields}
}`;

export const GET_CONTENT_REVIEW_QUERY = /* GraphQL */ `
    query GetContentReview($id: ID!) {
        advancedPublishingWorkflow {
            getContentReview(id: $id) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const LIST_CONTENT_REVIEWS_QUERY = /* GraphQL */ `
    query ListContentReviews(
        $where: ApwListContentReviewsWhereInput,
        $limit: Int,
        $after: String,
        $sort: [ApwListContentReviewsSort!],
        $search: ApwListContentReviewsSearchInput
    ) {
        advancedPublishingWorkflow {
            listContentReviews(
                where: $where,
                limit: $limit,
                after: $after,
                sort: $sort,
                search: $search
            ) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
                meta {
                    hasMoreItems
                    totalCount
                    cursor
                }
            }
        }
    }
`;

export const CREATE_CONTENT_REVIEW_MUTATION = /* GraphQL */ `
    mutation CreateContentReviewMutation($data: ApwCreateContentReviewInput!) {
        advancedPublishingWorkflow {
            createContentReview(data: $data) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const UPDATE_CONTENT_REVIEW_MUTATION = /* GraphQL */ `
    mutation UpdateContentReviewMutation($id: ID!, $data: ApwUpdateContentReviewInput!) {
        advancedPublishingWorkflow {
            updateContentReview(id: $id, data: $data) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const DELETE_CONTENT_REVIEW_MUTATION = /* GraphQL */ `
    mutation DeleteContentReviewMutation($id: ID!) {
        advancedPublishingWorkflow {
            deleteContentReview(id: $id) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;
