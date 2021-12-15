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
    status
    steps {
        status
        slug
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
        settings
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

export const PROVIDE_SIGN_OFF_MUTATION = /* GraphQL */ `
    mutation ProvideSignOffMutation($id: ID!, $step: String!) {
        advancedPublishingWorkflow {
            provideSignOff(id: $id, step: $step) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const RETRACT_SIGN_OFF_MUTATION = /* GraphQL */ `
    mutation RetractSignOffMutation($id: ID!, $step: String!) {
        advancedPublishingWorkflow {
            retractSignOff(id: $id, step: $step) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;
