import gql from "graphql-tag";

const ERROR_FIELDS = `{
    message
    code
    data
}`;

const META_FIELDS = `{
    totalCount
    hasMoreItems
    cursor
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
    status
    content {
        id
        type
        title
        version
    }
    steps {
        status
        id
        title
        pendingChangeRequests
        signOffProvidedOn
        signOffProvidedBy {
            id
            displayName
        }
    }
    ${fields}
}`;

export const GET_CONTENT_REVIEW_QUERY = /* GraphQL */ gql`
    query GetContentReview($id: ID!) {
        apw {
            getContentReview(id: $id) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const LIST_CONTENT_REVIEWS_QUERY = /* GraphQL */ gql`
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
                activeStep {
                    title
                }
                totalComments
                latestCommentId
                reviewers
                `)}
                error ${ERROR_FIELDS}
                meta ${META_FIELDS}
            }
        }
    }
`;

export const CREATE_CONTENT_REVIEW_MUTATION = /* GraphQL */ gql`
    mutation CreateContentReviewMutation($data: ApwCreateContentReviewInput!) {
        apw {
            contentReview: createContentReview(data: $data) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const DELETE_CONTENT_REVIEW_MUTATION = /* GraphQL */ gql`
    mutation DeleteContentReviewMutation($id: ID!) {
        apw {
            deleteContentReview(id: $id) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const PROVIDE_SIGN_OFF_MUTATION = /* GraphQL */ gql`
    mutation ProvideSignOffMutation($id: ID!, $step: String!) {
        apw {
            provideSignOff(id: $id, step: $step) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const RETRACT_SIGN_OFF_MUTATION = /* GraphQL */ gql`
    mutation RetractSignOffMutation($id: ID!, $step: String!) {
        apw {
            retractSignOff(id: $id, step: $step) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;
