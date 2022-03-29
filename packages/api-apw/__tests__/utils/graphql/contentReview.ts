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
        publishedOn
        publishedBy {
            id
            displayName
            type
        }
        scheduledOn
        scheduledBy {
            id
            displayName
            type
        }
    }
    ${fields}
}`;

export const IS_REVIEW_REQUIRED_QUERY = /* GraphQL */ `
    query IsReviewRequired($data: ApwContentReviewContentInput!) {
        apw {
            isReviewRequired(data: $data) {
                data {
                    isReviewRequired
                    contentReviewId
                }
                error ${ERROR_FIELDS}
            }
        }
    }
`;

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
        $sort: [ApwListContentReviewsSort!]
    ) {
        apw {
            listContentReviews(
                where: $where,
                limit: $limit,
                after: $after,
                sort: $sort
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

export const PUBLISH_CONTENT_MUTATION = /* GraphQL */ `
    mutation PublishContentMutation($id: ID!, $datetime: String) {
        apw {
            publishContent(id: $id, datetime: $datetime) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const UNPUBLISH_CONTENT_MUTATION = /* GraphQL */ `
    mutation UnPublishContentMutation($id: ID!, $datetime: String) {
        apw {
            unpublishContent(id: $id, datetime: $datetime) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const DELETE_SCHEDULED_ACTION_MUTATION = /* GraphQL */ `
    mutation DeleteScheduledActionMutation($id: ID!) {
        apw {
            deleteScheduledAction(id: $id) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;
