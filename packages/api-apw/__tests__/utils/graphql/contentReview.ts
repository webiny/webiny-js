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
    title
    status
    steps {
        status
        id
        pendingChangeRequests
        signOffProvidedOn
        signOffProvidedBy {
            id
            displayName
        }
    }
    content {
        type
        id
        version
        settings {
            modelId
        }
    }
    ${fields}
}`;

export const GET_CONTENT_REVIEW_QUERY = /* GraphQL */ `
    query GetContentReview($id: ID!) {
        apw {
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
        apw {
            listContentReviews(
                where: $where,
                limit: $limit,
                after: $after,
                sort: $sort,
                search: $search
            ) {
                data ${getDataFields(`
                activeStep { title }
                totalComments
                latestCommentId
                reviewers
                `)}
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
        apw {
            createContentReview(data: $data) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const DELETE_CONTENT_REVIEW_MUTATION = /* GraphQL */ `
    mutation DeleteContentReviewMutation($id: ID!) {
        apw {
            deleteContentReview(id: $id) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const PROVIDE_SIGN_OFF_MUTATION = /* GraphQL */ `
    mutation ProvideSignOffMutation($id: ID!, $step: String!) {
        apw {
            provideSignOff(id: $id, step: $step) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const RETRACT_SIGN_OFF_MUTATION = /* GraphQL */ `
    mutation RetractSignOffMutation($id: ID!, $step: String!) {
        apw {
            retractSignOff(id: $id, step: $step) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;
